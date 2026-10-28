'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckboxGroup from './filters/CheckboxGroup';
import PriceRangeInput from './filters/PriceRangeInput';

export default function FilterSidebar({
  filters,
  currentParams = {},
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selBrands = currentParams.brand ? currentParams.brand.split(',').filter(Boolean) : [];
  const selDemands = currentParams.nhu_cau ? currentParams.nhu_cau.split(',').filter(Boolean) : [];
  const selCpus = currentParams.cpu ? currentParams.cpu.split(',').filter(Boolean) : [];
  const selRams = currentParams.ram ? currentParams.ram.split(',').filter(Boolean) : [];
  const selDisks = currentParams.o_cung ? currentParams.o_cung.split(',').filter(Boolean) : [];
  const selColors = currentParams.mau_sac ? currentParams.mau_sac.split(',').filter(Boolean) : [];

  const activeCount = selBrands.length + selDemands.length + selCpus.length + selRams.length + selDisks.length + selColors.length + (currentParams.q ? 1 : 0) + (currentParams.gia_min || currentParams.gia_max ? 1 : 0);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleArrayFilter = (key, val) => {
    const current = (currentParams[key] || '').split(',').filter(Boolean);
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    updateParam(key, next.length ? next.join(',') : null);
  };

  const handlePriceApply = (minVal, maxVal) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (minVal !== null && minVal !== undefined && minVal !== '') {
      params.set('gia_min', String(minVal));
    } else {
      params.delete('gia_min');
    }
    if (maxVal !== null && maxVal !== undefined && maxVal !== '') {
      params.set('gia_max', String(maxVal));
    } else {
      params.delete('gia_max');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="sp-sidebar">
      <div className="sp-sidebar-inner">
        <div className="sidebar-top">
          <span className="sidebar-title">Bộ Lọc</span>
          {activeCount > 0 ? (
            <Link href="/san-pham" className="sidebar-reset">
              Xóa bộ lọc ({activeCount})
            </Link>
          ) : (
            <span className="sidebar-reset dim">
              Xóa bộ lọc
            </span>
          )}
        </div>

        {filters ? (
          <>
            <CheckboxGroup
              title="Thương Hiệu"
              items={filters.brands}
              selected={selBrands}
              onToggle={val => toggleArrayFilter('brand', val)}
            />
            <CheckboxGroup
              title="Nhu Cầu Sử Dụng"
              items={filters.nhu_cau}
              selected={selDemands}
              onToggle={val => toggleArrayFilter('nhu_cau', val)}
            />
            <CheckboxGroup
              title="CPU / Bộ xử lý"
              items={filters.cpus}
              selected={selCpus}
              onToggle={val => toggleArrayFilter('cpu', val)}
            />
            <CheckboxGroup
              title="RAM"
              items={filters.rams}
              selected={selRams}
              onToggle={val => toggleArrayFilter('ram', val)}
            />
            <CheckboxGroup
              title="Ổ Cứng"
              items={filters.disks}
              selected={selDisks}
              onToggle={val => toggleArrayFilter('o_cung', val)}
            />
            <CheckboxGroup
              title="Màu Sắc"
              items={filters.colors}
              selected={selColors}
              onToggle={val => toggleArrayFilter('mau_sac', val)}
            />
            <PriceRangeInput
              min={filters.priceRange?.min || 0}
              max={filters.priceRange?.max || 100000000}
              currentMin={currentParams.gia_min}
              currentMax={currentParams.gia_max}
              onApply={handlePriceApply}
            />
          </>
        ) : (
          <div className="filter-loading">Đang tải bộ lọc…</div>
        )}
      </div>
    </aside>
  );
}
