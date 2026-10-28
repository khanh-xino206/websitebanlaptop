import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px', color: 'var(--text)' }}>
      <nav style={{ marginBottom: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link href="/">Trang chủ</Link> / <span>Điều khoản dịch vụ</span>
      </nav>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 24 }}>Điều Khoản Sử Dụng KTSHOP</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>Cập nhật lần cuối: 2026</p>

      <section style={{ marginBottom: 32, lineHeight: 1.7, background: 'var(--surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>1. Quy định chung</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Khi truy cập và đặt mua sản phẩm tại KTSHOP, quý khách đồng ý tuân thủ các điều khoản dịch vụ và chính sách bán hàng hiện hành của chúng tôi.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>2. Đặt hàng và giá cả</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Giá sản phẩm hiển thị trên website là giá bán chính thức bằng Việt Nam Đồng (VNĐ). KTSHOP có quyền từ chối hoặc hủy đơn hàng trong trường hợp thông tin địa chỉ giao hàng không chính xác hoặc sản phẩm tạm thời hết hàng do lỗi kiểm kho.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>3. Chính sách bảo hành & đổi trả</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          - Đổi mới 1 - 1 trong vòng 30 ngày nếu laptop phát sinh lỗi kỹ thuật do nhà sản xuất.<br />
          - Thời gian bảo hành từ 12 đến 24 tháng theo đúng tiêu chuẩn của từng hãng (Dell, HP, Asus, Lenovo, Acer, Apple).
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>4. Trách nhiệm người dùng</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Khách hàng có trách nhiệm bảo mật thông tin tài khoản và mật khẩu cá nhân. Không được sử dụng bất kỳ công cụ can thiệp hoặc gây ảnh hưởng tiêu cực đến hệ thống máy chủ của KTSHOP.
        </p>
      </section>
    </div>
  );
}
