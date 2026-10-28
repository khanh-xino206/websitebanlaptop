import Link from 'next/link';

// Dữ liệu mở rộng và biểu tượng thương hiệu chuẩn cho từng hãng laptop
const BRAND_META = {
  'Dell': {
    origin: 'Hoa Kỳ (USA)',
    badge: 'Titanium Partner',
    accent: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(2, 132, 199, 0.12), rgba(14, 165, 233, 0.04))',
    borderHover: '#38bdf8',
    slogan: 'Bền bỉ, hiệu năng cao & máy trạm',
    popularSeries: ['XPS', 'Inspiron', 'G15 Gaming'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
          <circle cx="16" cy="16" r="14.5" stroke="#0284c7" strokeWidth="2.5" />
          <path d="M12 9h4.5c3.5 0 6 2.5 6 7s-2.5 7-6 7H12V9zm4 10.5c1.8 0 2.8-1.5 2.8-3.5s-1-3.5-2.8-3.5H15v7h1z" fill="#0284c7" />
        </svg>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '2px', fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#0284c7' }}>
          DELL
        </span>
      </div>
    ),
  },
  'HP': {
    origin: 'Hoa Kỳ (USA)',
    badge: 'Chính Hãng',
    accent: '#0096d6',
    glowColor: 'rgba(0, 150, 214, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(0, 150, 214, 0.12), rgba(59, 130, 246, 0.04))',
    borderHover: '#60a5fa',
    slogan: 'Mỏng nhẹ thời thượng & chuẩn màu',
    popularSeries: ['Spectre', 'Envy', 'Victus'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg viewBox="0 0 100 100" width="38" height="38" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#0096d6" strokeWidth="7" />
          <text x="50" y="66" textAnchor="middle" fill="#0096d6" fontSize="50" fontWeight="900" fontStyle="italic" fontFamily="'Times New Roman', serif">
            hp
          </text>
        </svg>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text)' }}>
          Hewlett Packard
        </span>
      </div>
    ),
  },
  'Asus': {
    origin: 'Đài Loan',
    badge: 'ROG Gaming #1',
    accent: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.04))',
    borderHover: '#34d399',
    slogan: 'ROG Gaming & Zenbook màn OLED',
    popularSeries: ['ROG Strix', 'TUF', 'Zenbook'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '3px', fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#10b981' }}>
          ASUS
        </span>
      </div>
    ),
  },
  'Lenovo': {
    origin: 'Quốc Tế',
    badge: 'Bán Chạy Nhất',
    accent: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.04))',
    borderHover: '#fbbf24',
    slogan: 'Bàn phím ThinkPad & Legion đỉnh',
    popularSeries: ['ThinkPad', 'Legion', 'LOQ'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#e11d48', padding: '5px 16px', borderRadius: '5px', display: 'inline-flex', boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)' }}>
          <span style={{ color: '#ffffff', fontSize: '1.3rem', fontWeight: 900, letterSpacing: '1.5px', fontFamily: 'sans-serif' }}>
            Lenovo
          </span>
        </div>
      </div>
    ),
  },
  'Acer': {
    origin: 'Đài Loan',
    badge: 'Trợ Giá Sinh Viên',
    accent: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(139, 92, 246, 0.12), rgba(109, 40, 217, 0.04))',
    borderHover: '#a78bfa',
    slogan: 'Cấu hình tối đa trong tầm giá',
    popularSeries: ['Nitro 5', 'Predator', 'Swift'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '1.5px', fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#8b5cf6' }}>
          acer
        </span>
      </div>
    ),
  },
  'Apple': {
    origin: 'Cupertino (USA)',
    badge: 'Apple Authorized',
    accent: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    gradient: 'linear-gradient(145deg, rgba(148, 163, 184, 0.12), rgba(51, 65, 85, 0.04))',
    borderHover: '#e2e8f0',
    slogan: 'Chip Apple M3 • Pin trâu 22 giờ',
    popularSeries: ['Air M2/M3', 'Pro M3', 'Pro Max'],
    renderLogo: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
        <svg viewBox="0 0 170 170" width="32" height="32" fill="currentColor">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-6-9.12-10.7-19.46-14.12-30.98-3.41-11.53-5.12-22.65-5.12-33.36 0-14.44 3.63-26.68 10.89-36.73 7.25-10.05 16.64-15.17 28.16-15.37 5.01 0 10.49 1.28 16.45 3.85 5.96 2.57 9.87 3.86 11.73 3.86 1.63 0 5.66-1.33 12.1-3.99 6.43-2.66 11.96-3.86 16.59-3.6 12.51.98 22.56 5.67 30.15 14.07-10.99 6.64-16.38 15.77-16.17 27.41.22 9.24 3.75 16.96 10.6 23.16 6.85 6.2 15.01 9.84 24.49 10.92-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.15c0-7.29 2.67-14.16 8.01-20.61 5.33-6.45 12-10.84 20-13.16.22 1.3.33 2.5.33 3.59 0 7.18-2.83 14.2-8.49 21.05-5.66 6.86-12.41 11.05-20.25 12.57-.44-1.2-.6-2.35-.6-3.44z" />
        </svg>
        <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.5px' }}>
          Apple
        </span>
      </div>
    ),
  },
};

