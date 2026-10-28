import Link from 'next/link';
import ProductCard from '../../components/ProductCard';

function buildQuery(params, updates) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.set(key, String(value));
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      q.delete(key);
    } else {
      q.set(key, String(value));
    }
  }
  const str = q.toString();
  return str ? `/san-pham?${str}` : '/san-pham';
}

function removeTagQuery(params, key, valueToRemove) {
  const currentVal = params[key] || '';
  const parts = currentVal.split(',').filter(Boolean);
  const nextParts = parts.filter(p => p !== String(valueToRemove));
  return buildQuery(params, {
    [key]: nextParts.length ? nextParts.join(',') : null,
    page: null,
  });
}

function Pagination({ currentPage, totalPages, total = 0, currentParams }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const max = 5;
  let s = Math.max(1, currentPage - Math.floor(max / 2));
  let e = Math.min(totalPages, s + max - 1);
  if (e - s < max - 1) s = Math.max(1, e - max + 1);
  for (let i = s; i <= e; i++) pages.push(i);

  return (
    <div className="pagination-container">
      <div className="pagination-wrap">
        {currentPage > 1 ? (
          <Link
            href={buildQuery(currentParams, { page: currentPage - 1 })}
            className="page-btn page-btn-prev"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        ) : (
          <span className="page-btn page-btn-prev disabled" aria-disabled="true" title="Trang trước">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
        )}

        {s > 1 && (
          <>
            <Link href={buildQuery(currentParams, { page: 1 })} className="page-btn">1</Link>
            {s > 2 && <span className="page-dots">…</span>}
          </>
        )}

        {pages.map(p => (
          <Link
            key={p}
            href={buildQuery(currentParams, { page: p })}
            className={`page-btn${p === currentPage ? ' active' : ''}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        ))}

        {e < totalPages && (
          <>
            {e < totalPages - 1 && <span className="page-dots">…</span>}
            <Link href={buildQuery(currentParams, { page: totalPages })} className="page-btn">{totalPages}</Link>
          </>
        )}

        {currentPage < totalPages ? (
          <Link
            href={buildQuery(currentParams, { page: currentPage + 1 })}
            className="page-btn page-btn-next"
            title="Trang sau"
            aria-label="Trang sau"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <span className="page-btn page-btn-next disabled" aria-disabled="true" title="Trang sau">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="pagination-info">
          Trang <strong>{currentPage}</strong> / {totalPages} (Tổng <strong>{total}</strong> sản phẩm)
        </div>
      )}
    </div>
  );
}

export default function ProductList({
  products = [],
  pagination = { total: 0, page: 1, totalPages: 1 },
  currentParams = {},
  filters = null,
}) {
  const selBrands = currentParams.brand ? currentParams.brand.split(',').filter(Boolean) : [];
  const selDemands = currentParams.nhu_cau ? currentParams.nhu_cau.split(',').filter(Boolean) : [];
  const selCpus = currentParams.cpu ? currentParams.cpu.split(',').filter(Boolean) : [];
  const selRams = currentParams.ram ? currentParams.ram.split(',').filter(Boolean) : [];
  const selDisks = currentParams.o_cung ? currentParams.o_cung.split(',').filter(Boolean) : [];
  const selColors = currentParams.mau_sac ? currentParams.mau_sac.split(',').filter(Boolean) : [];

  const activeCount = selBrands.length + selDemands.length + selCpus.length + selRams.length + selDisks.length + selColors.length + (currentParams.q ? 1 : 0) + (currentParams.gia_min || currentParams.gia_max ? 1 : 0);
  const currentPage = Number(currentParams.page) || 1;

  return (
    <main className="sp-main">
      {/* Result info bar */}
      <div className="sp-result-bar">
        <span className="sp-result-count">
          {pagination.total} sản phẩm
        </span>
        {activeCount > 0 && (
          <div className="sp-active-tags">
            {selBrands.map(bId => {
              const b = filters?.brands?.find(x => String(x.id) === bId || x.ten_NH?.toLowerCase() === bId.toLowerCase());
              const name = b ? b.ten_NH : bId;
              return (
                <span key={bId} className="active-tag">
                  {name}
                  <Link href={removeTagQuery(currentParams, 'brand', bId)} aria-label={`Xóa lọc ${name}`}>✕</Link>
                </span>
              );
            })}
            {selDemands.map(dId => {
              const d = filters?.nhu_cau?.find(x => String(x.id) === dId || x.id === dId);
              const label = d ? d.label : dId;
              return (
                <span key={dId} className="active-tag">
                  {label}
                  <Link href={removeTagQuery(currentParams, 'nhu_cau', dId)} aria-label={`Xóa lọc ${label}`}>✕</Link>
                </span>
              );
            })}
            {selCpus.map(v => (
              <span key={v} className="active-tag">
                {v}
                <Link href={removeTagQuery(currentParams, 'cpu', v)} aria-label={`Xóa lọc ${v}`}>✕</Link>
              </span>
            ))}
            {selRams.map(v => (
              <span key={v} className="active-tag">
                {v}
                <Link href={removeTagQuery(currentParams, 'ram', v)} aria-label={`Xóa lọc ${v}`}>✕</Link>
              </span>
            ))}
            {selDisks.map(v => (
              <span key={v} className="active-tag">
                {v}
                <Link href={removeTagQuery(currentParams, 'o_cung', v)} aria-label={`Xóa lọc ${v}`}>✕</Link>
              </span>
            ))}
            {selColors.map(v => (
              <span key={v} className="active-tag">
                {v}
                <Link href={removeTagQuery(currentParams, 'mau_sac', v)} aria-label={`Xóa lọc ${v}`}>✕</Link>
              </span>
            ))}
            {(currentParams.gia_min || currentParams.gia_max) && (
              <span className="active-tag">
                Giá: {currentParams.gia_min ? Number(currentParams.gia_min).toLocaleString('vi-VN') + 'đ' : '0đ'} – {currentParams.gia_max ? Number(currentParams.gia_max).toLocaleString('vi-VN') + 'đ' : 'Tối đa'}
                <Link href={buildQuery(currentParams, { gia_min: null, gia_max: null, page: null })} aria-label="Xóa lọc giá">✕</Link>
              </span>
            )}
            {currentParams.q && (
              <span className="active-tag">
                "{currentParams.q}"
                <Link href={buildQuery(currentParams, { q: null, page: null })} aria-label="Xóa từ khóa">✕</Link>
              </span>
            )}
            <Link href="/san-pham" className="sidebar-reset" style={{ marginLeft: 8 }}>
              Xóa tất cả
            </Link>
          </div>
        )}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="sp-empty">
          <p>Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn</p>
          <Link href="/san-pham" className="view-all-btn">Xóa tất cả bộ lọc</Link>
        </div>
      ) : (
        <div className="product-grid sp-product-grid">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        currentParams={currentParams}
      />
    </main>
  );
}
