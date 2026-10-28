const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function safeFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
      ...options,
    });
    if (!res.ok) {
      console.warn(`[Server Fetch] HTTP ${res.status} on ${url}`);
      return { success: false, status: res.status };
    }
    return await res.json();
  } catch (error) {
    console.error(`[Server Fetch Error] Failed to fetch ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ─── Trang chủ ──────────────────────────────────────────
export async function getHomeData() {
  const data = await safeFetch('/api/home');
  if (data?.success && Array.isArray(data.data)) {
    const brands = data.data.map(b => ({
      id: b.id,
      ten_NH: b.ten_NH,
      mo_ta: b.mo_ta,
    }));
    const products = data.data.flatMap(b => b.products || []);
    return { brands, products };
  }
  return { brands: [], products: [] };
}

// ─── Sản phẩm ───────────────────────────────────────────
export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  else query.set('limit', '15');
  if (params.q) query.set('q', params.q);
  if (params.brand) query.set('brand', params.brand);
  if (params.cpu) query.set('cpu', params.cpu);
  if (params.ram) query.set('ram', params.ram);
  if (params.o_cung) query.set('o_cung', params.o_cung);
  if (params.mau_sac) query.set('mau_sac', params.mau_sac);
  if (params.nhu_cau) query.set('nhu_cau', params.nhu_cau);
  if (params.sort && params.sort !== 'newest') query.set('sort', params.sort);
  if (params.gia_min) query.set('gia_min', String(params.gia_min));
  if (params.gia_max) query.set('gia_max', String(params.gia_max));

  const res = await safeFetch(`/api/san-pham?${query.toString()}`, { cache: 'no-store' });
  if (res?.success) {
    return {
      products: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, totalPages: 1 },
    };
  }
  return {
    products: [],
    pagination: { total: 0, page: 1, totalPages: 1 },
  };
}

export async function getProductFilters() {
  const res = await safeFetch('/api/san-pham/filters', { next: { revalidate: 300 } });
  if (res?.success) {
    return res.data;
  }
  return {
    brands: [],
    cpus: [],
    rams: [],
    disks: [],
    colors: [],
    priceRange: { min: 0, max: 100000000 },
  };
}

export async function getProductById(id) {
  const res = await safeFetch(`/api/san-pham/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res?.success && res.data) {
    return res.data;
  }
  return null;
}

// ─── Tin tức ────────────────────────────────────────────
export async function getFeaturedNews() {
  const res = await safeFetch('/api/tin-tuc/noi-bat', { next: { revalidate: 60 } });
  if (res?.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function getNewsCategories() {
  const res = await safeFetch('/api/tin-tuc/danh-muc', { next: { revalidate: 300 } });
  if (res?.success && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function getNewsList(params = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', String(params.limit || 9));
  if (params.category && params.category !== 'Tất cả') {
    query.set('category', params.category);
  }
  if (params.q) {
    query.set('q', params.q);
  }

  const res = await safeFetch(`/api/tin-tuc?${query.toString()}`, { cache: 'no-store' });
  if (res?.success) {
    return {
      articles: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 9, totalPages: 1 },
    };
  }
  return {
    articles: [],
    pagination: { total: 0, page: 1, limit: 9, totalPages: 1 },
  };
}

export async function getNewsById(id) {
  const res = await safeFetch(`/api/tin-tuc/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res?.success && res.data) {
    return res.data;
  }
  return null;
}
