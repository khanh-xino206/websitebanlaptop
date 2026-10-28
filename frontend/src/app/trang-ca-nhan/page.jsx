'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../context/AppContext';
import OrderHistorySection from './components/OrderHistorySection';

const PAYMENT_OPTIONS = [
  { value: 'tai_khoan', label: 'Số dư tài khoản', desc: 'Thanh toán nhanh từ ví KTSHOP' },
  { value: 'momo', label: 'Ví MoMo', desc: 'Liên kết ví MoMo của bạn' },
  { value: 'credit_card', label: 'Thẻ tín dụng / Credit Card', desc: 'Visa, Mastercard, JCB...' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, theme, toggleTheme, updateUserPrefs, apiFetch } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'payment' | 'appearance' | 'orders'
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerifyBusy, setEmailVerifyBusy] = useState(false);
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('');
  const [emailVerifyError, setEmailVerifyError] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setInterval(() => {
      setEmailCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [form, setForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    dia_chi: '',
    defaultPayment: 'momo',
  });

  // Tự động chọn tab nếu URL có tham số ?tab=orders hoặc ?tab=lich-su
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'orders' || tabParam === 'lich-su' || tabParam === 'don-hang') {
        setActiveTab('orders');
      } else if (tabParam && ['info', 'payment', 'appearance'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Làm mới thông tin người dùng (số dư ví, profile) khi hủy đơn hoàn tiền
  const refreshUserProfile = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const response = await apiFetch('http://localhost:5000/api/auth/me', {}, user);
      const result = await parseApiResponse(response);
      if (response.ok && result.success) {
        const updatedUser = {
          ...user,
          ...result.data,
          balance: Number(result.data.balance || 0),
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Không thể làm mới hồ sơ người dùng:', err);
    }
  }, [apiFetch, user, setUser]);

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setForm({
          ho_ten: user.ho_ten || '',
          so_dien_thoai: user.so_dien_thoai || '',
          dia_chi: user.dia_chi || '',
          defaultPayment: user.defaultPayment || 'momo',
        });
        setLoading(false);
      });
    } else {
      const timer = setTimeout(() => {
        if (!user) router.push('/dang-nhap');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const response = await apiFetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          ho_ten: form.ho_ten,
          so_dien_thoai: form.so_dien_thoai,
          dia_chi: form.dia_chi,
        }),
      }, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể lưu thông tin hồ sơ.');
      }

      updateUserPrefs({
        ho_ten: form.ho_ten,
        so_dien_thoai: form.so_dien_thoai,
        dia_chi: form.dia_chi,
        defaultPayment: form.defaultPayment,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Lỗi khi lưu thông tin!');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Chỉ được chọn file ảnh (JPG, PNG, WEBP, GIF)!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Kích thước ảnh tối đa là 10MB!');
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:5000/api/auth/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: formData,
      });

      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải ảnh đại diện lên.');
      }

      const updatedUser = { ...user, avatar: result.data.avatar };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setAvatarError(err.message || 'Lỗi khi tải ảnh đại diện!');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendEmailVerificationCode = async () => {
    setEmailVerifyBusy(true);
    setEmailVerifyError('');
    setEmailVerifyMessage('');
    try {
      const response = await apiFetch('http://localhost:5000/api/auth/email-verification/request', { method: 'POST' }, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || 'Không thể gửi mã xác minh.');
      if (result.verified) {
        setUser({ ...user, email_da_xac_minh: true });
        localStorage.setItem('user', JSON.stringify({ ...user, email_da_xac_minh: true }));
      } else {
        setEmailCodeSent(true);
        setEmailCountdown(60);
      }
      setEmailVerifyMessage(result.message);
    } catch (err) {
      setEmailVerifyError(err.message || 'Không thể gửi mã xác minh.');
    } finally {
      setEmailVerifyBusy(false);
    }
  };

  const verifyEmailCode = async event => {
    event.preventDefault();
    setEmailVerifyBusy(true);
    setEmailVerifyError('');
    setEmailVerifyMessage('');
    try {
      const response = await apiFetch('http://localhost:5000/api/auth/email-verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      }, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || 'Mã xác minh không hợp lệ.');
      const verifiedUser = { ...user, email_da_xac_minh: true };
      setUser(verifiedUser);
      localStorage.setItem('user', JSON.stringify(verifiedUser));
      setEmailCodeSent(false);
      setEmailCode('');
      setEmailVerifyMessage(result.message);
    } catch (err) {
      setEmailVerifyError(err.message || 'Không thể xác minh email.');
    } finally {
      setEmailVerifyBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="profile-spinner" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="profile-page">
      {/* ── HEADER CARD ── */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div
            className="profile-avatar-wrap"
            style={{ cursor: avatarUploading ? 'wait' : 'pointer', position: 'relative' }}
            onClick={() => !avatarUploading && fileInputRef.current?.click()}
            title="Nhấp để tải ảnh đại diện từ file máy tính"
          >
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.ho_ten || 'U')}&background=1d4ed8&color=fff&size=120`}
              alt="Avatar"
              className="profile-avatar"
            />
            <span className="profile-avatar-badge" title="Tải ảnh file lên" style={{ fontSize: '0.65rem', padding: '2px 4px', whiteSpace: 'nowrap' }}>
              {avatarUploading ? '...' : 'Đổi ảnh'}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{user.ho_ten}</h1>
            <p className="profile-email">{user.email}</p>
            {avatarError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4 }}>{avatarError}</p>}
            <div className="profile-role-badge">
              {user.vai_tro === 'qtv' ? 'Quản Trị Viên Cao Nhất' : user.vai_tro === 'admin' ? 'Quản Trị Viên' : user.vai_tro === 'nhan_su' ? 'Nhân Viên Nhân Sự' : user.vai_tro === 'nhan_vien_kho' ? 'Nhân Viên Kho' : user.vai_tro === 'nhan_vien' ? 'Nhân Viên' : 'Khách Hàng'}
            </div>
          </div>

          {/* Balance Card */}
          <div className="profile-balance-card">
            <div className="profile-balance-label">Số dư ví KTSHOP</div>
            <div className="profile-balance-amount">
              {Number(user.balance || 0).toLocaleString('vi-VN')}
              <span className="profile-balance-unit">đ</span>
            </div>
            <button className="profile-topup-btn" type="button" onClick={() => router.push('/nap-tien')}>+ Nạp tiền</button>
          </div>
        </div>
      </div>

      {user.vai_tro === 'khach_hang' && Number(user.email_da_xac_minh) !== 1 && <section className="profile-email-verification" aria-labelledby="verify-email-title">
        <div className="profile-email-verification-copy"><span className="profile-email-verification-icon" aria-hidden="true">!</span><div><h2 id="verify-email-title">Xác minh email của bạn</h2><p>Tài khoản <strong>{user.email}</strong> chưa được xác minh. Hãy xác minh để bảo vệ tài khoản và nhận thông báo đơn hàng.</p></div></div>
        
        {emailCodeSent && (
          <div style={{
            margin: '8px 0 12px',
            padding: '10px 14px',
            background: 'rgba(23, 107, 80, 0.08)',
            border: '1px solid rgba(23, 107, 80, 0.25)',
            borderRadius: '8px',
            fontSize: '0.82rem',
            lineHeight: '1.5'
          }}>
            <span style={{ fontWeight: '600', color: '#176b50' }}>💡 Lưu ý:</span> Nếu không thấy email trong <strong>Hộp thư đến</strong>, vui lòng kiểm tra hộp thư <strong>Spam / Thư rác</strong>.
          </div>
        )}

        {!emailCodeSent && <button type="button" className="profile-verify-button" onClick={sendEmailVerificationCode} disabled={emailVerifyBusy}>{emailVerifyBusy ? 'Đang gửi...' : 'Gửi mã xác minh'}</button>}
        {emailCodeSent && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <form className="profile-email-verify-form" onSubmit={verifyEmailCode} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="profile-field" style={{ margin: 0 }}>
                <input 
                  className="profile-input" 
                  type="text" 
                  inputMode="numeric" 
                  autoComplete="one-time-code" 
                  pattern="[0-9]{6}" 
                  maxLength={6} 
                  required 
                  value={emailCode} 
                  onChange={event => setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="Nhập 6 chữ số" 
                  style={{ width: '150px', letterSpacing: '3px', fontWeight: 'bold', textAlign: 'center' }}
                />
              </label>
              <button type="submit" className="profile-verify-button" disabled={emailVerifyBusy || emailCode.length !== 6}>
                {emailVerifyBusy ? 'Đang xác minh...' : 'Xác nhận'}
              </button>
            </form>
            <button 
              type="button" 
              className="profile-verify-button" 
              onClick={sendEmailVerificationCode} 
              disabled={emailVerifyBusy || emailCountdown > 0}
              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', cursor: emailCountdown > 0 ? 'not-allowed' : 'pointer' }}
            >
              {emailCountdown > 0 ? `Gửi lại (${emailCountdown}s)` : 'Gửi lại mã'}
            </button>
          </div>
        )}
        {emailVerifyMessage && <p className="profile-email-verify-message" role="status">{emailVerifyMessage}</p>}
        {emailVerifyError && <p className="profile-email-verify-error" role="alert">{emailVerifyError}</p>}
      </section>}

      {/* ── TABS ── */}
      <div className={`profile-container ${user.vai_tro === 'khach_hang' && Number(user.email_da_xac_minh) !== 1 ? 'has-email-warning' : ''}`}>
        <div className="profile-tabs">
          {[
            { key: 'info', label: 'Thông tin cá nhân' },
            { key: 'payment', label: 'Phương thức thanh toán' },
            { key: 'appearance', label: 'Giao diện' },
            { key: 'orders', label: 'Lịch sử mua hàng' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`profile-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="profile-card">
          {activeTab === 'orders' ? (
            <OrderHistorySection
              user={user}
              apiFetch={apiFetch}
              onRefreshUser={refreshUserProfile}
            />
          ) : (
            <form onSubmit={handleSave}>

          {/* TAB: Thông tin cá nhân */}
          {activeTab === 'info' && (
            <div className="profile-section">
              <h2 className="profile-section-title">Thông tin cá nhân</h2>
              <p className="profile-section-desc">Thông tin này sẽ tự động điền vào form thanh toán khi bạn đặt hàng.</p>

              <div className="profile-form-grid">
                <div className="profile-field">
                  <label className="profile-label">Họ và tên đầy đủ</label>
                  <input
                    type="text"
                    className="profile-input"
                    required
                    value={form.ho_ten}
                    onChange={e => setForm({ ...form, ho_ten: e.target.value })}
                    placeholder="Nguyễn Văn An"
                  />
                </div>

                <div className="profile-field">
                  <label className="profile-label">Email</label>
                  <input
                    type="email"
                    className="profile-input"
                    value={user.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <span className="profile-hint">Email không thể thay đổi</span>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="profile-input"
                    required
                    value={form.so_dien_thoai}
                    onChange={e => setForm({ ...form, so_dien_thoai: e.target.value })}
                    placeholder="0901 234 567"
                  />
                </div>

                <div className="profile-field profile-field-full">
                  <label className="profile-label">Địa chỉ nhận hàng mặc định</label>
                  <textarea
                    className="profile-input profile-textarea"
                    rows={3}
                    required
                    value={form.dia_chi}
                    onChange={e => setForm({ ...form, dia_chi: e.target.value })}
                    placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                  />
                  <span className="profile-hint">Địa chỉ này sẽ tự động điền vào form giỏ hàng</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Phương thức thanh toán */}
          {activeTab === 'payment' && (
            <div className="profile-section">
              <h2 className="profile-section-title">Phương thức thanh toán mặc định</h2>
              <p className="profile-section-desc">Phương thức bạn chọn sẽ được chọn sẵn khi vào trang thanh toán.</p>

              {/* Balance info */}
              <div className="profile-payment-balance">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ví KTSHOP</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>
                    Số dư hiện tại: <strong style={{ color: '#10b981' }}>{Number(user.balance || 0).toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>
                <button type="button" className="profile-topup-btn" style={{ marginLeft: 'auto' }} disabled title="Nạp tiền trực tuyến chưa được hỗ trợ">Nạp tiền</button>
              </div>

              <div className="profile-payment-options">
                {PAYMENT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`profile-payment-option ${form.defaultPayment === opt.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="defaultPayment"
                      value={opt.value}
                      checked={form.defaultPayment === opt.value}
                      onChange={e => setForm({ ...form, defaultPayment: e.target.value })}
                      style={{ display: 'none' }}
                    />
                    <div className="profile-payment-info">
                      <span className="profile-payment-label">{opt.label}</span>
                      <span className="profile-payment-desc">{opt.desc}</span>
                    </div>
                    {form.defaultPayment === opt.value && (
                      <span className="profile-payment-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Đã chọn</span>
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Giao diện */}
          {activeTab === 'appearance' && (
            <div className="profile-section">
              <h2 className="profile-section-title">Tùy chỉnh giao diện</h2>
              <p className="profile-section-desc">Thay đổi chế độ hiển thị theo sở thích cá nhân.</p>

              <div className="profile-theme-cards">
                <button
                  type="button"
                  className={`profile-theme-card light-card ${theme === 'light' ? 'selected' : ''}`}
                  onClick={() => theme !== 'light' && toggleTheme()}
                  aria-pressed={theme === 'light'}
                >
                  <div className="theme-preview light-preview">
                    <div className="theme-preview-bar" />
                    <div className="theme-preview-content">
                      <div className="theme-preview-line" style={{ width: '60%' }} />
                      <div className="theme-preview-line" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div className="profile-theme-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img src="/sun-favicon.svg" alt="Mặt trời" width="18" height="18" style={{ objectFit: 'contain' }} />
                    <span>Chế độ Sáng</span>
                    {theme === 'light' && <span className="profile-theme-active">Đang dùng</span>}
                  </div>
                </button>

                <button
                  type="button"
                  className={`profile-theme-card dark-card ${theme === 'dark' ? 'selected' : ''}`}
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  aria-pressed={theme === 'dark'}
                >
                  <div className="theme-preview dark-preview">
                    <div className="theme-preview-bar dark" />
                    <div className="theme-preview-content dark">
                      <div className="theme-preview-line dark" style={{ width: '60%' }} />
                      <div className="theme-preview-line dark" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div className="profile-theme-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img src="/moon-favicon.svg" alt="Mặt trăng" width="18" height="18" style={{ objectFit: 'contain' }} />
                    <span>Chế độ Tối</span>
                    {theme === 'dark' && <span className="profile-theme-active">Đang dùng</span>}
                  </div>
                </button>
              </div>

              <div className="profile-theme-toggle-row">
                <span style={{ fontWeight: 600 }}>Chuyển đổi nhanh:</span>
                <button
                  type="button"
                  className="profile-quick-toggle"
                  onClick={toggleTheme}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <img src={theme === 'light' ? '/moon-favicon.svg' : '/sun-favicon.svg'} alt="" width="18" height="18" style={{ objectFit: 'contain' }} />
                  {theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
                </button>
              </div>
            </div>
          )}

              {/* ── SAVE BUTTON ── */}
              {['info', 'payment'].includes(activeTab) && (
                <div className="profile-actions">
                  {saved && (
                    <div className="profile-success-msg">Đã lưu thông tin thành công!</div>
                  )}
                  {saveError && (
                    <div className="profile-error-msg" role="alert">{saveError}</div>
                  )}
                  <button type="submit" className="profile-save-btn" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
