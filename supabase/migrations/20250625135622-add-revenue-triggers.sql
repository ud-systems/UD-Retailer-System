-- Migration: Add database triggers for automatic revenue tracking
-- Date: 2025-06-29

-- Create function to update salesperson revenue
CREATE OR REPLACE FUNCTION public.update_salesperson_revenue()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Update salesperson revenue
        UPDATE public.salespersons 
        SET total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total_amount, 0)
        WHERE name = NEW.salesperson;
        
        -- Update retailer totals
        IF NEW.retailer_id IS NOT NULL THEN
            UPDATE public.retailers 
            SET total_spent = COALESCE(total_spent, 0) + COALESCE(NEW.total_amount, 0),
                total_order_count = COALESCE(total_order_count, 0) + 1,
                total_tax = COALESCE(total_tax, 0) + COALESCE(NEW.tax_amount, 0)
            WHERE id = NEW.retailer_id;
        END IF;
        
        RETURN NEW;
    
    -- Handle UPDATE operations
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle salesperson change
        IF OLD.salesperson != NEW.salesperson THEN
            -- Remove from old salesperson
            UPDATE public.salespersons 
            SET total_revenue = GREATEST(COALESCE(total_revenue, 0) - COALESCE(OLD.total_amount, 0), 0)
            WHERE name = OLD.salesperson;
            
            -- Add to new salesperson
            UPDATE public.salespersons 
            SET total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total_amount, 0)
            WHERE name = NEW.salesperson;
        ELSE
            -- Update existing salesperson with difference
            UPDATE public.salespersons 
            SET total_revenue = GREATEST(COALESCE(total_revenue, 0) + (COALESCE(NEW.total_amount, 0) - COALESCE(OLD.total_amount, 0)), 0)
            WHERE name = NEW.salesperson;
        END IF;
        
        -- Handle retailer change
        IF OLD.retailer_id IS DISTINCT FROM NEW.retailer_id THEN
            -- Remove from old retailer
            IF OLD.retailer_id IS NOT NULL THEN
                UPDATE public.retailers 
                SET total_spent = GREATEST(COALESCE(total_spent, 0) - COALESCE(OLD.total_amount, 0), 0),
                    total_order_count = GREATEST(COALESCE(total_order_count, 0) - 1, 0),
                    total_tax = GREATEST(COALESCE(total_tax, 0) - COALESCE(OLD.tax_amount, 0), 0)
                WHERE id = OLD.retailer_id;
            END IF;
            
            -- Add to new retailer
            IF NEW.retailer_id IS NOT NULL THEN
                UPDATE public.retailers 
                SET total_spent = COALESCE(total_spent, 0) + COALESCE(NEW.total_amount, 0),
                    total_order_count = COALESCE(total_order_count, 0) + 1,
                    total_tax = COALESCE(total_tax, 0) + COALESCE(NEW.tax_amount, 0)
                WHERE id = NEW.retailer_id;
            END IF;
        ELSE
            -- Update existing retailer with differences
            IF NEW.retailer_id IS NOT NULL THEN
                UPDATE public.retailers 
                SET total_spent = GREATEST(COALESCE(total_spent, 0) + (COALESCE(NEW.total_amount, 0) - COALESCE(OLD.total_amount, 0)), 0),
                    total_tax = GREATEST(COALESCE(total_tax, 0) + (COALESCE(NEW.tax_amount, 0) - COALESCE(OLD.tax_amount, 0)), 0)
                WHERE id = NEW.retailer_id;
            END IF;
        END IF;
        
        RETURN NEW;
    
    -- Handle DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove from salesperson
        UPDATE public.salespersons 
        SET total_revenue = GREATEST(COALESCE(total_revenue, 0) - COALESCE(OLD.total_amount, 0), 0)
        WHERE name = OLD.salesperson;
        
        -- Remove from retailer
        IF OLD.retailer_id IS NOT NULL THEN
            UPDATE public.retailers 
            SET total_spent = GREATEST(COALESCE(total_spent, 0) - COALESCE(OLD.total_amount, 0), 0),
                total_order_count = GREATEST(COALESCE(total_order_count, 0) - 1, 0),
                total_tax = GREATEST(COALESCE(total_tax, 0) - COALESCE(OLD.tax_amount, 0), 0)
            WHERE id = OLD.retailer_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders table
DROP TRIGGER IF EXISTS update_revenue_on_order_change ON public.orders;
CREATE TRIGGER update_revenue_on_order_change
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_salesperson_revenue();

-- Create function to recalculate all revenue (for maintenance)
CREATE OR REPLACE FUNCTION public.recalculate_all_revenue()
RETURNS void AS $$
BEGIN
    -- Reset all revenue to zero
    UPDATE public.salespersons SET total_revenue = 0.00;
    UPDATE public.retailers SET total_spent = 0.00, total_order_count = 0, total_tax = 0.00;
    
    -- Recalculate salesperson revenue from orders
    UPDATE public.salespersons 
    SET total_revenue = (
        SELECT COALESCE(SUM(total_amount), 0.00)
        FROM public.orders 
        WHERE salesperson = public.salespersons.name
    );
    
    -- Recalculate retailer totals from orders
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

-- Create function to validate revenue consistency
CREATE OR REPLACE FUNCTION public.validate_revenue_consistency()
RETURNS TABLE(
    entity_type text,
    entity_name text,
    calculated_revenue numeric,
    stored_revenue numeric,
    difference numeric
) AS $$
BEGIN
    -- Check salesperson revenue consistency
    RETURN QUERY
    SELECT 
        'salesperson'::text as entity_type,
        sp.name as entity_name,
        COALESCE(SUM(o.total_amount), 0.00) as calculated_revenue,
        COALESCE(sp.total_revenue, 0.00) as stored_revenue,
        ABS(COALESCE(SUM(o.total_amount), 0.00) - COALESCE(sp.total_revenue, 0.00)) as difference
    FROM public.salespersons sp
    LEFT JOIN public.orders o ON sp.name = o.salesperson
    GROUP BY sp.id, sp.name, sp.total_revenue
    HAVING ABS(COALESCE(SUM(o.total_amount), 0.00) - COALESCE(sp.total_revenue, 0.00)) > 0.01;
    
    -- Check retailer revenue consistency
    RETURN QUERY
    SELECT 
        'retailer'::text as entity_type,
        r.store_name as entity_name,
        COALESCE(SUM(o.total_amount), 0.00) as calculated_revenue,
        COALESCE(r.total_spent, 0.00) as stored_revenue,
        ABS(COALESCE(SUM(o.total_amount), 0.00) - COALESCE(r.total_spent, 0.00)) as difference
    FROM public.retailers r
    LEFT JOIN public.orders o ON r.id = o.retailer_id
    GROUP BY r.id, r.store_name, r.total_spent
    HAVING ABS(COALESCE(SUM(o.total_amount), 0.00) - COALESCE(r.total_spent, 0.00)) > 0.01;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION public.update_salesperson_revenue() IS 'Automatically updates salesperson and retailer revenue when orders are modified';
COMMENT ON FUNCTION public.recalculate_all_revenue() IS 'Recalculates all revenue fields from existing orders (use for maintenance)';
COMMENT ON FUNCTION public.validate_revenue_consistency() IS 'Validates that stored revenue matches calculated revenue from orders'; 