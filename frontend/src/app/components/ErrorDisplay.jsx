'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const ERROR_DEFINITIONS = {
  400: {
    code: '400',
    title: 'Yêu cầu không hợp lệ',
    subtitle: 'Dữ liệu gửi lên không đúng định dạng hoặc thiếu trường bắt buộc.',
    description: 'Hệ thống không thể xử lý yêu cầu của bạn vì cú pháp hoặc tham số chưa chính xác. Vui lòng kiểm tra lại thông tin vừa nhập và thử lại.',
    badge: 'BAD REQUEST',
    theme: 'warning',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    iconType: 'alert',
    primaryAction: { label: 'Kiểm tra lại dữ liệu', action: 'back' },
    secondaryAction: { label: 'Về trang chủ KTSHOP', href: '/' },
    suggestions: [
      { label: 'Về trang chủ KTSHOP', href: '/' },
      { label: 'Khám phá laptop chính hãng', href: '/san-pham' },
      { label: 'Giỏ hàng của bạn', href: '/gio-hang' },
    ],
  },
  401: {
    code: '401',
    title: 'Yêu cầu đăng nhập',
    subtitle: 'Bạn chưa đăng nhập hoặc phiên làm việc của bạn đã hết hạn.',
    description: 'Để bảo vệ an toàn thông tin tài khoản và dữ liệu cá nhân, tính năng này yêu cầu bạn phải đăng nhập vào hệ thống KTSHOP.',
    badge: 'UNAUTHORIZED',
    theme: 'purple',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    iconType: 'lock',
    primaryAction: { label: 'Đăng nhập ngay', href: '/dang-nhap', icon: 'login' },
    secondaryAction: { label: 'Tạo tài khoản mới', href: '/dang-ky' },
    suggestions: [
      { label: 'Đăng nhập bằng tài khoản KTSHOP', href: '/dang-nhap' },
      { label: 'Đăng ký tài khoản khách hàng mới', href: '/dang-ky' },
      { label: 'Quên mật khẩu đăng nhập?', href: '/quen-mat-khau' },
      { label: 'Về trang chủ KTSHOP', href: '/' },
    ],
  },
  403: {
    code: '403',
    title: 'Không có quyền truy cập',
    subtitle: 'Tài khoản của bạn không được cấp quyền để truy cập khu vực này.',
    description: 'Trang hoặc tính năng này được giới hạn quyền bảo mật (chỉ dành cho Quản trị viên hoặc Nhân viên được phân quyền). Nếu bạn cần truy cập, vui lòng liên hệ quản lý hệ thống.',
    badge: 'FORBIDDEN',
    theme: 'danger',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    iconType: 'shield',
    primaryAction: { label: 'Chuyển sang tài khoản khác', href: '/dang-nhap' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Đăng nhập tài khoản có quyền quản trị', href: '/dang-nhap' },
      { label: 'Về trang chủ mua sắm KTSHOP', href: '/' },
      { label: 'Trang thông tin cá nhân', href: '/trang-ca-nhan' },
    ],
  },
  404: {
    code: '404',
    title: 'Không tìm thấy trang',
    subtitle: 'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi.',
    description: 'Có thể liên kết bị hỏng, sản phẩm bạn tìm đã ngừng kinh doanh hoặc địa chỉ URL bị nhập sai. Đừng lo lắng, hãy thử tìm kiếm sản phẩm hoặc sử dụng các gợi ý bên dưới.',
    badge: 'PAGE NOT FOUND',
    theme: 'info',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    iconType: 'compass',
    primaryAction: { label: 'Khám phá sản phẩm', href: '/san-pham', icon: 'laptop' },
    secondaryAction: { label: 'Về trang chủ KTSHOP', href: '/' },
    suggestions: [
      { label: 'Laptop Gaming hiệu năng cao', href: '/san-pham?nhu_cau=gaming' },
      { label: 'Laptop Văn phòng mỏng nhẹ', href: '/san-pham?nhu_cau=mong_nhe' },
      { label: 'Laptop Đồ họa kỹ thuật', href: '/san-pham?nhu_cau=do_hoa' },
      { label: 'Xem giỏ hàng của bạn', href: '/gio-hang' },
    ],
  },
  409: {
    code: '409',
    title: 'Xung đột dữ liệu',
    subtitle: 'Yêu cầu không thể hoàn tất do xung đột với trạng thái hiện tại.',
    description: 'Dữ liệu bạn đang thao tác có thể đã được cập nhật bởi một phiên khác, hoặc tài nguyên (email, đơn hàng, mã) đã tồn tại từ trước.',
    badge: 'CONFLICT',
    theme: 'amber',
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    iconType: 'copy',
    primaryAction: { label: 'Tải lại trang', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Tải lại trang để lấy dữ liệu mới nhất', action: 'reload' },
      { label: 'Về trang chủ', href: '/' },
      { label: 'Kiểm tra trang cá nhân', href: '/trang-ca-nhan' },
    ],
  },
  422: {
    code: '422',
    title: 'Dữ liệu không thể xử lý',
    subtitle: 'Một số thông tin gửi lên chưa vượt qua kiểm tra tính hợp lệ.',
    description: 'Yêu cầu được gửi đúng cú pháp nhưng nội dung dữ liệu chưa thỏa mãn điều kiện nghiệp vụ của hệ thống KTSHOP.',
    badge: 'UNPROCESSABLE ENTITY',
    theme: 'purple',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    iconType: 'alert',
    primaryAction: { label: 'Quay lại kiểm tra', action: 'back' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Quay lại form để sửa dữ liệu', action: 'back' },
      { label: 'Về trang chủ KTSHOP', href: '/' },
    ],
  },
  429: {
    code: '429',
    title: 'Thao tác quá nhanh',
    subtitle: 'Hệ thống tạm ngưng nhận yêu cầu để bảo vệ máy chủ.',
    description: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng nghỉ ngơi một chút trước khi thử lại.',
    badge: 'RATE LIMIT EXCEEDED',
    theme: 'warning',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.3)',
    iconType: 'hourglass',
    hasCountdown: true,
    primaryAction: { label: 'Thử lại ngay', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Chờ bộ đếm giờ kết thúc và tự tải lại', action: 'reload' },
      { label: 'Về trang chủ KTSHOP', href: '/' },
    ],
  },
  500: {
    code: '500',
    title: 'Lỗi máy chủ nội bộ',
    subtitle: 'Hệ thống gặp sự cố bất ngờ trong quá trình xử lý yêu cầu.',
    description: 'Đội ngũ kỹ thuật của KTSHOP đã nhận được thông báo về sự cố này và đang khẩn trương xử lý. Xin lỗi vì sự bất tiện này.',
    badge: 'INTERNAL SERVER ERROR',
    theme: 'danger',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    iconType: 'server',
    primaryAction: { label: 'Tải lại trang', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ KTSHOP', href: '/' },
    suggestions: [
      { label: 'Thử tải lại trang để thử lại', action: 'reload' },
      { label: 'Về trang chủ KTSHOP', href: '/' },
      { label: 'Khám phá sản phẩm laptop', href: '/san-pham' },
    ],
  },
  502: {
    code: '502',
    title: 'Máy chủ tạm thời không phản hồi',
    subtitle: 'Cổng kết nối giữa máy chủ web và dịch vụ dữ liệu gặp sự cố (Bad Gateway).',
    description: 'Máy chủ đang phản hồi chậm hoặc tạm gián đoạn. Tình trạng này thường chỉ kéo dài trong vài giây.',
    badge: 'BAD GATEWAY',
    theme: 'teal',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    iconType: 'cloud',
    primaryAction: { label: 'Tải lại trang', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Tải lại trang sau ít giây', action: 'reload' },
      { label: 'Về trang chủ KTSHOP', href: '/' },
    ],
  },
  503: {
    code: '503',
    title: 'Hệ thống đang bảo trì',
    subtitle: 'Dịch vụ tạm ngưng để nâng cấp hoặc đang trong trạng thái quá tải.',
    description: 'KTSHOP đang tiến hành bảo trì định kỳ nhằm nâng cấp hiệu năng và bổ sung tính năng mới. Chúng tôi sẽ trở lại rất sớm.',
    badge: 'SERVICE UNAVAILABLE',
    theme: 'teal',
    accentColor: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.3)',
    iconType: 'wrench',
    primaryAction: { label: 'Kiểm tra trạng thái', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Thử lại sau ít phút', action: 'reload' },
      { label: 'Về trang chủ', href: '/' },
    ],
  },
  net: {
    code: 'NET',
    title: 'Mất kết nối mạng',
    subtitle: 'Không thể kết nối đến máy chủ hoặc thiết bị của bạn đang ngoại tuyến.',
    description: 'Vui lòng kiểm tra lại kết nối Wi-Fi, mạng có dây hoặc dữ liệu di động 4G/5G trên thiết bị của bạn rồi thử lại.',
    badge: 'NETWORK OFFLINE',
    theme: 'slate',
    accentColor: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.25)',
    iconType: 'wifi',
    primaryAction: { label: 'Thử kết nối lại', action: 'reload' },
    secondaryAction: { label: 'Về trang chủ', href: '/' },
    suggestions: [
      { label: 'Kiểm tra lại kết nối mạng Wi-Fi/4G', action: 'reload' },
      { label: 'Về trang chủ', href: '/' },
    ],
  },
};

