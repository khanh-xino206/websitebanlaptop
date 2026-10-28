'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';

function formatVND(num) {
  if (!num) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(num) + '₫';
}

const FALLBACK_FLASH_PRODUCTS = [
  {
    id: 1,
    ten_laptop: 'Dell Inspiron 15 3520 (i5-1235U, 16GB, 512GB, 120Hz)',
    gia_ban: 13990000,
    gia_goc: 16990000,
    discount_percent: 18,
    url_anh: '/uploads/dell-inspiron-15-main.jpg',
    thuong_hieu: 'Dell',
    da_ban: 31,
    tong_kho: 35,
  },
  {
    id: 3,
    ten_laptop: 'Dell Gaming G15 5530 (i7-13650HX, RTX 4060, 165Hz)',
    gia_ban: 28490000,
    gia_goc: 34990000,
    discount_percent: 19,
    url_anh: '/uploads/dell-inspiron-15-main.jpg',
    thuong_hieu: 'Dell',
    da_ban: 18,
    tong_kho: 20,
  },
  {
    id: 14,
    ten_laptop: 'Asus Zenbook 14 OLED UX3405MA (Core Ultra 7 AI, 3K OLED)',
    gia_ban: 32990000,
    gia_goc: 38990000,
    discount_percent: 15,
    url_anh: '/uploads/asus-zenbook-14.jpg',
    thuong_hieu: 'Asus',
    da_ban: 12,
    tong_kho: 15,
  },
  {
    id: 25,
    ten_laptop: 'Acer Nitro 5 Tiger AN515-58 (i7-12700H, RTX 3050Ti 144Hz)',
    gia_ban: 19990000,
    gia_goc: 24990000,
    discount_percent: 20,
    url_anh: '/uploads/acer-nitro-5-main.jpg',
    thuong_hieu: 'Acer',
    da_ban: 24,
    tong_kho: 25,
  },
  {
    id: 31,
    ten_laptop: 'Apple MacBook Air 13 inch M2 2022 (8GB RAM / 256GB SSD)',
    gia_ban: 24290000,
    gia_goc: 28990000,
    discount_percent: 16,
    url_anh: '/uploads/macbook-air-m3-main.jpg',
    thuong_hieu: 'Apple',
    da_ban: 45,
    tong_kho: 50,
  },
  {
    id: 33,
    ten_laptop: 'Apple MacBook Pro 14 inch M3 Pro (18GB / 512GB Space Black)',
    gia_ban: 49990000,
    gia_goc: 55990000,
    discount_percent: 11,
    url_anh: '/uploads/macbook-pro-16-m3.jpg',
    thuong_hieu: 'Apple',
    da_ban: 8,
    tong_kho: 10,
  },
  {
    id: 20,
    ten_laptop: 'Lenovo Legion Pro 5 16IRX9 (i9-14900HX, RTX 4070 240Hz)',
    gia_ban: 45490000,
    gia_goc: 52990000,
    discount_percent: 14,
    url_anh: '/uploads/lenovo-legion-pro-5.jpg',
    thuong_hieu: 'Lenovo',
    da_ban: 6,
    tong_kho: 8,
  },
  {
    id: 9,
    ten_laptop: 'HP Victus 16-r0129TX (i7-13700H, RTX 4050 144Hz)',
    gia_ban: 25490000,
    gia_goc: 29990000,
    discount_percent: 15,
    url_anh: '/uploads/hp-pavilion-15-main.jpg',
    thuong_hieu: 'HP',
    da_ban: 15,
    tong_kho: 18,
  },
];

