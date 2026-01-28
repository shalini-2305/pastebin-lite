import Link from 'next/link';
import { PasteUnavailabilityReason } from '@/lib/types/paste';

interface UnavailableProps {
  reason: PasteUnavailabilityReason;
  expiresAt?: string | null;
  maxViews?: number | null;
  viewCount?: number;
}

/**
 * Component to display specific reasons why a paste is unavailable
 */
export default function Unavailable({ 
  reason, 
  expiresAt, 
  maxViews, 
  viewCount 
}: UnavailableProps) {
  const getTitle = () => {
    switch (reason) {
      case 'expired':
        return 'Paste Expired';
      case 'max_views_reached':
        return 'Maximum Views Reached';
      case 'not_found':
        return 'Paste Not Found';
      default:
        return 'Paste Unavailable';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'expired':
        return expiresAt
          ? `This paste expired on ${new Date(expiresAt).toLocaleString()}`
          : 'This paste has expired and is no longer available.';
      case 'max_views_reached':
        return maxViews !== null && viewCount !== undefined
          ? `This paste has reached its maximum view limit of ${maxViews} views (currently at ${viewCount} views).`
          : 'This paste has reached its maximum view limit.';
      case 'not_found':
        return 'This paste does not exist or has been deleted.';
      default:
        return 'This paste is not available.';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
          {getTitle()}
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
          {getMessage()}
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

