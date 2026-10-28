'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const slides = [
  { id: 1, src: '/banner1.jpg', alt: 'Siêu Sale Laptop - Giảm đến 30%' },
  { id: 2, src: '/banner2.jpg', alt: 'Laptop Cao Cấp - Apple Dell Asus Lenovo' },
  { id: 3, src: '/banner3.jpg', alt: 'Gaming Laptop - Unleash The Power' },
  { id: 4, src: '/banner4.jpg', alt: 'Laptop Sinh Viên - Trả góp 0%' },
  { id: 5, src: '/banner5.jpg', alt: 'Khuyến Mãi Cuối Năm' },
];

export default function Banner() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  useEffect(() => {
    timerRef.current = setInterval(goNext, 4500);
    return () => clearInterval(timerRef.current);
  }, [isTransitioning]);

  return (
    <div className="banner-container">
      <div className="banner-wrapper">
        {/* Slides */}
        <div className="banner-track">
          {slides.map((slide, i) => {
            // Chỉ eager-load ảnh hiện tại + ảnh tiếp theo, còn lại lazy load
            const isNext = i === (current + 1) % slides.length;
            const shouldEagerLoad = i === 0 || i === current || isNext;
            return (
              <div
                key={slide.id}
                className={`banner-slide ${i === current ? 'active' : ''}`}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  loading={shouldEagerLoad ? 'eager' : 'lazy'}
                  sizes="(max-width: 768px) 100vw, 100vw"
                  style={{ objectFit: 'cover' }}
                  quality={80}
                />
              </div>
            );
          })}
        </div>

        {/* Prev Button */}
        <button className="banner-btn banner-btn-prev" onClick={goPrev} aria-label="Ảnh trước">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Next Button */}
        <button className="banner-btn banner-btn-next" onClick={goNext} aria-label="Ảnh tiếp">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
