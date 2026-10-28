'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get('code') || '404';
  const [selectedCode, setSelectedCode] = useState(initialCode);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setSelectedCode(codeParam);
    }
  }, [searchParams]);

  const handleSelectCode = (code) => {
    setSelectedCode(code);
    router.push(`/loi?code=${code}`, { scroll: false });
  };

  return (
    <ErrorDisplay
      code={selectedCode}
      showCodeSwitcher={true}
      onSelectCode={handleSelectCode}
    />
  );
}

export default function LoiPage() {
  return (
    <Suspense fallback={<div className="account-loading" style={{ minHeight: '60vh' }}>Đang tải giao diện lỗi...</div>}>
      <ErrorPageContent />
    </Suspense>
  );
}
