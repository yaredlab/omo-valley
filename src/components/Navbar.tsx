import { useState, useEffect } from 'react';

const NAV_LINKS = ['Campaign', 'Artists', 'Events', 'Catalog', 'Playlists'];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="nav" id="siteNav">
        <div className="nav-inner">
          <a className="brand" href="#" aria-label="HYEN home">
            <span className="brand-mark">OBUL</span>
            <span className="brand-divider" aria-hidden="true" />
            <span className="brand-kicker">Creative&nbsp;Studio</span>
          </a>

          {/* Open middle space keeping the head/face area completely clear */}
          <div className="flex-1 min-w-[24px]" aria-hidden="true" />

          {/* Right side: all navigation links + action icons grouped together */}
          <div className="flex items-center gap-4 lg:gap-6 ml-auto">
            <nav className="nav-links" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a key={link} className="nav-link" href="#">
                  {link}
                </a>
              ))}
            </nav>

            <div className="nav-actions">
              <a className="icon-btn" href="#" aria-label="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.1" cy="6.9" r="0.6" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a className="icon-btn" href="#" aria-label="Spotify">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M7.2 10c3.1-0.9 6.6-0.6 9.3 0.9" />
                  <path d="M7.7 13.1c2.5-0.7 5.4-0.5 7.6 0.8" />
                  <path d="M8.3 16c2-0.5 4.1-0.4 5.8 0.6" />
                </svg>
              </a>
              <span className="rule-v" aria-hidden="true" />
              <button
                className="menu-toggle"
                id="menuToggle"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                type="button"
              >
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav
        className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
        id="mobileMenu"
        aria-label="Mobile"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            onClick={() => setMenuOpen(false)}
          >
            {link}
          </a>
        ))}
      </nav>
    </>
  );
}
