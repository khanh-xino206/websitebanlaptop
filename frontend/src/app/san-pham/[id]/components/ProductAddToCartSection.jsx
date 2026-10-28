'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '../../../context/AppContext';

export default function ProductAddToCartSection({ product, inStock }) {
  const { addToCart } = useAppContext();
  const [cartNotice, setCartNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!inStock || !product) return;
    setLoading(true);
    await addToCart(product);
    setLoading(false);
    setCartNotice('Đã thêm sản phẩm vào giỏ hàng.');
    setTimeout(() => setCartNotice(''), 4000);
  };

  return (
    <>
      <button
        className="public-product-buy"
        type="button"
        onClick={handleAddToCart}
        disabled={!inStock || loading}
      >
        {loading ? 'Đang thêm…' : inStock ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
      </button>

      {cartNotice && (
        <p className="public-product-cart-notice" role="status">
          {cartNotice}{' '}
          <Link href="/gio-hang">Xem giỏ hàng</Link>
        </p>
      )}
    </>
  );
}
