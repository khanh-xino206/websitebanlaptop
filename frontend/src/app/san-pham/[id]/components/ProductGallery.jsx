'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images = [], title = '', discount = 0, defaultImage = '' }) {
  const [activeImage, setActiveImage] = useState(images[0]?.url_anh || defaultImage || '');

  return (
    <div className="public-product-gallery">
      <div className="public-product-image">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'contain' }}
            quality={85}
          />
        ) : (
          <span aria-hidden="true" style={{ fontSize: '1rem', color: '#94a3b8' }}>
            KTSHOP
          </span>
        )}
        {discount > 0 && <span className="public-product-discount">-{discount}%</span>}
      </div>

      {images.length > 1 && (
        <div className="public-product-thumbnails" aria-label="Ảnh sản phẩm">
          {images.map((image) => (
            <button
              key={image.id || image.url_anh}
              type="button"
              className={activeImage === image.url_anh ? 'active' : ''}
              onClick={() => setActiveImage(image.url_anh)}
              aria-label={image.alt_text || 'Xem ảnh sản phẩm'}
            >
              <Image
                src={image.url_anh}
                alt=""
                fill
                loading="lazy"
                sizes="80px"
                style={{ objectFit: 'cover' }}
                quality={60}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
