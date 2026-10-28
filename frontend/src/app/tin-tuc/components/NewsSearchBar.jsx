'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewsSearchBar({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/tin-tuc?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/tin-tuc');
    }
  };

  const handleClear = () => {
    setQuery('');
    router.push('/tin-tuc');
  };

  return (
    <form className="news-search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tìm kiếm bài viết, hướng dẫn, đánh giá..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="news-search-input"
      />
      {query && (
        <button
          type="button"
          className="news-search-clear"
          onClick={handleClear}
          aria-label="Xóa tìm kiếm"
        >
          ✕
        </button>
      )}
      <button type="submit" className="news-search-submit">
        Tìm kiếm
      </button>
    </form>
  );
}
