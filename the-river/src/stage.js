// One WebGL2 canvas carries the whole transformation: map → satellite → photograph → video.
// Each layer is revealed by its distance from the river, so the image opens out of the river's corridor.
// No fallback imitation: if WebGL2 is missing, `Stage.create` returns null and the page shows the line and map only.
import { FRAME, SAT_RECT } from './geo.js';
import { drawMapTexture } from './mapTexture.js';
import { buildDistanceField } from './distanceField.js';
import { STAGE, loadFirst, loadVideo, plateCanvas } from './media.js';

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 outColor;

uniform vec2 uRes;
uniform vec4 uCam;        // cx, cy (world), scale (device px per unit), kx
uniform vec2 uOrigin;     // device px where (cx, cy) lands
uniform vec2 uFrame;      // world frame size
uniform vec4 uSatRect;    // x0, y0, x1, y1 in world units
uniform sampler2D uMap;
uniform sampler2D uDist;
uniform sampler2D uSat;
uniform sampler2D uPhoto;
uniform sampler2D uVideo;
uniform float uMapA;
uniform float uSatR;
uniform float uPhotoR;
uniform float uVideoA;
uniform vec4 uPhotoFit;   // scale xy, offset zw
uniform vec4 uVideoFit;
uniform float uScrim;
uniform float uFade;
uniform float uTime;

