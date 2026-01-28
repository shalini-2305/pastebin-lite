import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getPasteAndIncrementViews, getPasteUnavailabilityReason } from '@/lib/db/pastes';
import { pasteIdSchema } from '@/lib/schemas/paste';
import Unavailable from './unavailable';
import CopyButton from './copy-button';
import CopyLinkButton from './copy-link-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * View paste page - displays paste content safely
 * GET /p/:id
 */
export default async function PastePage({ params }: PageProps) {
  const { id } = await params;

  // Validate ID format
  const idValidation = pasteIdSchema.safeParse({ id });
  if (!idValidation.success) {
    notFound();
  }

  // Get test time if TEST_MODE is enabled
  // Note: In Next.js App Router, we need to construct a Request-like object
  // to pass to getTestTime, or extract the header directly
  const headersList = await headers();
  let testNowMs: number | null = null;
  
  if (process.env.TEST_MODE === '1') {
    const testNowMsHeader = headersList.get('x-test-now-ms');
    if (testNowMsHeader) {
      const parsed = parseInt(testNowMsHeader, 10);
      testNowMs = isNaN(parsed) ? null : parsed;
    }
  }

  // Fetch paste and increment views
  let paste;
  try {
    paste = await getPasteAndIncrementViews(id, testNowMs ?? undefined);
  } catch (error) {
    console.error('Error fetching paste:', error);
    notFound();
  }

  // If paste not found or unavailable, determine the reason and show specific error
  if (!paste) {
    const unavailabilityInfo = await getPasteUnavailabilityReason(
      id,
      testNowMs ?? undefined
    );
    
    return (
      <Unavailable
        reason={unavailabilityInfo.reason}
        expiresAt={unavailabilityInfo.paste?.expires_at}
        maxViews={unavailabilityInfo.paste?.max_views}
        viewCount={unavailabilityInfo.paste?.view_count}
      />
    );
  }

  // Calculate remaining views for display
  const remainingViews =
    paste.max_views !== null
      ? Math.max(0, paste.max_views - paste.view_count)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Paste
            </h1>
          </div>

          {/* Metadata Badges and Copy Link Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-3">
              {remainingViews !== null && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#CDE7EB]/30 dark:bg-[#CDE7EB]/20 border border-[#CDE7EB] dark:border-[#CDE7EB]/50 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
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
                  <span>
                    {remainingViews} {remainingViews === 1 ? 'view' : 'views'} remaining
                  </span>
                </div>
              )}
              {paste.expires_at && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-300">
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
                  <span>
                    Expires: {new Date(paste.expires_at).toLocaleString()}
                  </span>
                </div>
              )}
              {!remainingViews && !paste.expires_at && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium text-green-700 dark:text-green-300">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>No expiration</span>
                </div>
              )}
            </div>
            <CopyLinkButton pasteId={id} />
          </div>
        </div>

        {/* Paste Content Card */}
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden mb-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Content
              </span>
              <CopyButton content={paste.content} />
            </div>
          </div>
          <div className="p-6">
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-50 overflow-x-auto">
              {paste.content}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5BA3B0] hover:bg-[#4A9BA8] text-white rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#CDE7EB]/30"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create a new paste</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

