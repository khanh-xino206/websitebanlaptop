'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';
const STATUSES = [
  { value: 'cho_xac_nhan', label: 'Chờ xác nhận' },
  { value: 'da_xac_nhan', label: 'Đã xác nhận' },
  { value: 'dang_giao', label: 'Đang giao' },
  { value: 'da_giao', label: 'Đã giao' },
  { value: 'da_huy', label: 'Đã hủy' },
  { value: 'tra_hang', label: 'Trả hàng' },
];
const STATUS_LABELS = Object.fromEntries(STATUSES.map(status => [status.value, status.label]));
const PAYMENT_STATUSES = [
  { value: 'chua_thanh_toan', label: 'Chưa thanh toán' },
  { value: 'da_thanh_toan', label: 'Đã thanh toán' },
  { value: 'hoan_tien', label: 'Đã hoàn tiền' },
];
const PAYMENT_STATUS_LABELS = Object.fromEntries(PAYMENT_STATUSES.map(item => [item.value, item.label]));
const PAYMENT_METHODS = [
  { value: 'tien_mat', label: 'Tiền mặt' },
  { value: 'chuyen_khoan', label: 'Chuyển khoản' },
  { value: 'momo', label: 'MoMo' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'zalopay', label: 'ZaloPay' },
];
const formatPrice = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);
const formatDate = value => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const emptyOrder = {
  id: null,
  user_id: '',
  ho_ten_nguoi_nhan: '',
  so_dien_thoai: '',
  dia_chi_giao: '',
  phi_van_chuyen: 30000,
  phuong_thuc_tt: 'tien_mat',
  trang_thai_tt: 'chua_thanh_toan',
  trang_thai_dh: 'cho_xac_nhan',
  ghi_chu: '',
  items: [{ laptop_id: '', so_luong: 1 }],
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [options, setOptions] = useState({ customers: [], products: [] });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [draftStatuses, setDraftStatuses] = useState({});
  const [draftPaymentStatuses, setDraftPaymentStatuses] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savingPaymentId, setSavingPaymentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (!stored) {
        router.replace('/dang-nhap');
        return;
      }
      queueMicrotask(() => setActor(stored));
    } catch {
      router.replace('/dang-nhap');
    }
  }, [router]);

  useEffect(() => {
    if (!actor) return;
    let current = true;
    Promise.all([
      apiFetch(`${API}/api/admin/don-hang?limit=200`, {}, actor).then(async response => ({ response, data: await parseApiResponse(response) })),
      apiFetch(`${API}/api/admin/don-hang/options`, {}, actor).then(async response => ({ response, data: await parseApiResponse(response) })),
    ])
      .then(([ordersResult, optionsResult]) => {
        if (!current) return;
        if (!ordersResult.response.ok || !ordersResult.data.success) throw new Error(ordersResult.data.message || 'Không thể tải đơn hàng.');
        if (!optionsResult.response.ok || !optionsResult.data.success) throw new Error(optionsResult.data.message || 'Không thể tải tùy chọn đơn hàng.');
        setOrders(ordersResult.data.data || []);
        setOptions(optionsResult.data.data || { customers: [], products: [] });
      })
      .catch(err => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [actor, apiFetch]);

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesQuery = `${order.ma_don_hang} ${order.ho_ten_nguoi_nhan} ${order.so_dien_thoai}`
      .toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
    const matchesStatus = !statusFilter || order.trang_thai_dh === statusFilter;
    const matchesPaymentStatus = !paymentStatusFilter || order.trang_thai_tt === paymentStatusFilter;
    return matchesQuery && matchesStatus && matchesPaymentStatus;
  }), [orders, query, statusFilter, paymentStatusFilter]);

  const updateStatus = async order => {
    const nextStatus = draftStatuses[order.id] || order.trang_thai_dh;
    if (nextStatus === order.trang_thai_dh) return;
    setSavingId(order.id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`${API}/api/admin/don-hang/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trang_thai_dh: nextStatus }),
      }, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật đơn hàng.');
      setOrders(current => current.map(item => item.id === order.id ? { ...item, trang_thai_dh: nextStatus } : item));
      setNotice(`Đã cập nhật đơn ${order.ma_don_hang}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const updatePaymentStatus = async order => {
    const nextPaymentStatus = draftPaymentStatuses[order.id] || order.trang_thai_tt;
    if (nextPaymentStatus === order.trang_thai_tt) return;
    setSavingPaymentId(order.id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`${API}/api/admin/don-hang/${order.id}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trang_thai_tt: nextPaymentStatus }),
      }, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật trạng thái thanh toán.');
      setOrders(current => current.map(item => item.id === order.id ? { ...item, trang_thai_tt: nextPaymentStatus } : item));
      setNotice(`Đã cập nhật thanh toán đơn ${order.ma_don_hang} thành "${PAYMENT_STATUS_LABELS[nextPaymentStatus] || nextPaymentStatus}".`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPaymentId(null);
    }
  };

  const openCreate = () => {
    const customer = options.customers[0];
    setOrderForm({
      ...emptyOrder,
      user_id: customer ? String(customer.id) : '',
      ho_ten_nguoi_nhan: customer?.ho_ten || '',
      so_dien_thoai: customer?.so_dien_thoai || '',
      dia_chi_giao: customer?.dia_chi || '',
      items: [{ laptop_id: options.products[0] ? String(options.products[0].id) : '', so_luong: 1 }],
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  };

  const openDetail = async order => {
    setDetailLoading(true);
    setDetailOrder(null);
    setError('');
    try {
      const response = await apiFetch(`${API}/api/admin/don-hang/${order.id}`, {}, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải chi tiết đơn hàng.');
      setDetailOrder(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveOrder = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(
        `${API}/api/admin/don-hang`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderForm,
            user_id: Number(orderForm.user_id),
            phi_van_chuyen: Number(orderForm.phi_van_chuyen),
            items: orderForm.items.map(item => ({ laptop_id: Number(item.laptop_id), so_luong: Number(item.so_luong) })),
          }),
        },
        actor
      );
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tạo đơn hàng.');
      setModalOpen(false);
      setNotice(`Đã tạo đơn ${data.data.ma_don_hang}.`);
      const listResponse = await apiFetch(`${API}/api/admin/don-hang?limit=200`, {}, actor);
      const listData = await parseApiResponse(listResponse);
      if (listResponse.ok && listData.success) setOrders(listData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async order => {
    if (!window.confirm(`Xóa đơn ${order.ma_don_hang}? Đơn đã thanh toán không thể xóa.`)) return;
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`${API}/api/admin/don-hang/${order.id}`, { method: 'DELETE' }, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể xóa đơn hàng.');
      setOrders(current => current.filter(item => item.id !== order.id));
      setNotice(`Đã xóa đơn ${order.ma_don_hang}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderItem = (index, changes) => setOrderForm(current => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
  }));

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="orders" />
      <main className="account-main">
        <header className="account-topbar">
          <div><span className="account-eyebrow">VẬN HÀNH / ĐƠN HÀNG</span><h1>Quản lý đơn hàng</h1></div>
          <button className="account-primary-button" type="button" onClick={openCreate}>+ Tạo đơn hàng</button>
        </header>
        <section className="account-intro">
          <div><strong>{orders.length}</strong><span>Đơn hàng gần đây</span></div>
          <p>Theo dõi thông tin giao nhận và cập nhật trạng thái xử lý.</p>
        </section>
        {notice && <p className="account-notice" role="status">{notice}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <section className="account-table-section" aria-label="Danh sách đơn hàng">
          <div className="account-table-toolbar">
            <h2>Đơn hàng</h2>
            <div className="admin-orders-filters">
              <label className="account-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Mã đơn, khách hàng, số điện thoại" aria-label="Tìm đơn hàng" /></label>
              <select value={paymentStatusFilter} onChange={event => setPaymentStatusFilter(event.target.value)} aria-label="Lọc theo trạng thái thanh toán">
                <option value="">Tất cả thanh toán</option>
                {PAYMENT_STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Lọc theo trạng thái">
                <option value="">Tất cả trạng thái</option>
                {STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
          </div>
          <div className="account-table-scroll">
            <table className="account-table admin-orders-table">
              <thead><tr><th>ĐƠN HÀNG</th><th>NGƯỜI NHẬN</th><th>TỔNG TIỀN</th><th>THANH TOÁN</th><th>CẬP NHẬT TT</th><th>TRẠNG THÁI</th><th>CẬP NHẬT ĐƠN</th><th>THAO TÁC</th></tr></thead>
              <tbody>
                {loading && <tr><td className="account-empty" colSpan="8">Đang tải đơn hàng...</td></tr>}
                {!loading && filteredOrders.map(order => {
                  const selectedStatus = draftStatuses[order.id] || order.trang_thai_dh;
                  const selectedPaymentStatus = draftPaymentStatuses[order.id] || order.trang_thai_tt;
                  return <tr key={order.id}>
                    <td><strong className="admin-order-code">{order.ma_don_hang}</strong><small className="admin-order-date">{formatDate(order.created_at)}</small><small className="admin-order-items">{order.so_mat_hang} mặt hàng</small></td>
                    <td><strong>{order.ho_ten_nguoi_nhan}</strong><small className="admin-order-date">{order.so_dien_thoai}</small></td>
                    <td className="admin-order-total">{formatPrice(order.thanh_tien)}</td>
                    <td><span className={`admin-payment-state ${order.trang_thai_tt === 'da_thanh_toan' ? 'paid' : order.trang_thai_tt === 'hoan_tien' ? 'refunded' : ''}`}>{PAYMENT_STATUS_LABELS[order.trang_thai_tt] || order.trang_thai_tt}</span></td>
                    <td><div className="admin-order-update"><select value={selectedPaymentStatus} onChange={event => setDraftPaymentStatuses(current => ({ ...current, [order.id]: event.target.value }))} aria-label={`Trạng thái thanh toán mới cho ${order.ma_don_hang}`}>
                      {PAYMENT_STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select><button className="account-edit-button" type="button" disabled={savingPaymentId === order.id || selectedPaymentStatus === order.trang_thai_tt} onClick={() => updatePaymentStatus(order)}>{savingPaymentId === order.id ? 'Đang lưu' : 'Lưu'}</button></div></td>
                    <td><span className={`admin-order-status status-${order.trang_thai_dh}`}>{STATUS_LABELS[order.trang_thai_dh] || order.trang_thai_dh}</span></td>
                    <td><div className="admin-order-update"><select value={selectedStatus} onChange={event => setDraftStatuses(current => ({ ...current, [order.id]: event.target.value }))} aria-label={`Trạng thái mới cho ${order.ma_don_hang}`}>
                      {STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select><button className="account-edit-button" type="button" disabled={savingId === order.id || selectedStatus === order.trang_thai_dh} onClick={() => updateStatus(order)}>{savingId === order.id ? 'Đang lưu' : 'Lưu'}</button></div></td>
                    <td>
                      <div className="admin-order-actions">
                        <button className="account-edit-button" type="button" onClick={() => openDetail(order)}>
                          Chi tiết
                        </button>
                        <button className="admin-order-delete" type="button" onClick={() => deleteOrder(order)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>;
                })}
                {!loading && filteredOrders.length === 0 && <tr><td className="account-empty" colSpan="8">Không có đơn hàng phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── MODAL TẠO ĐƠN HÀNG MỚI ── */}
      {modalOpen && <div className="account-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
        <section className="account-modal admin-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
          <header className="account-modal-header">
            <div>
              <span className="account-eyebrow">VẬN HÀNH / ĐƠN HÀNG</span>
              <h2 id="order-modal-title">Tạo đơn hàng mới</h2>
            </div>
            <button type="button" className="account-close" onClick={() => setModalOpen(false)} aria-label="Đóng">×</button>
          </header>
          <form onSubmit={saveOrder}>
            <div className="account-form-grid">
              <label className="account-field account-field-wide"><span>Khách hàng</span><select required value={orderForm.user_id} onChange={event => {
                const customer = options.customers.find(item => String(item.id) === event.target.value);
                setOrderForm(current => ({ ...current, user_id: event.target.value, ho_ten_nguoi_nhan: customer?.ho_ten || '', so_dien_thoai: customer?.so_dien_thoai || '', dia_chi_giao: customer?.dia_chi || '' }));
              }}><option value="">Chọn khách hàng</option>{options.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.ho_ten} · {customer.email}</option>)}</select></label>
              <label className="account-field"><span>Người nhận</span><input required value={orderForm.ho_ten_nguoi_nhan} onChange={event => setOrderForm({ ...orderForm, ho_ten_nguoi_nhan: event.target.value })} /></label>
              <label className="account-field"><span>Số điện thoại</span><input required value={orderForm.so_dien_thoai} onChange={event => setOrderForm({ ...orderForm, so_dien_thoai: event.target.value })} /></label>
              <label className="account-field account-field-wide"><span>Địa chỉ giao hàng</span><textarea required rows="2" value={orderForm.dia_chi_giao} onChange={event => setOrderForm({ ...orderForm, dia_chi_giao: event.target.value })} /></label>
            </div>
            <div className="admin-order-form-section"><div className="admin-order-form-heading"><h3>Sản phẩm trong đơn</h3><button className="account-edit-button" type="button" onClick={() => setOrderForm(current => ({ ...current, items: [...current.items, { laptop_id: options.products[0] ? String(options.products[0].id) : '', so_luong: 1 }] }))}>Thêm dòng</button></div>
              {orderForm.items.map((item, index) => <div className="admin-order-item-editor" key={`${index}-${item.laptop_id}`}>
                <label className="account-field"><span>Sản phẩm</span><select required value={item.laptop_id} onChange={event => updateOrderItem(index, { laptop_id: event.target.value })}><option value="">Chọn sản phẩm</option>{options.products.map(product => <option key={product.id} value={product.id}>{product.ten_laptop} · {formatPrice(product.gia_ban)}</option>)}</select></label>
                <label className="account-field"><span>Số lượng</span><input type="number" min="1" max="1000" required value={item.so_luong} onChange={event => updateOrderItem(index, { so_luong: event.target.value })} /></label>
                <button className="admin-order-delete" type="button" disabled={orderForm.items.length < 2} onClick={() => setOrderForm(current => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Xóa sản phẩm khỏi đơn">Xóa dòng</button>
              </div>)}
            </div>
            <div className="account-form-grid admin-order-form-bottom">
              <label className="account-field"><span>Phí vận chuyển</span><input type="number" min="0" step="1000" required value={orderForm.phi_van_chuyen} onChange={event => setOrderForm({ ...orderForm, phi_van_chuyen: event.target.value })} /></label>
              <label className="account-field"><span>Phương thức thanh toán</span><select value={orderForm.phuong_thuc_tt} onChange={event => setOrderForm({ ...orderForm, phuong_thuc_tt: event.target.value })}>{PAYMENT_METHODS.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
              <label className="account-field"><span>Trạng thái thanh toán</span><select value={orderForm.trang_thai_tt} onChange={event => setOrderForm({ ...orderForm, trang_thai_tt: event.target.value })}><option value="chua_thanh_toan">Chưa thanh toán</option><option value="da_thanh_toan">Đã thanh toán</option><option value="hoan_tien">Đã hoàn tiền</option></select></label>
              <label className="account-field"><span>Trạng thái đơn</span><select value={orderForm.trang_thai_dh} onChange={event => setOrderForm({ ...orderForm, trang_thai_dh: event.target.value })}>{STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="account-field account-field-wide"><span>Ghi chú</span><textarea rows="2" value={orderForm.ghi_chu} onChange={event => setOrderForm({ ...orderForm, ghi_chu: event.target.value })} /></label>
            </div>
            {error && <p className="account-error" role="alert">{error}</p>}
            <footer className="account-modal-actions">
              <button className="account-secondary-button" type="button" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="account-primary-button" type="submit" disabled={saving || !options.customers.length || !options.products.length}>
                {saving ? 'Đang tạo...' : 'Tạo đơn hàng'}
              </button>
            </footer>
          </form>
        </section>
      </div>}

      {/* ── MODAL XEM CHI TIẾT ĐƠN HÀNG (READ-ONLY) ── */}
      {(detailOrder || detailLoading) && (
        <div className="account-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setDetailOrder(null); setDetailLoading(false); } }}>
          <section className="account-modal admin-order-modal" style={{ maxWidth: '680px' }} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            <header className="account-modal-header">
              <div>
                <span className="account-eyebrow">VẬN HÀNH / CHI TIẾT ĐƠN HÀNG</span>
                <h2 id="order-detail-title">
                  {detailLoading ? 'Đang tải thông tin...' : `Đơn hàng #${detailOrder.ma_don_hang}`}
                </h2>
              </div>
              <button type="button" className="account-close" onClick={() => { setDetailOrder(null); setDetailLoading(false); }} aria-label="Đóng">×</button>
            </header>

            {detailLoading ? (
              <p className="account-empty" style={{ padding: '40px' }}>Đang tải chi tiết đơn hàng...</p>
            ) : detailOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Thông tin giao nhận */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: 'var(--input-bg, #f8fafc)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border, #e2e8f0)',
                  fontSize: '0.88rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontSize: '0.78rem' }}>Người nhận:</span>
                    <strong>{detailOrder.ho_ten_nguoi_nhan}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontSize: '0.78rem' }}>Số điện thoại:</span>
                    <strong>{detailOrder.so_dien_thoai}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontSize: '0.78rem' }}>Thời gian đặt:</span>
                    <span>{formatDate(detailOrder.created_at)}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-muted, #64748b)', display: 'block', fontSize: '0.78rem' }}>Địa chỉ giao hàng:</span>
                    <span>{detailOrder.dia_chi_giao}</span>
                  </div>
                </div>

                {/* Danh sách mặt hàng */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: 'var(--text, #111827)' }}>
                    Danh sách sản phẩm ({detailOrder.items?.length || 0})
                  </h4>
                  <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--input-bg, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)', textAlign: 'left', color: 'var(--text-muted, #64748b)' }}>
                          <th style={{ padding: '10px 12px' }}>Sản phẩm</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Số lượng</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrder.items?.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border, #f1f5f9)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <strong style={{ color: 'var(--text, #111827)' }}>{item.ten_laptop}</strong>
                              {item.serial_number && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                                  Serial: {item.serial_number}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {formatPrice(item.gia_ban)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>
                              {item.so_luong}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#10b981', whiteSpace: 'nowrap' }}>
                              {formatPrice(item.thanh_tien)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Chi tiết thanh toán & Trạng thái */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: 'var(--input-bg, #f8fafc)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border, #e2e8f0)',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Phương thức: </span>
                      <strong>{PAYMENT_METHODS.find(m => m.value === detailOrder.phuong_thuc_tt)?.label || detailOrder.phuong_thuc_tt}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Thanh toán: </span>
                      <span className={`admin-payment-state ${detailOrder.trang_thai_tt === 'da_thanh_toan' ? 'paid' : detailOrder.trang_thai_tt === 'hoan_tien' ? 'refunded' : ''}`}>
                        {PAYMENT_STATUS_LABELS[detailOrder.trang_thai_tt] || detailOrder.trang_thai_tt}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Trạng thái đơn: </span>
                      <span className={`admin-order-status status-${detailOrder.trang_thai_dh}`}>
                        {STATUS_LABELS[detailOrder.trang_thai_dh] || detailOrder.trang_thai_dh}
                      </span>
                    </div>
                    {detailOrder.ghi_chu && (
                      <div style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>
                        <strong>Ghi chú:</strong> {detailOrder.ghi_chu}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted, #64748b)' }}>
                      <span>Tiền hàng:</span>
                      <span>{formatPrice(detailOrder.tong_tien)}</span>
                    </div>
                    {Number(detailOrder.tien_giam) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(detailOrder.tien_giam)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted, #64748b)' }}>
                      <span>Phí vận chuyển:</span>
                      <span>+{formatPrice(detailOrder.phi_van_chuyen)}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border, #e2e8f0)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '800' }}>
                      <span>Tổng tiền:</span>
                      <span style={{ color: '#10b981' }}>{formatPrice(detailOrder.thanh_tien)}</span>
                    </div>
                  </div>
                </div>

                <footer className="account-modal-actions" style={{ marginTop: '4px' }}>
                  <button
                    className="account-primary-button"
                    type="button"
                    onClick={() => { setDetailOrder(null); setDetailLoading(false); }}
                  >
                    Đóng chi tiết
                  </button>
                </footer>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}