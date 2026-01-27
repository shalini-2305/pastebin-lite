import { z } from 'zod';

// Schema for creating a paste
export const createPasteSchema = z.object({
  content: z.string().min(1, 'Content must be non-empty'),
  ttl_seconds: z.number().int().min(1).optional(),
  max_views: z.number().int().min(1).optional(),
});

// Schema for paste ID (UUID)
export const pasteIdSchema = z.object({
  id: z.string().uuid('Invalid paste ID format'),
});

// Response schemas
export const healthCheckResponseSchema = z.object({
  ok: z.boolean(),
});

export const createPasteResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
});

export const pasteResponseSchema = z.object({
  content: z.string(),
  remaining_views: z.number().int().nullable(),
  expires_at: z.string().nullable(),
});

