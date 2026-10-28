'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', mat_khau: '' });
  const [error, setError] = useState('');
  const [needsVerify, setNeedsVerify] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerify(false);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.data));
        alert('Đăng nhập thành công!');
        window.location.href = '/';
      } else {
        if (data.code === 'EMAIL_VERIFICATION_REQUIRED') {
          setNeedsVerify(true);
        }
        setError(data.message || 'Đã có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối đến server');
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-card-left">
            <h2 className="auth-welcome">KTSHOP</h2>
            <p className="auth-subtitle">
              Chào mừng bạn quay trở lại. Vui lòng đăng nhập để tiếp tục.
            </p>
            <div className="auth-graphic">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
          </div>

          <div className="auth-card-right">
            <h2 style={{ marginBottom: '20px', fontSize: '1.8rem', color: 'var(--text)' }}>Đăng Nhập</h2>
            <div className="auth-form-container">
              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '12px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div>{error}</div>
                  {needsVerify && (
                    <div style={{ marginTop: '8px' }}>
                      <Link 
                        href={`/dang-ky/xac-minh?email=${encodeURIComponent(formData.email)}`}
                        style={{ color: '#176b50', fontWeight: 'bold', textDecoration: 'underline' }}
                      >
                        👉 Bấm vào đây để nhập mã xác minh email
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="example@ktshop.com" required value={formData.email} onChange={handleChange} />
                </div>
                
                <div className="auth-input-group">
                  <label>Mật khẩu</label>
                  <input type="password" name="mat_khau" placeholder="••••••••" required value={formData.mat_khau} onChange={handleChange} />
                </div>

                <div className="auth-forgot">
                  <Link href="/quen-mat-khau">Quên mật khẩu?</Link>
                </div>

                <button type="submit" className="auth-submit">
                  Đăng Nhập
                </button>
              </form>

              <div className="auth-divider-txt">hoặc</div>

              <div className="auth-social">
                <button className="auth-social-btn google" type="button">
                  <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" />
                  Google
                </button>
                <button className="auth-social-btn facebook" type="button">
                  <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" />
                  Facebook
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                Chưa có tài khoản? <Link href="/dang-ky" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đăng ký ngay</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
