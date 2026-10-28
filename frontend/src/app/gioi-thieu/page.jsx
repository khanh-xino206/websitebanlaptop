import Link from 'next/link';

export default function GioiThieuPage() {
  return (
    <div className="about-page" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: 9999, fontWeight: 700, fontSize: '0.875rem', marginBottom: 16 }}>
          VỀ CHÚNG TÔI
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 16, lineHeight: 1.2 }}>
          KTSHOP – Hệ Thống Bán Lẻ Laptop Chính Hãng Hàng Đầu
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: 720, margin: '0 auto', lineHeight: 1.6 }}>
          Thành lập với sứ mệnh mang đến trải nghiệm công nghệ đỉnh cao, KTSHOP tự hào là điểm đến tin cậy của hàng chục ngàn học sinh, sinh viên, lập trình viên và doanh nghiệp trên toàn quốc.
        </p>
      </section>

      {/* Stats Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 64 }}>
        {[
          { number: '10+', label: 'Năm kinh nghiệm công nghệ' },
          { number: '50.000+', label: 'Khách hàng hài lòng' },
          { number: '100%', label: 'Sản phẩm chính hãng' },
          { number: '24/7', label: 'Hỗ trợ kỹ thuật chuyên sâu' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2563eb', marginBottom: 8 }}>{stat.number}</div>
            <div style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.95rem' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Core Values */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: 36, color: 'var(--text)' }}>
          Giá Trị Cốt Lõi Của KTSHOP
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Chất Lượng Tiên Quyết</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Tất cả laptop tại KTSHOP đều có nguồn gốc rõ ràng, nguyên seal từ nhà sản xuất Dell, HP, Asus, Lenovo, Acer, Apple, được kiểm tra nghiêm ngặt trước khi đến tay người tiêu dùng.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Giá Tốt & Trả Góp 0%</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Chúng tôi luôn tối ưu hóa chuỗi cung ứng để mang lại mức giá cạnh tranh nhất, kết hợp chính sách trả góp linh hoạt giúp khách hàng dễ dàng sở hữu laptop mong muốn.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Hậu Mãi Chu Đáo</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Đổi mới 30 ngày nếu phát sinh lỗi từ nhà sản xuất, bảo hành chính hãng lên tới 24 tháng, hỗ trợ cài đặt phần mềm và vệ sinh máy miễn phí trọn đời.
            </p>
          </div>
        </div>
      </section>

      {/* Showroom & Contact info */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Hệ Thống Cửa Hàng & Showroom KTSHOP</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Địa chỉ: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Hotline tư vấn & đặt hàng: <strong>0909 000 001</strong> (8:00 - 21:00 hàng ngày)</p>
        <Link href="/san-pham" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '14px 32px', borderRadius: 9999, fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
          Khám Phá Danh Sách Laptop →
        </Link>
      </section>
    </div>
  );
}
