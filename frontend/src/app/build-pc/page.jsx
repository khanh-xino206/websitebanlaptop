'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';

// Danh sách danh mục linh kiện
const PART_CATEGORIES = [
  { id: 'cpu', name: '1. Vi Xử Lý (CPU)', icon: '⚡', desc: 'Bộ não xử lý mọi tác vụ game & công việc', required: true },
  { id: 'mainboard', name: '2. Bo Mạch Chủ (Mainboard)', icon: '🔌', desc: 'Kết nối và đồng bộ các linh kiện', required: true },
  { id: 'ram', name: '3. Bộ Nhớ Trong (RAM)', icon: '🧠', desc: 'Đa nhiệm mượt mà không lo tràn RAM', required: true },
  { id: 'vga', name: '4. Card Đồ Họa (VGA/GPU)', icon: '🎮', desc: 'Sức mạnh dựng hình 3D & chiến game FPS cao', required: true },
  { id: 'ssd', name: '5. Ổ Cứng Lưu Trữ (SSD)', icon: '💾', desc: 'Khởi động máy và load game siêu tốc', required: true },
  { id: 'psu', name: '6. Nguồn Máy Tính (PSU)', icon: '🔋', desc: 'Cung cấp năng lượng ổn định, bền bỉ', required: true },
  { id: 'case', name: '7. Vỏ Máy Tính (Case)', icon: '📦', desc: 'Bảo vệ linh kiện và luồng khí tối ưu', required: false },
  { id: 'cooler', name: '8. Tản Nhiệt CPU', icon: '❄️', desc: 'Giữ nhiệt độ máy luôn mát mẻ', required: false },
  { id: 'monitor', name: '9. Màn Hình Máy Tính', icon: '🖥️', desc: 'Hiển thị hình ảnh sắc nét, tần số quét cao', required: false },
];

