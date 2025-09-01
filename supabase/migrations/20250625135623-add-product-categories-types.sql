-- Migration: Add product categories and types tables
-- Date: 2025-06-29

-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create product_types table
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Insert default categories
INSERT INTO public.product_categories (name, description, color, created_by) VALUES
('Disposable', 'Single-use disposable products', '#F59E0B', 'system'),
('Refillable', 'Reusable products that can be refilled', '#10B981', 'system');

-- Insert default types
INSERT INTO public.product_types (name, description, color, created_by) VALUES
('Disposable', 'Single-use disposable vape devices', '#F59E0B', 'system'),
('Closed Pod', 'Closed pod system devices', '#3B82F6', 'system'),
('Open System', 'Open system refillable devices', '#8B5CF6', 'system');

-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.product_categories(id),
ADD COLUMN type_id UUID REFERENCES public.product_types(id);

-- Update existing products to use the new foreign keys
-- Cast ENUM values to text for proper comparison
UPDATE public.products 
SET category_id = (SELECT id FROM public.product_categories WHERE name = products.category::text),
    type_id = (SELECT id FROM public.product_types WHERE name = products.product_type::text);

-- Make the new columns NOT NULL after data migration
ALTER TABLE public.products 
ALTER COLUMN category_id SET NOT NULL,
ALTER COLUMN type_id SET NOT NULL;

-- Drop the old ENUM columns (we'll keep them for now to avoid breaking existing code)
-- ALTER TABLE public.products DROP COLUMN category;
-- ALTER TABLE public.products DROP COLUMN product_type;

-- Enable RLS on new tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_categories
CREATE POLICY "All users can view product categories" ON public.product_categories 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage product categories" ON public.product_categories 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for product_types
CREATE POLICY "All users can view product types" ON public.product_types 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage product types" ON public.product_types 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Add comments for documentation
COMMENT ON TABLE public.product_categories IS 'Product categories that can be managed by admins';
COMMENT ON TABLE public.product_types IS 'Product types that can be managed by admins';
COMMENT ON COLUMN public.product_categories.color IS 'Color for UI display (hex format)';
COMMENT ON COLUMN public.product_types.color IS 'Color for UI display (hex format)'; 