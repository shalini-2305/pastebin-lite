import Link from 'next/link';

/**
 * Custom 404 page for unavailable pastes
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
          Paste not found or unavailable
        </p>
        <Link
          href="/"
          className="text-zinc-900 dark:text-zinc-50 underline hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
        >
          Create a new paste
        </Link>
      </div>
    </div>
  );
}

