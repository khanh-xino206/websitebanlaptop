import Link from 'next/link';
import KTShopLogo from '../../components/KTShopLogo';

const ROLE_NAMES = {
  qtv: 'Quản trị viên cao nhất',
  admin: 'Quản trị viên',
  nhan_su: 'Nhân viên nhân sự',
  nhan_vien_kho: 'Nhân viên kho',
  nhan_vien: 'Nhân viên',
};

export default function AdminSidebar({ actor, active }) {
  const role = actor?.vai_tro || actor?.role;
  const isQtv = role === 'qtv';
  const permissions = actor?.quyen || [];
  const canManageProducts = isQtv || ['admin', 'nhan_vien_kho'].includes(role) || permissions.includes('products');
  const canManageCategories = isQtv || ['admin', 'nhan_vien_kho'].includes(role) || permissions.includes('categories') || permissions.includes('products');
  const canManageCoupons = isQtv || ['admin', 'nhan_vien_kho'].includes(role) || permissions.includes('coupons') || permissions.includes('products');
  const canManageOrders = isQtv || ['admin', 'nhan_vien_kho'].includes(role) || permissions.includes('orders');
  const canManageAccounts = isQtv || ['admin', 'nhan_su'].includes(role) || permissions.includes('accounts');
  const canManageNews = isQtv || ['admin', 'nhan_vien'].includes(role) || permissions.includes('news');
  const canManageDeposits = isQtv || ['admin'].includes(role) || permissions.includes('deposits');
  const items = [
    { key: 'dashboard', href: '/admin/dashboard', label: 'Tổng quan', visible: true },
    { key: 'products', href: '/admin/san-pham', label: 'Quản lý sản phẩm', visible: canManageProducts },
    { key: 'categories', href: '/admin/danh-muc', label: 'Quản lý danh mục', visible: canManageCategories },
    { key: 'coupons', href: '/admin/coupons', label: 'Quản lý mã giảm giá', visible: canManageCoupons },
    { key: 'orders', href: '/admin/don-hang', label: 'Quản lý đơn hàng', visible: canManageOrders },
    { key: 'deposits', href: '/admin/nap-tien', label: 'Quản lý nạp tiền', visible: canManageDeposits },
    { key: 'news', href: '/admin/tin-tuc', label: 'Quản lý tin tức', visible: canManageNews },
    { key: 'accounts', href: '/admin/tai-khoan', label: 'Quản lý tài khoản', visible: canManageAccounts },
  ];

  return (
    <aside className="account-sidebar">
      <Link className="account-brand" href="/admin/dashboard" style={{ padding: '0 4px 22px' }}>
        <KTShopLogo height={30} variant="admin" />
      </Link>
      <div className="account-sidebar-label">QUẢN TRỊ</div>
      <nav className="account-nav" aria-label="Điều hướng quản trị">
        {items.filter(item => item.visible).map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={active === item.key ? 'selected' : undefined}
            aria-current={active === item.key ? 'page' : undefined}
            title={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="account-sidebar-user">
        <div className="account-avatar">{actor?.ho_ten?.slice(0, 1) || 'A'}</div>
        <div><strong>{actor?.ho_ten}</strong><small>{ROLE_NAMES[role] || role || 'Quản trị'}</small></div>
      </div>
    </aside>
  );
}