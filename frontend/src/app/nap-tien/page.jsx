'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../context/AppContext';

const PRESET_AMOUNTS = [
  { value: 50000, label: '50.000đ', popular: false },
  { value: 100000, label: '100.000đ', popular: false },
  { value: 500000, label: '500.000đ', popular: true },
  { value: 1000000, label: '1.000.000đ', popular: true },
  { value: 2000000, label: '2.000.000đ', popular: false },
  { value: 4000000, label: '4.000.000đ', popular: false },
  { value: 5000000, label: '5.000.000đ', popular: true },
  { value: 10000000, label: '10.000.000đ', popular: false },
  { value: 15000000, label: '15.000.000đ', popular: false },
  { value: 20000000, label: '20.000.000đ', popular: false },
];

export default function DepositPage() {
  const router = useRouter();
  const { user, setUser, apiFetch } = useAppContext();

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'history'
  const [selectedAmount, setSelectedAmount] = useState(500000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' | 'momo'
  
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Lịch sử giao dịch ví
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Số tiền thực tế sẽ nạp
  const finalAmount = isCustom ? (parseInt(customAmount.replace(/\D/g, ''), 10) || 0) : selectedAmount;

  // Tải lại thông tin số dư của người dùng
  const refreshUserBalance = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const response = await apiFetch('http://localhost:5000/api/auth/me', {}, user);
      const result = await parseApiResponse(response);
      if (response.ok && result.success) {
        const updatedUser = { ...user, balance: Number(result.data.balance || 0) };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Không thể làm mới số dư:', err);
    }
  }, [apiFetch, user, setUser]);

  // Tải lịch sử giao dịch ví
  const fetchHistory = useCallback(async () => {
    if (!user?.accessToken) return;
    setHistoryLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/wallet/history', {}, user);
      const data = await parseApiResponse(res);
      if (res.ok && data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [apiFetch, user]);

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        if (!user) router.push('/dang-nhap');
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      refreshUserBalance();
      fetchHistory();
    }
  }, [user, router, refreshUserBalance, fetchHistory]);

  const handleSelectPreset = (amount) => {
    setIsCustom(false);
    setSelectedAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setIsCustom(true);
    setSelectedAmount(null);
    if (!raw) {
      setCustomAmount('');
    } else {
      const num = parseInt(raw, 10);
      setCustomAmount(new Intl.NumberFormat('vi-VN').format(num));
    }
    setError('');
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setError('');

    if (!finalAmount || finalAmount < 10000) {
      return setError('Số tiền nạp tối thiểu là 10.000đ!');
    }
    if (finalAmount > 100000000) {
      return setError('Số tiền nạp tối đa mỗi lần là 100.000.000đ!');
    }

    setBusy(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          so_tien: finalAmount,
          phuong_thuc: paymentMethod,
          ghi_chu: `Nạp ${new Intl.NumberFormat('vi-VN').format(finalAmount)}đ vào ví KTSHOP`,
        }),
      }, user);

      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo yêu cầu nạp tiền.');
      }

      setCreatedOrder(data.data);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi yêu cầu nạp tiền.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoInstantDeposit = async () => {
    setError('');
    if (!finalAmount || finalAmount < 10000) {
      return setError('Số tiền nạp tối thiểu là 10.000đ!');
    }
    if (finalAmount > 100000000) {
      return setError('Số tiền nạp tối đa mỗi lần là 100.000.000đ!');
    }

    setDemoBusy(true);
    try {
      let endpoint = 'http://localhost:5000/api/wallet/deposit/demo';
      let body = {
        so_tien: finalAmount,
        phuong_thuc: paymentMethod,
        ghi_chu: `Nạp ${new Intl.NumberFormat('vi-VN').format(finalAmount)}đ vào ví KTSHOP (Demo nạp ngay)`,
      };

      if (createdOrder?.id) {
        endpoint = `http://localhost:5000/api/wallet/deposit/${createdOrder.id}/demo-confirm`;
        body = {};
      }

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, user);

      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể thực hiện nạp tiền demo.');
      }

      const newBal = Number(data.data.so_du_moi ?? ((user.balance || 0) + finalAmount));
      const updatedUser = { ...user, balance: newBal };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccessOrder(data.data);
      setCreatedOrder(null);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Lỗi khi nạp tiền demo.');
    } finally {
      setDemoBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Vui lòng đăng nhập để nạp tiền vào ví...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 16px' }}>
      {/* ── BREADCRUMB ── */}
      <div style={{ fontSize: '0.86rem', color: 'var(--text-muted, #6b7280)', marginBottom: '16px' }}>
        <Link href="/" style={{ color: 'var(--text, #374151)' }}>Trang chủ</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <Link href="/trang-ca-nhan" style={{ color: 'var(--text, #374151)' }}>Trang cá nhân</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: 'var(--primary, #176b50)', fontWeight: '600' }}>Nạp tiền vào ví</span>
      </div>

      {/* ── HERO BANNER: SỐ DƯ HIỆN TẠI ── */}
      <div style={{
        background: 'linear-gradient(135deg, #176b50 0%, #104e3b 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(23, 107, 80, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
            Ví KTSHOP Pay
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '4px' }}>
            {Number(user.balance || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>đ</span>
          </div>
          <div style={{ fontSize: '0.84rem', color: '#e5e7eb', marginTop: '2px' }}>
            Tài khoản: <strong>{user.ho_ten}</strong> ({user.email})
          </div>
        </div>

        <button 
          onClick={refreshUserBalance}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔄 Làm mới số dư
        </button>
      </div>

      {/* ── TABS CHỌN ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e5e7eb)', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('deposit'); setCreatedOrder(null); }}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'deposit' ? '3px solid var(--primary, #176b50)' : '3px solid transparent',
            color: activeTab === 'deposit' ? 'var(--primary, #176b50)' : 'var(--text-muted, #6b7280)',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          💳 Nạp tiền vào ví
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('history'); fetchHistory(); }}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--primary, #176b50)' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--primary, #176b50)' : 'var(--text-muted, #6b7280)',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          📜 Lịch sử nạp tiền ({history.length})
        </button>
      </div>

      {/* ── TAB 1: NẠP TIỀN ── */}
      {activeTab === 'deposit' && (
        <>
          {successOrder ? (
            /* ── MÀN HÌNH NẠP TIỀN THÀNH CÔNG (SUCCESS PAGE) ── */
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '20px',
              padding: '40px 24px',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              textAlign: 'center',
              maxWidth: '680px',
              margin: '0 auto'
            }}>
              {/* Animated Glowing Checkmark Icon */}
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                color: '#ffffff'
              }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '50px',
                background: '#dcfce7',
                color: '#15803d',
                fontWeight: '800',
                fontSize: '0.8rem',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}>
                Giao dịch thành công
              </span>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text, #111827)', margin: '0 0 8px' }}>
                Nạp tiền thành công!
              </h2>
              <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.95rem', margin: '0 0 28px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                Số tiền đã được cộng vào tài khoản của bạn thông qua giao thức Database Transaction.
              </p>

              {/* Hộp số tiền nạp nổi bật */}
              <div style={{
                background: 'var(--bg, #f9fafb)',
                border: '2px dashed #10b981',
                borderRadius: '16px',
                padding: '24px 20px',
                marginBottom: '28px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted, #6b7280)', marginBottom: '4px' }}>Số tiền đã nạp vào ví:</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#059669', letterSpacing: '-0.5px' }}>
                  +{Number(successOrder.so_tien).toLocaleString('vi-VN')} đ
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ecfdf5',
                  padding: '6px 14px',
                  borderRadius: '50px',
                  marginTop: '10px',
                  color: '#047857',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  <span>✓ Số dư mới:</span>
                  <strong>{Number(successOrder.so_du_moi || user.balance || 0).toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>

              {/* Thông tin biên nhận giao dịch */}
              <div style={{
                textAlign: 'left',
                background: 'var(--bg, #f9fafb)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.9rem',
                border: '1px solid var(--border, #e5e7eb)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>Mã giao dịch:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text, #111827)' }}>{successOrder.ma_giao_dich}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(successOrder.ma_giao_dich, 'tx')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedField === 'tx' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border, #e5e7eb)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>Phương thức:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text, #111827)' }}>
                    {successOrder.phuong_thuc === 'vietqr' ? 'Chuyển khoản VietQR' : successOrder.phuong_thuc === 'momo' ? 'Ví MoMo' : 'Nạp tiền ngay (Demo)'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>Thời gian thực hiện:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text, #111827)' }}>
                    {new Date(successOrder.created_at || Date.now()).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>Trạng thái:</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#15803d',
                    fontWeight: '800'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                    Thành công
                  </span>
                </div>
              </div>

              {/* Các nút điều hướng */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setSuccessOrder(null); setCreatedOrder(null); }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border, #d1d5db)',
                    background: '#ffffff',
                    color: 'var(--text, #374151)',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Nạp thêm tiền
                </button>

                <button
                  type="button"
                  onClick={() => { setSuccessOrder(null); setActiveTab('history'); fetchHistory(); }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--bg, #f3f4f6)',
                    color: 'var(--text, #111827)',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  📜 Xem lịch sử ví
                </button>

                <Link
                  href="/san-pham"
                  style={{
                    padding: '12px 26px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary, #176b50)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(23, 107, 80, 0.3)'
                  }}
                >
                  <span>🛍️</span>
                  <span>Mua sắm ngay</span>
                </Link>
              </div>
            </div>
          ) : !createdOrder ? (
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text, #111827)', marginBottom: '16px', fontWeight: '700' }}>
                1. Chọn mệnh giá nạp tiền
              </h2>

              {/* Lưới các gói mệnh giá theo yêu cầu người dùng */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {PRESET_AMOUNTS.map((pkg) => {
                  const isSelected = !isCustom && selectedAmount === pkg.value;
                  return (
                    <button
                      key={pkg.value}
                      type="button"
                      onClick={() => handleSelectPreset(pkg.value)}
                      style={{
                        padding: '16px 12px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary, #176b50)' : '1px solid var(--border, #e5e7eb)',
                        background: isSelected ? 'rgba(23, 107, 80, 0.08)' : 'var(--bg, #f9fafb)',
                        color: isSelected ? 'var(--primary, #176b50)' : 'var(--text, #374151)',
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: '1.05rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        position: 'relative',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pkg.popular && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '8px',
                          background: '#f59e0b',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Phổ biến
                        </span>
                      )}
                      <div>{pkg.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Hoặc tự nhập số tiền */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text, #374151)', marginBottom: '8px' }}>
                  Hoặc tự nhập số tiền bạn muốn nạp (tối thiểu 10.000đ):
                </label>
                <div style={{ position: 'relative', maxWidth: '340px' }}>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="VD: 3.500.000"
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      borderRadius: '10px',
                      border: isCustom ? '2px solid var(--primary, #176b50)' : '1.5px solid var(--border, #d1d5db)',
                      outline: 'none',
                      background: 'var(--bg, #ffffff)',
                      color: 'var(--text, #111827)'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: '700',
                    color: 'var(--text-muted, #9ca3af)'
                  }}>
                    đ
                  </span>
                </div>
              </div>

              {/* 2. Chọn phương thức thanh toán */}
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text, #111827)', marginBottom: '16px', fontWeight: '700' }}>
                2. Chọn phương thức thanh toán
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                <div
                  onClick={() => setPaymentMethod('vietqr')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: paymentMethod === 'vietqr' ? '2px solid var(--primary, #176b50)' : '1px solid var(--border, #e5e7eb)',
                    background: paymentMethod === 'vietqr' ? 'rgba(23, 107, 80, 0.05)' : 'var(--bg, #ffffff)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <input type="radio" checked={paymentMethod === 'vietqr'} onChange={() => setPaymentMethod('vietqr')} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text, #111827)' }}>
                      Chuyển khoản VietQR (Ngân hàng Quân Đội MB)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: '2px' }}>
                      Quét mã QR tự động điền đúng số tiền và nội dung nạp
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('momo')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: paymentMethod === 'momo' ? '2px solid var(--primary, #176b50)' : '1px solid var(--border, #e5e7eb)',
                    background: paymentMethod === 'momo' ? 'rgba(23, 107, 80, 0.05)' : 'var(--bg, #ffffff)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <input type="radio" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text, #111827)' }}>
                      Ví MoMo / Chuyển khoản số điện thoại
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: '2px' }}>
                      Chuyển tiền nhanh qua ứng dụng MoMo
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px',
                  background: '#fff3f1',
                  border: '1px solid #f2c4bf',
                  color: '#9b3428',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.88rem'
                }}>
                  {error}
                </div>
              )}

              {/* Tóm tắt & Các nút nạp tiền */}
              <div style={{
                background: 'var(--bg, #f9fafb)',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #6b7280)' }}>Tổng tiền thanh toán:</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary, #176b50)' }}>
                    {finalAmount ? finalAmount.toLocaleString('vi-VN') : 0}đ
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Nút Nạp tiền ngay (Demo) */}
                  <button
                    type="button"
                    onClick={handleDemoInstantDeposit}
                    disabled={demoBusy || busy || !finalAmount || finalAmount < 10000}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '1rem',
                      cursor: demoBusy ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span>⚡</span>
                    <span>{demoBusy ? 'Đang nạp tiền...' : 'Nạp tiền ngay (demo)'}</span>
                  </button>

                  {/* Nút Tạo yêu cầu nạp tiền thông thường */}
                  <button
                    type="button"
                    onClick={handleSubmitDeposit}
                    disabled={busy || demoBusy || !finalAmount || finalAmount < 10000}
                    style={{
                      background: 'var(--primary, #176b50)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      cursor: busy ? 'wait' : 'pointer',
                      boxShadow: '0 4px 12px rgba(23, 107, 80, 0.25)'
                    }}
                  >
                    {busy ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu nạp tiền'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── MÀN HÌNH HƯỚNG DẪN CHUYỂN KHOẢN SAU KHI TẠO YÊU CẦU ── */
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                background: 'rgba(23, 107, 80, 0.08)',
                border: '1px solid rgba(23, 107, 80, 0.25)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary, #176b50)', fontSize: '1.05rem', fontWeight: '700' }}>
                    Yêu cầu nạp tiền đã được gửi lên hệ thống!
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text, #374151)' }}>
                    Vui lòng quét mã QR hoặc chuyển khoản với <strong>đúng số tiền và nội dung</strong> bên dưới. Quản trị viên sẽ kiểm tra và xác nhận cộng tiền vào ví của bạn.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', alignItems: 'center' }}>
                {/* Cột trái: Mã QR VietQR */}
                <div style={{ textAlign: 'center', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <img
                    src={createdOrder.qr_url}
                    alt="VietQR Code"
                    style={{ maxWidth: '280px', width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '10px' }}>
                    Mở ứng dụng Ngân hàng hoặc MoMo để quét mã QR chuyển nhanh
                  </div>
                </div>

                {/* Cột phải: Thông tin chuyển khoản chi tiết */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ngân hàng thụ hưởng:</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{createdOrder.bank_name}</div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Số tài khoản:</div>
                      <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#176b50' }}>{createdOrder.account_no}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdOrder.account_no, 'acc')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {copiedField === 'acc' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tên người thụ hưởng:</div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>{createdOrder.account_name}</div>
                  </div>

                  <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Số tiền cần chuyển:</div>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#e11d48' }}>
                        {Number(createdOrder.so_tien).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(createdOrder.so_tien), 'amt')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {copiedField === 'amt' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>Nội dung chuyển khoản (bắt buộc):</div>
                      <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#b45309', letterSpacing: '1px' }}>
                        {createdOrder.syntax}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdOrder.syntax, 'syn')}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #f59e0b', background: '#ffffff', color: '#b45309', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {copiedField === 'syn' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hàng nút hành động dưới màn hình QR */}
              <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCreatedOrder(null)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Tạo yêu cầu nạp khác
                </button>

                {/* Nút nạp tiền ngay (demo) trên màn hình QR */}
                <button
                  type="button"
                  onClick={handleDemoInstantDeposit}
                  disabled={demoBusy}
                  style={{
                    padding: '11px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: demoBusy ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚡</span>
                  <span>{demoBusy ? 'Đang duyệt demo...' : 'Nạp tiền ngay (demo)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('history'); fetchHistory(); }}
                  style={{
                    padding: '11px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary, #176b50)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Xem trạng thái duyệt tại Lịch sử
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: LỊCH SỬ NẠP TIỀN ── */}
      {activeTab === 'history' && (
        <div style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border, #e5e7eb)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text, #111827)', margin: 0, fontWeight: '700' }}>
              Danh sách giao dịch ví của bạn
            </h2>
            <button
              type="button"
              onClick={() => { fetchHistory(); refreshUserBalance(); }}
              disabled={historyLoading}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              {historyLoading ? 'Đang tải...' : '🔄 Làm mới'}
            </button>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #9ca3af)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
              <p>Bạn chưa có yêu cầu nạp tiền nào.</p>
              <button
                type="button"
                onClick={() => setActiveTab('deposit')}
                style={{
                  marginTop: '12px',
                  background: 'var(--primary, #176b50)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Nạp tiền ngay
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg, #f9fafb)', textAlign: 'left', color: 'var(--text-muted, #6b7280)', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                    <th style={{ padding: '10px 12px' }}>Mã giao dịch</th>
                    <th style={{ padding: '10px 12px' }}>Loại GD</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Số tiền</th>
                    <th style={{ padding: '10px 12px' }}>Phương thức</th>
                    <th style={{ padding: '10px 12px' }}>Thời gian</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => {
                    const isPending = tx.trang_thai === 'cho_duyet';
                    const isSuccess = tx.trang_thai === 'thanh_cong';
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border, #f3f4f6)' }}>
                        <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text, #111827)' }}>
                          {tx.ma_giao_dich}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            background: tx.loai_giao_dich === 'nap_tien' ? '#ecfdf5' : 'var(--input-bg, #f3f4f6)',
                            color: tx.loai_giao_dich === 'nap_tien' ? '#047857' : 'var(--text, #374151)',
                            border: '1px solid var(--border, #e5e7eb)'
                          }}>
                            {tx.loai_giao_dich === 'nap_tien' ? 'Nạp tiền ví' : tx.loai_giao_dich === 'hoan_tien' ? 'Hoàn tiền' : 'Thanh toán'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: tx.loai_giao_dich === 'thanh_toan' ? '#e11d48' : '#10b981' }}>
                          {tx.loai_giao_dich === 'thanh_toan' ? '-' : '+'}{Number(tx.so_tien).toLocaleString('vi-VN')}đ
                        </td>
                        <td style={{ padding: '12px', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)' }}>
                          {tx.phuong_thuc}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted, #6b7280)', fontSize: '0.82rem' }}>
                          {new Date(tx.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            display: 'inline-block',
                            background: isPending ? '#fef3c7' : isSuccess ? '#ecfdf5' : '#fee2e2',
                            color: isPending ? '#b45309' : isSuccess ? '#047857' : '#b91c1c'
                          }}>
                            {isPending ? '⏳ Chờ duyệt' : isSuccess ? '✓ Thành công' : '✕ Từ chối'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
