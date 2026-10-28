export default function KTShopLogo({ height = 42, className = '', variant = 'default' }) {
  // variant: 'default' | 'admin' | 'footer'
  const isDarkAccent = variant === 'footer' || variant === 'admin';

  return (
    <div className={`ktshop-logo-component ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', userSelect: 'none' }}>
      {/* ── Modern High-Tech Vector Emblem ── */}
      <svg
        viewBox="0 0 48 48"
        width={height}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.25))' }}
      >
        <defs>
          <linearGradient id="ktLogoEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="ktLogoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Shield / Badge */}
        <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#ktLogoEmblemGrad)" />
        <rect x="2.5" y="2.5" width="43" height="43" rx="10.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

        {/* Laptop Display Silhouette */}
        <rect x="10" y="10" width="28" height="18" rx="2" fill="rgba(15, 23, 42, 0.5)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />

        {/* Monogram K */}
        <path
          d="M16 13.5v11M16 19l5.5-5.5M16.5 18.5l6 6"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Monogram T with Cyan accent */}
        <path
          d="M25 13.5h7M28.5 13.5v11"
          stroke="url(#ktLogoCyan)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Laptop Keyboard / Base Stand */}
        <path d="M7 31h34l-2.2 3.5H9.2L7 31z" fill="url(#ktLogoCyan)" opacity="0.95" />
        <line x1="20" y1="32.5" x2="28" y2="32.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* ── Typography Wordmark ── */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-0.5px' }}>
          <span
            className="kt-brand-kt"
            style={{
              fontSize: `${height * 0.56}px`,
              fontWeight: 900,
              fontFamily: "'Inter', system-ui, sans-serif",
              color: isDarkAccent ? '#ffffff' : 'var(--text, #0f172a)',
              letterSpacing: '-0.5px'
            }}
          >
            KT
          </span>
          <span
            className="kt-brand-shop"
            style={{
              fontSize: `${height * 0.56}px`,
              fontWeight: 800,
              fontFamily: "'Inter', system-ui, sans-serif",
              color: '#f59e0b',
              marginLeft: '2px',
              letterSpacing: '0.2px'
            }}
          >
            SHOP
          </span>
          {variant === 'admin' && (
            <span
              style={{
                fontSize: `${height * 0.24}px`,
                fontWeight: 800,
                color: '#9fd5bb',
                marginLeft: '6px',
                letterSpacing: '1px'
              }}
            >
              ADMIN
            </span>
          )}
        </div>
        {variant !== 'admin' && (
          <span
            className="kt-brand-slogan"
            style={{
              fontSize: `${Math.max(7.5, height * 0.2)}px`,
              fontWeight: 700,
              letterSpacing: '2px',
              color: isDarkAccent ? '#94a3b8' : 'var(--text-muted, #64748b)',
              marginTop: '3px',
              fontFamily: "'Inter', system-ui, sans-serif",
              textTransform: 'uppercase'
            }}
          >
            Laptop Chính Hãng
          </span>
        )}
      </div>
    </div>
  );
}
