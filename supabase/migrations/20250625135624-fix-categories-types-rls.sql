-- Migration: Fix RLS policies for product categories and types
-- Date: 2025-06-29

-- Drop existing policies
DROP POLICY IF EXISTS "All users can view product categories" ON public.product_categories;
DROP POLICY IF EXISTS "Managers and admins can manage product categories" ON public.product_categories;
DROP POLICY IF EXISTS "All users can view product types" ON public.product_types;
DROP POLICY IF EXISTS "Managers and admins can manage product types" ON public.product_types;

-- Create more permissive policies for development
-- Allow all authenticated users to view
CREATE POLICY "Authenticated users can view product categories" ON public.product_categories 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view product types" ON public.product_types 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert (for development)
CREATE POLICY "Authenticated users can insert product categories" ON public.product_categories 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product types" ON public.product_types 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update (for development)
CREATE POLICY "Authenticated users can update product categories" ON public.product_categories 
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product types" ON public.product_types 
FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete (for development)
CREATE POLICY "Authenticated users can delete product categories" ON public.product_categories 
FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product types" ON public.product_types 
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default data if tables are empty
INSERT INTO public.product_categories (name, description, color, created_by) 
SELECT 'Disposable', 'Single-use disposable products', '#F59E0B', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories WHERE name = 'Disposable');

INSERT INTO public.product_categories (name, description, color, created_by) 
SELECT 'Refillable', 'Reusable products that can be refilled', '#10B981', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories WHERE name = 'Refillable');

INSERT INTO public.product_types (name, description, color, created_by) 
SELECT 'Disposable', 'Single-use disposable vape devices', '#F59E0B', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.product_types WHERE name = 'Disposable');

INSERT INTO public.product_types (name, description, color, created_by) 
SELECT 'Closed Pod', 'Closed pod system devices', '#3B82F6', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.product_types WHERE name = 'Closed Pod');

INSERT INTO public.product_types (name, description, color, created_by) 
SELECT 'Open System', 'Open system refillable devices', '#8B5CF6', 'system'
WHERE NOT EXISTS (SELECT 1 FROM public.product_types WHERE name = 'Open System'); 