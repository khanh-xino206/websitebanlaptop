'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LienHePage() {
  const [formData, setFormData] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    email: '',
    chu_de: 'Tư vấn mua laptop',
    noi_dung: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/lien-he', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || 'Gửi thất bại, vui lòng thử lại!');
      }
    } catch {
      // Offline fallback
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lien-he-page" style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 80px' }}>
      
      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trang chủ</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>Liên Hệ Showroom & Hỗ Trợ 24/7</span>
      </div>

      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', maxWidth: 650, margin: '0 auto 40px' }}>
        <span style={{
          display: 'inline-block',
          background: 'rgba(37,99,235,0.1)',
          color: 'var(--primary)',
          padding: '4px 14px',
          borderRadius: 50,
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: 10
        }}>
          📞 CHĂM SÓC KHÁCH HÀNG TẬN TÂM
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 10px', color: 'var(--text)' }}>
          Liên Hệ Với KTSHOP
        </h1>
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Đội ngũ chuyên viên kỹ thuật và tư vấn viên giàu kinh nghiệm luôn sẵn sàng phục vụ và giải đáp mọi thắc mắc của quý khách.
        </p>
      </div>

      {/* ── MAIN CONTENT (2 COLS) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
        marginBottom: 50
      }}>
        
        {/* CỘT TRÁI: FORM LIÊN HỆ */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
            Gửi Thắc Mắc & Yêu Cầu Tư Vấn
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 24px' }}>
            Điền thông tin bên dưới, nhân viên KTSHOP sẽ gọi lại tư vấn miễn phí trong 15 phút.
          </p>

          {submitted ? (
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 14,
              padding: '24px',
              textAlign: 'center',
              color: '#10b981'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
              <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1.15rem' }}>Gửi Liên Hệ Thành Công!</h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)' }}>
                Cảm ơn bạn đã liên hệ với KTSHOP. Chuyên viên tư vấn sẽ liên hệ lại qua số điện thoại của bạn ngay.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ ho_ten: '', so_dien_thoai: '', email: '', chu_de: 'Tư vấn mua laptop', noi_dung: '' });
                }}
                style={{
                  marginTop: 16,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Gửi thêm tin nhắn khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn An"
                    value={formData.ho_ten}
                    onChange={e => setFormData({ ...formData, ho_ten: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0988xxxxxx"
                    value={formData.so_dien_thoai}
                    onChange={e => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                  Email liên hệ
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                  Nhu cầu cần hỗ trợ
                </label>
                <select
                  value={formData.chu_de}
                  onChange={e => setFormData({ ...formData, chu_de: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="Tư vấn mua laptop">Tư vấn chọn mua Laptop Gaming / Học tập</option>
                  <option value="Tư vấn cấu hình PC">Tư vấn Build cấu hình PC</option>
                  <option value="Bảo hành & Sửa chữa">Hỗ trợ bảo hành & Kỹ thuật phần cứng</option>
                  <option value="Hợp tác doanh nghiệp">Báo giá dự án & Doanh nghiệp</option>
                  <option value="Khác">Góp ý dịch vụ / Khác</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                  Nội dung chi tiết *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Hãy cho chúng tôi biết mức tài chính dự kiến hoặc model laptop quý khách đang quan tâm..."
                  value={formData.noi_dung}
                  onChange={e => setFormData({ ...formData, noi_dung: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'background 0.2s'
                }}
              >
                {submitting ? 'Đang gửi...' : '🚀 Gửi Thông Tin Ngay'}
              </button>
            </form>
          )}
        </div>

        {/* CỘT PHẢI: THÔNG TIN SHOWROOM & GOOGLE MAPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card Trụ sở */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--text)' }}>
              🏢 Trụ Sở & Showroom Chính
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <div>
                  <strong>Địa chỉ:</strong> 120 Thái Hà, P. Trung Liệt, Q. Đống Đa, Hà Nội
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>☎️</span>
                <div>
                  <strong>Hotline bán hàng:</strong> <span style={{ color: '#ef4444', fontWeight: 800 }}>1900.8888</span> (8h00 - 21h30)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>🛠️</span>
                <div>
                  <strong>Kỹ thuật / Bảo hành:</strong> 024.7300.2288
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>✉️</span>
                <div>
                  <strong>Email:</strong> lienhe@shoplaptop.vn
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>⏰</span>
                <div>
                  <strong>Giờ mở cửa:</strong> 08:00 - 21:30 (Cả Thứ 7, CN & Ngày lễ)
                </div>
              </div>
            </div>
          </div>

          {/* Bản đồ Google Maps mô phỏng showroom */}
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            height: 240,
            position: 'relative'
          }}>
            <iframe
              title="KTSHOP Showroom Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.382875150821!2d105.81643927503112!3d21.01736028062896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab7a74a49c25%3A0xe9628ec2372f4165!2zMTIwIFRow6FpIEjDoCwgVHJ1bmcgTGnhu4d0LCDEkOG7kW5nIMSQYSwgSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
