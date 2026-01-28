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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-black dark:text-zinc-50">
          Pastebin-Lite
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
            >
              Paste Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
              placeholder="Enter your text here..."
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ttl"
                className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
              >
                TTL (seconds)
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
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Optional"
                aria-label="Time to live in seconds"
              />
            </div>

            <div>
              <label
                htmlFor="maxViews"
                className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
              >
                Max Views
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
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-colors"
                placeholder="Optional"
                aria-label="Maximum number of views"
              />
            </div>
          </div>

          {error && (
            <div
              id="error-message"
              role="alert"
              className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 px-6 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
            aria-busy={loading}
          >
            {loading ? 'Creating...' : 'Create Paste'}
          </button>
        </form>
      </main>
    </div>
  );
}
