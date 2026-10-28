'use client';

import { useState, useEffect } from 'react';

const QUICK_PRICE_RANGES = [
  { id: 'under_10', label: 'Dưới 10 triệu', min: 0, max: 10000000 },
  { id: '10_15',    label: '10 – 15 triệu', min: 10000000, max: 15000000 },
  { id: '15_20',    label: '15 – 20 triệu', min: 15000000, max: 20000000 },
  { id: '20_30',    label: '20 – 30 triệu', min: 20000000, max: 30000000 },
  { id: 'above_30', label: 'Trên 30 triệu', min: 30000000, max: 100000000 },
];

function formatVND(num) {
  if (!num && num !== 0) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(num)) + ' đ';
}

export default function PriceRangeInput({ min, max, currentMin, currentMax, onApply }) {
  const [inputMin, setInputMin] = useState(currentMin !== undefined && currentMin !== null ? String(currentMin) : '');
  const [inputMax, setInputMax] = useState(currentMax !== undefined && currentMax !== null ? String(currentMax) : '');

  useEffect(() => {
    setInputMin(currentMin !== undefined && currentMin !== null ? String(currentMin) : '');
    setInputMax(currentMax !== undefined && currentMax !== null ? String(currentMax) : '');
  }, [currentMin, currentMax]);

  const hasActivePrice = currentMin !== undefined && currentMin !== null && currentMin !== '' ||
                         currentMax !== undefined && currentMax !== null && currentMax !== '';

  const handleApply = (e) => {
    if (e) e.preventDefault();
    const cleanMin = inputMin ? Number(String(inputMin).replace(/[^0-9]/g, '')) : null;
    const cleanMax = inputMax ? Number(String(inputMax).replace(/[^0-9]/g, '')) : null;

    if (cleanMin !== null && cleanMax !== null && cleanMin > cleanMax) {
      onApply(cleanMax, cleanMin);
    } else {
      onApply(cleanMin, cleanMax);
    }
  };

  const handleReset = () => {
    setInputMin('');
    setInputMax('');
    onApply(null, null);
  };

  const handleQuickClick = (qMin, qMax) => {
    const isAlreadyActive =
      Number(currentMin || 0) === qMin &&
      Number(currentMax || 100000000) === qMax;

    if (isAlreadyActive) {
      handleReset();
    } else {
      setInputMin(qMin > 0 ? String(qMin) : '');
      setInputMax(qMax < 100000000 ? String(qMax) : '');
      onApply(qMin > 0 ? qMin : null, qMax < 100000000 ? qMax : null);
    }
  };

  return (
    <details open className="filter-group">
      <summary
        className="filter-group-title"
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>Mức Giá (VNĐ)</span>
        <span className="filter-chevron">›</span>
      </summary>

      <div className="filter-group-body price-input-body">
        {/* Nhóm nút chọn nhanh mức giá */}
        <div className="price-range-quick">
          {QUICK_PRICE_RANGES.map((btn) => {
            const isActive =
              (btn.min === 0 ? (!currentMin || Number(currentMin) <= 0) : Number(currentMin) === btn.min) &&
              (btn.max >= 100000000 ? (!currentMax || Number(currentMax) >= 100000000) : Number(currentMax) === btn.max) &&
              hasActivePrice;

            return (
              <button
                key={btn.id}
                type="button"
                className={`price-quick-btn${isActive ? ' active' : ''}`}
                onClick={() => handleQuickClick(btn.min, btn.max)}
              >
                <span>{btn.label}</span>
                {isActive && <span className="price-quick-check">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Nhập khoảng giá tùy chỉnh */}
        <form onSubmit={handleApply} className="price-input-row" style={{ marginTop: 12 }}>
          <div className="price-input-fields-wrap">
            <div className="price-input-wrap">
              <label className="price-input-label">Từ</label>
              <input
                type="number"
                className="price-input-field"
                placeholder={min ? String(min) : '0'}
                value={inputMin}
                onChange={(e) => setInputMin(e.target.value)}
                min={0}
                step={500000}
              />
              {inputMin && (
                <span className="price-input-preview">{formatVND(inputMin)}</span>
              )}
            </div>

            <span className="price-input-sep">—</span>

            <div className="price-input-wrap">
              <label className="price-input-label">Đến</label>
              <input
                type="number"
                className="price-input-field"
                placeholder={max ? String(max) : '100000000'}
                value={inputMax}
                onChange={(e) => setInputMax(e.target.value)}
                min={0}
                step={500000}
              />
              {inputMax && (
                <span className="price-input-preview">{formatVND(inputMax)}</span>
              )}
            </div>
          </div>

          <div className="price-actions-row">
            <button type="submit" className="price-apply-btn">
              <span>Áp dụng giá</span>
            </button>
            {hasActivePrice && (
              <button
                type="button"
                className="price-reset-btn"
                onClick={handleReset}
                title="Bỏ lọc giá"
              >
                Đặt lại
              </button>
            )}
          </div>
        </form>
      </div>
    </details>
  );
}
