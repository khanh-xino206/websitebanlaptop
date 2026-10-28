'use client';

import { useState } from 'react';

export default function CopyLinkButton({ className = '', variant = 'pill' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        className={`news-detail-share-pill ${className}`}
        onClick={handleCopy}
      >
        {copied ? 'Đã copy link bài viết' : 'Sao chép link chia sẻ'}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`news-share-btn copy-btn ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      title="Sao chép đường dẫn bài viết"
    >
      {copied ? 'Đã sao chép' : 'Chia sẻ liên kết'}
    </button>
  );
}
