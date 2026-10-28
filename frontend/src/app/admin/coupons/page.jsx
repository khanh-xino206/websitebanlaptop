'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';

const formatPrice = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);

const formatDate = value => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(value).slice(0, 10);
  }
};

const toInputDate = value => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return String(value).slice(0, 10);
  }
};

const getDefaultDates = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const emptyForm = {
  id: null,
  ma_coupon: '',
  mo_ta: '',
  loai_giam: 'so_tien',
  gia_tri_giam: '',
  giam_toi_da: '',
  don_hang_toi_thieu: '0',
  so_luong: '100',
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  trang_thai: 1,
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0, inactive_or_expired: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [copiedCode, setCopiedCode] = useState(null);

  // Authentication check
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

  // Load coupon list from server
  const loadCoupons = useCallback(async () => {
    if (!actor) return;
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await apiFetch(`${API}/api/admin/coupons?${params.toString()}`, {}, actor);
      const data = await parseApiResponse(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải danh sách mã giảm giá.');
      }

      setCoupons(data.data || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [actor, apiFetch, query, statusFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Filter list by type locally if needed
  const filteredCoupons = useMemo(() => {
    if (typeFilter === 'all') return coupons;
    return coupons.filter(c => c.loai_giam === typeFilter);
  }, [coupons, typeFilter]);

  const openCreate = () => {
    const dates = getDefaultDates();
    setForm({
      ...emptyForm,
      ngay_bat_dau: dates.start,
      ngay_ket_thuc: dates.end,
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  };

  const openEdit = coupon => {
    setForm({
      id: coupon.id,
      ma_coupon: coupon.ma_coupon,
      mo_ta: coupon.mo_ta || '',
      loai_giam: coupon.loai_giam || 'so_tien',
      gia_tri_giam: String(Number(coupon.gia_tri_giam)),
      giam_toi_da: coupon.giam_toi_da ? String(Number(coupon.giam_toi_da)) : '',
      don_hang_toi_thieu: String(Number(coupon.don_hang_toi_thieu || 0)),
      so_luong: String(coupon.so_luong || 100),
      ngay_bat_dau: toInputDate(coupon.ngay_bat_dau),
      ngay_ket_thuc: toInputDate(coupon.ngay_ket_thuc),
      trang_thai: Number(coupon.trang_thai),
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  };

  const handleCopyCode = code => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleToggleStatus = async coupon => {
    setTogglingId(coupon.id);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/coupons/${coupon.id}/toggle-status`, {
        method: 'PUT',
      }, actor);
      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể đổi trạng thái mã giảm giá.');
      }
      setCoupons(prev =>
        prev.map(item =>
          item.id === coupon.id ? { ...item, trang_thai: data.data.trang_thai } : item
        )
      );
      setNotice(data.message);
      // Refresh stats
      loadCoupons();
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async coupon => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${coupon.ma_coupon}"?`)) {
      return;
    }
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
      }, actor);
      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể xóa mã giảm giá.');
      }
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      setNotice(`Đã xóa mã giảm giá "${coupon.ma_coupon}".`);
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const isEditing = Boolean(form.id);
      const payload = {
        ma_coupon: form.ma_coupon.trim().toUpperCase(),
        mo_ta: form.mo_ta.trim(),
        loai_giam: form.loai_giam,
        gia_tri_giam: Number(form.gia_tri_giam),
        giam_toi_da: form.loai_giam === 'phan_tram' && form.giam_toi_da ? Number(form.giam_toi_da) : null,
        don_hang_toi_thieu: Number(form.don_hang_toi_thieu || 0),
        so_luong: Number(form.so_luong || 100),
        ngay_bat_dau: form.ngay_bat_dau,
        ngay_ket_thuc: form.ngay_ket_thuc,
        trang_thai: Number(form.trang_thai),
      };

      if (!payload.ma_coupon) throw new Error('Vui lòng nhập mã coupon.');
      if (isNaN(payload.gia_tri_giam) || payload.gia_tri_giam <= 0) {
        throw new Error('Giá trị giảm phải là số lớn hơn 0.');
      }
      if (payload.loai_giam === 'phan_tram' && payload.gia_tri_giam > 100) {
        throw new Error('Giảm giá phần trăm không được vượt quá 100%.');
      }
      if (!payload.ngay_bat_dau || !payload.ngay_ket_thuc) {
        throw new Error('Vui lòng chọn ngày bắt đầu và kết thúc.');
      }
      if (new Date(payload.ngay_ket_thuc) < new Date(payload.ngay_bat_dau)) {
        throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      }

      const res = await apiFetch(
        isEditing ? `${API}/api/admin/coupons/${form.id}` : `${API}/api/admin/coupons`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        actor
      );

      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể lưu mã giảm giá.');
      }

      setModalOpen(false);
      setNotice(isEditing ? 'Đã cập nhật mã giảm giá!' : 'Đã tạo mã giảm giá mới thành công!');
      loadCoupons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isExpired = coupon => {
    if (!coupon.ngay_ket_thuc) return false;
    const end = new Date(coupon.ngay_ket_thuc);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  };

  const isExhausted = coupon => Number(coupon.da_su_dung) >= Number(coupon.so_luong);

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="coupons" />
      <main className="account-main">
        {/* Header */}
        <header className="account-topbar">
          <div>
            <span className="account-eyebrow">KHUYẾN MÃI / MÃ GIẢM GIÁ</span>
            <h1>Quản lý mã giảm giá</h1>
          </div>
          <button className="account-primary-button" type="button" onClick={openCreate}>
            + Thêm mã giảm giá
          </button>
        </header>

        {/* 4 Stats Cards */}
        <section className="account-intro" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <strong>{stats.total}</strong>
            <span>Tổng số mã voucher</span>
          </div>
          <div>
            <strong style={{ color: '#16a34a' }}>{stats.active}</strong>
            <span>Đang phát hành & còn hạn</span>
          </div>
          <div>
            <strong style={{ color: '#2563eb' }}>{stats.used}</strong>
            <span>Lượt đã sử dụng</span>
          </div>
          <div>
            <strong style={{ color: '#d97706' }}>{stats.inactive_or_expired}</strong>
            <span>Tạm khóa / Hết hạn</span>
          </div>
        </section>

        {notice && <p className="account-notice" role="status">{notice}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}

        {/* Filters & Table */}
        <section className="account-table-section" aria-label="Danh sách mã giảm giá">
          <div className="account-table-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h2>Danh sách mã giảm giá</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label className="account-search">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tìm theo mã hoặc mô tả..."
                  aria-label="Tìm mã giảm giá"
                />
              </label>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                style={{
                  height: '38px',
                  borderRadius: '6px',
                  border: '1px solid var(--admin-border)',
                  padding: '0 10px',
                  background: 'var(--surface, #fff)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="disabled">Tạm ẩn / Khóa</option>
                <option value="expired">Hết hạn / Hết lượt</option>
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                aria-label="Lọc theo loại giảm"
                style={{
                  height: '38px',
                  borderRadius: '6px',
                  border: '1px solid var(--admin-border)',
                  padding: '0 10px',
                  background: 'var(--surface, #fff)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="all">Tất cả loại giảm</option>
                <option value="so_tien">Giảm số tiền (VNĐ)</option>
                <option value="phan_tram">Giảm phần trăm (%)</option>
              </select>
            </div>
          </div>

          <div className="account-table-scroll">
            <table className="account-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>MÃ VOUCHER</th>
                  <th>MỨC GIẢM</th>
                  <th>ĐƠN TỐI THIỂU</th>
                  <th style={{ minWidth: '140px' }}>LƯỢT DÙNG</th>
                  <th>HIỆU LỰC</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="account-empty" colSpan="7">
                      Đang tải danh sách mã giảm giá...
                    </td>
                  </tr>
                )}

                {!loading && filteredCoupons.length === 0 && (
                  <tr>
                    <td className="account-empty" colSpan="7">
                      Không tìm thấy mã giảm giá phù hợp.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredCoupons.map(coupon => {
                    const expired = isExpired(coupon);
                    const exhausted = isExhausted(coupon);
                    const isActive = Number(coupon.trang_thai) === 1 && !expired && !exhausted;
                    const percent = Math.min(
                      100,
                      Math.round(((coupon.da_su_dung || 0) / (coupon.so_luong || 1)) * 100)
                    );

                    return (
                      <tr key={coupon.id}>
                        {/* Mã voucher */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: '800',
                                  fontSize: '0.92rem',
                                  letterSpacing: '0.5px',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(37, 99, 235, 0.1)',
                                  color: '#2563eb',
                                  border: '1px solid rgba(37, 99, 235, 0.25)',
                                }}
                              >
                                {coupon.ma_coupon}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.ma_coupon)}
                                title="Sao chép mã"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  color: copiedCode === coupon.ma_coupon ? '#16a34a' : 'var(--admin-muted)',
                                  fontWeight: '600',
                                }}
                              >
                                {copiedCode === coupon.ma_coupon ? 'Đã chép' : 'Chép'}
                              </button>
                            </div>
                            <small
                              style={{
                                color: 'var(--admin-muted)',
                                fontSize: '0.74rem',
                                lineHeight: '1.3',
                                maxWidth: '240px',
                              }}
                            >
                              {coupon.mo_ta || 'Không có mô tả'}
                            </small>
                          </div>
                        </td>

                        {/* Mức giảm */}
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#1d634b' }}>
                            {coupon.loai_giam === 'phan_tram' ? (
                              <span>
                                Giảm {Number(coupon.gia_tri_giam)}%
                                {coupon.giam_toi_da && (
                                  <small style={{ display: 'block', color: 'var(--admin-muted)', fontWeight: '400', fontSize: '0.72rem' }}>
                                    Tối đa {formatPrice(coupon.giam_toi_da)}
                                  </small>
                                )}
                              </span>
                            ) : (
                              <span>Giảm {formatPrice(coupon.gia_tri_giam)}</span>
                            )}
                          </div>
                        </td>

                        {/* Đơn tối thiểu */}
                        <td>
                          <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>
                            {Number(coupon.don_hang_toi_thieu) > 0 ? (
                              formatPrice(coupon.don_hang_toi_thieu)
                            ) : (
                              <span style={{ color: 'var(--admin-muted)' }}>0 đ</span>
                            )}
                          </span>
                        </td>

                        {/* Lượt dùng */}
                        <td>
                          <div style={{ minWidth: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                              <span>{coupon.da_su_dung || 0} đã dùng</span>
                              <span style={{ color: 'var(--admin-muted)' }}>/ {coupon.so_luong}</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--border, #e2e8f0)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  background: percent >= 100 ? '#ef4444' : percent >= 80 ? '#f59e0b' : '#3b82f6',
                                  transition: 'width 0.3s',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Hiệu lực */}
                        <td>
                          <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                            <div>{formatDate(coupon.ngay_bat_dau)} - {formatDate(coupon.ngay_ket_thuc)}</div>
                            {expired ? (
                              <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.7rem' }}>Đã hết hạn</span>
                            ) : (
                              <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.7rem' }}>Còn hiệu lực</span>
                            )}
                          </div>
                        </td>

                        {/* Trạng thái & Toggle */}
                        <td>
                          <button
                            type="button"
                            disabled={togglingId === coupon.id}
                            onClick={() => handleToggleStatus(coupon)}
                            style={{
                              border: 'none',
                              borderRadius: '20px',
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: Number(coupon.trang_thai) === 1 ? '#dcfce7' : '#fee2e2',
                              color: Number(coupon.trang_thai) === 1 ? '#15803d' : '#b91c1c',
                              transition: 'all 0.2s',
                            }}
                            title="Bấm để bật / tắt trạng thái"
                          >
                            {togglingId === coupon.id
                              ? 'Đang đổi...'
                              : Number(coupon.trang_thai) === 1
                              ? 'Hoạt động'
                              : 'Tạm ẩn'}
                          </button>
                        </td>

                        {/* Thao tác */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="account-edit-button"
                              onClick={() => openEdit(coupon)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-order-delete"
                              onClick={() => handleDelete(coupon)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal Thêm / Chỉnh sửa Coupon */}
        {modalOpen && (
          <div className="account-modal-backdrop" onClick={() => !saving && setModalOpen(false)}>
            <div
              className="account-modal admin-order-modal"
              style={{ maxWidth: '640px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="account-modal-header">
                <h2>{form.id ? `Sửa mã giảm giá: ${form.ma_coupon}` : 'Tạo mã giảm giá mới'}</h2>
                <button
                  type="button"
                  className="account-modal-close"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="account-form">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                  {/* Mã coupon */}
                  <div className="account-field">
                    <label>Mã voucher (In hoa, không dấu) *</label>
                    <input
                      type="text"
                      required
                      value={form.ma_coupon}
                      onChange={e =>
                        setForm({ ...form, ma_coupon: e.target.value.toUpperCase().replace(/\s+/g, '') })
                      }
                      placeholder="VD: KTSHOP100, SINHVIEN..."
                    />
                  </div>

                  {/* Loại giảm giá */}
                  <div className="account-field">
                    <label>Loại giảm giá *</label>
                    <select
                      value={form.loai_giam}
                      onChange={e => setForm({ ...form, loai_giam: e.target.value })}
                    >
                      <option value="so_tien">Giảm số tiền cố định (VNĐ)</option>
                      <option value="phan_tram">Giảm theo phần trăm (%)</option>
                    </select>
                  </div>
                </div>

                {/* Mô tả */}
                <div className="account-field" style={{ marginBottom: '14px' }}>
                  <label>Mô tả hiển thị cho khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={form.mo_ta}
                    onChange={e => setForm({ ...form, mo_ta: e.target.value })}
                    placeholder="VD: Giảm 10% tối đa 500k cho khách mua laptop Gaming"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: form.loai_giam === 'phan_tram' ? 'repeat(2, 1fr)' : '1fr', gap: '14px', marginBottom: '14px' }}>
                  {/* Giá trị giảm */}
                  <div className="account-field">
                    <label>
                      {form.loai_giam === 'phan_tram' ? 'Mức giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={form.loai_giam === 'phan_tram' ? 100 : undefined}
                      value={form.gia_tri_giam}
                      onChange={e => setForm({ ...form, gia_tri_giam: e.target.value })}
                      placeholder={form.loai_giam === 'phan_tram' ? 'VD: 10' : 'VD: 200000'}
                    />
                  </div>

                  {/* Giảm tối đa (nếu là phần trăm) */}
                  {form.loai_giam === 'phan_tram' && (
                    <div className="account-field">
                      <label>Số tiền giảm tối đa (VNĐ)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.giam_toi_da}
                        onChange={e => setForm({ ...form, giam_toi_da: e.target.value })}
                        placeholder="VD: 500000 (Để trống nếu không giới hạn)"
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                  {/* Đơn hàng tối thiểu */}
                  <div className="account-field">
                    <label>Đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.don_hang_toi_thieu}
                      onChange={e => setForm({ ...form, don_hang_toi_thieu: e.target.value })}
                      placeholder="VD: 5000000 (0 nếu không yêu cầu)"
                    />
                  </div>

                  {/* Số lượng phát hành */}
                  <div className="account-field">
                    <label>Số lượt phát hành tối đa *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.so_luong}
                      onChange={e => setForm({ ...form, so_luong: e.target.value })}
                      placeholder="VD: 100"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                  {/* Ngày bắt đầu */}
                  <div className="account-field">
                    <label>Ngày bắt đầu hiệu lực *</label>
                    <input
                      type="date"
                      required
                      value={form.ngay_bat_dau}
                      onChange={e => setForm({ ...form, ngay_bat_dau: e.target.value })}
                    />
                  </div>

                  {/* Ngày kết thúc */}
                  <div className="account-field">
                    <label>Ngày kết thúc hiệu lực *</label>
                    <input
                      type="date"
                      required
                      value={form.ngay_ket_thuc}
                      onChange={e => setForm({ ...form, ngay_ket_thuc: e.target.value })}
                    />
                  </div>
                </div>

                {/* Kích hoạt */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 20px' }}>
                  <input
                    type="checkbox"
                    id="coupon_active_check"
                    checked={Number(form.trang_thai) === 1}
                    onChange={e => setForm({ ...form, trang_thai: e.target.checked ? 1 : 0 })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="coupon_active_check" style={{ cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600' }}>
                    Kích hoạt sử dụng ngay
                  </label>
                </div>

                <div className="account-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="account-secondary-button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="account-primary-button"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : form.id ? 'Cập nhật mã' : 'Tạo mã voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
