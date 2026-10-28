import Link from 'next/link';
import KTShopLogo from './KTShopLogo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ── COL 1: Thương hiệu ── */}
        <div className="footer-col">
          <div className="footer-logo" style={{ marginBottom: '16px' }}>
            <KTShopLogo height={36} variant="footer" />
          </div>
          <p className="footer-desc">
            Chuyên cung cấp laptop chính hãng, giá tốt nhất thị trường.
            Bảo hành uy tín – Giao hàng toàn quốc.
          </p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Facebook">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://zalo.me" target="_blank" rel="noreferrer" className="social-btn" aria-label="Zalo">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14H14l-2.5-3.5V16H9V8h2.5l2.5 3.5V8H16.5v8z"/>
              </svg>
            </a>
            <a href="tel:0909000001" className="social-btn" aria-label="Hotline">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.57 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.48 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.72-.72a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16l.42.92z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ── COL 2: Liên kết ── */}
        <div className="footer-col">
          <h3 className="footer-title">Liên Kết Nhanh</h3>
          <ul className="footer-links">
            <li><Link href="/">Trang Chủ</Link></li>
            <li><Link href="/san-pham">Sản Phẩm</Link></li>
            <li><Link href="/tin-tuc">Tin Tức Công Nghệ</Link></li>
            <li><Link href="/gioi-thieu">Giới Thiệu</Link></li>
            <li><Link href="/dang-nhap">Đăng Nhập</Link></li>
            <li><Link href="/dang-ky">Đăng Ký</Link></li>
          </ul>
        </div>

        {/* ── COL 3: Danh mục ── */}
        <div className="footer-col">
          <h3 className="footer-title">Danh Mục Nổi Bật</h3>
          <ul className="footer-links">
            <li><Link href="/san-pham?brand=dell">Laptop Dell</Link></li>
            <li><Link href="/san-pham?brand=asus">Laptop Asus</Link></li>
            <li><Link href="/san-pham?brand=lenovo">Laptop Lenovo</Link></li>
            <li><Link href="/san-pham?brand=hp">Laptop HP</Link></li>
            <li><Link href="/san-pham?brand=apple">MacBook Apple</Link></li>
          </ul>
        </div>

        {/* ── COL 4: Liên hệ ── */}
        <div className="footer-col">
          <h3 className="footer-title">Liên Hệ</h3>
          <ul className="footer-contact">
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
            </li>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.57 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.48 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.72-.72a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16l.42.92z"/>
              </svg>
              <span>0909 000 001</span>
            </li>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>ktshop@gmail.com</span>
            </li>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Thứ 2 – Chủ nhật: 8:00 – 21:00</span>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <p>© {year} <strong>KTSHOP</strong>. Tất cả quyền được bảo lưu.</p>
        <div className="footer-bottom-links">
          <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
          <span>·</span>
          <Link href="/dieu-khoan">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  );
}
