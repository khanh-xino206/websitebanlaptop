import Link from 'next/link';
import { getFeaturedNews } from '@/lib/api';

export default async function TinTucSection() {
  const articles = await getFeaturedNews();

  if (!articles || !articles.length) return null;

  return (
    <section className="home-news-section">
      <div className="home-news-header">
        <div>
          <span className="home-news-badge">TIN TỨC CÔNG NGHỆ</span>
          <h2 className="home-news-title">Bài Viết & Đánh Giá Mới Nhất</h2>
          <p className="home-news-desc">Cập nhật xu hướng công nghệ, mẹo hay và các chương trình khuyến mãi laptop hấp dẫn</p>
        </div>
        <Link href="/tin-tuc" className="home-news-more-btn">
          Xem tất cả bài viết <span>→</span>
        </Link>
      </div>

      <div className="home-news-grid">
        {articles.slice(0, 3).map((article) => (
          <article key={article.id} className="home-news-card">
            <Link href={`/tin-tuc/${article.slug || article.id}`} className="home-news-thumb-wrap">
              <img
                src={article.hinh_anh || '/uploads/macbook-pro-16-m3.jpg'}
                alt={article.tieu_de}
                className="home-news-thumb"
                loading="lazy"
              />
              <span className="home-news-category">{article.danh_muc}</span>
            </Link>
            <div className="home-news-body">
              <div className="home-news-meta">
                <span className="home-news-author">{article.tac_gia_ten}</span>
                <span className="home-news-date">
                  {new Date(article.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="home-news-views">{article.luot_xem || 0} lượt xem</span>
              </div>
              <h3 className="home-news-card-title">
                <Link href={`/tin-tuc/${article.slug || article.id}`}>
                  {article.tieu_de}
                </Link>
              </h3>
              <p className="home-news-excerpt">
                {article.tom_tat}
              </p>
              <Link href={`/tin-tuc/${article.slug || article.id}`} className="home-news-read-more">
                Đọc bài viết <span>→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
