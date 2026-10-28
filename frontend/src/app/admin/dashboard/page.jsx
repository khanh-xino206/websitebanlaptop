'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '../_components/AdminSidebar';
import { parseApiResponse, useAppContext } from '../../context/AppContext';

const API = 'http://localhost:5000';
const formatPrice = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0);
const formatDate = value => new Date(value).toLocaleDateString('vi-VN');
const ORDER_STATUS = {
  cho_xac_nhan: ['Chờ xác nhận', 'status-pending'],
  da_xac_nhan: ['Đã xác nhận', 'status-processing'],
  dang_giao: ['Đang giao', 'status-processing'],
  da_giao: ['Đã giao', 'status-completed'],
  da_huy: ['Đã hủy', 'status-cancelled'],
  tra_hang: ['Trả hàng', 'status-cancelled'],
};

const monthChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 'Chưa có dữ liệu tháng trước' : 'Mới phát sinh trong tháng này';
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? 'Tăng' : percent < 0 ? 'Giảm' : 'Không đổi'} ${Math.abs(percent)}% so với tháng trước`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const role = parsed.vai_tro || parsed.role;
        if (['qtv', 'admin', 'nhan_su', 'nhan_vien_kho', 'nhan_vien'].includes(role)) {
          queueMicrotask(() => setUser({ ...parsed, vai_tro: role }));
        } else {
          router.push('/');
        }
      } catch (e) {
        router.push('/dang-nhap');
      }
    } else {
      router.push('/dang-nhap');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let current = true;
    apiFetch(`${API}/api/admin/tong-quan`, {}, user)
      .then(async response => ({ response, data: await parseApiResponse(response) }))
      .then(({ response, data }) => {
        if (!current) return;
        if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải tổng quan.');
        setOverview(data.data);
      })
      .catch(error => { if (current) setOverviewError(error.message); })
      .finally(() => { if (current) setOverviewLoading(false); });
    return () => { current = false; };
  }, [user, apiFetch]);

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang kiểm tra quyền truy cập...</div>;

  const role = user.vai_tro || user.role;
  const stats = overview?.stats;
  const canViewOrders = ['qtv', 'admin', 'nhan_vien_kho'].includes(role) || user.quyen?.includes('orders');

  return (
    <div className="dashboard-layout">
      <AdminSidebar actor={user} active="dashboard" />

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Tổng Quan Hệ Thống</h1>
          <div className="header-user">
            <div className="avatar">AD</div>
            <div className="info">
              <span className="name">{user.ho_ten}</span>
              <span className="role">{role === 'qtv' ? 'Quản trị viên cao nhất' : role === 'nhan_su' ? 'Nhân viên nhân sự' : role === 'nhan_vien_kho' ? 'Nhân viên kho' : role === 'nhan_vien' ? 'Nhân viên' : 'Quản trị viên'}</span>
            </div>
          </div>
        </header>

        {overviewError && <p className="dashboard-data-error" role="alert">{overviewError}</p>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Doanh thu tháng</h3>
              <p className="value">{overviewLoading ? 'Đang tải...' : formatPrice(stats?.revenueThisMonth)}</p>
              <span className={`trend ${stats?.revenueThisMonth >= stats?.revenuePreviousMonth ? 'positive' : 'negative'}`}>{overviewLoading ? ' ' : monthChange(stats?.revenueThisMonth || 0, stats?.revenuePreviousMonth || 0)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Đơn hàng mới</h3>
              <p className="value">{overviewLoading ? '...' : (stats?.ordersThisMonth || 0).toLocaleString('vi-VN')}</p>
              <span className={`trend ${(stats?.ordersThisMonth || 0) >= (stats?.ordersPreviousMonth || 0) ? 'positive' : 'negative'}`}>{overviewLoading ? ' ' : `${monthChange(stats?.ordersThisMonth || 0, stats?.ordersPreviousMonth || 0)} · không tính đơn đã hủy`}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Sản phẩm</h3>
              <p className="value">{overviewLoading ? '...' : (stats?.activeProducts || 0).toLocaleString('vi-VN')}</p>
              <span className={`trend ${stats?.lowStockProducts ? 'negative' : 'neutral'}`}>{overviewLoading ? ' ' : stats?.lowStockProducts ? `${stats.lowStockProducts} sản phẩm sắp hết (tồn ≤ 3)` : 'Tồn kho ổn định'}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Khách hàng</h3>
              <p className="value">{overviewLoading ? '...' : (stats?.activeCustomers || 0).toLocaleString('vi-VN')}</p>
              <span className="trend neutral">{overviewLoading ? ' ' : `${(stats?.customersThisMonth || 0).toLocaleString('vi-VN')} khách hàng mới trong tháng`}</span>
            </div>
          </div>
        </div>

        <div className="recent-orders">
          <div className="section-header">
            <h2>Đơn hàng gần đây</h2>
            {canViewOrders && <Link href="/admin/don-hang" className="view-all-btn">Xem tất cả</Link>}
          </div>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {overviewLoading && <tr><td colSpan="5" className="dashboard-empty">Đang tải đơn hàng...</td></tr>}
                {!overviewLoading && (overview?.recentOrders || []).map(order => {
                  const [statusLabel, statusClass] = ORDER_STATUS[order.trang_thai_dh] || ['Chưa rõ', 'status-pending'];
                  return <tr key={order.id}>
                    <td>{order.ma_don_hang}</td>
                    <td>{order.ho_ten_nguoi_nhan}</td>
                    <td>{order.product_names || `${order.item_count} mặt hàng`}</td>
                    <td>{formatPrice(order.thanh_tien)}</td>
                    <td><span className={`badge ${statusClass}`}>{statusLabel}</span></td>
                  </tr>;
                })}
                {!overviewLoading && !overviewError && overview?.recentOrders?.length === 0 && <tr><td colSpan="5" className="dashboard-empty">Chưa có đơn hàng trong hệ thống.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
