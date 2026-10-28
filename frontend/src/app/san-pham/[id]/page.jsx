import Link from 'next/link';
import { getProductById } from '@/lib/api';
import ProductGallery from './components/ProductGallery';
import ProductAddToCartSection from './components/ProductAddToCartSection';

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);

const SPECIFICATIONS = [
  ['Bộ xử lý', 'cpu'],
  ['Bộ nhớ RAM', 'ram'],
  ['Ổ cứng', 'o_cung'],
  ['Màn hình', 'man_hinh'],
  ['Đồ họa', 'card_do_hoa'],
  ['Hệ điều hành', 'he_dieu_hanh'],
  ['Pin', 'pin'],
  ['Khối lượng', 'trong_luong', (value) => (value ? `${value} kg` : '')],
  ['Màu sắc', 'mau_sac'],
  ['Cổng kết nối', 'ket_noi'],
  ['Bảo hành', 'bao_hanh', (value) => (value ? `${value} tháng` : '')],
];

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm | KTSHOP',
    };
  }
  return {
    title: `${product.ten_laptop} – Chính Hãng Giá Tốt | KTSHOP`,
    description: product.mo_ta
      ? product.mo_ta.slice(0, 160)
      : `Mua laptop ${product.ten_laptop} chính hãng giá tốt, bảo hành ${product.bao_hanh || 12} tháng tại KTSHOP.`,
    openGraph: {
      images: product.url_anh ? [product.url_anh] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <main className="public-product-page">
        <div className="public-product-state public-product-error">
          <span>404</span>
          <h1>Không tìm thấy sản phẩm</h1>
          <p>Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.</p>
          <Link href="/san-pham">Quay lại danh sách sản phẩm</Link>
        </div>
      </main>
    );
  }

  const images = product.images || (product.url_anh ? [{ id: 1, url_anh: product.url_anh }] : []);
  const inStock = Number(product.so_luong_ton) > 0;
  const discount = Number(product.gia_goc) > Number(product.gia_ban)
    ? Math.round((1 - Number(product.gia_ban) / Number(product.gia_goc)) * 100)
    : 0;

  return (
    <main className="public-product-page">
      <div className="public-product-container">
        <nav className="public-product-breadcrumb" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/san-pham">Laptop</Link>
          <span>/</span>
          <span>{product.ten_laptop}</span>
        </nav>

        <section className="public-product-overview">
          {/* Gallery (leaf client component for active image toggle) */}
          <ProductGallery
            images={images}
            title={product.ten_laptop}
            discount={discount}
            defaultImage={product.url_anh}
          />

          <div className="public-product-summary">
            <span className="public-product-brand">{product.ten_NH}</span>
            <h1>{product.ten_laptop}</h1>
            <div className="public-product-reference">
              <span>Mã sản phẩm: {product.id}</span>
              <span>{Number(product.luot_xem || 0).toLocaleString('vi-VN')} lượt xem</span>
            </div>

            <div className="public-product-price">
              <strong>{formatPrice(product.gia_ban)}</strong>
              {discount > 0 && (
                <>
                  <del>{formatPrice(product.gia_goc)}</del>
                  <span>Tiết kiệm {formatPrice(Number(product.gia_goc) - Number(product.gia_ban))}</span>
                </>
              )}
            </div>

            <div className={`public-product-stock ${inStock ? '' : 'out-of-stock'}`}>
              <i />
              {inStock ? `Còn hàng (${product.so_luong_ton} sản phẩm)` : 'Tạm hết hàng'}
            </div>

            <div className="public-product-highlights">
              {SPECIFICATIONS.slice(0, 4).map(([label, key]) =>
                product[key] ? (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{product[key]}</strong>
                  </div>
                ) : null
              )}
            </div>

            {/* Add to Cart button (leaf client component) */}
            <ProductAddToCartSection product={product} inStock={inStock} />

            <div className="public-product-assurances">
              <span>Hàng chính hãng</span>
              <span>Bảo hành {product.bao_hanh || 12} tháng</span>
              <span>Hỗ trợ trả góp</span>
            </div>
          </div>
        </section>

        <section className="public-product-details">
          <div className="public-product-section-heading">
            <span>THÔNG SỐ</span>
            <h2>Thông tin sản phẩm</h2>
          </div>
          <dl className="public-product-specs">
            {SPECIFICATIONS.map(([label, key, format = (v) => v]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{product[key] ? format(product[key]) : 'Đang cập nhật'}</dd>
              </div>
            ))}
          </dl>
          <div className="public-product-description">
            <h3>Mô tả chi tiết</h3>
            <p>{product.mo_ta || 'Thông tin mô tả sản phẩm đang được cập nhật.'}</p>
          </div>
        </section>

        <Link className="public-product-back" href="/san-pham">
          ← Tiếp tục xem sản phẩm
        </Link>
      </div>
    </main>
  );
}