'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ ho_ten: '', email: '', mat_khau: '', re_mat_khau: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Nếu truy cập với ?verify=true hoặc ?email=... -> tự động chuyển hướng tới trang xác minh riêng
  useEffect(() => {
    const verify = searchParams.get('verify');
    const emailParam = searchParams.get('email');
    if (verify === 'true' || verify === '1') {
      router.replace(`/dang-ky/xac-minh${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ''}`);
    }
  }, [searchParams, router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.mat_khau !== formData.re_mat_khau) {
      return setError('Mật khẩu xác nhận không khớp!');
    }
    if (formData.mat_khau.length < 8) {
      return setError('Mật khẩu phải có tối thiểu 8 ký tự!');
    }

    try {
      setBusy(true);
      // Lưu tạm email và họ tên vào sessionStorage để trang xác minh có thể hiển thị
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending_registration_email', formData.email);
        sessionStorage.setItem('pending_registration_name', formData.ho_ten);
      }

      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ho_ten: formData.ho_ten, email: formData.email, mat_khau: formData.mat_khau })
      });
      const data = await res.json();
      
      // Nếu đăng ký thành công hoặc tài khoản đang chờ xác minh
      if (data.verificationRequired || data.success) {
        router.push(`/dang-ky/xac-minh?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo tài khoản.');
      }

      router.push(`/dang-ky/xac-minh?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Lỗi kết nối đến server.' : err.message);
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
            <p className="auth-subtitle">
              Đăng ký ngay để trải nghiệm mua sắm tuyệt vời nhất cùng KTSHOP.
            </p>
            <div className="auth-graphic">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
          </div>

          <div className="auth-card-right">
            <h2 className="signup-title">Đăng ký tài khoản</h2>
            <div className="auth-form-container">
              {error && <div className="signup-message error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <label>Họ và tên</label>
                  <input 
                    type="text" 
                    name="ho_ten" 
                    placeholder="Nhập họ và tên của bạn" 
                    required 
                    value={formData.ho_ten} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div className="auth-input-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="example@ktshop.com" 
                    required 
                    value={formData.email} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div className="auth-input-group">
                  <label>Mật khẩu (tối thiểu 8 ký tự)</label>
                  <input 
                    type="password" 
                    name="mat_khau" 
                    placeholder="••••••••" 
                    required 
                    minLength={8}
                    value={formData.mat_khau} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="auth-input-group">
                  <label>Xác nhận mật khẩu</label>
                  <input 
                    type="password" 
                    name="re_mat_khau" 
                    placeholder="••••••••" 
                    required 
                    minLength={8}
                    value={formData.re_mat_khau} 
                    onChange={handleChange} 
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={busy}>
                  {busy ? 'Đang tạo tài khoản...' : 'Tiếp tục nhận mã xác minh'}
                </button>
              </form>

              {/* Lối tắt cho tài khoản đã đăng ký nhưng chưa xác minh */}
              <div style={{
                marginTop: '16px',
                padding: '10px 12px',
                background: 'rgba(23, 107, 80, 0.05)',
                border: '1px solid rgba(23, 107, 80, 0.2)',
                borderRadius: '8px',
                fontSize: '0.84rem',
                textAlign: 'center'
              }}>
                <span>Đã đăng ký nhưng chưa xác nhận email? </span>
                <Link 
                  href="/dang-ky/xac-minh" 
                  style={{ color: 'var(--primary, #176b50)', fontWeight: '700', textDecoration: 'underline' }}
                >
                  Nhập mã xác minh tại đây
                </Link>
              </div>

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
                Đã có tài khoản? <Link href="/dang-nhap" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đăng nhập</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Đang tải trang đăng ký...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