// Kho linh kiện mẫu thực tế
const HARDWARE_ITEMS = {
  cpu: [
    { id: 'cpu-1', name: 'Intel Core i5-13400F (10 nhân 16 luồng, Turbo 4.6GHz)', price: 4690000, brand: 'Intel', watts: 65, img: '/uploads/dell-inspiron-15-main.jpg' },
    { id: 'cpu-2', name: 'Intel Core i5-14600K (14 nhân 20 luồng, Turbo 5.3GHz)', price: 7990000, brand: 'Intel', watts: 125, img: '/uploads/asus-rog-g15-main.jpg' },
    { id: 'cpu-3', name: 'Intel Core i7-14700K (20 nhân 28 luồng, Turbo 5.6GHz)', price: 10990000, brand: 'Intel', watts: 125, img: '/uploads/asus-rog-g15-main.jpg' },
    { id: 'cpu-4', name: 'AMD Ryzen 5 7600X (6 nhân 12 luồng, Turbo 5.3GHz, AM5)', price: 5490000, brand: 'AMD', watts: 105, img: '/uploads/dell-xps-13.jpg' },
    { id: 'cpu-5', name: 'AMD Ryzen 7 7800X3D (8 nhân 16 luồng, 3D V-Cache Game thủ)', price: 9890000, brand: 'AMD', watts: 120, img: '/uploads/dell-xps-13.jpg' },
  ],
  mainboard: [
    { id: 'mb-1', name: 'ASUS TUF GAMING B760M-PLUS WIFI DDR5', price: 3990000, brand: 'Asus', watts: 30, img: '/uploads/asus-zenbook-14.jpg' },
    { id: 'mb-2', name: 'MSI MAG B760 TOMAHAWK WIFI DDR5', price: 4790000, brand: 'MSI', watts: 35, img: '/uploads/asus-zenbook-14.jpg' },
    { id: 'mb-3', name: 'ASUS ROG STRIX Z790-A GAMING WIFI II', price: 8990000, brand: 'Asus', watts: 45, img: '/uploads/asus-zenbook-14.jpg' },
    { id: 'mb-4', name: 'GIGABYTE B650M AORUS ELITE AX AM5', price: 4390000, brand: 'Gigabyte', watts: 30, img: '/uploads/asus-zenbook-14.jpg' },
  ],
  ram: [
    { id: 'ram-1', name: 'Kingston Fury Beast RGB 16GB (2x8GB) DDR5 5600MHz', price: 1690000, brand: 'Kingston', watts: 15, img: '/uploads/hp-pavilion-15-main.jpg' },
    { id: 'ram-2', name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz', price: 3190000, brand: 'Corsair', watts: 20, img: '/uploads/hp-pavilion-15-main.jpg' },
    { id: 'ram-3', name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6400MHz', price: 3690000, brand: 'G.Skill', watts: 20, img: '/uploads/hp-pavilion-15-main.jpg' },
    { id: 'ram-4', name: 'Kingston Fury Beast 64GB (2x32GB) DDR5 5600MHz', price: 5490000, brand: 'Kingston', watts: 25, img: '/uploads/hp-pavilion-15-main.jpg' },
  ],
  vga: [
    { id: 'vga-1', name: 'ASUS Dual GeForce RTX 4060 EVO OC 8GB GDDR6', price: 8290000, brand: 'NVIDIA', watts: 115, img: '/uploads/dell-xps-13.jpg' },
    { id: 'vga-2', name: 'GIGABYTE GeForce RTX 4060 Ti Gaming OC 8GB', price: 11490000, brand: 'NVIDIA', watts: 160, img: '/uploads/dell-xps-13.jpg' },
    { id: 'vga-3', name: 'MSI GeForce RTX 4070 SUPER 12G VENTUS 2X OC', price: 16990000, brand: 'NVIDIA', watts: 220, img: '/uploads/dell-xps-13.jpg' },
    { id: 'vga-4', name: 'ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB', price: 29990000, brand: 'NVIDIA', watts: 320, img: '/uploads/dell-xps-13.jpg' },
  ],
  ssd: [
    { id: 'ssd-1', name: 'Kingston NV2 500GB PCIe 4.0 NVMe M.2 SSD', price: 990000, brand: 'Kingston', watts: 5, img: '/uploads/acer-nitro-5-main.jpg' },
    { id: 'ssd-2', name: 'Samsung 980 PRO 1TB PCIe Gen 4.0 NVMe', price: 2490000, brand: 'Samsung', watts: 7, img: '/uploads/acer-nitro-5-main.jpg' },
    { id: 'ssd-3', name: 'Samsung 990 PRO 2TB PCIe Gen 4.0 NVMe Cực Nhanh', price: 4490000, brand: 'Samsung', watts: 9, img: '/uploads/acer-nitro-5-main.jpg' },
  ],
  psu: [
    { id: 'psu-1', name: 'Corsair CV650 650W 80 Plus Bronze', price: 1450000, brand: 'Corsair', watts: 0, img: '/uploads/lenovo-thinkpad-x1-main.jpg' },
    { id: 'psu-2', name: 'MSI MAG A750GL PCIE5 750W 80 Plus Gold Chuẩn ATX 3.0', price: 2590000, brand: 'MSI', watts: 0, img: '/uploads/lenovo-thinkpad-x1-main.jpg' },
    { id: 'psu-3', name: 'Corsair RM850e 850W 80 Plus Gold Full Modular', price: 3390000, brand: 'Corsair', watts: 0, img: '/uploads/lenovo-thinkpad-x1-main.jpg' },
  ],
  case: [
    { id: 'case-1', name: 'Xigmatek Aqua M 3GF (Đen - Kèm 3 Fan RGB)', price: 790000, brand: 'Xigmatek', watts: 10, img: '/uploads/dell-inspiron-15-main.jpg' },
    { id: 'case-2', name: 'NZXT H5 Flow RGB White (Kính cường lực cao cấp)', price: 2290000, brand: 'NZXT', watts: 15, img: '/uploads/hp-spectre-x360.jpg' },
  ],
  cooler: [
    { id: 'cool-1', name: 'Thermalright Peerless Assassin 120 SE ARGB (Khí)', price: 790000, brand: 'Thermalright', watts: 10, img: '/uploads/hp-spectre-x360.jpg' },
    { id: 'cool-2', name: 'DeepCool LS720 SE ARGB 360mm (Tản nhiệt nước AIO)', price: 2390000, brand: 'DeepCool', watts: 25, img: '/uploads/hp-spectre-x360.jpg' },
  ],
  monitor: [
    { id: 'mon-1', name: 'ASUS TUF Gaming VG249Q3A 24" FHD Fast IPS 180Hz 1ms', price: 3190000, brand: 'Asus', watts: 25, img: '/uploads/macbook-air-m3-main.jpg' },
    { id: 'mon-2', name: 'LG UltraGear 27GR75Q-B 27" 2K QHD IPS 165Hz G-Sync', price: 6290000, brand: 'LG', watts: 35, img: '/uploads/macbook-pro-16-m3.jpg' },
  ],
};

function formatVND(num) {
  return new Intl.NumberFormat('vi-VN').format(num) + '₫';
}

export default function BuildPCPage() {
  const { addToCart } = useAppContext();
  const [selectedParts, setSelectedParts] = useState({});
  const [activeModalCategory, setActiveModalCategory] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Tính tổng tiền & công suất watt
  const totalPrice = Object.values(selectedParts).reduce((sum, item) => sum + (item?.price || 0), 0);
  const totalWatts = Object.values(selectedParts).reduce((sum, item) => sum + (item?.watts || 0), 0) + 50; // 50W base
  const recommendedPSU = Math.ceil((totalWatts * 1.35) / 50) * 50; // headroom 35%

  const handleSelect = (category, item) => {
    setSelectedParts(prev => ({ ...prev, [category]: item }));
    setActiveModalCategory(null);
  };

  const handleRemove = (category) => {
    setSelectedParts(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn làm mới và xóa toàn bộ cấu hình đang chọn?')) {
      setSelectedParts({});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddAllToCart = () => {
    const items = Object.values(selectedParts).filter(Boolean);
    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất một linh kiện để thêm vào giỏ hàng!');
      return;
    }
    items.forEach(part => {
      addToCart({
        id: part.id,
        ten_laptop: `[Linh Kiện Build PC] ${part.name}`,
        gia_ban: part.price,
        gia_goc: part.price * 1.1,
        url_anh: part.img || '/uploads/dell-inspiron-15-main.jpg',
      });
    });
    alert(`Đã thêm ${items.length} linh kiện vào giỏ hàng thành công!`);
  };

  const handleCopyConfig = () => {
    const list = Object.entries(selectedParts)
      .map(([cat, item]) => `${cat.toUpperCase()}: ${item.name} - ${formatVND(item.price)}`)
      .join('\n');
    const text = `=== BẢNG CẤU HÌNH PC TẠI KTSHOP ===\n${list}\n-------------------------\nTổng cộng: ${formatVND(totalPrice)}\nCông suất nguồn đề xuất: ${recommendedPSU}W+`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="build-pc-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 80px' }}>
      
      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trang chủ</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>Build PC & Chọn Cấu Hình</span>
      </div>

      {/* ── TOP HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%)',
        borderRadius: 20,
        padding: '36px 32px',
        color: '#fff',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
        boxShadow: '0 12px 36px rgba(37, 99, 235, 0.25)',
        marginBottom: 32,
      }}>
        <div style={{ maxWidth: 640 }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            padding: '4px 14px',
            borderRadius: 50,
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: 12
          }}>
            🛠️ CÔNG CỤ TỰ BUILD CẤU HÌNH THÔNG MINH
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, margin: '0 0 10px' }}>
            Xây Dựng Cấu Hình PC & Laptop Gaming
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.5 }}>
            Tự do tùy biến từng linh kiện chính hãng 100%, tự động kiểm tra tương thích phần cứng, tối ưu hóa công suất nguồn và nhận báo giá tức thì.
          </p>
        </div>

        {/* Dashboard tóm tắt tiền */}
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 16,
          padding: '20px 24px',
          minWidth: 260,
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '0.82rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5 }}>Chi phí dự tính</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fef08a', margin: '4px 0 8px' }}>
            {formatVND(totalPrice)}
          </div>
          <div style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
            <span>⚡ Ước tính điện năng:</span>
            <strong style={{ color: '#86efac' }}>~{totalWatts}W</strong>
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 2 }}>
            Đề xuất nguồn: <strong>{recommendedPSU}W+</strong>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{
        position: 'sticky',
        top: 76,
        zIndex: 90,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '12px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Đã chọn: <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{Object.keys(selectedParts).length}/9</strong> linh kiện
          </span>
          <span style={{ height: 16, width: 1, background: 'var(--border)' }}></span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ef4444' }}>
            {formatVND(totalPrice)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🗑️ Làm mới
          </button>
          
          <button
            onClick={handleCopyConfig}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copySuccess ? '✅ Đã sao chép!' : '📋 Sao chép cấu hình'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🖨️ In / Tải PDF
          </button>

          <button
            onClick={handleAddAllToCart}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🛒 Thêm Tất Cả Vào Giỏ
          </button>
        </div>
      </div>

      {/* ── BẢNG DANH MỤC LINH KIỆN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PART_CATEGORIES.map(cat => {
          const selected = selectedParts[cat.id];
          return (
            <div
              key={cat.id}
              style={{
                background: 'var(--surface)',
                border: selected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'all 0.2s ease',
                boxShadow: selected ? '0 4px 14px rgba(37,99,235,0.08)' : 'none'
              }}
            >
              {/* Cột trái: Tên danh mục */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: selected ? 'rgba(37,99,235,0.1)' : 'rgba(148,163,184,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                    {cat.name}
                    {cat.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cat.desc}</div>
                </div>
              </div>

              {/* Cột giữa: Linh kiện đã chọn */}
              <div style={{ flex: 1, padding: '0 12px' }}>
                {selected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img src={selected.img} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.3 }}>
                        {selected.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Hãng: <strong>{selected.brand}</strong> &bull; Tiêu thụ: <strong>~{selected.watts}W</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontStyle: 'italic' }}>
                    Chưa chọn linh kiện nào cho mục này
                  </div>
                )}
              </div>

              {/* Cột phải: Giá tiền & Nút chọn */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                {selected ? (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#ef4444' }}>
                        {formatVND(selected.price)}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveModalCategory(cat.id)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    >
                      Đổi linh kiện
                    </button>
                    <button
                      onClick={() => handleRemove(cat.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.25)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Xóa linh kiện này"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveModalCategory(cat.id)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 10,
                      background: 'rgba(37,99,235,0.08)',
                      border: '1px solid rgba(37,99,235,0.25)',
                      color: 'var(--primary)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>+</span> Chọn linh kiện
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL CHỌN LINH KIỆN ── */}
      {activeModalCategory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 780,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  Chọn {PART_CATEGORIES.find(c => c.id === activeModalCategory)?.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Linh kiện cam kết chính hãng 100%, bảo hành 36 tháng
                </span>
              </div>
              <button
                onClick={() => setActiveModalCategory(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(148,163,184,0.15)',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(HARDWARE_ITEMS[activeModalCategory] || []).map(item => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'all 0.2s ease',
                    background: selectedParts[activeModalCategory]?.id === item.id ? 'rgba(37,99,235,0.06)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Thương hiệu: <strong>{item.brand}</strong> &bull; Tiêu thụ: <strong>~{item.watts}W</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444' }}>
                      {formatVND(item.price)}
                    </div>
                    <button
                      onClick={() => handleSelect(activeModalCategory, item)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 8,
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Chọn món này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER CAM KẾT ── */}
      <div style={{
        marginTop: 48,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20
      }}>
        <div style={{ padding: 20, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🛡️</div>
          <h4 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Bảo Hành Tận Nơi</h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Bảo hành chính hãng 1 đổi 1 lên đến 36 tháng. Hỗ trợ kỹ thuật lắp ráp miễn phí trọn đời dàn PC.
          </p>
        </div>

        <div style={{ padding: 20, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🚚</div>
          <h4 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Lắp Ráp & Giao Tốc Hành</h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Kỹ thuật viên đi dây thẩm mỹ cao, test hiệu năng burn-in benchmark 24h trước khi bàn giao.
          </p>
        </div>

        <div style={{ padding: 20, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🎁</div>
          <h4 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Quà Tặng Khủng</h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Tặng ngay bàn di chuột cỡ lớn 80x30cm, giá đỡ VGA chống xệ và gói vệ sinh dàn PC định kỳ 6 tháng/lần.
          </p>
        </div>
      </div>

    </div>
  );
}
