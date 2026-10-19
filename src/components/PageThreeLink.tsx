/**
 * PageThreeLink — entry strip linking the main scroll story into Page 03: The River.
 * This is the ONLY change made to the existing site to support Page 03.
 * It sits below DraggableCardDemo and matches its dark background.
 */
export default function PageThreeLink() {
  return (
    <div
      style={{
        background: '#061E29',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
      }}
    >
      <a
        href="/03/"
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
          fontSize: '0.75rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          transition: 'color 0.25s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(205,180,138,1)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)')}
      >
        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>Next</span>
        <span style={{ fontSize: '1.1rem', letterSpacing: '0.28em', color: 'inherit', fontWeight: 500 }}>
          The River
        </span>
        <span
          style={{
            width: '2.4rem',
            height: '1px',
            background: 'currentColor',
            display: 'block',
            opacity: 0.4,
            marginTop: '0.25rem',
          }}
        />
        <span style={{ opacity: 0.4 }}>03</span>
      </a>
    </div>
  );
}
