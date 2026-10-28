'use client';

import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function AddToCartButton({ product, disabled = false, className = '', style = {} }) {
  const { addToCart } = useAppContext();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !product) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      className={`add-to-cart-btn ${added ? 'added' : ''} ${className}`}
      onClick={handleAdd}
      disabled={disabled}
      style={{
        ...(added ? { background: '#16a34a', color: '#fff' } : {}),
        ...style,
      }}
    >
      {added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
    </button>
  );
}
