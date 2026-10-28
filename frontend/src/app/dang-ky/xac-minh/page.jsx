'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [complete, setComplete] = useState(false);

  // Modal edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ho_ten: '', email: '', mat_khau: '', re_mat_khau: '' });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');

  // Lấy email từ URL param hoặc sessionStorage
  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_registration_email', queryEmail);
      }
    } else if (typeof window !== 'undefined') {
      const savedEmail = sessionStorage.getItem('pending_registration_email') || localStorage.getItem('pending_registration_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      const savedName = sessionStorage.getItem('pending_registration_name');
      if (savedName) setHoTen(savedName);
    }
  }, [searchParams]);

  // Bộ đếm ngược 60 giây cho nút Gửi lại mã
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Mở modal sửa thông tin
  const openEditModal = () => {
    setEditForm({
      ho_ten: hoTen || '',
      email: email || '',
      mat_khau: '',
      re_mat_khau: '',
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Xác thực mã OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Không tìm thấy thông tin email. Vui lòng bấm "Sửa lại thông tin" để nhập email.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Mã xác nhận không hợp lệ.');
      }
      setComplete(true);
      setNotice(data.message || 'Đăng ký hoàn tất! Email đã được xác minh thành công.');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_registration_email');
        sessionStorage.removeItem('pending_registration_name');
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Lỗi kết nối đến server.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  // Gửi lại mã xác nhận
  const handleResend = async () => {
    if (countdown > 0 || busy || !email) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không gửi được mã mới.');
      }
      setNotice(data.message || 'Mã xác nhận mới đã được gửi tới email của bạn.');
      setCountdown(60);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Lỗi kết nối đến server.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  // Lưu thông tin sửa đổi trong modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (editForm.mat_khau && editForm.mat_khau !== editForm.re_mat_khau) {
      return setEditError('Mật khẩu xác nhận không khớp!');
    }
    if (editForm.mat_khau && editForm.mat_khau.length < 8) {
      return setEditError('Mật khẩu mới phải có tối thiểu 8 ký tự!');
    }

    setEditBusy(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/update-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_email: email,
          ho_ten: editForm.ho_ten,
          email: editForm.email,
          mat_khau: editForm.mat_khau || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật thông tin.');
      }

      const newEmail = data.email || editForm.email;
      setEmail(newEmail);
      setHoTen(data.ho_ten || editForm.ho_ten);
      setCode('');
      setNotice(data.message);
      setCountdown(60);
      setIsEditModalOpen(false);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_registration_email', newEmail);
        sessionStorage.setItem('pending_registration_name', editForm.ho_ten);
        router.replace(`/dang-ky/xac-minh?email=${encodeURIComponent(newEmail)}`);
      }
    } catch (err) {
      setEditError(err.message === 'Failed to fetch' ? 'Lỗi kết nối đến máy chủ.' : err.message);
    } finally {
      setEditBusy(false);
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          {/* Card Left: Branding */}
          <div className="auth-card-left">
            <h2 className="auth-welcome">KTSHOP</h2>
            <p className="auth-subtitle">
              Xác minh tài khoản để bảo mật đơn hàng và trải nghiệm mua sắm tốt nhất.
            </p>
            <div className="auth-graphic">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
          </div>

          {/* Card Right: Content */}
          <div className="auth-card-right">
            <h2 className="signup-title">{complete ? 'Đăng ký hoàn tất' : 'Xác minh email'}</h2>
            
            <div className="auth-form-container">
              {error && <div className="signup-message error" role="alert">{error}</div>}
              {notice && <div className="signup-message success" role="status">{notice}</div>}

              {!complete ? (
                <div className="signup-verification">
                  <p className="signup-verification-copy">
                    Nhập mã 6 chữ số được gửi đến <strong>{email || '(chưa có email)'}</strong>. Mã có hiệu lực trong 10 phút.
                  </p>

                  {/* Hộp nhắc nhở Spam / Thư rác */}
                  <div style={{
                    margin: '12px 0 16px',
                    padding: '12px 14px',
                    background: 'rgba(23, 107, 80, 0.08)',
                    border: '1px solid rgba(23, 107, 80, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ fontWeight: '600', color: '#176b50', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💡 Lưu ý quan trọng</span>
                    </div>
                    <div style={{ color: 'var(--text, #374151)' }}>
                      Nếu không thấy email trong <strong>Hộp thư đến (Inbox)</strong>, vui lòng kiểm tra hộp thư <strong>Spam / Thư rác</strong> hoặc <strong>Quảng cáo (Promotions)</strong>.
                    </div>
                  </div>

                  {/* Form nhập mã xác nhận */}
                  <form className="auth-form" onSubmit={handleVerify}>
                    <div className="auth-input-group">
                      <label htmlFor="verify-code">Mã xác nhận (6 chữ số)</label>
                      <input 
                        id="verify-code" 
                        type="text" 
                        inputMode="numeric" 
                        autoComplete="one-time-code" 
                        pattern="[0-9]{6}" 
                        maxLength={6} 
                        required 
                        value={code} 
                        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                        placeholder="VD: 123456" 
                        style={{ letterSpacing: '6px', fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="auth-submit" 
                      disabled={busy || code.length !== 6}
                    >
                      {busy ? 'Đang xác minh...' : 'Xác nhận kích hoạt tài khoản'}
                    </button>
                  </form>

                  {/* Hàng nút hành động: Gửi lại mã & Sửa thông tin */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button 
                      className="signup-resend" 
                      type="button" 
                      disabled={busy || countdown > 0} 
                      onClick={handleResend}
                      style={{ 
                        flex: 1, 
                        opacity: countdown > 0 ? 0.65 : 1, 
                        cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: '#f9fafb',
                        textAlign: 'center'
                      }}
                    >
                      {busy ? 'Đang xử lý...' : countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác nhận'}
                    </button>
                    
                    <button 
                      className="signup-back" 
                      type="button" 
                      disabled={busy} 
                      onClick={openEditModal}
                      style={{ 
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--primary, #176b50)',
                        color: 'var(--primary, #176b50)',
                        background: 'transparent',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      ✏️ Sửa lại thông tin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="signup-complete">
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                    <h3 style={{ color: '#176b50', marginBottom: '8px' }}>Xác minh thành công!</h3>
                    <p style={{ color: 'var(--text-muted, #6b7280)', marginBottom: '20px' }}>
                      Email của bạn đã được xác minh thành công. Bây giờ bạn có thể đăng nhập vào tài khoản KTSHOP.
                    </p>
                    <Link 
                      className="auth-submit signup-login-link" 
                      href="/dang-nhap" 
                      style={{ display: 'inline-block', textDecoration: 'none' }}
                    >
                      Đi tới đăng nhập ngay
                    </Link>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                Đã có tài khoản? <Link href="/dang-nhap" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đăng nhập</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL POPUP: SỬA LẠI THÔNG TIN ĐĂNG KÝ ── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--border, #e5e7eb)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text, #111827)', fontWeight: '700' }}>
                ✏️ Chỉnh sửa thông tin đăng ký
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={editBusy}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #9ca3af)',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #6b7280)', marginBottom: '16px', lineHeight: '1.5' }}>
              Sửa lại họ tên hoặc địa chỉ email. Sau khi lưu, hệ thống sẽ gửi mã xác nhận mới tới email cập nhật của bạn.
            </p>

            {editError && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 12px',
                background: '#fff3f1',
                border: '1px solid #f2c4bf',
                color: '#9b3428',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="auth-input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Họ và tên</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.ho_ten} 
                  onChange={e => setEditForm({ ...editForm, ho_ten: e.target.value })} 
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div className="auth-input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Email nhận mã xác nhận</label>
                <input 
                  type="email" 
                  required 
                  value={editForm.email} 
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="auth-input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  Mật khẩu mới <span style={{ fontWeight: 'normal', color: 'var(--text-muted, #9ca3af)' }}>(để trống nếu không đổi)</span>
                </label>
                <input 
                  type="password" 
                  value={editForm.mat_khau} 
                  onChange={e => setEditForm({ ...editForm, mat_khau: e.target.value })} 
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>

              {editForm.mat_khau && (
                <div className="auth-input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    required 
                    value={editForm.re_mat_khau} 
                    onChange={e => setEditForm({ ...editForm, re_mat_khau: e.target.value })} 
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editBusy}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={editBusy}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary, #176b50)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: editBusy ? 'wait' : 'pointer'
                  }}
                >
                  {editBusy ? 'Đang lưu & gửi mã...' : 'Lưu & Gửi mã mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Đang tải trang xác minh...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