export default function FlashSalePage() {
  const { addToCart } = useAppContext();
  const [products, setProducts] = useState(FALLBACK_FLASH_PRODUCTS);
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [activeSlot, setActiveSlot] = useState(0);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    // Tải flash sale từ backend nếu có
    fetch('http://localhost:5000/api/flash-sale')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data.map(p => ({
            ...p,
            da_ban: Math.floor(Math.random() * 15) + 12,
            tong_kho: (p.so_luong_ton || 10) + 20,
          }));
          setProducts(list);
        }
      })
      .catch(() => {});

    // Đếm ngược từng giây
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filtered = selectedBrand === 'ALL'
    ? products
    : products.filter(p => (p.thuong_hieu || '').toLowerCase().includes(selectedBrand.toLowerCase()));

  const pad = n => String(n).padStart(2, '0');

  return (
    <div className="flash-sale-page" style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 80px' }}>
      
      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trang chủ</Link>
        <span>/</span>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>🔥 Flash Sale Giờ Vàng Giá Sốc</span>
      </div>

      {/* ── FLASH SALE HERO BANNER ── */}
      <div style={{
        background: 'radial-gradient(ellipse at top left, #ef4444 0%, #b91c1c 45%, #7f1d1d 100%)',
        borderRadius: 24,
        padding: '36px 32px',
        color: '#fff',
        boxShadow: '0 16px 40px rgba(220, 38, 38, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24
      }}>
        {/* Glow hiệu ứng nền */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.25)',
          filter: 'blur(50px)'
        }} />

        <div style={{ maxWidth: 580, position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            padding: '5px 16px',
            borderRadius: 50,
            fontSize: '0.84rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            marginBottom: 12
          }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fef08a' }} />
            ĐỘC QUYỀN HÔM NAY - GIẢM ĐẾN 35%
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            ⚡ Săn Deal Chớp Nhoáng KTSHOP
          </h1>
          <p style={{ margin: 0, fontSize: '0.96rem', opacity: 0.92, lineHeight: 1.5 }}>
            Cam kết giá thấp nhất thị trường cho laptop Gaming, Ultrabook, MacBook chính hãng. Số lượng có hạn theo từng khung giờ!
          </p>
        </div>

        {/* Khối đếm ngược Countdown */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          borderRadius: 20,
          padding: '20px 28px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9, marginBottom: 8 }}>
            KẾT THÚC TRONG
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <div style={{
              background: '#fff',
              color: '#b91c1c',
              fontSize: '1.8rem',
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: 10,
              minWidth: 54,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {pad(timeLeft.hours)}
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fef08a' }}>:</span>
            <div style={{
              background: '#fff',
              color: '#b91c1c',
              fontSize: '1.8rem',
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: 10,
              minWidth: 54,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {pad(timeLeft.minutes)}
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fef08a' }}>:</span>
            <div style={{
              background: '#fff',
              color: '#b91c1c',
              fontSize: '1.8rem',
              fontWeight: 900,
              padding: '6px 14px',
              borderRadius: 10,
              minWidth: 54,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {pad(timeLeft.seconds)}
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 8 }}>
            Giờ &bull; Phút &bull; Giây
          </div>
        </div>
      </div>

      {/* ── TIME SLOTS BAR ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 28
      }}>
        {[
          { time: '09:00 - 12:00', title: '🔥 Đang diễn ra', status: 'Sắp hết' },
          { time: '12:00 - 15:00', title: '⏰ Sắp diễn ra', status: 'Chờ mở' },
          { time: '18:00 - 21:00', title: '🌙 Giờ vàng tối', status: 'Chờ mở' },
          { time: 'Ngày mai', title: '⭐ Siêu sale ngày mới', status: 'Đặt lịch' },
        ].map((slot, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlot(idx)}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: activeSlot === idx ? '#ef4444' : 'var(--surface)',
              color: activeSlot === idx ? '#fff' : 'var(--text)',
              border: activeSlot === idx ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: activeSlot === idx ? '0 8px 20px rgba(239,68,68,0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{slot.time}</div>
            <div style={{ fontSize: '0.8rem', opacity: activeSlot === idx ? 0.95 : 0.7, marginTop: 2 }}>
              {slot.title} &bull; <strong>{slot.status}</strong>
            </div>
          </button>
        ))}
      </div>

      {/* ── BRAND FILTER TABS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
        {['ALL', 'Apple', 'Asus', 'Dell', 'HP', 'Lenovo', 'Acer'].map(brand => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            style={{
              padding: '7px 18px',
              borderRadius: 50,
              fontSize: '0.85rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: selectedBrand === brand ? '#ef4444' : 'var(--border)',
              background: selectedBrand === brand ? 'rgba(239,68,68,0.1)' : 'var(--surface)',
              color: selectedBrand === brand ? '#ef4444' : 'var(--text)',
              cursor: 'pointer'
            }}
          >
            {brand === 'ALL' ? 'Tất cả sản phẩm' : brand}
          </button>
        ))}
      </div>

      {/* ── PRODUCT GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20
      }}>
        {filtered.map(p => {
          const percentSold = Math.min(100, Math.round((p.da_ban / (p.tong_kho || 30)) * 100));
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease'
              }}
            >
              {/* Huy hiệu % giảm giá */}
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 2,
                background: '#ef4444',
                color: '#fff',
                padding: '4px 9px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
              }}>
                -{p.discount_percent || 15}%
              </div>

              {/* Ảnh laptop */}
              <div style={{
                width: '100%',
                height: 180,
                borderRadius: 12,
                background: 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: 14
              }}>
                <img
                  src={p.url_anh || '/uploads/dell-inspiron-15-main.jpg'}
                  alt={p.ten_laptop}
                  style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', transition: 'transform 0.3s' }}
                />
              </div>

              {/* Thông tin */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  {p.thuong_hieu}
                </span>
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  margin: '4px 0 10px',
                  color: 'var(--text)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 38
                }}>
                  {p.ten_laptop}
                </h3>

                {/* Giá bán */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444' }}>
                    {formatVND(p.gia_ban)}
                  </span>
                  {p.gia_goc && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatVND(p.gia_goc)}
                    </span>
                  )}
                </div>

                {/* Thanh tiến độ số lượng đã bán */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    width: '100%',
                    height: 18,
                    background: 'rgba(239,68,68,0.12)',
                    borderRadius: 50,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${percentSold}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)',
                      borderRadius: 50,
                      transition: 'width 0.5s ease'
                    }} />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: percentSold > 45 ? '#fff' : '#b91c1c'
                    }}>
                      🔥 ĐÃ BÁN {p.da_ban} / {p.tong_kho} MÁY
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <Link
                  href={`/san-pham/${p.id}`}
                  style={{
                    padding: '9px 0',
                    textAlign: 'center',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)'
                  }}
                >
                  Xem chi tiết
                </Link>
                <button
                  onClick={() => {
                    addToCart(p);
                    alert(`Đã thêm "${p.ten_laptop}" vào giỏ hàng!`);
                  }}
                  style={{
                    padding: '9px 0',
                    borderRadius: 10,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.35)'
                  }}
                >
                  ⚡ MUA NGAY
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
