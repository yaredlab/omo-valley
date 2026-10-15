"""
Build src/data/geo.js from Natural Earth (public domain) GeoJSON.

Source files (download once from github.com/nvkelso/natural-earth-vector):
  geojson/ne_10m_rivers_lake_centerlines.geojson
  geojson/ne_10m_lakes.geojson
  geojson/ne_10m_admin_0_countries.geojson

Usage:  python3 -I scripts/build-geo.py /path/to/geojson-dir
Output: every coordinate is projected to a local plane where 1 degree = 1000 units.
"""
import json
import math
import sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/geo")
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "geo.js"

# Map frame (degrees). The river runs 9.15N -> 4.54N, Lake Turkana sits to the south.
LON0, LON1 = 33.6, 40.0
LAT0, LAT1 = 2.0, 10.0
K = 1000.0
COS = math.cos(math.radians(6.0))  # single mid-latitude correction; negligible error at 2-10 N


def proj(lon, lat):
    return ((lon - LON0) * K * COS, (LAT1 - lat) * K)


W = (LON1 - LON0) * K * COS
H = (LAT1 - LAT0) * K


def inside(lon, lat, pad=0.0):
    return LON0 - pad <= lon <= LON1 + pad and LAT0 - pad <= lat <= LAT1 + pad


def dp(points, eps):
    """Douglas-Peucker, iterative."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-12
        dmax, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L
            if d > dmax:
                dmax, idx = d, i
        if dmax > eps and idx != -1:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, k in zip(points, keep) if k]


def dp_ring(points, eps):
    """Douglas-Peucker for a closed ring (first == last): split at the point farthest from the start."""
    if len(points) < 5:
        return points
    ax, ay = points[0]
    far = max(range(1, len(points) - 1), key=lambda i: (points[i][0] - ax) ** 2 + (points[i][1] - ay) ** 2)
    a = dp(points[: far + 1], eps)
    b = dp(points[far:], eps)
    return a[:-1] + b


def path_d(points, close=False):
    if not points:
        return ""
    d = "M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in points[:1])
    d += "L" + " ".join(f"{x:.1f},{y:.1f}" for x, y in points[1:])
    return d + ("Z" if close else "")


def runs_in_frame(coords, pad=0.3):
    """Split a line into runs that are inside the (padded) frame."""
    run, runs = [], []
    for lon, lat in coords:
        if inside(lon, lat, pad):
            run.append((lon, lat))
        else:
            if len(run) > 1:
                runs.append(run)
            run = []
    if len(run) > 1:
        runs.append(run)
    return runs


def lines_of(geom):
    if geom["type"] == "LineString":
        return [geom["coordinates"]]
    if geom["type"] == "MultiLineString":
        return geom["coordinates"]
    return []


def rings_of(geom):
    if geom["type"] == "Polygon":
        return geom["coordinates"]
    if geom["type"] == "MultiPolygon":
        return [r for poly in geom["coordinates"] for r in poly]
    return []


rivers = json.load(open(SRC / "ne_10m_rivers_lake_centerlines.geojson"))
lakes = json.load(open(SRC / "ne_10m_lakes.geojson"))
countries = json.load(open(SRC / "ne_10m_admin_0_countries.geojson"))

# --- the Omo -----------------------------------------------------------------------------
omo = None
for f in rivers["features"]:
    if f["properties"].get("name") == "Omo":
        omo = f["geometry"]["coordinates"][0]
assert omo, "Omo River not found in Natural Earth data"

omo_proj = [proj(*p) for p in omo]
omo_simple = dp(omo_proj, 1.2)

# cumulative distance along the line (in km, using great-circle on the original points)
def hav(a, b):
    R = 6371.0088
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dla = la2 - la1
    dlo = math.radians(b[0] - a[0])
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

omo_ll_simple = []
# map simplified projected points back to lon/lat so the readout is exact for the drawn path
for x, y in omo_simple:
    omo_ll_simple.append((x / (K * COS) + LON0, LAT1 - y / K))
cum = [0.0]
for i in range(1, len(omo_ll_simple)):
    cum.append(cum[-1] + hav(omo_ll_simple[i - 1], omo_ll_simple[i]))

# --- other rivers (context, faint) -----------------------------------------------------
other_rivers = []
for f in rivers["features"]:
    if f["properties"].get("name") == "Omo":
        continue
    for line in lines_of(f["geometry"]):
        for run in runs_in_frame(line):
            pts = dp([proj(*p) for p in run], 0.8)
            if len(pts) > 1:
                other_rivers.append(path_d(pts))

# --- lakes -----------------------------------------------------------------------------
lake_paths = []
turkana = None
for f in lakes["features"]:
    g = f["geometry"]
    name = f["properties"].get("name")
    for ring in rings_of(g):
        if not any(inside(lon, lat) for lon, lat in ring):
            continue
        pts = dp_ring([proj(lon, lat) for lon, lat in ring], 0.5)
        if len(pts) < 4:
            continue
        # skip tiny lakes
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        if (max(xs) - min(xs)) < 8 and (max(ys) - min(ys)) < 8:
            continue
        d = path_d(pts, close=True)
        if name == "Lake Turkana":
            turkana = d
        lake_paths.append({"name": name, "d": d})

# --- country borders -------------------------------------------------------------------
WANT = {"Ethiopia", "Kenya", "South Sudan", "Uganda", "Somalia", "Sudan"}
borders = []
for f in countries["features"]:
    name = f["properties"].get("NAME") or f["properties"].get("ADMIN")
    if name not in WANT:
        continue
    for ring in rings_of(f["geometry"]):
        for run in runs_in_frame(ring, pad=0.2):
            pts = dp([proj(lon, lat) for lon, lat in run], 0.9)
            if len(pts) > 1:
                borders.append(path_d(pts))

# --- write -----------------------------------------------------------------------------
data = {
    "frame": {"lon0": LON0, "lon1": LON1, "lat0": LAT0, "lat1": LAT1, "k": K, "cos": COS, "w": round(W, 1), "h": round(H, 1)},
    "omo": path_d(omo_simple),
    "omoPoints": [[round(x, 1), round(y, 1)] for x, y in omo_simple],
    "omoLonLat": [[round(a, 4), round(b, 4)] for a, b in omo_ll_simple],
    "omoKm": [round(c, 1) for c in cum],
    "rivers": other_rivers,
    "lakes": lake_paths,
    "turkana": turkana,
    "borders": borders,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "// Generated by scripts/build-geo.py from Natural Earth (public domain). Do not edit by hand.\n"
    "// Projection: x = (lon - lon0) * 1000 * cos, y = (lat1 - lat) * 1000.\n"
    "export default " + json.dumps(data, separators=(",", ":")) + ";\n"
)
print("omo pts", len(omo), "->", len(omo_simple), "| km along drawn line:", round(cum[-1], 1))
print("rivers", len(other_rivers), "lakes", len(lake_paths), "borders", len(borders))
print("frame", data["frame"])
print("size KB", round(OUT.stat().st_size / 1024, 1))
