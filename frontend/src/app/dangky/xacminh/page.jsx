'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get('email');
    router.replace(`/dang-ky/xac-minh${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Đang chuyển hướng đến trang xác minh...</p>
    </div>
  );
}

export default function DangKyXacMinhRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
