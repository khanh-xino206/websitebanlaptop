'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';

const CATEGORIES = [
  'Công nghệ',
  'Đánh giá Laptop',
  'Tư vấn mua sắm',
  'Mẹo & Thủ thuật',
  'Khuyến mãi'
];

export default function AdminNewsPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    tieu_de: '',
    slug: '',
    danh_muc: 'Công nghệ',
    tac_gia_ten: 'KTSHOP News',
    hinh_anh: '/uploads/macbook-pro-16-m3.jpg',
    tom_tat: '',
    noi_dung: '',
    noi_bat: 0,
    trang_thai: 1,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Check auth
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

  // Load articles
  const loadArticles = () => {
    if (!actor) return;
    setLoading(true);
    apiFetch(`${API}/api/admin/tin-tuc?limit=200`, {}, actor)
      .then(async response => ({ response, data: await parseApiResponse(response) }))
      .then(({ response, data }) => {
        if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải tin tức.');
        setArticles(data.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (actor) loadArticles();
  }, [actor]);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      tieu_de: '',
      slug: '',
      danh_muc: 'Công nghệ',
      tac_gia_ten: actor?.ho_ten || 'KTSHOP News',
      hinh_anh: '/uploads/macbook-pro-16-m3.jpg',
      tom_tat: '',
      noi_dung: '',
      noi_bat: 0,
      trang_thai: 1,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setFormData({
      tieu_de: art.tieu_de || '',
      slug: art.slug || '',
      danh_muc: art.danh_muc || 'Công nghệ',
      tac_gia_ten: art.tac_gia_ten || '',
      hinh_anh: art.hinh_anh || '',
      tom_tat: art.tom_tat || '',
      noi_dung: art.noi_dung || '',
      noi_bat: art.noi_bat ? 1 : 0,
      trang_thai: art.trang_thai !== undefined ? art.trang_thai : 1,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Auto generate slug from title when typing title (if creating)
  const handleTitleChange = (val) => {
    const newForm = { ...formData, tieu_de: val };
    if (!editingArticle) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      newForm.slug = generated;
    }
    setFormData(newForm);
  };

  // Image file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const body = new FormData();
    body.append('file', file);

    const token = actor?.token || (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}')?.token; } catch { return ''; }
    })();

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers,
        body,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setFormData(prev => ({ ...prev, hinh_anh: data.data.url }));
        setSuccessMsg('Tải ảnh đại diện thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(data.message || 'Không thể tải ảnh.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload file ảnh.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit create or edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tieu_de.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài viết.');
      return;
    }
    if (!formData.noi_dung.trim()) {
      setFormError('Vui lòng nhập nội dung bài viết.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const isEdit = Boolean(editingArticle);
      const url = isEdit ? `${API}/api/admin/tin-tuc/${editingArticle.id}` : `${API}/api/admin/tin-tuc`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, actor);

      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể lưu bài viết.');
      }

      setSuccessMsg(isEdit ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết mới thành công!');
      setTimeout(() => setSuccessMsg(''), 3500);
      setModalOpen(false);
      loadArticles();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (art) => {
    try {
      const res = await apiFetch(`${API}/api/admin/tin-tuc/${art.id}/toggle-featured`, { method: 'PUT' }, actor);
      const data = await parseApiResponse(res);
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === art.id ? { ...a, noi_bat: data.data.noi_bat } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Published Status
  const handleToggleStatus = async (art) => {
    try {
      const res = await apiFetch(`${API}/api/admin/tin-tuc/${art.id}/toggle-status`, { method: 'PUT' }, actor);
      const data = await parseApiResponse(res);
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === art.id ? { ...a, trang_thai: data.data.trang_thai } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete article
  const handleDeleteArticle = async (art) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${art.tieu_de}" không?`)) return;
    try {
      const res = await apiFetch(`${API}/api/admin/tin-tuc/${art.id}`, { method: 'DELETE' }, actor);
      const data = await parseApiResponse(res);
      if (data.success) {
        setSuccessMsg('Đã xóa bài viết thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
        setArticles(prev => prev.filter(a => a.id !== art.id));
      } else {
        alert(data.message || 'Không thể xóa bài viết.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi xóa bài viết.');
    }
  };

  // Filtered articles
  const visibleArticles = articles.filter(art => {
    const matchQuery = `${art.tieu_de || ''} ${art.tom_tat || ''} ${art.tac_gia_ten || ''}`
      .toLocaleLowerCase('vi')
      .includes(searchQuery.toLocaleLowerCase('vi'));
    const matchCat = selectedCat === 'all' || art.danh_muc === selectedCat;
    const matchStatus = selectedStatus === 'all' || String(art.trang_thai) === selectedStatus;
    return matchQuery && matchCat && matchStatus;
  });

  const totalPublished = articles.filter(a => a.trang_thai === 1).length;
  const totalDraft = articles.filter(a => a.trang_thai === 0).length;
  const totalFeatured = articles.filter(a => a.noi_bat === 1).length;

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="news" />

      <main className="account-main">
        {/* Top bar */}
        <header className="account-topbar">
          <div>
            <span className="account-eyebrow">QUẢN TRỊ NỘI DUNG</span>
            <h1>Quản lý tin tức & bài viết</h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link className="account-secondary-button" href="/tin-tuc" target="_blank">
              Xem trang tin tức ↗
            </Link>
            <button
              type="button"
              className="account-primary-button"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Viết bài mới
            </button>
          </div>
        </header>

        {/* Overview Stats */}
        <section className="account-intro" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--card-bg, #1e293b)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-color, #334155)' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--primary-color, #3b82f6)' }}>{articles.length}</strong>
            <span style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', marginTop: 4 }}>Tổng bài viết</span>
          </div>
          <div style={{ background: 'var(--card-bg, #1e293b)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-color, #334155)' }}>
            <strong style={{ fontSize: '1.8rem', color: '#10b981' }}>{totalPublished}</strong>
            <span style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', marginTop: 4 }}>Đang xuất bản</span>
          </div>
          <div style={{ background: 'var(--card-bg, #1e293b)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-color, #334155)' }}>
            <strong style={{ fontSize: '1.8rem', color: '#f59e0b' }}>{totalDraft}</strong>
            <span style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', marginTop: 4 }}>Bản nháp / Ẩn</span>
          </div>
          <div style={{ background: 'var(--card-bg, #1e293b)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border-color, #334155)' }}>
            <strong style={{ fontSize: '1.8rem', color: '#ec4899' }}>{totalFeatured}</strong>
            <span style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', marginTop: 4 }}>Ghim nổi bật</span>
          </div>
        </section>

        {/* Alerts */}
        {error && <p className="account-error" role="alert">{error}</p>}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: 8, marginBottom: 16, border: '1px solid #10b981' }}>
            {successMsg}
          </div>
        )}

        {/* Articles Table Section */}
        <section className="account-table-section" aria-label="Danh sách tin tức">
          <div className="account-table-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h2>Danh sách bài viết</h2>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Category Filter */}
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                style={{
                  background: 'var(--input-bg, #0f172a)',
                  color: 'var(--text-main, #f8fafc)',
                  border: '1px solid var(--border-color, #334155)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.88rem'
                }}
              >
                <option value="all">Tất cả danh mục</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{
                  background: 'var(--input-bg, #0f172a)',
                  color: 'var(--text-main, #f8fafc)',
                  border: '1px solid var(--border-color, #334155)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: '0.88rem'
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="1">Đang xuất bản</option>
                <option value="0">Bản nháp</option>
              </select>

              {/* Search */}
              <label className="account-search">
                <input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Tìm tiêu đề, tác giả..."
                  aria-label="Tìm bài viết"
                />
              </label>
            </div>
          </div>

          <div className="account-table-scroll">
            <table className="account-table admin-products-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ẢNH</th>
                  <th>TIÊU ĐỀ & ĐƯỜNG DẪN</th>
                  <th>DANH MỤC</th>
                  <th>TÁC GIẢ</th>
                  <th>LƯỢT XEM</th>
                  <th style={{ textAlign: 'center' }}>NỔI BẬT</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="account-empty" colSpan="8">Đang tải danh sách bài viết...</td>
                  </tr>
                )}
                {!loading && visibleArticles.map(art => (
                  <tr key={art.id}>
                    <td>
                      <div className="admin-product-thumb" style={{ width: 68, height: 48, borderRadius: 6, overflow: 'hidden' }}>
                        {art.hinh_anh ? (
                          <img src={art.hinh_anh} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>KT</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 360 }}>
                        <strong style={{ fontSize: '0.94rem', lineHeight: 1.35, display: 'block', color: 'var(--text-main, #f8fafc)' }}>
                          {art.tieu_de}
                        </strong>
                        <small style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem', display: 'block', marginTop: 2 }}>
                          /{art.slug}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        borderRadius: 16,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        {art.danh_muc}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-main, #f8fafc)' }}>{art.tac_gia_ten}</small>
                      <small style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>
                        {new Date(art.created_at).toLocaleDateString('vi-VN')}
                      </small>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{art.luot_xem || 0}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(art)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'transform 0.15s ease',
                        }}
                        title={art.noi_bat === 1 ? 'Bấm để bỏ nổi bật' : 'Bấm để ghim nổi bật'}
                      >
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: art.noi_bat === 1 ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: art.noi_bat === 1 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                          {art.noi_bat === 1 ? 'Bật' : 'Tắt'}
                        </span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(art)}
                        className={`account-status ${Number(art.trang_thai) === 0 ? 'inactive' : ''}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Bấm để chuyển trạng thái"
                      >
                        <i />
                        {Number(art.trang_thai) === 0 ? 'Bản nháp' : 'Đang xuất bản'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <Link
                          href={`/tin-tuc/${art.slug || art.id}`}
                          target="_blank"
                          className="account-edit-button"
                          style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                          title="Xem trên trang người dùng"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          className="account-edit-button"
                          onClick={() => handleOpenEdit(art)}
                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art)}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && visibleArticles.length === 0 && (
                  <tr>
                    <td className="account-empty" colSpan="8">Không có bài viết nào phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── CREATE / EDIT ARTICLE MODAL ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 780,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color, #334155)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main, #f8fafc)' }}>
                {editingArticle ? 'Chỉnh sửa bài viết' : 'Viết bài tin tức mới'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem' }}>
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                  Tiêu đề bài viết <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.tieu_de}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Đánh giá chi tiết laptop ASUS ROG Strix SCAR 16..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--input-bg, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: 'var(--text-main, #f8fafc)',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {/* Slug & Category Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                    Đường dẫn tĩnh (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="danh-gia-chi-tiet-laptop-asus-rog"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--input-bg, #0f172a)',
                      border: '1px solid var(--border-color, #334155)',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                    Chuyên mục
                  </label>
                  <select
                    value={formData.danh_muc}
                    onChange={e => setFormData({ ...formData, danh_muc: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--input-bg, #0f172a)',
                      border: '1px solid var(--border-color, #334155)',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Author & Image URL Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                    Tên tác giả hiển thị
                  </label>
                  <input
                    type="text"
                    value={formData.tac_gia_ten}
                    onChange={e => setFormData({ ...formData, tac_gia_ten: e.target.value })}
                    placeholder="KTSHOP News"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--input-bg, #0f172a)',
                      border: '1px solid var(--border-color, #334155)',
                      color: 'var(--text-main, #f8fafc)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                    Ảnh đại diện bài viết
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={formData.hinh_anh}
                      onChange={e => setFormData({ ...formData, hinh_anh: e.target.value })}
                      placeholder="/uploads/ten-anh.jpg hoặc URL ảnh"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--input-bg, #0f172a)',
                        border: '1px solid var(--border-color, #334155)',
                        color: 'var(--text-main, #f8fafc)',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '0 16px',
                        borderRadius: 8,
                        background: 'var(--accent-color, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {uploadingImage ? 'Đang tải...' : 'Tải ảnh'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {formData.hinh_anh && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <img
                    src={formData.hinh_anh}
                    alt="Preview"
                    style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <small style={{ color: '#94a3b8' }}>Xem trước ảnh đại diện bài viết</small>
                </div>
              )}

              {/* Summary */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                  Đoạn tóm tắt (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={formData.tom_tat}
                  onChange={e => setFormData({ ...formData, tom_tat: e.target.value })}
                  placeholder="Đoạn văn ngắn 1-2 câu tóm tắt nội dung hấp dẫn để kích thích người đọc..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--input-bg, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: 'var(--text-main, #f8fafc)',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Full Content */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                  Nội dung chi tiết (Hỗ trợ HTML / Văn bản) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={9}
                  value={formData.noi_dung}
                  onChange={e => setFormData({ ...formData, noi_dung: e.target.value })}
                  placeholder="<h2>1. Mở đầu</h2><p>Nội dung bài viết chi tiết tại đây...</p>"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'var(--input-bg, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    color: 'var(--text-main, #f8fafc)',
                    fontSize: '0.92rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: 24, padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.92rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.noi_bat === 1}
                    onChange={e => setFormData({ ...formData, noi_bat: e.target.checked ? 1 : 0 })}
                  />
                  <span>Ghim làm bài viết nổi bật</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.92rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.trang_thai === 1}
                    onChange={e => setFormData({ ...formData, trang_thai: e.target.checked ? 1 : 0 })}
                  />
                  <span>Xuất bản ngay (Công khai cho khách xem)</span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-color, #334155)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid var(--border-color, #475569)',
                    color: 'var(--text-main, #f8fafc)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="account-primary-button"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  {formSubmitting ? 'Đang lưu...' : (editingArticle ? 'Lưu thay đổi' : 'Đăng bài viết')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