export default function Brand({ brands = [] }) {
  return (
    <section className="brand-section">
      <div className="section-title-wrap">
        <div className="section-badge-pill">
          <span>ĐỐI TÁC CÔNG NGHỆ CHÍNH HÃNG</span>
        </div>
        <h2 className="section-title">Thương Hiệu Laptop Nổi Bật</h2>
        <p className="section-sub">
          Cam kết 100% phân phối chính hãng với dịch vụ bảo hành toàn diện từ các tập đoàn công nghệ số 1 thế giới
        </p>
      </div>

      <div className="premium-brand-grid">
        {brands.map(brand => {
          const meta = BRAND_META[brand.ten_NH] || {
            origin: 'Chính Hãng',
            badge: 'Chất Lượng',
            accent: '#3b82f6',
            glowColor: 'rgba(59, 130, 246, 0.35)',
            gradient: 'linear-gradient(145deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.04))',
            borderHover: '#60a5fa',
            slogan: 'Hiệu năng mạnh mẽ & tin cậy',
            popularSeries: ['Laptop', 'Ultrabook', 'Gaming'],
            renderLogo: null,
          };

          return (
            <Link
              key={brand.id}
              href={`/san-pham?brand=${encodeURIComponent(brand.ten_NH.toLowerCase())}`}
              className="premium-brand-card"
              style={{
                '--brand-accent': meta.accent,
                '--brand-glow': meta.glowColor,
                '--brand-border-hover': meta.borderHover,
                '--brand-gradient': meta.gradient,
              }}
            >
              {/* Top Meta: Origin + Active Status Dot */}
              <div className="brand-card-top">
                <span className="brand-origin-tag">{meta.origin}</span>
                <span className="brand-status-dot" title="Sẵn hàng trong kho" />
              </div>

              {/* Logo Area */}
              <div className="brand-logo-wrap">
                {meta.renderLogo ? (
                  <div className="brand-svg-container">{meta.renderLogo()}</div>
                ) : (
                  <span className="brand-fallback-name">{brand.ten_NH}</span>
                )}
              </div>

              {/* Brand Title & Slogan */}
              <div className="brand-info-wrap">
                <h3 className="brand-name-title">{brand.ten_NH}</h3>
                <p className="brand-slogan-text">{meta.slogan}</p>
              </div>

              {/* Series Tags */}
              <div className="brand-series-row">
                {meta.popularSeries.map((series, idx) => (
                  <span key={idx} className="brand-series-chip">
                    {series}
                  </span>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="brand-card-footer">
                <span className="brand-count-indicator">
                  <span className="brand-indicator-count">6+</span> mẫu máy
                </span>
                <span className="brand-explore-btn">
                  Khám phá
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
