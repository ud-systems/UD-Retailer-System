-- Migration: Add price field to products table and unit_price to orders table
-- Date: 2025-06-28

-- Add price column to products table
ALTER TABLE public.products 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;

-- Add unit_price column to orders table for historical tracking
ALTER TABLE public.orders 
ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00;

-- Update existing products to have a default price (you can adjust this value)
UPDATE public.products 
SET price = 5.99 
WHERE price IS NULL OR price = 0;

-- Add constraint to ensure price is not negative
ALTER TABLE public.products 
ADD CONSTRAINT products_price_positive CHECK (price >= 0);

-- Add constraint to ensure unit_price is not negative
ALTER TABLE public.orders 
ADD CONSTRAINT orders_unit_price_positive CHECK (unit_price >= 0);

-- Add comment for documentation
COMMENT ON COLUMN public.products.price IS 'Product price in GBP';
COMMENT ON COLUMN public.orders.unit_price IS 'Unit price at time of order for historical accuracy'; 