import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getPasteAndIncrementViews } from '@/lib/db/pastes';
import { pasteIdSchema } from '@/lib/schemas/paste';

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

  // If paste not found or unavailable, show 404
  if (!paste) {
    notFound();
  }

  // Calculate remaining views for display
  const remainingViews =
    paste.max_views !== null
      ? Math.max(0, paste.max_views - paste.view_count)
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Paste
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            {remainingViews !== null && (
              <span>Remaining views: {remainingViews}</span>
            )}
            {paste.expires_at && (
              <span>
                Expires: {new Date(paste.expires_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Paste Content */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 shadow-sm">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-zinc-900 dark:text-zinc-50 overflow-x-auto">
            {paste.content}
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 underline transition-colors"
          >
            Create a new paste
          </Link>
        </div>
      </div>
    </div>
  );
}

