import Link from 'next/link';
import { getNewsList, getNewsCategories, getFeaturedNews } from '@/lib/api';
import NewsSearchBar from './components/NewsSearchBar';

export const metadata = {
  title: 'Tin Tức Công Nghệ & Đánh Giá Laptop | KTSHOP',
  description: 'Cập nhật tin tức công nghệ vi xử lý, đánh giá laptop cao cấp, thủ thuật máy tính và các chương trình khuyến mãi độc quyền tại KTSHOP.',
};

function buildNewsUrl(params, updates) {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val && val !== 'Tất cả') query.set(key, String(val));
  }
  for (const [key, val] of Object.entries(updates)) {
    if (!val || val === 'Tất cả') query.delete(key);
    else query.set(key, String(val));
  }
  const str = query.toString();
  return str ? `/tin-tuc?${str}` : '/tin-tuc';
}

export default async function TinTucPage({ searchParams }) {
  const params = (await searchParams) || {};
  const currentCategory = params.category || 'Tất cả';
  const currentSearch = params.q || '';
  const currentPage = Number(params.page) || 1;

  const [newsData, categories, featuredArticles] = await Promise.all([
    getNewsList({ category: currentCategory, q: currentSearch, page: currentPage }),
    getNewsCategories(),
    getFeaturedNews(),
  ]);

  const { articles, pagination } = newsData;
  const mainFeatured = featuredArticles.length > 0 ? featuredArticles[0] : null;

  return (
    <div className="news-page-container">
      {/* ── HERO HEADER ── */}
      <section className="news-hero">
        <div className="news-hero-inner">
          <span className="news-eyebrow">KTSHOP NEWSROOM</span>
          <h1 className="news-hero-title">Tin Tức Công Nghệ & Khuyến Mãi Laptop</h1>
          <p className="news-hero-desc">
            Cập nhật xu hướng vi xử lý mới nhất, đánh giá chuyên sâu các dòng máy cao cấp và cẩm nang lựa chọn laptop tối ưu cho học tập, công việc và đồ họa.
          </p>

          <NewsSearchBar initialQuery={currentSearch} />
        </div>
      </section>

      <div className="news-main-wrap">
        {/* ── FEATURED HERO ARTICLE (hiển thị khi ở trang 1 và không tìm kiếm) ── */}
        {!currentSearch && currentCategory === 'Tất cả' && currentPage === 1 && mainFeatured && (
          <section className="news-featured-hero">
            <Link href={`/tin-tuc/${mainFeatured.slug || mainFeatured.id}`} className="featured-hero-card">
              <div className="featured-hero-image-wrap">
                <img
                  src={mainFeatured.hinh_anh || '/uploads/macbook-pro-16-m3.jpg'}
                  alt={mainFeatured.tieu_de}
                  className="featured-hero-image"
                />
                <span className="featured-hero-badge">BÀI VIẾT NỔI BẬT NHẤT</span>
              </div>
              <div className="featured-hero-content">
                <div className="featured-hero-meta">
                  <span className="featured-hero-cat">{mainFeatured.danh_muc}</span>
                  <span className="featured-hero-dot">•</span>
                  <span>{new Date(mainFeatured.created_at).toLocaleDateString('vi-VN')}</span>
                  <span className="featured-hero-dot">•</span>
                  <span>{mainFeatured.luot_xem || 0} lượt xem</span>
                </div>
                <h2 className="featured-hero-title">{mainFeatured.tieu_de}</h2>
                <p className="featured-hero-desc">{mainFeatured.tom_tat}</p>
                <div className="featured-hero-cta">
                  <span>Khám phá bài viết</span>
                  <span className="cta-arrow">→</span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── CATEGORY PILLS FILTER (Pure Link tags, no useState) ── */}
        <section className="news-categories-bar">
          <div className="news-categories-list">
            <Link
              href={buildNewsUrl(params, { category: 'Tất cả', page: null })}
              className={`news-cat-btn ${currentCategory === 'Tất cả' ? 'active' : ''}`}
            >
              Tất cả bài viết
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.danh_muc}
                href={buildNewsUrl(params, { category: cat.danh_muc, page: null })}
                className={`news-cat-btn ${currentCategory === cat.danh_muc ? 'active' : ''}`}
              >
                {cat.danh_muc} <span className="cat-count">({cat.count})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── SEARCH BANNER RESULT (nếu có tìm kiếm) ── */}
        {currentSearch && (
          <div className="news-filter-status">
            <span>
              Kết quả tìm kiếm cho từ khóa: <strong>"{currentSearch}"</strong> ({pagination.total} bài viết)
            </span>
            <Link href="/tin-tuc" className="news-clear-filter-btn">
              Xóa tìm kiếm
            </Link>
          </div>
        )}

        {/* ── ARTICLES GRID ── */}
        {articles.length === 0 ? (
          <div className="news-empty-state">
            <h3>Không tìm thấy bài viết nào phù hợp</h3>
            <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục bài viết khác.</p>
            <Link href="/tin-tuc" className="news-empty-reset-btn">
              Xem tất cả bài viết
            </Link>
          </div>
        ) : (
          <div className="news-grid">
            {articles.map((item) => (
              <article key={item.id} className="news-card">
                <Link href={`/tin-tuc/${item.slug || item.id}`} className="news-card-thumb-wrap">
                  <img
                    src={item.hinh_anh || '/uploads/macbook-pro-16-m3.jpg'}
                    alt={item.tieu_de}
                    className="news-card-thumb"
                    loading="lazy"
                  />
                  <span className="news-card-cat">{item.danh_muc}</span>
                  {item.noi_bat === 1 && <span className="news-card-featured-star">Nổi bật</span>}
                </Link>
                <div className="news-card-body">
                  <div className="news-card-meta">
                    <span>{item.tac_gia_ten}</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <h3 className="news-card-title">
                    <Link href={`/tin-tuc/${item.slug || item.id}`}>
                      {item.tieu_de}
                    </Link>
                  </h3>
                  <p className="news-card-desc">{item.tom_tat}</p>
                  <div className="news-card-footer">
                    <span className="news-card-views">{item.luot_xem || 0} lượt xem</span>
                    <Link href={`/tin-tuc/${item.slug || item.id}`} className="news-card-link">
                      Đọc tiếp <span>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── PAGINATION (Pure Link navigation) ── */}
        {pagination.totalPages > 1 && (
          <div className="news-pagination">
            {currentPage > 1 ? (
              <Link
                href={buildNewsUrl(params, { page: currentPage - 1 })}
                className="news-page-btn prev-btn"
              >
                ← Trang trước
              </Link>
            ) : (
              <span className="news-page-btn prev-btn disabled" aria-disabled="true">
                ← Trang trước
              </span>
            )}

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={buildNewsUrl(params, { page: pageNum })}
                className={`news-page-num ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </Link>
            ))}

            {currentPage < pagination.totalPages ? (
              <Link
                href={buildNewsUrl(params, { page: currentPage + 1 })}
                className="news-page-btn next-btn"
              >
                Trang sau →
              </Link>
            ) : (
              <span className="news-page-btn next-btn disabled" aria-disabled="true">
                Trang sau →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
