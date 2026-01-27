// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      pastes: {
        Row: {
          id: string;
          content: string;
          ttl_seconds: number | null;
          max_views: number | null;
          view_count: number;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          content: string;
          ttl_seconds?: number | null;
          max_views?: number | null;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          ttl_seconds?: number | null;
          max_views?: number | null;
          view_count?: number;
        };
      };
    };
  };
}

