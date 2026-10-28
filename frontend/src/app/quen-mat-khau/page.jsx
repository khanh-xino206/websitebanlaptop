'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiResponse } from '../context/AppContext';

const API = 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [countdown, setCountdown] = useState(0);

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

  const requestCode = async event => {
    if (event) event.preventDefault();
    if (countdown > 0) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể gửi mã xác nhận.');
      setCodeSent(true);
      setNotice(data.message);
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async event => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password !== passwordConfirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, mat_khau: password }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể đổi mật khẩu.');
      setNotice(data.message);
      window.setTimeout(() => router.replace('/dang-nhap'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-card-left">
            <h2 className="auth-welcome">KTSHOP</h2>
            <p className="auth-subtitle">Khôi phục quyền truy cập tài khoản bằng email đã đăng ký.</p>
            <div className="auth-graphic"><div className="circle circle-1" /><div className="circle circle-2" /><div className="circle circle-3" /></div>
          </div>
          <div className="auth-card-right">
            <h1 className="reset-title">Quên mật khẩu</h1>
            <p className="reset-intro">Nhận mã xác nhận qua email, sau đó đặt mật khẩu mới.</p>
            {error && (
              <div 
                className="reset-message error" 
                role="alert"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div 
                className="reset-message success" 
                role="status"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>✓</span>
                <span>{notice}</span>
              </div>
            )}

            {!codeSent ? <form className="auth-form reset-form" onSubmit={requestCode}>
              <div className="auth-input-group">
                <label htmlFor="reset-email">Email đăng ký</label>
                <input 
                  id="reset-email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  value={email} 
                  onChange={event => {
                    setEmail(event.target.value);
                    if (error) setError('');
                  }} 
                  placeholder="name@example.com"
                  style={error ? { borderColor: '#ef4444' } : {}}
                />
              </div>
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}</button>
            </form> : <form className="auth-form reset-form" onSubmit={resetPassword}>
              <div className="reset-address">Mã được gửi đến <strong>{email}</strong> (hiệu lực 10 phút)</div>

              <div style={{
                margin: '10px 0 14px',
                padding: '10px 12px',
                background: 'rgba(23, 107, 80, 0.08)',
                border: '1px solid rgba(23, 107, 80, 0.25)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                lineHeight: '1.5'
              }}>
                <span style={{ fontWeight: '600', color: '#176b50' }}>💡 Lưu ý:</span> Nếu không thấy thư trong <strong>Hộp thư đến</strong>, vui lòng kiểm tra hộp thư <strong>Spam / Thư rác</strong>.
              </div>

              <div className="auth-input-group">
                <label htmlFor="reset-code">Mã xác nhận (6 chữ số)</label>
                <input 
                  id="reset-code" 
                  type="text" 
                  inputMode="numeric" 
                  autoComplete="one-time-code" 
                  pattern="[0-9]{6}" 
                  maxLength={6} 
                  required 
                  value={code} 
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="6 chữ số" 
                  style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}
                />
              </div>
              <div className="auth-input-group"><label htmlFor="new-password">Mật khẩu mới</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></div>
              <div className="auth-input-group"><label htmlFor="confirm-password">Nhập lại mật khẩu</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={passwordConfirm} onChange={event => setPasswordConfirm(event.target.value)} /></div>
              <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang cập nhật...' : 'Đặt mật khẩu mới'}</button>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  className="reset-resend" 
                  type="button" 
                  disabled={busy || countdown > 0} 
                  onClick={requestCode}
                  style={{ flex: 1, opacity: countdown > 0 ? 0.65 : 1, cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã xác nhận'}
                </button>
                <button 
                  className="reset-resend" 
                  type="button" 
                  disabled={busy} 
                  onClick={() => { setCodeSent(false); setCode(''); setNotice(''); setError(''); }}
                  style={{ flex: 1 }}
                >
                  Đổi email
                </button>
              </div>
            </form>}
            <div className="reset-return"><Link href="/dang-nhap">Quay lại đăng nhập</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}