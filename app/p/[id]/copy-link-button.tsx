'use client';

import { useState } from 'react';

interface CopyLinkButtonProps {
  pasteId: string;
}

export default function CopyLinkButton({ pasteId }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      // Construct the full URL
      const url = `${window.location.origin}/p/${pasteId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <button
      onClick={handleCopyLink}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#CDE7EB]/30 dark:bg-[#CDE7EB]/20 border border-[#CDE7EB] dark:border-[#CDE7EB]/50 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-[#CDE7EB]/50 dark:hover:bg-[#CDE7EB]/30 transition-colors"
      title={copied ? 'Link copied!' : 'Copy paste link'}
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Link copied!</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span>Copy Link</span>
        </>
      )}
    </button>
  );
}

