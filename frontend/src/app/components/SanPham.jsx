import Link from 'next/link';
import ProductCard from './ProductCard';

export default function SanPham({ products = [] }) {
  if (!products || products.length === 0) {
    return <p className="no-products-msg">Chưa có sản phẩm nào.</p>;
  }

  // Hiển thị 15 sản phẩm mới nhất trên trang chủ
  const displayedProducts = products.slice(0, 15);

  return (
    <section className="sanpham-section">
      <div className="section-title-wrap">
        <h2 className="section-title">Sản Phẩm Mới Nhất</h2>
        <p className="section-sub">Khám phá các dòng laptop chính hãng, hiệu năng mạnh mẽ</p>
      </div>

      <div className="sp-meta-row">
        <span className="sp-count">
          Hiển thị {displayedProducts.length} / {products.length} sản phẩm
        </span>
        <Link href="/san-pham" className="view-all-btn" id="home-view-all-products-btn">
          <span>Xem tất cả sản phẩm</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Link>
      </div>

      <div className="product-grid">
        {displayedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/san-pham" className="view-all-btn" style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '1rem', borderRadius: '9999px' }}>
          Khám phá toàn bộ {products.length}+ mẫu máy tại KTSHOP →
        </Link>
      </div>
    </section>
  );
}
