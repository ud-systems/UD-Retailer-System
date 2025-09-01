-- Create error_logs table for storing application errors
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  message TEXT NOT NULL,
  stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on error_logs table
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for error_logs
-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs" ON public.error_logs 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can insert error logs
CREATE POLICY "Admins can insert error logs" ON public.error_logs 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can delete error logs
CREATE POLICY "Admins can delete error logs" ON public.error_logs 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create index for better performance
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_level ON public.error_logs(level);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);

-- Insert default admin settings for error logging
INSERT INTO public.admin_settings (key, value) VALUES
('errorLoggingEnabled', 'true'),
('errorLogRetentionDays', '30')
ON CONFLICT (key) DO NOTHING; 