export default function ErrorDisplay({
  code = '404',
  customTitle,
  customSubtitle,
  customMessage,
  onRetry,
  errorDetail,
  showCodeSwitcher = false,
  onSelectCode,
}) {
  const router = useRouter();
  const normalizedCode = String(code).toLowerCase();
  const config = ERROR_DEFINITIONS[normalizedCode] || ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS['500'];

  // Search input state on error page
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(config.hasCountdown ? 10 : null);
  const [showDebug, setShowDebug] = useState(false);

  // Countdown timer for 429
  useEffect(() => {
    if (!config.hasCountdown) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (typeof onRetry === 'function') onRetry();
          else if (typeof window !== 'undefined') window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [code, config.hasCountdown, onRetry]);

  const handleAction = (action) => {
    if (action === 'reload') {
      if (typeof onRetry === 'function') onRetry();
      else if (typeof window !== 'undefined') window.location.reload();
    } else if (action === 'back') {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        router.push('/');
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/san-pham?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Render SVG Icon theo từng loại lỗi
  const renderIcon = () => {
    switch (config.iconType) {
      case 'lock':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
      case 'shield':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      case 'compass':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        );
      case 'server':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
            <line x1="10" y1="6" x2="18" y2="6" />
            <line x1="10" y1="18" x2="18" y2="18" />
          </svg>
        );
      case 'hourglass':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </svg>
        );
      case 'wifi':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        );
      case 'cloud':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        );
      case 'wrench':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      default:
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  return (
    <div className="error-page-container">
      {/* ── INTERACTIVE CODE SELECTOR (Dành cho trang /loi hoặc xem trước) ── */}
      {showCodeSwitcher && (
        <div className="error-code-switcher">
          <span className="error-code-switcher-label">Xem giao diện các mã lỗi:</span>
          <div className="error-code-pills">
            {Object.keys(ERROR_DEFINITIONS).map((key) => {
              const def = ERROR_DEFINITIONS[key];
              const isSelected = String(code).toLowerCase() === String(key).toLowerCase();
              return (
                <button
                  key={key}
                  type="button"
                  className={`error-code-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectCode && onSelectCode(key)}
                  style={{
                    borderColor: isSelected ? def.accentColor : 'transparent',
                    color: isSelected ? def.accentColor : 'inherit',
                  }}
                >
                  <span className="error-code-pill-badge" style={{ backgroundColor: def.accentColor }} />
                  {def.code} - {def.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN ERROR CARD ── */}
      <div className="error-card" style={{ '--error-accent': config.accentColor, '--error-glow': config.glowColor }}>
        {/* Glow ambient background */}
        <div className="error-card-glow" />

        {/* Top badge */}
        <div className="error-top-badge" style={{ borderColor: config.accentColor, color: config.accentColor }}>
          <span className="error-dot" style={{ backgroundColor: config.accentColor }} />
          {config.badge}
        </div>

        {/* Big Code and Icon Visual */}
        <div className="error-visual">
          <div className="error-icon-box" style={{ color: config.accentColor }}>
            {renderIcon()}
          </div>
          <div className="error-giant-code" style={{ color: config.accentColor }}>
            {config.code}
          </div>
        </div>

        {/* Typography */}
        <h1 className="error-title">{customTitle || config.title}</h1>
        <p className="error-subtitle">{customSubtitle || config.subtitle}</p>
        <p className="error-description">{customMessage || config.description}</p>

        {/* Countdown notice (429) */}
        {config.hasCountdown && countdown !== null && (
          <div className="error-countdown-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Tự động thử lại sau: <strong>{countdown} giây</strong></span>
          </div>
        )}

        {/* Search Bar for 404 & Product discovery */}
        {normalizedCode === '404' && (
          <form className="error-search-form" onSubmit={handleSearchSubmit}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="error-search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="error-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm laptop bạn quan tâm (Dell, Asus, Gaming...)"
            />
            <button type="submit" className="error-search-btn">
              Tìm kiếm
            </button>
          </form>
        )}

        {/* Primary & Secondary Action Buttons */}
        <div className="error-actions">
          {config.primaryAction && (
            config.primaryAction.href ? (
              <Link
                href={config.primaryAction.href}
                className="error-btn-primary"
                style={{ background: config.accentColor }}
              >
                {config.primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                className="error-btn-primary"
                style={{ background: config.accentColor }}
                onClick={() => handleAction(config.primaryAction.action)}
              >
                {config.primaryAction.label}
              </button>
            )
          )}

          {config.secondaryAction && (
            config.secondaryAction.href ? (
              <Link href={config.secondaryAction.href} className="error-btn-secondary">
                {config.secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                className="error-btn-secondary"
                onClick={() => handleAction(config.secondaryAction.action)}
              >
                {config.secondaryAction.label}
              </button>
            )
          )}

          <button
            type="button"
            className="error-btn-ghost"
            onClick={() => handleAction('back')}
          >
            ← Quay lại trang trước
          </button>
        </div>

        {/* Suggestions Quick Links */}
        {config.suggestions && config.suggestions.length > 0 && (
          <div className="error-suggestions">
            <span className="error-suggestions-title">Gợi ý hữu ích cho bạn:</span>
            <div className="error-suggestions-grid">
              {config.suggestions.map((sug, i) => (
                sug.href ? (
                  <Link key={i} href={sug.href} className="error-suggestion-link">
                    <span className="sug-arrow">➔</span>
                    <span>{sug.label}</span>
                  </Link>
                ) : (
                  <button key={i} type="button" className="error-suggestion-link" onClick={() => handleAction(sug.action)}>
                    <span className="sug-arrow">➔</span>
                    <span>{sug.label}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        )}

        {/* Technical Error Details / Debug (collapsible) */}
        {errorDetail && (
          <div className="error-debug-section">
            <button
              type="button"
              className="error-debug-toggle"
              onClick={() => setShowDebug(!showDebug)}
            >
              <span>{showDebug ? 'Ẩn thông tin kỹ thuật' : 'Xem chi tiết kỹ thuật (Developer Info)'}</span>
              <span>{showDebug ? '▲' : '▼'}</span>
            </button>
            {showDebug && (
              <pre className="error-debug-pre">
                {typeof errorDetail === 'object'
                  ? JSON.stringify(errorDetail, null, 2)
                  : String(errorDetail)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
