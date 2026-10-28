import { getHomeData } from '@/lib/api';
import Brand from './Brand';
import SanPham from './SanPham';

export default async function ProductSection() {
  const { brands, products } = await getHomeData();

  return (
    <div className="home-sections">
      {/* Section Thương Hiệu (Server Component) */}
      <Brand brands={brands} />

      <div className="section-divider" />

      {/* Section Sản Phẩm (Server Component) */}
      <SanPham products={products} />
    </div>
  );
}
