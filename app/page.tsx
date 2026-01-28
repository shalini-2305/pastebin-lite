'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CreatePasteResponse } from '@/lib/types/paste';

export default function Home() {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState<number | ''>('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build request body
      const body: {
        content: string;
        ttl_seconds?: number;
        max_views?: number;
      } = { content };

      if (ttlSeconds) {
        body.ttl_seconds = Number(ttlSeconds);
      }
      if (maxViews) {
        body.max_views = Number(maxViews);
      }

      // Create paste
      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create paste');
      }

      // Validate response type
      const pasteResponse = data as CreatePasteResponse;
      if (!pasteResponse.id) {
        throw new Error('Invalid response from server');
      }

      // Redirect to the paste URL
      router.push(`/p/${pasteResponse.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <main className="w-full max-w-3xl">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Pastebin-Lite
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Paste Content Field */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300"
                >
                  Paste Content
                  <span className="text-red-500 ml-1" aria-label="required">
                    *
                  </span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={14}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-50 font-mono text-sm leading-relaxed focus:outline-none focus:border-[#CDE7EB] dark:focus:border-[#CDE7EB] focus:ring-4 focus:ring-[#CDE7EB]/20 dark:focus:ring-[#CDE7EB]/20 transition-all resize-y"
                  placeholder="Enter your text, code, or snippet here..."
                  aria-describedby={error ? 'error-message' : 'content-help'}
                />
                <p
                  id="content-help"
                  className="mt-2 text-xs text-slate-500 dark:text-slate-400"
                >
                  Supports plain text, code, and formatted content
                </p>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ttl"
                    className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-1.5">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      TTL (seconds)
                    </span>
                  </label>
                  <input
                    type="number"
                    id="ttl"
                    value={ttlSeconds}
                    onChange={(e) =>
                      setTtlSeconds(e.target.value ? Number(e.target.value) : '')
                    }
                    min="1"
                    step="1"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-[#CDE7EB] dark:focus:border-[#CDE7EB] focus:ring-4 focus:ring-[#CDE7EB]/20 dark:focus:ring-[#CDE7EB]/20 transition-all"
                    placeholder="Optional"
                    aria-label="Time to live in seconds"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Auto-expire after this time
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="maxViews"
                    className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-1.5">
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Max Views
                    </span>
                  </label>
                  <input
                    type="number"
                    id="maxViews"
                    value={maxViews}
                    onChange={(e) =>
                      setMaxViews(e.target.value ? Number(e.target.value) : '')
                    }
                    min="1"
                    step="1"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-[#CDE7EB] dark:focus:border-[#CDE7EB] focus:ring-4 focus:ring-[#CDE7EB]/20 dark:focus:ring-[#CDE7EB]/20 transition-all"
                    placeholder="Optional"
                    aria-label="Maximum number of views"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Limit how many times it can be viewed
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  id="error-message"
                  role="alert"
                  className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300"
                >
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">Error creating paste</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full py-3.5 px-6 bg-[#5BA3B0] hover:bg-[#4A9BA8] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#CDE7EB]/30 flex items-center justify-center gap-2"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Creating Paste...</span>
                  </>
                ) : (
                  <span>Create Paste</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Info */}
          <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
            Your paste will be available via a shareable link
          </p>
        </main>
      </div>
    </div>
  );
}
