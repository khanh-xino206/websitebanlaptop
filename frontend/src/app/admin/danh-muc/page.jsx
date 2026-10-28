'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';

const DEMAND_LABELS = {
  gaming: { label: 'Gaming - Đồ họa nặng', desc: 'Cấu hình khủng, card đồ họa rời, tản nhiệt tối ưu' },
  do_hoa: { label: 'Thiết kế đồ họa - Kỹ thuật', desc: 'Màn hình chuẩn màu, CPU mạnh mẽ render 2D/3D' },
  mong_nhe: { label: 'Mỏng nhẹ - Doanh nhân', desc: 'Thiết kế sang trọng, pin trâu, trọng lượng nhẹ dưới 1.5kg' },
  sinh_vien: { label: 'Sinh viên - Giá tốt', desc: 'Giá thành hợp lý, đáp ứng trọn vẹn việc học và giải trí' },
  van_phong: { label: 'Văn phòng - Học tập', desc: 'Bền bỉ, bàn phím gõ êm, xử lý văn phòng mượt mà' }
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();

  const [actor, setActor] = useState(null);
  const [activeTab, setActiveTab] = useState('brands'); // 'brands' | 'demands' | 'news'
  const [data, setData] = useState({ brands: [], demands: [], newsCategories: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modal Thêm / Sửa Danh mục
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [targetCategory, setTargetCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Modal Xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Kiểm tra quyền
  const role = actor?.vai_tro || actor?.role;
  const isQtv = role === 'qtv';
  const permissions = actor?.quyen || [];
  const canManage = isQtv || ['admin', 'nhan_vien_kho'].includes(role) || permissions.includes('categories') || permissions.includes('products');

  useEffect(() => {
    let raw = null;
    if (typeof window !== 'undefined') {
      try {
        raw = JSON.parse(localStorage.getItem('user'));
      } catch {
        raw = null;
      }
    }
    if (!raw) {
      router.replace('/dang-nhap');
    } else {
      setActor(raw);
    }
  }, [router]);

  const loadCategories = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/api/admin/danh-muc`, {}, actor);
      const resData = await parseApiResponse(res);
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Không thể tải danh sách danh mục.');
      }
      setData(resData.data || { brands: [], demands: [], newsCategories: [], stats: {} });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [actor, apiFetch]);

  useEffect(() => {
    if (actor && canManage) {
      loadCategories();
    }
  }, [actor, canManage, loadCategories]);

  // Mở modal tạo mới
  const openCreateModal = () => {
    setModalMode('create');
    setTargetCategory(null);
    setFormName('');
    setFormDesc('');
    setFormStatus(1);
    setError('');
  };

  // Mở modal chỉnh sửa
  const openEditModal = (cat) => {
    setModalMode('edit');
    setTargetCategory(cat);
    setFormName(cat.ten_NH || '');
    setFormDesc(cat.mo_ta || '');
    setFormStatus(Number(cat.trang_thai) === 1 ? 1 : 0);
    setError('');
  };

  // Submit Lưu danh mục
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Vui lòng nhập tên danh mục / thương hiệu.');
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `${API}/api/admin/danh-muc/${targetCategory.id}` : `${API}/api/admin/danh-muc`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ten_NH: formName.trim(),
          logo: targetCategory?.logo || null,
          mo_ta: formDesc.trim() || null,
          trang_thai: formStatus
        })
      }, actor);
      const resData = await parseApiResponse(res);
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Lỗi khi lưu danh mục.');
      }

      setNotice(resData.message);
      setModalMode(null);
      loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle nhanh trạng thái
  const handleToggleStatus = async (cat) => {
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/danh-muc/${cat.id}/toggle-status`, {
        method: 'PUT'
      }, actor);
      const resData = await parseApiResponse(res);
      if (!res.ok || !resData.success) throw new Error(resData.message);
      setNotice(resData.message);
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  // Xóa danh mục
  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/danh-muc/${deleteTarget.id}`, {
        method: 'DELETE'
      }, actor);
      const resData = await parseApiResponse(res);
      if (!res.ok || !resData.success) throw new Error(resData.message);
      setNotice(resData.message);
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  if (!canManage) {
    return (
      <div className="account-admin">
        <AdminSidebar actor={actor} active="categories" />
        <main className="account-main">
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <h2>Không có quyền truy cập</h2>
            <p>Tài khoản của bạn không được cấp quyền <strong>Quản lý danh mục</strong>.</p>
          </div>
        </main>
      </div>
    );
  }

  const brands = data.brands || [];
  const filteredBrands = brands.filter(b => {
    const matchSearch = `${b.ten_NH} ${b.mo_ta || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? Number(b.trang_thai) === 1 : Number(b.trang_thai) === 0;
    return matchSearch && matchStatus;
  });

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="categories" />

      <main className="account-main">
        {/* Topbar */}
        <header className="account-topbar">
          <div>
            <span className="account-eyebrow">DANH MỤC & PHÂN LOẠI</span>
            <h1>Quản lý danh mục sản phẩm</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="account-primary-button"
              type="button"
              onClick={openCreateModal}
              style={{ background: 'var(--primary, #1d4ed8)', color: '#fff', fontWeight: '700' }}
            >
              + Thêm danh mục mới
            </button>
            <button 
              className="account-secondary-button" 
              type="button" 
              onClick={loadCategories} 
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </header>

        {/* Thông báo thông tin & lỗi */}
        {notice && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#065f46',
            fontWeight: '600'
          }}>
            {notice}
          </div>
        )}

        {error && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#fff3f1',
            border: '1px solid #f2c4bf',
            borderRadius: '8px',
            color: '#9b3428',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        {/* ── THỐNG KÊ TỔNG QUAN (METRICS CARDS) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          margin: '20px 0'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Tổng thương hiệu
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text, #111827)', marginTop: '4px' }}>
              {data.stats?.totalBrands || brands.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6b7280)', marginTop: '4px' }}>
              Hãng laptop kinh doanh
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Đang hoạt động
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {data.stats?.activeBrands || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px' }}>
              Hiển thị trên cửa hàng
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Tạm ẩn
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
              {data.stats?.inactiveBrands || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
              Tạm ngưng nhập hàng
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '18px 20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Tổng sản phẩm liên kết
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
              {data.stats?.totalProducts || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: '4px' }}>
              Sản phẩm có trong danh mục
            </div>
          </div>
        </div>

        {/* ── TABS NAVIGATION ── */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border, #e5e7eb)',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('brands')}
            style={{
              padding: '12px 20px',
              fontWeight: '700',
              fontSize: '0.95rem',
              color: activeTab === 'brands' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #6b7280)',
              borderBottom: activeTab === 'brands' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Thương hiệu / Hãng ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demands')}
            style={{
              padding: '12px 20px',
              fontWeight: '700',
              fontSize: '0.95rem',
              color: activeTab === 'demands' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #6b7280)',
              borderBottom: activeTab === 'demands' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Phân loại theo Nhu cầu ({data.demands?.length || 5})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            style={{
              padding: '12px 20px',
              fontWeight: '700',
              fontSize: '0.95rem',
              color: activeTab === 'news' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #6b7280)',
              borderBottom: activeTab === 'news' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Danh mục Tin tức ({data.newsCategories?.length || 0})
          </button>
        </div>

        {/* ── TAB 1: THƯƠNG HIỆU / HÃNG LAPTOP ── */}
        {activeTab === 'brands' && (
          <div>
            {/* Toolbar Tìm kiếm & Lọc */}
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid var(--border, #e5e7eb)',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên danh mục, thương hiệu, mô tả..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, #ffffff)',
                    color: 'var(--text, #111827)',
                    minWidth: '280px',
                    flex: 1,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', fontWeight: '600' }}>Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, #ffffff)',
                    color: 'var(--text, #111827)',
                    fontSize: '0.88rem',
                    fontWeight: '600'
                  }}
                >
                  <option value="all">Tất cả ({brands.length})</option>
                  <option value="active">✓ Đang hoạt động ({data.stats?.activeBrands || 0})</option>
                  <option value="inactive">✕ Tạm ẩn ({data.stats?.inactiveBrands || 0})</option>
                </select>
              </div>
            </div>

            {/* Bảng danh sách Thương hiệu */}
            <div style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--border, #e5e7eb)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
            }}>
              {filteredBrands.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted, #9ca3af)' }}>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Không tìm thấy danh mục / thương hiệu nào.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-deposit-table">
                    <thead>
                      <tr>
                        <th>Tên danh mục / Hãng</th>
                        <th>Mô tả chi tiết</th>
                        <th style={{ textAlign: 'center' }}>Sản phẩm</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ textAlign: 'center', width: '160px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands.map(cat => {
                        const isActive = Number(cat.trang_thai) === 1;
                        return (
                          <tr key={cat.id}>
                            <td>
                              <div className="admin-deposit-user" style={{ fontSize: '1rem' }}>
                                {cat.ten_NH}
                              </div>
                              <div className="admin-deposit-sub" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                ID: #{cat.id}
                              </div>
                            </td>

                            <td style={{ maxWidth: '360px' }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', lineHeight: '1.4' }}>
                                {cat.mo_ta || '—'}
                              </p>
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <Link
                                href={`/admin/san-pham`}
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.82rem',
                                  fontWeight: '700',
                                  background: 'rgba(37, 99, 235, 0.08)',
                                  color: '#2563eb',
                                  textDecoration: 'none'
                                }}
                                title="Xem danh sách sản phẩm thuộc hãng này"
                              >
                                {cat.so_san_pham || 0} máy
                              </Link>
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(cat)}
                                title="Bấm để bật / tắt trạng thái"
                                className={isActive ? 'admin-deposit-badge-success' : 'admin-deposit-badge-failed'}
                                style={{ cursor: 'pointer', border: 'none' }}
                              >
                                {isActive ? 'Đang bán' : 'Tạm ẩn'}
                              </button>
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(cat)}
                                  style={{
                                    background: 'var(--input-bg, #f3f4f6)',
                                    color: 'var(--text, #374151)',
                                    border: '1px solid var(--border, #d1d5db)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(cat)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
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
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: PHÂN LOẠI THEO NHU CẦU ── */}
        {activeTab === 'demands' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(DEMAND_LABELS).map(([key, item]) => {
              const demandStats = data.demands?.find(d => d.nhu_cau === key);
              const count = demandStats?.so_san_pham || 0;
              return (
                <div
                  key={key}
                  style={{
                    background: 'var(--surface, #ffffff)',
                    borderRadius: '14px',
                    padding: '24px',
                    border: '1px solid var(--border, #e5e7eb)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text, #111827)' }}>
                        {item.label}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981'
                      }}>
                        {count} sản phẩm
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', lineHeight: '1.5' }}>
                      {item.desc}
                    </p>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                    <Link
                      href={`/san-pham?nhu_cau=${key}`}
                      target="_blank"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '8px 14px',
                        background: 'var(--input-bg, #f8fafc)',
                        color: 'var(--primary, #2563eb)',
                        border: '1px solid var(--border, #e2e8f0)',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        textDecoration: 'none'
                      }}
                    >
                      Xem sản phẩm trên web ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 3: DANH MỤC TIN TỨC ── */}
        {activeTab === 'news' && (
          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border, #e5e7eb)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text, #111827)' }}>Danh mục bài viết tin tức & đánh giá</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)' }}>Phân nhóm bài viết xuất bản trên website</p>
              </div>
              <Link
                href="/admin/tin-tuc"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--primary, #2563eb)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                Quản lý bài viết ↗
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-deposit-table">
                <thead>
                  <tr>
                    <th>Tên danh mục tin tức</th>
                    <th style={{ textAlign: 'center' }}>Số bài viết đã xuất bản</th>
                    <th style={{ textAlign: 'center' }}>Đường dẫn xem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.newsCategories?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {item.danh_muc}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb'
                        }}>
                          {item.so_bai_viet} bài
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          href={`/tin-tuc?category=${encodeURIComponent(item.danh_muc)}`}
                          target="_blank"
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--primary, #2563eb)',
                            fontWeight: '600',
                            textDecoration: 'none'
                          }}
                        >
                          Xem chuyên mục ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL THÊM / SỬA DANH MỤC ── */}
      {modalMode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            color: 'var(--text, #111827)',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text, #111827)', fontWeight: '800' }}>
              {modalMode === 'create' ? 'Thêm danh mục / thương hiệu mới' : `Chỉnh sửa danh mục: ${targetCategory?.ten_NH}`}
            </h3>

            <form onSubmit={handleSubmitCategory}>
              {/* Tên thương hiệu */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text, #374151)', marginBottom: '6px' }}>
                  Tên danh mục / Thương hiệu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dell, ASUS, MSI, ThinkPad..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, #ffffff)',
                    color: 'var(--text, #111827)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Mô tả */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text, #374151)', marginBottom: '6px' }}>
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Thương hiệu laptop hàng đầu thế giới với dòng sản phẩm doanh nhân và gaming..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, #ffffff)',
                    color: 'var(--text, #111827)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Trạng thái */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text, #374151)', marginBottom: '6px' }}>
                  Trạng thái kinh doanh
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="cat_status"
                      checked={formStatus === 1}
                      onChange={() => setFormStatus(1)}
                    />
                    <span style={{ color: '#10b981', fontWeight: '600' }}>Đang hoạt động</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="cat_status"
                      checked={formStatus === 0}
                      onChange={() => setFormStatus(0)}
                    />
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>Tạm ẩn</span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, #f3f4f6)',
                    color: 'var(--text, #374151)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary, #2563eb)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {submitting ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo danh mục mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA DANH MỤC ── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            color: 'var(--text, #111827)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#ef4444', fontWeight: '800' }}>
              Xác nhận xóa danh mục
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #4b5563)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa danh mục / thương hiệu <strong style={{ color: 'var(--text, #111827)' }}>{deleteTarget.ten_NH}</strong>?
            </p>

            {Number(deleteTarget.so_san_pham) > 0 ? (
              <div style={{
                background: '#fff3f1',
                border: '1px solid #f2c4bf',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#9b3428',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                marginBottom: '20px'
              }}>
                <strong>Cảnh báo:</strong> Danh mục này đang liên kết với <strong>{deleteTarget.so_san_pham} sản phẩm</strong> trong kho hàng. Bạn không thể xóa hẳn để bảo toàn dữ liệu sản phẩm, hãy chọn <strong>Tạm ẩn</strong> thay thế.
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', marginBottom: '20px' }}>
                Hành động này sẽ xóa hoàn toàn danh mục khỏi hệ thống cơ sở dữ liệu.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #d1d5db)',
                  background: 'var(--input-bg, #f3f4f6)',
                  color: 'var(--text, #374151)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              {Number(deleteTarget.so_san_pham) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(deleteTarget);
                    setDeleteTarget(null);
                  }}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Tạm ẩn danh mục này
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: deleting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
