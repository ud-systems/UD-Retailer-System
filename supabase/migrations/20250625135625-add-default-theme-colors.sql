-- Add default theme colors to admin_settings
-- This migration ensures that theme colors are available for the theming system

-- Insert default theme colors
INSERT INTO public.admin_settings (key, value) VALUES
('app-theme-colors', '{"primary":"#228B22","secondary":"#f1f5f9","accent":"#39FF14","active":"#22c55e","inactive":"#ef4444"}')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert default company branding
INSERT INTO public.admin_settings (key, value) VALUES
('company-branding', '{"logoUrl":"","companyName":"Retailer Management System"}')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert custom theme configuration
INSERT INTO public.admin_settings (key, value) VALUES
('custom-theme', '{"primaryColor":"#228B22","secondaryColor":"#f1f5f9","accentColor":"#39FF14","backgroundColor":"#ffffff","textColor":"#000000"}')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW(); 