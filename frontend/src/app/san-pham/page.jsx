import Link from 'next/link';
import '../globals.css';
import { getProducts, getProductFilters } from '@/lib/api';
import FilterSidebar from './components/FilterSidebar';
import ProductList from './components/ProductList';

export const metadata = {
  title: 'Danh Sách Laptop Chính Hãng – Giá Tốt Nhất | KTSHOP',
  description: 'Khám phá hơn 100+ mẫu laptop Dell, HP, Asus, Lenovo, Apple chính hãng với cấu hình mạnh mẽ, bảo hành uy tín tại KTSHOP.',
};

export default async function SanPhamPage({ searchParams }) {
  const params = (await searchParams) || {};
  const [productsData, filters] = await Promise.all([
    getProducts(params),
    getProductFilters(),
  ]);

  const searchQuery = params.q || '';

  return (
    <div className="sp-page-layout">
      {searchQuery && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px 0' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Kết quả tìm kiếm cho: <strong>"{searchQuery}"</strong> ({productsData.pagination.total} sản phẩm)</span>
            <Link href="/san-pham" style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>
              Xóa tìm kiếm
            </Link>
          </div>
        </div>
      )}

      <div className="sp-page-body">
        <FilterSidebar
          filters={filters}
          currentParams={params}
        />

        <ProductList
          products={productsData.products}
          pagination={productsData.pagination}
          currentParams={params}
          filters={filters}
        />
      </div>
    </div>
  );
}
