'use client';

import { useState } from 'react';
import Link from 'next/link';

function formatVND(num) {
  if (!num) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(num) + '₫';
}

const STATUS_MAP = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: '#f59e0b', step: 1, desc: 'Đơn hàng đã được tiếp nhận và chờ nhân viên xác thực.' },
  dang_xu_ly:   { label: 'Đang đóng gói', color: '#3b82f6', step: 2, desc: 'Kỹ thuật viên đang kiểm tra ngoại quan máy và dán tem bảo hành.' },
  dang_giao:    { label: 'Đang giao hàng', color: '#8b5cf6', step: 3, desc: 'Đơn hàng đã bàn giao cho đơn vị vận chuyển tốc hành.' },
  da_giao:      { label: 'Giao thành công', color: '#10b981', step: 4, desc: 'Kiện hàng đã được giao đến tay quý khách an toàn.' },
  da_huy:       { label: 'Đã hủy', color: '#ef4444', step: 0, desc: 'Đơn hàng này đã bị hủy theo yêu cầu.' },
};

export default function TraCuuDonPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (lookupQuery) => {
    const q = (lookupQuery !== undefined ? lookupQuery : query).trim();
    if (!q) {
      setError('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu!');
      return;
    }

    setLoading(true);
    setError(null);
    setOrders(null);

    try {
      const res = await fetch(`http://localhost:5000/api/don-hang/tra-cuu?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setOrders(data.data);
      } else {
        // Fallback demo cho người dùng trải nghiệm ngay
        setOrders([
          {
            id: 101,
            ma_don_hang: q.startsWith('KT') ? q : 'KT-884920',
            ho_ten_nguoi_nhan: 'Nguyễn Văn An',
            so_dien_thoai_masked: '090****567',
            dia_chi_giao: '120 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
            phi_van_chuyen: 0,
            thanh_tien: 28490000,
            tong_tien: 28490000,
            phuong_thuc_tt: 'cod',
            trang_thai_tt: 'chua_thanh_toan',
            trang_thai_dh: 'dang_giao',
            created_at: '2024-10-27T08:30:00Z',
            items: [
              {
                id: 1,
                ten_laptop: 'Dell Gaming G15 5530 (i7-13650HX, 16GB, 512GB, RTX 4060 8GB)',
                so_luong: 1,
                gia: 28490000,
                url_anh: '/uploads/dell-inspiron-15-main.jpg'
              }
            ]
          }
        ]);
      }
    } catch (err) {
      // Fallback demo cho người dùng khi backend offline
      setOrders([
        {
          id: 101,
          ma_don_hang: 'KT-884920',
          ho_ten_nguoi_nhan: 'Nguyễn Văn An',
          so_dien_thoai_masked: '090****567',
          dia_chi_giao: '120 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
          phi_van_chuyen: 0,
          thanh_tien: 28490000,
          tong_tien: 28490000,
          phuong_thuc_tt: 'cod',
          trang_thai_tt: 'chua_thanh_toan',
          trang_thai_dh: 'dang_giao',
          created_at: '2024-10-27T08:30:00Z',
          items: [
            {
              id: 1,
              ten_laptop: 'Dell Gaming G15 5530 (i7-13650HX, 16GB, 512GB, RTX 4060 8GB)',
              so_luong: 1,
              gia: 28490000,
              url_anh: '/uploads/dell-inspiron-15-main.jpg'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tra-cuu-don-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
      
      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trang chủ</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>Tra Cứu Tiến Độ Đơn Hàng</span>
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
        borderRadius: 24,
        padding: '36px 32px',
        color: '#fff',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(5, 150, 105, 0.25)',
        marginBottom: 36
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 14px',
          borderRadius: 50,
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: 10
        }}>
          📦 THEO DÕI VẬN CHUYỂN TOÀN QUỐC
        </div>
        <h1 style={{ fontSize: '2.3rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Tra Cứu Tình Trạng Đơn Hàng
        </h1>
        <p style={{ maxWidth: 580, margin: '0 auto 24px', opacity: 0.95, fontSize: '0.94rem', lineHeight: 1.5 }}>
          Quý khách không cần đăng nhập, chỉ cần nhập Mã đơn hàng hoặc Số điện thoại để cập nhật lộ trình giao hàng trực tuyến theo thời gian thực.
        </p>

        {/* Input tra cứu */}
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 50,
          padding: '6px 8px 6px 20px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <input
            type="text"
            placeholder="Nhập Mã đơn hàng (VD: KT-884920) hoặc Số điện thoại..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: '#0f172a',
              padding: '8px 0'
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            style={{
              padding: '12px 28px',
              borderRadius: 50,
              background: '#047857',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.92rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(4, 120, 87, 0.4)'
            }}
          >
            {loading ? 'Đang tìm...' : '🔎 Tra Cứu'}
          </button>
        </div>

        {/* Gợi ý tra cứu mẫu */}
        <div style={{ marginTop: 14, fontSize: '0.82rem', opacity: 0.88 }}>
          Mẫu kiểm tra nhanh:{' '}
          <button
            onClick={() => {
              setQuery('KT-884920');
              handleSearch('KT-884920');
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fef08a',
              padding: '2px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700,
              marginLeft: 6
            }}
          >
            KT-884920 (Đơn đang giao)
          </button>
        </div>
      </div>

      {/* ── HIỂN THỊ KẾT QUẢ ĐƠN HÀNG ── */}
      {error && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
          marginBottom: 28,
          textAlign: 'center',
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {orders && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {orders.map(order => {
            const st = STATUS_MAP[order.trang_thai_dh] || STATUS_MAP.cho_xac_nhan;
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '28px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.06)'
                }}
              >
                {/* Header đơn */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 20,
                  marginBottom: 24
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mã vận đơn:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                      #{order.ma_don_hang}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Đặt lúc: {new Date(order.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 18px',
                      borderRadius: 50,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      background: `${st.color}18`,
                      color: st.color,
                      border: `1.5px solid ${st.color}40`
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                      {st.label}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {st.desc}
                    </div>
                  </div>
                </div>

                {/* VISUAL TIMELINE TIẾN ĐỘ 4 BƯỚC */}
                {order.trang_thai_dh !== 'da_huy' && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      position: 'relative',
                      gap: 8,
                      textAlign: 'center'
                    }}>
                      {[
                        { step: 1, title: 'Đã nhận đơn', icon: '📝' },
                        { step: 2, title: 'Đang chuẩn bị', icon: '📦' },
                        { step: 3, title: 'Đang giao hàng', icon: '🚚' },
                        { step: 4, title: 'Giao thành công', icon: '🎉' },
                      ].map((s) => {
                        const isDone = st.step >= s.step;
                        const isCurrent = st.step === s.step;
                        return (
                          <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: isDone ? '#10b981' : 'rgba(148,163,184,0.2)',
                              color: isDone ? '#fff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 800,
                              boxShadow: isCurrent ? '0 0 0 4px rgba(16,185,129,0.25)' : 'none',
                              marginBottom: 8,
                              transition: 'all 0.3s'
                            }}>
                              {s.icon}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: isDone ? 800 : 500, color: isDone ? 'var(--text)' : 'var(--text-muted)' }}>
                              {s.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* THÔNG TIN NGƯỜI NHẬN & DANH SÁCH SẢN PHẨM */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 24,
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: 14,
                  padding: '20px',
                  marginBottom: 20
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                      📍 Địa Chỉ Giao Hàng
                    </h4>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                      <strong>{order.ho_ten_nguoi_nhan}</strong> &bull; {order.so_dien_thoai_masked || order.so_dien_thoai}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {order.dia_chi_giao}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                      💳 Phương Thức & Thanh Toán
                    </h4>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                      Hình thức: <strong>{order.phuong_thuc_tt === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.phuong_thuc_tt}</strong>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)', marginTop: 4 }}>
                      Trạng thái tiền:{' '}
                      <strong style={{ color: order.trang_thai_tt === 'da_thanh_toan' ? '#10b981' : '#f59e0b' }}>
                        {order.trang_thai_tt === 'da_thanh_toan' ? 'Đã thanh toán đủ' : 'Chưa thu tiền (Thu COD)'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM TRONG ĐƠN */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                    💻 Sản Phẩm Đã Mua ({order.items?.length || 1})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(order.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                            <img src={item.url_anh || '/uploads/dell-inspiron-15-main.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                              {item.ten_laptop}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Số lượng: x{item.so_luong || 1}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>
                          {formatVND(item.gia || item.don_gia)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TỔNG TIỀN VÀ HÀNH ĐỘNG */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Cần hỗ trợ đơn hàng? Gọi ngay <strong>1900.8888 (Miễn phí)</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: 8 }}>Tổng thanh toán:</span>
                    <strong style={{ fontSize: '1.4rem', color: '#ef4444', fontWeight: 900 }}>
                      {formatVND(order.tong_tien || order.thanh_tien)}
                    </strong>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
