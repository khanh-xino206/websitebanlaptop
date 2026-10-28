'use client';

import './globals.css';
import ErrorDisplay from './components/ErrorDisplay';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="vi">
      <body className="page-layout">
        <ErrorDisplay
          code={500}
          customTitle="Sự cố hệ thống nghiêm trọng"
          customSubtitle={error?.message || 'Giao diện hệ thống gặp lỗi khi tải bố cục chính.'}
          errorDetail={error?.stack || error?.digest || String(error)}
          onRetry={() => reset()}
        />
      </body>
    </html>
  );
}
