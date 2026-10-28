import Link from 'next/link';
import { getNewsById } from '@/lib/api';
import CopyLinkButton from '../components/CopyLinkButton';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getNewsById(id);
  if (!article) {
    return {
      title: 'Không tìm thấy bài viết | KTSHOP News',
    };
  }
  return {
    title: `${article.tieu_de} | KTSHOP News`,
    description: article.tom_tat || 'Tin tức công nghệ và đánh giá laptop tại KTSHOP.',
    openGraph: {
      images: article.hinh_anh ? [article.hinh_anh] : [],
    },
  };
}

export default async function NewsDetailPage({ params }) {
  const { id } = await params;
  const article = await getNewsById(id);

  if (!article) {
    return (
      <div className="news-detail-container">
        <div className="news-not-found">
          <h2>Bài viết không tồn tại</h2>
          <p>Bài viết bạn tìm kiếm có thể đã bị xóa hoặc đang ở chế độ ẩn.</p>
          <Link href="/tin-tuc" className="news-back-button">
            ← Quay lại trang Tin Tức
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="news-detail-container">
      {/* ── BREADCRUMB ── */}
      <nav className="news-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href="/tin-tuc">Tin tức</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{article.tieu_de}</span>
      </nav>

      {/* ── ARTICLE HEADER ── */}
      <header className="news-detail-header">
        <div className="news-detail-cat-badge">{article.danh_muc}</div>
        <h1 className="news-detail-title">{article.tieu_de}</h1>

        <div className="news-detail-author-bar">
          <div className="author-info">
            <div className="author-avatar">KT</div>
            <div>
              <strong className="author-name">{article.tac_gia_ten || 'KTSHOP News'}</strong>
              <div className="news-publish-info">
                <span>
                  Xuất bản: {new Date(article.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="info-sep">•</span>
                <span>{article.luot_xem || 0} lượt xem</span>
              </div>
            </div>
          </div>

          <div className="news-share-actions">
            <CopyLinkButton variant="btn" />
          </div>
        </div>
      </header>

      {/* ── FEATURED IMAGE ── */}
      {article.hinh_anh && (
        <div className="news-detail-featured-media">
          <img
            src={article.hinh_anh}
            alt={article.tieu_de}
            className="news-detail-main-img"
          />
        </div>
      )}

      {/* ── SUMMARY LEAD ── */}
      {article.tom_tat && (
        <div className="news-detail-lead">
          <p>{article.tom_tat}</p>
        </div>
      )}

      {/* ── BODY CONTENT ── */}
      <div
        className="news-detail-content"
        dangerouslySetInnerHTML={{ __html: article.noi_dung }}
      />

      {/* ── FOOTER ACTIONS & CTA ── */}
      <div className="news-detail-footer-bar">
        <div className="news-tags">
          <span className="tag-label">Chủ đề:</span>
          <span className="news-tag-item">{article.danh_muc}</span>
          <span className="news-tag-item">Laptop KTSHOP</span>
          <span className="news-tag-item">Công nghệ 2026</span>
        </div>

        <CopyLinkButton variant="pill" />
      </div>

      {/* ── PROMO BANNER ── */}
      <section className="news-promo-banner">
        <div className="news-promo-content">
          <span className="news-promo-tag">ƯU ĐÃI ĐẶC QUYỀN TẠI KTSHOP</span>
          <h3>Tìm Kiếm Chiếc Laptop Hoàn Hảo Cho Nhu Cầu Của Bạn?</h3>
          <p>Hơn 36 mẫu laptop cao cấp từ Dell, HP, Asus, Lenovo, Acer & Apple với giá tốt nhất thị trường, bảo hành chính hãng tới 24 tháng.</p>
          <Link href="/san-pham" className="news-promo-btn">
            Khám phá kho sản phẩm ngay <span>→</span>
          </Link>
        </div>
      </section>

      {/* ── RELATED ARTICLES ── */}
      {article.tin_lien_quan && article.tin_lien_quan.length > 0 && (
        <section className="news-related-section">
          <div className="news-related-header">
            <h2>Bài Viết Liên Quan Cùng Chủ Đề</h2>
            <Link href="/tin-tuc" className="news-related-all">Xem tất cả →</Link>
          </div>

          <div className="news-related-grid">
            {article.tin_lien_quan.map((rel) => (
              <div key={rel.id} className="news-related-card">
                <Link href={`/tin-tuc/${rel.slug || rel.id}`} className="news-related-thumb-link">
                  <img
                    src={rel.hinh_anh || '/uploads/macbook-pro-16-m3.jpg'}
                    alt={rel.tieu_de}
                    className="news-related-thumb"
                  />
                  <span className="news-related-cat">{rel.danh_muc}</span>
                </Link>
                <div className="news-related-body">
                  <span className="news-related-date">{new Date(rel.created_at).toLocaleDateString('vi-VN')}</span>
                  <h4 className="news-related-title">
                    <Link href={`/tin-tuc/${rel.slug || rel.id}`}>
                      {rel.tieu_de}
                    </Link>
                  </h4>
                  <p className="news-related-excerpt">{rel.tom_tat}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
