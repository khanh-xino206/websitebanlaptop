import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px', color: 'var(--text)' }}>
      <nav style={{ marginBottom: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <Link href="/">Trang chủ</Link> / <span>Chính sách bảo mật</span>
      </nav>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 24 }}>Chính Sách Bảo Mật Thông Tin</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>Cập nhật lần cuối: 2026</p>

      <section style={{ marginBottom: 32, lineHeight: 1.7, background: 'var(--surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>1. Mục đích thu thập thông tin cá nhân</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          KTSHOP thu thập thông tin khách hàng (Họ tên, email, số điện thoại, địa chỉ nhận hàng) chỉ nhằm phục vụ việc xử lý đơn hàng, giao nhận laptop, gửi mã xác minh email và cung cấp chế độ bảo hành sản phẩm.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>2. Phạm vi sử dụng thông tin</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Thông tin thu thập chỉ được sử dụng nội bộ trong hệ thống KTSHOP và đơn vị vận chuyển đối tác. Chúng tôi cam kết tuyệt đối không bán, chia sẻ hoặc tiết lộ thông tin khách hàng cho bên thứ ba vì bất kỳ mục đích thương mại nào.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>3. Cam kết bảo mật</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
          Mật khẩu tài khoản được mã hóa một chiều bằng thuật toán mã hóa hiện đại (Bcrypt). Mọi thông tin truyền tải giữa trình duyệt và máy chủ đều được bảo vệ nghiêm ngặt.
        </p>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>4. Quyền của khách hàng</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Khách hàng có quyền kiểm tra, cập nhật hoặc điều chỉnh thông tin cá nhân của mình bất kỳ lúc nào tại mục <Link href="/trang-ca-nhan" style={{ color: '#2563eb', fontWeight: 600 }}>Trang cá nhân</Link>.
        </p>
      </section>
    </div>
  );
}