const vec3 NIGHT = vec3(0.0196, 0.0196, 0.0157);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float opening(float d, float r, float soft, float n) {
  if (r <= 0.0) return 0.0;
  return 1.0 - smoothstep(r - soft, r + soft, d + n);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 world = vec2((frag.x - uOrigin.x) / (uCam.z * uCam.w) + uCam.x, (frag.y - uOrigin.y) / uCam.z + uCam.y);
  vec2 wuv = world / uFrame;
  bool inFrame = wuv.x >= 0.0 && wuv.x <= 1.0 && wuv.y >= 0.0 && wuv.y <= 1.0;

  vec3 col = NIGHT;
  if (inFrame) {
    // the atlas sheet dissolves into the dark at its edges instead of ending in a hard crop
    float sheet = smoothstep(0.0, 0.17, min(min(wuv.x, 1.0 - wuv.x), min(wuv.y, 1.0 - wuv.y)));
    col = mix(col, texture(uMap, wuv).rgb, uMapA * sheet);
  }

  float dWorld = inFrame ? texture(uDist, wuv).r : 99999.0;
  float dPx = dWorld * uCam.z;
  float nz = (vnoise(world * 0.0047) * 0.62 + vnoise(world * 0.019) * 0.38 - 0.5) * 2.0;

  // satellite, registered to its lon/lat box
  vec2 suv = (world - uSatRect.xy) / (uSatRect.zw - uSatRect.xy);
  float sIn = step(0.0, suv.x) * step(suv.x, 1.0) * step(0.0, suv.y) * step(suv.y, 1.0);
  float sEdge = smoothstep(0.0, 0.07, min(min(suv.x, 1.0 - suv.x), min(suv.y, 1.0 - suv.y)));
  float mS = opening(dPx, uSatR, 26.0 + uSatR * 0.1, nz * (14.0 + uSatR * 0.22)) * sIn * sEdge;
  if (mS > 0.0) col = mix(col, texture(uSat, clamp(suv, 0.0, 1.0)).rgb, mS);

  // aerial photograph, screen space, same corridor
  vec2 sc = frag / uRes - 0.5;
  float mP = opening(dPx, uPhotoR, 30.0 + uPhotoR * 0.1, nz * (16.0 + uPhotoR * 0.2));
  if (mP > 0.0) col = mix(col, texture(uPhoto, sc * uPhotoFit.xy + 0.5 + uPhotoFit.zw).rgb, mP);

  // video, dissolved in with the same slow noise
  if (uVideoA > 0.0) {
    float mV = smoothstep(0.0, 1.0, uVideoA * 1.6 - 0.3 + nz * 0.3);
    col = mix(col, texture(uVideo, sc * uVideoFit.xy + 0.5 + uVideoFit.zw).rgb, clamp(mV, 0.0, 1.0));
  }

  // reading scrim behind left-hand text, and fade to ground
  col *= 1.0 - uScrim * 0.62 * smoothstep(0.78, 0.0, frag.x / uRes.x);
  col = mix(NIGHT, col, uFade);
  col += (hash(frag + fract(uTime)) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export class Stage {
  static create(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    try {
      return new Stage(canvas, gl);
    } catch (err) {
      console.warn('[stage] WebGL2 setup failed', err);
      return null;
    }
  }

  constructor(canvas, gl) {
    this.canvas = canvas;
    this.gl = gl;
    this.dpr = 1;
    this.w = 1;
    this.h = 1;
    this.video = null;
    this.videoReady = false;
    this.loaded = { sat: false, photo: false, video: false };
    this.photoAspect = 16 / 9;
    this.videoAspect = 16 / 9;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    this.prog = prog;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.u = {};
    for (const n of ['uRes', 'uCam', 'uOrigin', 'uFrame', 'uSatRect', 'uMap', 'uDist', 'uSat', 'uPhoto', 'uVideo', 'uMapA', 'uSatR', 'uPhotoR', 'uVideoA', 'uPhotoFit', 'uVideoFit', 'uScrim', 'uFade', 'uTime']) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    // textures: 0 map, 1 distance, 2 satellite, 3 photograph, 4 video
    this.tex = [0, 1, 2, 3, 4].map(() => gl.createTexture());
    gl.uniform1i(this.u.uMap, 0);
    gl.uniform1i(this.u.uDist, 1);
    gl.uniform1i(this.u.uSat, 2);
    gl.uniform1i(this.u.uPhoto, 3);
    gl.uniform1i(this.u.uVideo, 4);
    gl.uniform2f(this.u.uFrame, FRAME.w, FRAME.h);
    gl.uniform4f(this.u.uSatRect, ...SAT_RECT);

    // map (mipmapped so hairlines survive minification)
    this.bind(0);
    this.setParams(true, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawMapTexture(2048));
    gl.generateMipmap(gl.TEXTURE_2D);

    // distance field (half float is filterable in WebGL2)
    const df = buildDistanceField(1024);
    this.bind(1);
    this.setParams(false, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, df.width, df.height, 0, gl.RED, gl.FLOAT, df.data);

    // start every image layer as a flat tone so nothing is ever undefined
    this.setPlate(2, STAGE.satellite, 1024, 1280, false);
    this.setPlate(3, STAGE.photo, 1024, 576, false);
    this.setPlate(4, STAGE.video, 1024, 576, false);
  }

  bind(unit) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[unit]);
  }

  setParams(mip, repeat) {
    const gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  }

  setPlate(unit, cfg, w, h, withLabel) {
    const gl = this.gl;
    this.bind(unit);
    this.setParams(false, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plateCanvas(w, h, cfg.tone, withLabel ? cfg.label : ''));
  }

  setImage(unit, img, mip = true) {
    const gl = this.gl;
    this.bind(unit);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    this.setParams(mip, false);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  }

  /** Fetch the real layers when the scroll gets close; fall back to labelled plates if a file is absent. */
  async ensure(kind) {
    if (this.loaded[kind] !== false) return;
    this.loaded[kind] = 'loading';
    if (kind === 'sat') {
      const img = await loadFirst(STAGE.satellite.candidates);
      if (img) {
        this.setImage(2, img);
        this.hasSat = true;
      } else {
        // No satellite plate yet: the descent goes straight from the map to the photograph. Nothing is imitated.
        this.hasSat = false;
        console.info('[stage] no satellite plate at public/media/sat-omo-1920.jpg; skipping that step. See MEDIA.md.');
      }
      this.loaded.sat = true;
    } else if (kind === 'photo') {
      const img = await loadFirst(STAGE.photo.candidates);
      if (img) {
        this.setImage(3, img);
        this.photoAspect = img.naturalWidth / img.naturalHeight;
      } else this.setPlate(3, STAGE.photo, 1024, 576, true);
      this.loaded.photo = true;
    } else if (kind === 'video') {
      const v = await loadVideo(STAGE.video.sources);
      if (v) {
        this.video = v;
        this.videoAspect = v.videoWidth / v.videoHeight || 16 / 9;
        this.videoReady = true;
      } else this.setPlate(4, STAGE.video, 1024, 576, true);
      this.loaded.video = true;
    }
  }

  playVideo(on) {
    if (!this.video) return;
    if (on && this.video.paused) this.video.play().catch(() => {});
    if (!on && !this.video.paused) this.video.pause();
  }

  resize(cssW, cssH, dpr) {
    this.dpr = dpr;
    this.w = cssW;
    this.h = cssH;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  fit(aspect, zoom, shiftX = 0, shiftY = 0) {
    const ra = this.w / this.h;
    let sx = 1;
    let sy = 1;
    if (aspect > ra) sx = ra / aspect;
    else sy = aspect / ra;
    return [sx / zoom, sy / zoom, shiftX, shiftY];
  }

  /**
   * s: { cam:{cx,cy,s,kx,ox,oy}, mapA, satR, photoR, videoA, photoZoom, videoZoom, scrim, fade, t }
   * Radii are in CSS px; origin is a fraction of the viewport.
   */
  render(s) {
    const gl = this.gl;
    const d = this.dpr;
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform4f(this.u.uCam, s.cam.cx, s.cam.cy, s.cam.s * d, s.cam.kx);
    gl.uniform2f(this.u.uOrigin, s.cam.ox * this.canvas.width, s.cam.oy * this.canvas.height);
    gl.uniform1f(this.u.uMapA, s.mapA);
    gl.uniform1f(this.u.uSatR, (this.hasSat === false ? 0 : s.satR) * d);
    gl.uniform1f(this.u.uPhotoR, s.photoR * d);
    gl.uniform1f(this.u.uVideoA, s.videoA);
    gl.uniform4f(this.u.uPhotoFit, ...this.fit(this.photoAspect, s.photoZoom, s.photoShift || 0, 0));
    gl.uniform4f(this.u.uVideoFit, ...this.fit(this.videoAspect, s.videoZoom, 0, 0));
    gl.uniform1f(this.u.uScrim, s.scrim);
    gl.uniform1f(this.u.uFade, s.fade);
    gl.uniform1f(this.u.uTime, s.t % 7);

    if (this.videoReady && s.videoA > 0 && this.video.readyState >= 2) {
      this.bind(4);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      this.setParams(false, false);
    }
    // textures stay bound to their own units between frames
    for (let i = 0; i < 5; i++) this.bind(i);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
