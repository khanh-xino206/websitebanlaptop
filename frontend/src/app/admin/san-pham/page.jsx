'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';
const formatPrice = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);

export default function AdminProductsPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    apiFetch(`${API}/api/admin/san-pham?limit=200`, {}, actor)
      .then(async response => ({ response, data: await parseApiResponse(response) }))
      .then(({ response, data }) => {
        if (!current) return;
        if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải kho sản phẩm.');
        setProducts(data.data || []);
      })
      .catch(err => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [actor, apiFetch]);

  const visibleProducts = products.filter(product =>
    `${product.ten_laptop} ${product.ten_NH} ${product.cpu || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))
  );

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="products" />
      <main className="account-main">
        <header className="account-topbar">
          <div><span className="account-eyebrow">KHO HÀNG / SẢN PHẨM</span><h1>Quản lý sản phẩm</h1></div>
          <Link className="account-secondary-button" href="/san-pham">Xem cửa hàng</Link>
        </header>
        <section className="account-intro">
          <div><strong>{products.length}</strong><span>Sản phẩm trong kho</span></div>
          <p>Chọn một sản phẩm để xem cấu hình, hình ảnh và tồn kho.</p>
        </section>
        {error && <p className="account-error" role="alert">{error}</p>}
        <section className="account-table-section" aria-label="Danh sách sản phẩm trong kho">
          <div className="account-table-toolbar">
            <h2>Kho sản phẩm</h2>
            <label className="account-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên, thương hiệu, CPU" aria-label="Tìm sản phẩm" /></label>
          </div>
          <div className="account-table-scroll">
            <table className="account-table admin-products-table">
              <thead><tr><th>SẢN PHẨM</th><th>THƯƠNG HIỆU</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th><span className="visually-hidden">Chi tiết</span></th></tr></thead>
              <tbody>
                {loading && <tr><td className="account-empty" colSpan="6">Đang tải kho sản phẩm...</td></tr>}
                {!loading && visibleProducts.map(product => (
                  <tr key={product.id}>
                    <td><div className="admin-product-summary"><div className="admin-product-thumb">{product.url_anh ? <img src={product.url_anh} alt="" /> : <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>KT</span>}</div><div><strong>{product.ten_laptop}</strong><small>{[product.cpu, product.ram, product.o_cung].filter(Boolean).join(' · ') || 'Chưa có cấu hình'}</small></div></div></td>
                    <td>{product.ten_NH}</td>
                    <td className="admin-product-price">{formatPrice(product.gia_ban)}</td>
                    <td><span className={`admin-stock ${Number(product.so_luong_ton) <= 3 ? 'low' : ''}`}>{product.so_luong_ton} máy</span></td>
                    <td><span className={`account-status ${Number(product.trang_thai) === 0 ? 'inactive' : ''}`}><i />{Number(product.trang_thai) === 0 ? 'Ngừng bán' : 'Đang bán'}</span></td>
                    <td><Link className="account-edit-button" href={`/admin/san-pham/${product.id}`}>Chi tiết</Link></td>
                  </tr>
                ))}
                {!loading && visibleProducts.length === 0 && <tr><td className="account-empty" colSpan="6">Không có sản phẩm phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}