import Link from 'next/link';
import Image from 'next/image';
import AddToCartButton from './AddToCartButton';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);

export default function ProductCard({ product, className = '' }) {
  if (!product) return null;

  const hasDiscount = Number(product.gia_goc) > Number(product.gia_ban);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.gia_ban) / Number(product.gia_goc)) * 100)
    : 0;

  const imgSrc = product.url_anh || null;

  return (
    <div className={`product-card ${className}`}>
      <Link href={`/san-pham/${product.id}`} className="product-image" style={{ display: 'block', textDecoration: 'none' }}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.ten_laptop}
            fill
            loading="lazy"
            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            quality={75}
          />
        ) : (
          <div className="no-image">KTSHOP</div>
        )}
        {hasDiscount && (
          <span className="discount-badge">-{discountPercent}%</span>
        )}
        {product.ten_NH && (
          <span className="brand-chip">{product.ten_NH}</span>
        )}
      </Link>

      <div className="product-info">
        <Link href={`/san-pham/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="product-name">{product.ten_laptop}</h3>
        </Link>

        <div className="product-specs" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {product.cpu && <span className="spec-tag">{product.cpu}</span>}
          {product.ram && <span className="spec-tag">{product.ram}</span>}
          {product.o_cung && <span className="spec-tag">{product.o_cung}</span>}
          {product.mau_sac && <span className="spec-tag">{product.mau_sac}</span>}
        </div>

        <div className="product-price-wrapper">
          <span className="product-price">{formatPrice(product.gia_ban)}</span>
          {hasDiscount && (
            <span className="product-old-price">{formatPrice(product.gia_goc)}</span>
          )}
        </div>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
