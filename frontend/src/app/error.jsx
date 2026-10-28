'use client';

import { useEffect } from 'react';
import ErrorDisplay from './components/ErrorDisplay';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('KTSHOP Runtime Error caught:', error);
  }, [error]);

  return (
    <ErrorDisplay
      code={500}
      customSubtitle={error?.message || 'Đã xảy ra lỗi không mong muốn khi tải trang.'}
      errorDetail={error?.stack || error?.digest || String(error)}
      onRetry={() => reset()}
    />
  );
}
