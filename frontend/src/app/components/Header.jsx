'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import KTShopLogo from './KTShopLogo';

const navLinks = [
  { href: '/',             label: 'Trang chủ' },
  { href: '/san-pham',     label: 'Sản phẩm'  },
  { href: '/build-pc',     label: 'Build PC'  },
  { href: '/flash-sale',   label: 'Flash Sale', isFlash: true },
  { href: '/tin-tuc',      label: 'Tin tức'   },
  { href: '/bao-hanh',     label: 'Bảo hành'  },
  { href: '/tra-cuu-don',  label: 'Tra cứu đơn' },
  { href: '/lien-he',      label: 'Liên hệ'   },
];


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, cart, theme, toggleTheme } = useAppContext();
  const [searchValue, setSearchValue]   = useState('');
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const authRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);


  const handleLogout = async () => {
    if (user && user.id) {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      }).catch(console.error);
    }
    localStorage.removeItem('user');
    setUser(null);
    setShowAuthMenu(false);
    router.refresh();
  };

  // Shadow khi scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => {
      if (authRef.current && !authRef.current.contains(e.target)) {
        setShowAuthMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/san-pham?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-inner">

        {/* ── LOGO ── */}
        <Link href="/" className="header-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <KTShopLogo height={38} />
        </Link>

        {/* ── NAV ── */}
        <nav className="header-nav">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <span className="nav-link-label">
                  {link.isFlash && <span className="nav-flash-dot">• </span>}
                  {link.label}
                </span>
                {isActive && <span className="nav-active-bar" />}
              </Link>
            );
          })}
        </nav>


        {/* ── SEARCH ── */}
        <form className="header-search" onSubmit={handleSearch}>
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Tìm kiếm laptop..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="submit" className="search-btn" aria-label="Tìm kiếm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* ── AUTH, CART & THEME ── */}
        <div className="header-auth" ref={authRef} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Đổi giao diện"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              padding: 0,
            }}
          >
            <img
              src={theme === 'dark' ? '/sun-favicon.svg' : '/moon-favicon.svg'}
              alt={theme === 'dark' ? 'Mặt trời - Chuyển sang giao diện Sáng' : 'Mặt trăng - Chuyển sang giao diện Tối'}
              width="23"
              height="23"
              style={{
                objectFit: 'contain',
                filter: theme === 'dark'
                  ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.75))'
                  : 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.65))',
                transition: 'transform 0.3s ease, filter 0.3s ease',
              }}
            />
          </button>

          <Link href="/gio-hang" className="cart-icon-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text)', padding: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '0 4px', borderRadius: '9999px', minWidth: '16px', textAlign: 'center' }}>
                {cart.reduce((a, b) => a + b.so_luong, 0)}
              </span>
            )}
          </Link>

          {user && (
            <div className="header-user-badge">
              <span className="user-greeting-text">
                Chào mừng, <strong className="user-greeting-name">{user.ho_ten}</strong>
              </span>
              {user.balance !== undefined && (
                <span className="user-greeting-balance">
                  Số dư: <strong>{Number(user.balance).toLocaleString('vi-VN')} đ</strong>
                </span>
              )}
            </div>
          )}
          <button
            id="auth-toggle-btn"
            className="auth-toggle-btn"
            onClick={() => setShowAuthMenu((v) => !v)}
            aria-expanded={showAuthMenu}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Tài khoản</span>
            <svg
              className={`chevron ${showAuthMenu ? 'open' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {showAuthMenu && (
            <div className="auth-dropdown" id="auth-dropdown">
              {user ? (
                <>
                  {['qtv', 'admin', 'nhan_su', 'nhan_vien_kho', 'nhan_vien'].includes(user.vai_tro || user.role) && (
                    <Link href="/admin/dashboard" className="auth-item" onClick={() => setShowAuthMenu(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      Dashboard
                    </Link>
                  )}
                  <Link href="/trang-ca-nhan" className="auth-item" onClick={() => setShowAuthMenu(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Trang cá nhân
                  </Link>
                  <Link href="/nap-tien" className="auth-item" onClick={() => setShowAuthMenu(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="6" y1="12" x2="18" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                    </svg>
                    <span>Nạp tiền vào ví <strong style={{ color: '#10b981', marginLeft: 4 }}>({Number(user.balance || 0).toLocaleString('vi-VN')}đ)</strong></span>
                  </Link>
                  <Link href="/trang-ca-nhan?tab=orders" className="auth-item" onClick={() => setShowAuthMenu(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Đơn hàng của tôi
                  </Link>
                  <div className="auth-divider" />
                  <button className="auth-item" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <Link href="/dang-nhap" className="auth-item" onClick={() => setShowAuthMenu(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Đăng Nhập
                  </Link>
                  <div className="auth-divider" />
                  <Link href="/dang-ky" className="auth-item auth-item-register" onClick={() => setShowAuthMenu(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Đăng Ký
                  </Link>
                </>
              )}
            </div>
          )}

          {/* ── MOBILE MENU BUTTON ── */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-list">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-nav-label">
                    {link.isFlash && <span className="nav-flash-dot">• </span>}
                    {link.label}
                  </span>
                  {isActive && <span style={{ color: '#ef4444', fontWeight: 800 }}>✓</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

