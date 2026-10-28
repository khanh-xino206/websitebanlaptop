import { Suspense } from 'react';
import Banner from './components/Banner';
import ProductSection from './components/ProductSection';
import TinTucSection from './components/TinTucSection';

export default function HomePage() {
  return (
    <div className="home-page-container">
      <Banner />

      {/* Feature & Trust Badges */}
      <section className="trust-features-bar">
        <div className="trust-features-inner">
          <div className="trust-feature-item">
            <div>
              <h4>100% Chính Hãng</h4>
              <p>Phân phối chính hãng từ các thương hiệu hàng đầu</p>
            </div>
          </div>
          <div className="trust-feature-item">
            <div>
              <h4>Giao Hàng Siêu Tốc</h4>
              <p>Miễn phí vận chuyển toàn quốc cho đơn từ 5 triệu</p>
            </div>
          </div>
          <div className="trust-feature-item">
            <div>
              <h4>Đổi Mới 30 Ngày</h4>
              <p>Lỗi phần cứng đổi máy mới ngay trong 30 ngày</p>
            </div>
          </div>
          <div className="trust-feature-item">
            <div>
              <h4>Bảo Hành Tận Tâm</h4>
              <p>Hỗ trợ kỹ thuật 24/7 & miễn phí vệ sinh laptop trọn đời</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
        <Suspense fallback={<div className="loading-state" style={{ padding: '40px 0', textAlign: 'center' }}>Đang tải dữ liệu sản phẩm...</div>}>
          <ProductSection />
        </Suspense>

        <Suspense fallback={<div className="loading-state" style={{ padding: '40px 0', textAlign: 'center' }}>Đang tải bài viết mới nhất...</div>}>
          <TinTucSection />
        </Suspense>
      </div>
    </div>
  );
}
