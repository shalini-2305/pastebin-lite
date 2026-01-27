-- Create pastes table
CREATE TABLE pastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (length(content) > 0),
  ttl_seconds INTEGER CHECK (ttl_seconds IS NULL OR ttl_seconds >= 1),
  max_views INTEGER CHECK (max_views IS NULL OR max_views >= 1),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_pastes_id ON pastes(id);
CREATE INDEX idx_pastes_expires_at ON pastes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_pastes_created_at ON pastes(created_at);

-- Function to set expires_at based on ttl_seconds
CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ttl_seconds IS NOT NULL THEN
    NEW.expires_at := NEW.created_at + (NEW.ttl_seconds || ' seconds')::INTERVAL;
  ELSE
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set expires_at on insert or update
CREATE TRIGGER trigger_set_expires_at
  BEFORE INSERT OR UPDATE OF ttl_seconds, created_at ON pastes
  FOR EACH ROW
  EXECUTE FUNCTION set_expires_at();

-- Function to check if paste is available
CREATE OR REPLACE FUNCTION is_paste_available(
  paste_id UUID,
  test_now_ms BIGINT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  paste_record RECORD;
  check_time TIMESTAMPTZ;
BEGIN
  SELECT * INTO paste_record FROM pastes WHERE id = paste_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Use test time if provided, otherwise use now()
  IF test_now_ms IS NOT NULL THEN
    check_time := to_timestamp(test_now_ms / 1000.0);
  ELSE
    check_time := now();
  END IF;
  
  -- Check TTL expiry
  IF paste_record.expires_at IS NOT NULL AND check_time >= paste_record.expires_at THEN
    RETURN FALSE;
  END IF;
  
  -- Check view limit
  IF paste_record.max_views IS NOT NULL AND paste_record.view_count >= paste_record.max_views THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_paste_views(
  paste_id UUID,
  test_now_ms BIGINT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_view_count INTEGER;
  check_time TIMESTAMPTZ;
BEGIN
  -- Use test time if provided
  IF test_now_ms IS NOT NULL THEN
    check_time := to_timestamp(test_now_ms / 1000.0);
  ELSE
    check_time := now();
  END IF;
  
  UPDATE pastes
  SET view_count = view_count + 1
  WHERE id = paste_id
    AND (max_views IS NULL OR view_count < max_views)
    AND (expires_at IS NULL OR expires_at > check_time)
  RETURNING view_count INTO new_view_count;
  
  RETURN COALESCE(new_view_count, -1);
END;
$$ LANGUAGE plpgsql;

