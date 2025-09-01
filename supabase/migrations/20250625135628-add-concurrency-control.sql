-- Add version columns for optimistic locking
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.salespersons ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create locks table for exclusive access control
CREATE TABLE IF NOT EXISTS public.locks (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON public.locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_locks_table_record ON public.locks(table_name, record_id);

-- Enable RLS on locks table
ALTER TABLE public.locks ENABLE ROW LEVEL SECURITY;

-- RLS policies for locks table
CREATE POLICY "Users can manage their own locks" ON public.locks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'manager')
  )
);

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.locks 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired locks (runs every 5 minutes)
SELECT cron.schedule(
  'cleanup-expired-locks',
  '*/5 * * * *',
  'SELECT public.cleanup_expired_locks();'
);

-- Function to increment version on update
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for version incrementing
DROP TRIGGER IF EXISTS increment_retailer_version ON public.retailers;
CREATE TRIGGER increment_retailer_version
  BEFORE UPDATE ON public.retailers
  FOR EACH ROW EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_order_version ON public.orders;
CREATE TRIGGER increment_order_version
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_product_version ON public.products;
CREATE TRIGGER increment_product_version
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_salesperson_version ON public.salespersons;
CREATE TRIGGER increment_salesperson_version
  BEFORE UPDATE ON public.salespersons
  FOR EACH ROW EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_profile_version ON public.profiles;
CREATE TRIGGER increment_profile_version
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.increment_version();

-- Function to handle concurrent updates with conflict detection
CREATE OR REPLACE FUNCTION public.handle_concurrent_update(
  p_table_name TEXT,
  p_record_id TEXT,
  p_expected_version INTEGER,
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  current_version INTEGER;
  result JSONB;
BEGIN
  -- Get current version
  EXECUTE format('SELECT version FROM %I WHERE id = $1', p_table_name)
  INTO current_version
  USING p_record_id;

  -- Check if version matches
  IF current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Version mismatch',
      'current_version', current_version,
      'expected_version', p_expected_version
    );
  END IF;

  -- Perform update
  EXECUTE format(
    'UPDATE %I SET %s, version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $2 RETURNING *',
    p_table_name,
    (SELECT string_agg(key || ' = $' || (idx + 3), ', ')
     FROM jsonb_object_keys(p_updates) WITH ORDINALITY AS t(key, idx))
  )
  USING p_record_id, p_expected_version, 
        (SELECT array_agg(value) FROM jsonb_array_elements_text(p_updates));

  -- Check if update was successful
  IF FOUND THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Update failed - record may have been modified'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.locks IS 'Table for managing exclusive locks on records';
COMMENT ON FUNCTION public.cleanup_expired_locks() IS 'Removes expired locks from the locks table';
COMMENT ON FUNCTION public.increment_version() IS 'Automatically increments version field on record updates';
COMMENT ON FUNCTION public.handle_concurrent_update() IS 'Handles concurrent updates with version checking and conflict resolution'; 