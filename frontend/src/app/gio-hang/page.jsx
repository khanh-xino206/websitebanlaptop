'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseApiResponse, useAppContext } from '../context/AppContext';

const formatPrice = (n) => Number(n || 0).toLocaleString('vi-VN');

const PAYMENT_OPTIONS = [
  { value: 'momo',        label: 'Ví MoMo' },
  { value: 'credit_card', label: 'Thẻ tín dụng / Credit Card' },
  { value: 'tai_khoan',   label: 'Số dư tài khoản KTSHOP' },
];

export default function CartPage() {
  const { user, cart, updateCart, apiFetch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponPicker, setShowCouponPicker] = useState(false);

  // Tự động điền từ profile user
  const [form, setForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    dia_chi: '',
    payment_method: 'momo',
  });

  // Điền thông tin khi user thay đổi
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        ho_ten:        user.ho_ten        || prev.ho_ten,
        so_dien_thoai: user.so_dien_thoai || prev.so_dien_thoai,
        dia_chi:       user.dia_chi       || prev.dia_chi,
        payment_method: user.defaultPayment || prev.payment_method,
      }));
    }
  }, [user]);

  // Tải danh sách mã ưu đãi có sẵn từ server
  useEffect(() => {
    let current = true;
    fetch('http://localhost:5000/api/coupons')
      .then(res => res.json())
      .then(data => {
        if (current && data.success) {
          setAvailableCoupons(data.data || []);
        }
      })
      .catch(() => {});
    return () => { current = false; };
  }, []);

  const tongTien = cart.reduce((s, i) => s + i.gia_ban * i.so_luong, 0);
  const phiShip  = tongTien >= 20000000 ? 0 : 30000;

  // Tính tiền giảm giá
  let tienGiam = 0;
  if (appliedCoupon && tongTien >= Number(appliedCoupon.don_hang_toi_thieu || 0)) {
    if (appliedCoupon.loai_giam === 'phan_tram') {
      const raw = (tongTien * Number(appliedCoupon.gia_tri_giam)) / 100;
      tienGiam = appliedCoupon.giam_toi_da ? Math.min(raw, Number(appliedCoupon.giam_toi_da)) : raw;
    } else {
      tienGiam = Math.min(tongTien, Number(appliedCoupon.gia_tri_giam));
    }
  }
  tienGiam = Math.round(tienGiam);

  // Kiểm tra nếu tổng đơn tụt xuống dưới mức tối thiểu của mã đã áp dụng
  useEffect(() => {
    if (appliedCoupon && tongTien > 0 && tongTien < Number(appliedCoupon.don_hang_toi_thieu || 0)) {
      const minStr = formatPrice(appliedCoupon.don_hang_toi_thieu);
      setCouponError(`Mã ${appliedCoupon.ma_coupon} đã bị gỡ vì tổng đơn hàng chưa đạt mức tối thiểu ${minStr}đ.`);
      setAppliedCoupon(null);
      setCouponSuccess('');
    }
  }, [tongTien, appliedCoupon]);

  const thanhTien = Math.max(0, tongTien - tienGiam + phiShip);

  // Xử lý áp dụng mã giảm giá
  const handleApplyCoupon = async (codeOverride) => {
    const code = (typeof codeOverride === 'string' ? codeOverride : couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      return;
    }
    if (tongTien <= 0) {
      setCouponError('Giỏ hàng trống, không thể áp dụng mã giảm giá.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await apiFetch('http://localhost:5000/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tong_tien: tongTien }),
      }, user);
      const data = await parseApiResponse(res);

      if (res.ok && data.success) {
        setAppliedCoupon(data.data);
        setCouponSuccess(`Đã áp dụng mã ${data.data.ma_coupon}: Tiết kiệm ${formatPrice(data.data.tien_giam)} đ`);
        setCouponInput('');
        setShowCouponPicker(false);
      } else {
        setCouponError(data.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      }
    } catch {
      setCouponError('Không thể kiểm tra mã giảm giá lúc này. Vui lòng thử lại!');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!form.ho_ten || !form.so_dien_thoai || !form.dia_chi) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user?.accessToken) headers['Authorization'] = `Bearer ${user.accessToken}`;

      const res = await apiFetch('http://localhost:5000/api/order/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ho_ten:         form.ho_ten,
          so_dien_thoai:  form.so_dien_thoai,
          dia_chi:        form.dia_chi,
          payment_method: form.payment_method,
          coupon_code:    appliedCoupon ? appliedCoupon.ma_coupon : undefined,
          items: cart.map(c => ({ laptop_id: c.laptop_id, so_luong: c.so_luong })),
        }),
      }, user);
      const data = await parseApiResponse(res);
      if (res.ok && data.success) {
        setOrderDone(data.order);
        if (!user?.accessToken) {
          localStorage.removeItem('cart');
        }
      } else {
        alert(data.message);
      }
    } catch {
      alert('Không kết nối được server. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // ── Màn hình đặt hàng thành công
  if (orderDone) {
    return (
      <div className="cart-page">
        <div className="cart-success">
          <h2>Đặt hàng thành công!</h2>
          <p>Mã đơn hàng của bạn: <strong className="cart-order-code">{orderDone.ma_don_hang}</strong></p>
          {orderDone.ma_coupon && (
            <p style={{ margin: '8px 0', fontSize: '0.95rem', color: '#16a34a' }}>
              Mã voucher áp dụng: <strong>{orderDone.ma_coupon}</strong> (Giảm {formatPrice(orderDone.tien_giam)} đ)
            </p>
          )}
          <p>Tổng thanh toán: <strong style={{ color: '#ef4444' }}>{formatPrice(orderDone.thanh_tien)} đ</strong></p>
          <div className="cart-success-actions">
            <Link href="/" className="cart-btn-primary">Về trang chủ</Link>
            <Link href="/san-pham" className="cart-btn-outline">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">Giỏ hàng</h1>
        <span className="cart-count">{cart.reduce((a, b) => a + b.so_luong, 0)} sản phẩm</span>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy thêm sản phẩm yêu thích của bạn!</p>
          <Link href="/san-pham" className="cart-btn-primary">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* ── LEFT: Danh sách sản phẩm ── */}
          <div className="cart-items-col">
            <div className="cart-card">
              <h2 className="cart-card-title">Sản phẩm đã chọn</h2>
              {cart.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <img
                    src={item.url_anh || 'https://via.placeholder.com/80'}
                    alt={item.ten_laptop}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.ten_laptop}</div>
                    <div className="cart-item-price">{formatPrice(item.gia_ban)} đ</div>
                  </div>
                  <div className="cart-qty-controls">
                    <button className="cart-qty-btn" onClick={() => updateCart(item.laptop_id, item.so_luong - 1)}>-</button>
                    <span className="cart-qty-num">{item.so_luong}</span>
                    <button className="cart-qty-btn" onClick={() => updateCart(item.laptop_id, item.so_luong + 1)}>+</button>
                  </div>
                  <div className="cart-item-total">{formatPrice(item.gia_ban * item.so_luong)} đ</div>
                  <button className="cart-item-remove" onClick={() => updateCart(item.laptop_id, 0)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Thanh toán ── */}
          <div className="cart-checkout-col">
            <form onSubmit={handleCheckout}>
              {/* Thông tin giao hàng */}
              <div className="cart-card" style={{ marginBottom: 16 }}>
                <h2 className="cart-card-title">
                  Thông tin giao hàng
                  {user && <span className="cart-autofill-badge">Tự động điền từ profile</span>}
                </h2>

                {!user && (
                  <div className="cart-login-tip">
                    <Link href="/dang-nhap" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng nhập</Link> để tự động điền thông tin và xem số dư ví
                  </div>
                )}

                <div className="cart-form-field">
                  <label className="cart-form-label">Họ và tên *</label>
                  <input required className="cart-form-input" type="text"
                    value={form.ho_ten}
                    onChange={e => setForm({ ...form, ho_ten: e.target.value })}
                    placeholder="Nguyễn Văn An" />
                </div>
                <div className="cart-form-field">
                  <label className="cart-form-label">Số điện thoại *</label>
                  <input required className="cart-form-input" type="tel"
                    value={form.so_dien_thoai}
                    onChange={e => setForm({ ...form, so_dien_thoai: e.target.value })}
                    placeholder="0901 234 567" />
                </div>
                <div className="cart-form-field">
                  <label className="cart-form-label">Địa chỉ nhận hàng *</label>
                  <textarea required className="cart-form-input cart-form-textarea"
                    rows={3}
                    value={form.dia_chi}
                    onChange={e => setForm({ ...form, dia_chi: e.target.value })}
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP" />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="cart-card" style={{ marginBottom: 16 }}>
                <h2 className="cart-card-title">Phương thức thanh toán</h2>
                <div className="cart-payment-list">
                  {PAYMENT_OPTIONS.map(opt => (
                    <label key={opt.value} className={`cart-payment-opt ${form.payment_method === opt.value ? 'selected' : ''}`}>
                      <input type="radio" name="pm" value={opt.value}
                        checked={form.payment_method === opt.value}
                        onChange={e => setForm({ ...form, payment_method: e.target.value })}
                        style={{ display: 'none' }} />
                      <span className="cart-payment-name">{opt.label}</span>
                      {opt.value === 'tai_khoan' && user && (
                        <span className="cart-balance-badge">
                          {formatPrice(user.balance || 0)} đ
                        </span>
                      )}
                      {form.payment_method === opt.value && (
                        <span className="cart-payment-check">
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

              {/* Mã giảm giá (Coupon Section) */}
              <div className="cart-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h2 className="cart-card-title" style={{ margin: 0 }}>Mã giảm giá</h2>
                  {availableCoupons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCouponPicker(!showCouponPicker)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--primary)',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px 6px',
                      }}
                    >
                      {showCouponPicker ? 'Đóng gợi ý' : `Xem mã ưu đãi (${availableCoupons.length})`}
                    </button>
                  )}
                </div>

                {/* Khối nhập mã */}
                {!appliedCoupon ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="cart-form-input"
                      style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="Nhập mã voucher (VD: WELCOME200)..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponInput.trim()}
                      onClick={() => handleApplyCoupon()}
                      style={{
                        padding: '0 16px',
                        borderRadius: '8px',
                        background: 'var(--primary, #2563eb)',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.86rem',
                        border: 'none',
                        cursor: couponLoading || !couponInput.trim() ? 'not-allowed' : 'pointer',
                        opacity: couponLoading || !couponInput.trim() ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                ) : (
                  /* Trạng thái đã áp dụng mã */
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1.5px solid rgba(34, 197, 94, 0.35)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#16a34a',
                            color: '#fff',
                          }}
                        >
                          {appliedCoupon.ma_coupon}
                        </span>
                        <strong style={{ color: '#16a34a', fontSize: '0.88rem' }}>
                          - {formatPrice(tienGiam)} đ
                        </strong>
                      </div>
                      <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.76rem' }}>
                        {appliedCoupon.mo_ta}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        color: '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Gỡ mã
                    </button>
                  </div>
                )}

                {/* Thông báo lỗi / thành công */}
                {couponError && (
                  <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '8px', marginBottom: 0, fontWeight: '600' }}>
                    {couponError}
                  </p>
                )}
                {couponSuccess && !appliedCoupon && (
                  <p style={{ color: '#16a34a', fontSize: '0.82rem', marginTop: '8px', marginBottom: 0, fontWeight: '600' }}>
                    {couponSuccess}
                  </p>
                )}

                {/* Danh sách mã voucher có sẵn */}
                {showCouponPicker && availableCoupons.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                      MÃ GIẢM GIÁ KHẢ DỤNG:
                    </div>
                    {availableCoupons.map(c => {
                      const isEligible = tongTien >= Number(c.don_hang_toi_thieu || 0);
                      const isCurrent = appliedCoupon?.ma_coupon === c.ma_coupon;

                      return (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isCurrent ? '1.5px solid #16a34a' : '1px solid var(--border)',
                            background: isCurrent ? 'rgba(34, 197, 94, 0.06)' : 'var(--surface)',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: '800',
                                  fontSize: '0.85rem',
                                  color: 'var(--primary)',
                                }}
                              >
                                {c.ma_coupon}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a' }}>
                                {c.loai_giam === 'phan_tram' ? `Giảm ${Number(c.gia_tri_giam)}%` : `Giảm ${formatPrice(c.gia_tri_giam)}đ`}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                              {c.mo_ta}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Đơn tối thiểu: <strong>{formatPrice(c.don_hang_toi_thieu)}đ</strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!isEligible || isCurrent || couponLoading}
                            onClick={() => handleApplyCoupon(c.ma_coupon)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: isCurrent ? '1px solid #16a34a' : 'none',
                              background: isCurrent ? '#dcfce7' : isEligible ? 'var(--primary)' : 'var(--border)',
                              color: isCurrent ? '#15803d' : isEligible ? '#fff' : 'var(--text-muted)',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: isEligible && !isCurrent ? 'pointer' : 'not-allowed',
                              flexShrink: 0,
                            }}
                          >
                            {isCurrent ? 'Đang dùng' : isEligible ? 'Dùng ngay' : 'Chưa đủ điều kiện'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="cart-card">
                <h2 className="cart-card-title">Tóm tắt đơn hàng</h2>
                <div className="cart-summary-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(tongTien)} đ</span>
                </div>

                {tienGiam > 0 && (
                  <div className="cart-summary-row" style={{ color: '#16a34a', fontWeight: '600' }}>
                    <span>Giảm giá (Voucher)</span>
                    <span>- {formatPrice(tienGiam)} đ</span>
                  </div>
                )}

                <div className="cart-summary-row">
                  <span>Phí vận chuyển</span>
                  <span>
                    {phiShip === 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>Miễn phí</span>
                    ) : (
                      `${formatPrice(phiShip)} đ`
                    )}
                  </span>
                </div>

                <div className="cart-summary-divider" />
                <div className="cart-summary-total">
                  <span>Tổng thanh toán</span>
                  <span className="cart-summary-total-price">{formatPrice(thanhTien)} đ</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cart-checkout-btn"
                >
                  {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                </button>
                <p className="cart-secure-note">Thanh toán bảo mật & an toàn</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
