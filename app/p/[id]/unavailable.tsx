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

  const getIcon = () => {
    switch (reason) {
      case 'expired':
        return (
          <svg
            className="w-16 h-16 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'max_views_reached':
        return (
          <svg
            className="w-16 h-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        );
      case 'not_found':
        return (
          <svg
            className="w-16 h-16 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-16 h-16 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
    }
  };

  const getColorClasses = () => {
    switch (reason) {
      case 'expired':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
        };
      case 'max_views_reached':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
        };
      case 'not_found':
        return {
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
        };
      default:
        return {
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          text: 'text-slate-700 dark:text-slate-300',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-lg w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-2 border-slate-200 dark:border-slate-700 p-8 sm:p-12">
          {/* 404 Status Code */}
          <div className="mb-6">
            <span className="text-4xl sm:text-5xl font-bold text-slate-400 dark:text-slate-600">
              404
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {getTitle()}
          </h1>

          {/* Message */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {getMessage()}
          </p>

          {/* Action Button */}
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

