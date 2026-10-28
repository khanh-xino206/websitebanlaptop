'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../../context/AppContext';
import AdminSidebar from '../../_components/AdminSidebar';

const API = 'http://localhost:5000';
const formatPrice = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);
const SPECS = [
  ['CPU', 'cpu'],
  ['RAM', 'ram'],
  ['Ổ cứng', 'o_cung'],
  ['Màn hình', 'man_hinh'],
  ['Card đồ họa', 'card_do_hoa'],
  ['Hệ điều hành', 'he_dieu_hanh'],
  ['Pin', 'pin'],
  ['Trọng lượng', 'trong_luong', value => value ? `${value} kg` : ''],
  ['Màu sắc', 'mau_sac'],
  ['Kết nối', 'ket_noi'],
  ['Bảo hành', 'bao_hanh', value => value ? `${value} tháng` : ''],
];

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [brands, setBrands] = useState([]);
  const [editForm, setEditForm] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editError, setEditError] = useState('');
  const productFileInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);

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
    if (!actor || !id) return;
    let current = true;
    apiFetch(`${API}/api/admin/san-pham/${encodeURIComponent(id)}`, {}, actor)
      .then(async response => ({ response, data: await parseApiResponse(response) }))
      .then(({ response, data }) => {
        if (!current) return;
        if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải chi tiết sản phẩm.');
        setProduct(data.data);
        setActiveImage(data.data.images?.[0]?.url_anh || '');
      })
      .catch(err => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [actor, apiFetch, id]);

  const openEdit = async () => {
    setEditError('');
    setNotice('');
    try {
      const response = await apiFetch(`${API}/api/admin/san-pham/options`, {}, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải danh sách thương hiệu.');
      setBrands(data.data.brands || []);
      setEditForm({
        nhan_hieu_id: String(product.nhan_hieu_id),
        ten_laptop: product.ten_laptop || '',
        gia_ban: product.gia_ban ?? '',
        gia_goc: product.gia_goc ?? '',
        cpu: product.cpu || '',
        ram: product.ram || '',
        o_cung: product.o_cung || '',
        man_hinh: product.man_hinh || '',
        card_do_hoa: product.card_do_hoa || '',
        he_dieu_hanh: product.he_dieu_hanh || '',
        pin: product.pin || '',
        trong_luong: product.trong_luong ?? '',
        ket_noi: product.ket_noi || '',
        mau_sac: product.mau_sac || '',
        bao_hanh: product.bao_hanh ?? 12,
        mo_ta: product.mo_ta || '',
        so_luong_ton: product.so_luong_ton ?? 0,
        trang_thai: String(product.trang_thai),
      });
      setEditOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProduct = async event => {
    event.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      const payload = {
        ...editForm,
        nhan_hieu_id: Number(editForm.nhan_hieu_id),
        gia_ban: Number(editForm.gia_ban),
        gia_goc: editForm.gia_goc === '' ? null : Number(editForm.gia_goc),
        trong_luong: editForm.trong_luong === '' ? null : Number(editForm.trong_luong),
        bao_hanh: Number(editForm.bao_hanh),
        so_luong_ton: Number(editForm.so_luong_ton),
        trang_thai: Number(editForm.trang_thai),
      };
      const response = await apiFetch(`${API}/api/admin/san-pham/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, actor);
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể lưu thay đổi sản phẩm.');
      const brandName = brands.find(brand => Number(brand.id) === payload.nhan_hieu_id)?.ten_NH || product.ten_NH;
      setProduct(current => ({ ...current, ...payload, ten_NH: brandName }));
      setEditOpen(false);
      setNotice('Đã cập nhật thông tin sản phẩm.');
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('la_anh_chinh', (product.images?.length ? 0 : 1));

      const response = await fetch(`${API}/api/admin/san-pham/${encodeURIComponent(id)}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${actor.accessToken}`,
        },
        body: formData,
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải ảnh sản phẩm lên.');

      const newImages = [...(product.images || []), data.data];
      setProduct({ ...product, images: newImages });
      setActiveImage(data.data.url_anh);
      setNotice('Đã tải và lưu file ảnh mới cho sản phẩm thành công!');
    } catch (err) {
      setError(err.message || 'Lỗi khi tải ảnh sản phẩm!');
    } finally {
      setImageUploading(false);
      if (productFileInputRef.current) productFileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa file ảnh này?')) return;
    try {
      const response = await fetch(`${API}/api/admin/san-pham/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${actor.accessToken}`,
        },
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể xóa ảnh.');
      const newImages = product.images.filter(img => img.id !== imageId);
      setProduct({ ...product, images: newImages });
      setActiveImage(newImages[0]?.url_anh || '');
      setNotice('Đã xóa file ảnh thành công.');
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa ảnh!');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const response = await fetch(`${API}/api/admin/san-pham/images/${imageId}/primary`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${actor.accessToken}`,
        },
      });
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể đặt ảnh chính.');
      const newImages = product.images.map(img => ({
        ...img,
        la_anh_chinh: img.id === imageId ? 1 : 0,
      }));
      setProduct({ ...product, images: newImages });
      const primaryImg = newImages.find(img => img.id === imageId);
      if (primaryImg) setActiveImage(primaryImg.url_anh);
      setNotice('Đã đặt làm ảnh chính sản phẩm.');
    } catch (err) {
      setError(err.message || 'Lỗi khi đặt ảnh chính!');
    }
  };

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="products" />
      <main className="account-main admin-product-detail-main">
        <header className="account-topbar">
          <div><span className="account-eyebrow">KHO HÀNG / SẢN PHẨM / CHI TIẾT</span><h1>Chi tiết sản phẩm</h1></div>
          <div className="admin-product-header-actions">
            {!loading && product && <button className="account-primary-button" type="button" onClick={openEdit}>Sửa sản phẩm</button>}
            <Link className="account-secondary-button" href="/admin/san-pham">← Danh sách sản phẩm</Link>
          </div>
        </header>
        {loading && <div className="admin-product-detail-state">Đang tải thông tin sản phẩm...</div>}
        {!loading && error && <div className="admin-product-detail-state account-error" role="alert">{error}<p><Link href="/admin/san-pham">Quay lại danh sách sản phẩm</Link></p></div>}
        {notice && <p className="account-notice" role="status">{notice}</p>}
        {!loading && product && <>
          <section className="admin-product-hero">
            <div className="admin-product-gallery">
              <div className="admin-product-main-image">
                {activeImage ? <img src={activeImage} alt={product.ten_laptop} /> : <span aria-hidden="true" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>KTSHOP</span>}
              </div>
              {product.images?.length > 0 && <div className="admin-product-thumbnails" aria-label="Ảnh sản phẩm">
                {product.images.map(image => (
                  <div key={image.id} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <button type="button" className={activeImage === image.url_anh ? 'active' : ''} onClick={() => setActiveImage(image.url_anh)} aria-label={image.alt_text || 'Xem ảnh sản phẩm'}>
                      <img src={image.url_anh} alt="" />
                    </button>
                    <div style={{ display: 'flex', gap: 6, fontSize: '0.72rem' }}>
                      {image.la_anh_chinh ? (
                        <span title="Ảnh chính" style={{ color: '#16a34a', fontWeight: 'bold' }}>Chính</span>
                      ) : (
                        <button type="button" onClick={() => handleSetPrimary(image.id)} title="Đặt làm ảnh chính" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#2563eb' }}>Đặt chính</button>
                      )}
                      <button type="button" onClick={() => handleDeleteImage(image.id)} title="Xóa ảnh" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#ef4444' }}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="account-secondary-button"
                  style={{ width: '100%', fontSize: '0.875rem' }}
                  onClick={() => productFileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? 'Đang tải file lên...' : 'Thêm file ảnh mới'}
                </button>
                <input
                  type="file"
                  ref={productFileInputRef}
                  onChange={handleUploadImage}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className="admin-product-overview">
              <div className="admin-product-meta"><span>{product.ten_NH}</span><span className={`account-status ${Number(product.trang_thai) === 0 ? 'inactive' : ''}`}><i />{Number(product.trang_thai) === 0 ? 'Ngừng kinh doanh' : 'Đang kinh doanh'}</span></div>
              <h2>{product.ten_laptop}</h2>
              <p className="admin-product-id">Mã sản phẩm: #{product.id}</p>
              <div className="admin-detail-price">{formatPrice(product.gia_ban)}{Number(product.gia_goc) > Number(product.gia_ban) && <del>{formatPrice(product.gia_goc)}</del>}</div>
              <div className={`admin-stock-panel ${Number(product.so_luong_ton) <= 3 ? 'low' : ''}`}>
                <span className="admin-stock-number">{product.so_luong_ton}</span>
                <span><strong>Sản phẩm tồn kho</strong><small>{Number(product.so_luong_ton) === 0 ? 'Cần nhập hàng' : Number(product.so_luong_ton) <= 3 ? 'Sắp hết hàng' : 'Sẵn sàng xuất kho'}</small></span>
              </div>
              <div className="admin-product-dates"><span>Ngày tạo <strong>{new Date(product.created_at).toLocaleDateString('vi-VN')}</strong></span><span>Cập nhật <strong>{new Date(product.updated_at).toLocaleDateString('vi-VN')}</strong></span></div>
            </div>
          </section>

          <section className="admin-product-info-section">
            <div className="admin-detail-section-heading"><span>01</span><div><h2>Cấu hình kỹ thuật</h2><p>Thông số hiện được lưu cho sản phẩm</p></div></div>
            <dl className="admin-spec-grid">
              {SPECS.map(([label, key, format = value => value]) => <div className="admin-spec-item" key={key}><dt>{label}</dt><dd>{product[key] ? format(product[key]) : 'Chưa cập nhật'}</dd></div>)}
            </dl>
          </section>

          <section className="admin-product-info-section admin-description-section">
            <div className="admin-detail-section-heading"><span>02</span><div><h2>Mô tả sản phẩm</h2><p>Nội dung giới thiệu trên trang cửa hàng</p></div></div>
            <p>{product.mo_ta || 'Sản phẩm chưa có mô tả.'}</p>
          </section>
        </>}
      </main>
      {editOpen && editForm && <div className="account-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditOpen(false); }}>
        <section className="account-modal admin-product-edit-modal" role="dialog" aria-modal="true" aria-labelledby="product-edit-title">
          <header className="account-modal-header"><div><span className="account-eyebrow">KHO HÀNG / CẬP NHẬT</span><h2 id="product-edit-title">Sửa sản phẩm</h2></div><button className="account-close" type="button" onClick={() => setEditOpen(false)} aria-label="Đóng">×</button></header>
          <form onSubmit={saveProduct}>
            <div className="account-form-grid">
              <label className="account-field account-field-wide"><span>Tên sản phẩm</span><input required maxLength="255" value={editForm.ten_laptop} onChange={event => setEditForm({ ...editForm, ten_laptop: event.target.value })} /></label>
              <label className="account-field"><span>Thương hiệu</span><select required value={editForm.nhan_hieu_id} onChange={event => setEditForm({ ...editForm, nhan_hieu_id: event.target.value })}>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.ten_NH}</option>)}</select></label>
              <label className="account-field"><span>Trạng thái</span><select value={editForm.trang_thai} onChange={event => setEditForm({ ...editForm, trang_thai: event.target.value })}><option value="1">Đang kinh doanh</option><option value="0">Ngừng kinh doanh</option></select></label>
              <label className="account-field"><span>Giá bán (VNĐ)</span><input type="number" min="0" step="1000" required value={editForm.gia_ban} onChange={event => setEditForm({ ...editForm, gia_ban: event.target.value })} /></label>
              <label className="account-field"><span>Giá gốc (VNĐ)</span><input type="number" min="0" step="1000" value={editForm.gia_goc} onChange={event => setEditForm({ ...editForm, gia_goc: event.target.value })} /></label>
              <label className="account-field"><span>Số lượng tồn</span><input type="number" min="0" step="1" required value={editForm.so_luong_ton} onChange={event => setEditForm({ ...editForm, so_luong_ton: event.target.value })} /></label>
              <label className="account-field"><span>Bảo hành (tháng)</span><input type="number" min="0" step="1" required value={editForm.bao_hanh} onChange={event => setEditForm({ ...editForm, bao_hanh: event.target.value })} /></label>
              <label className="account-field"><span>CPU</span><input value={editForm.cpu} onChange={event => setEditForm({ ...editForm, cpu: event.target.value })} /></label>
              <label className="account-field"><span>RAM</span><input value={editForm.ram} onChange={event => setEditForm({ ...editForm, ram: event.target.value })} /></label>
              <label className="account-field"><span>Ổ cứng</span><input value={editForm.o_cung} onChange={event => setEditForm({ ...editForm, o_cung: event.target.value })} /></label>
              <label className="account-field"><span>Màn hình</span><input value={editForm.man_hinh} onChange={event => setEditForm({ ...editForm, man_hinh: event.target.value })} /></label>
              <label className="account-field"><span>Card đồ họa</span><input value={editForm.card_do_hoa} onChange={event => setEditForm({ ...editForm, card_do_hoa: event.target.value })} /></label>
              <label className="account-field"><span>Hệ điều hành</span><input value={editForm.he_dieu_hanh} onChange={event => setEditForm({ ...editForm, he_dieu_hanh: event.target.value })} /></label>
              <label className="account-field"><span>Pin</span><input value={editForm.pin} onChange={event => setEditForm({ ...editForm, pin: event.target.value })} /></label>
              <label className="account-field"><span>Trọng lượng (kg)</span><input type="number" min="0" step="0.01" value={editForm.trong_luong} onChange={event => setEditForm({ ...editForm, trong_luong: event.target.value })} /></label>
              <label className="account-field"><span>Màu sắc</span><input value={editForm.mau_sac} onChange={event => setEditForm({ ...editForm, mau_sac: event.target.value })} /></label>
              <label className="account-field account-field-wide"><span>Cổng kết nối</span><textarea rows="2" value={editForm.ket_noi} onChange={event => setEditForm({ ...editForm, ket_noi: event.target.value })} /></label>
              <label className="account-field account-field-wide"><span>Mô tả</span><textarea rows="4" value={editForm.mo_ta} onChange={event => setEditForm({ ...editForm, mo_ta: event.target.value })} /></label>
            </div>
            {editError && <p className="account-error" role="alert">{editError}</p>}
            <footer className="account-modal-actions"><button className="account-secondary-button" type="button" onClick={() => setEditOpen(false)}>Hủy</button><button className="account-primary-button" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  );
}