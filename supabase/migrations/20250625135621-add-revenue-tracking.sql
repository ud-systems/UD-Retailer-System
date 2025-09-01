-- Migration: Add revenue tracking for salespersons and retailers
-- Date: 2025-06-29

-- Add total_revenue field to salespersons table
ALTER TABLE public.salespersons 
ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Add constraint to ensure revenue is not negative
ALTER TABLE public.salespersons 
ADD CONSTRAINT salespersons_total_revenue_positive CHECK (total_revenue >= 0);

-- Add comment for documentation
COMMENT ON COLUMN public.salespersons.total_revenue IS 'Total revenue generated from all orders by assigned retailers';

-- Create function to update salesperson revenue
CREATE OR REPLACE FUNCTION public.update_salesperson_revenue()
RETURNS TRIGGER AS $$
BEGIN
    -- Update salesperson revenue when order is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE public.salespersons 
        SET total_revenue = total_revenue + NEW.total_amount
        WHERE name = NEW.salesperson;
        
        -- Also update retailer total_spent
        UPDATE public.retailers 
        SET total_spent = total_spent + NEW.total_amount,
            total_order_count = total_order_count + 1,
            total_tax = total_tax + NEW.tax_amount
        WHERE id = NEW.retailer_id;
        
        RETURN NEW;
    
    -- Update salesperson revenue when order is updated
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revert old values
        UPDATE public.salespersons 
        SET total_revenue = total_revenue - OLD.total_amount
        WHERE name = OLD.salesperson;
        
        UPDATE public.retailers 
        SET total_spent = total_spent - OLD.total_amount,
            total_order_count = total_order_count - 1,
            total_tax = total_tax - OLD.tax_amount
        WHERE id = OLD.retailer_id;
        
        -- Apply new values
        UPDATE public.salespersons 
        SET total_revenue = total_revenue + NEW.total_amount
        WHERE name = NEW.salesperson;
        
        UPDATE public.retailers 
        SET total_spent = total_spent + NEW.total_amount,
            total_order_count = total_order_count + 1,
            total_tax = total_tax + NEW.tax_amount
        WHERE id = NEW.retailer_id;
        
        RETURN NEW;
    
    -- Update salesperson revenue when order is deleted
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.salespersons 
        SET total_revenue = total_revenue - OLD.total_amount
        WHERE name = OLD.salesperson;
        
        UPDATE public.retailers 
        SET total_spent = total_spent - OLD.total_amount,
            total_order_count = total_order_count - 1,
            total_tax = total_tax - OLD.tax_amount
        WHERE id = OLD.retailer_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders table
CREATE TRIGGER update_revenue_on_order_change
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_salesperson_revenue();

-- Create function to recalculate all revenue (for backfilling)
CREATE OR REPLACE FUNCTION public.recalculate_all_revenue()
RETURNS void AS $$
BEGIN
    -- Reset all revenue to zero
    UPDATE public.salespersons SET total_revenue = 0.00;
    UPDATE public.retailers SET total_spent = 0.00, total_order_count = 0, total_tax = 0.00;
    
    -- Recalculate from existing orders
    UPDATE public.salespersons 
    SET total_revenue = (
        SELECT COALESCE(SUM(total_amount), 0.00)
        FROM public.orders 
        WHERE salesperson = public.salespersons.name
    );
    
    UPDATE public.retailers 
    SET total_spent = (
        SELECT COALESCE(SUM(total_amount), 0.00)
        FROM public.orders 
        WHERE retailer_id = public.retailers.id
    ),
    total_order_count = (
        SELECT COUNT(*)
        FROM public.orders 
        WHERE retailer_id = public.retailers.id
    ),
    total_tax = (
        SELECT COALESCE(SUM(tax_amount), 0.00)
        FROM public.orders 
        WHERE retailer_id = public.retailers.id
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation function to populate existing data
SELECT public.recalculate_all_revenue(); 