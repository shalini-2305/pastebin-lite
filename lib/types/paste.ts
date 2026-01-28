// Input types
export interface CreatePasteInput {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

// Database paste type
export interface Paste {
  id: string;
  content: string;
  ttl_seconds: number | null;
  max_views: number | null;
  view_count: number;
  created_at: string;
  expires_at: string | null;
}

// API response types
export interface CreatePasteResponse {
  id: string;
  url: string;
}

export interface PasteResponse {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

export interface HealthCheckResponse {
  ok: boolean;
}

// Unavailability reason types
export type PasteUnavailabilityReason = 
  | 'not_found'
  | 'expired'
  | 'max_views_reached';

export interface PasteUnavailabilityInfo {
  reason: PasteUnavailabilityReason;
  paste?: Paste | null; // Paste data if it exists but is unavailable
}

