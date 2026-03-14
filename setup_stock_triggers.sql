-- 1. Function to handle stock on order item insertion
CREATE OR REPLACE FUNCTION handle_stock_on_order_item_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct stock from product_variants if variant_id is present
    IF NEW.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock = GREATEST(0, stock - NEW.quantity)
        WHERE id = NEW.variant_id;
    -- Otherwise deduct from products if product_id is present
    ELSIF NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET stock = GREATEST(0, stock - NEW.quantity)
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for order item insertion
DROP TRIGGER IF EXISTS tr_stock_on_order_item_insert ON order_items;
CREATE TRIGGER tr_stock_on_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION handle_stock_on_order_item_insert();

-- 3. Function to handle stock on order status change (cancellation/restoration)
CREATE OR REPLACE FUNCTION handle_stock_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- CASE: Order moved TO 'cancelled' (Restore Stock)
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        FOR item IN (SELECT * FROM order_items WHERE order_id = NEW.id) LOOP
            IF item.variant_id IS NOT NULL THEN
                UPDATE product_variants
                SET stock = stock + item.quantity
                WHERE id = item.variant_id;
            ELSIF item.product_id IS NOT NULL THEN
                UPDATE products
                SET stock = stock + item.quantity
                WHERE id = item.product_id;
            END IF;
        END LOOP;
    
    -- CASE: Order moved FROM 'cancelled' to something else (Deduct Stock)
    ELSIF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
        FOR item IN (SELECT * FROM order_items WHERE order_id = NEW.id) LOOP
            IF item.variant_id IS NOT NULL THEN
                UPDATE product_variants
                SET stock = GREATEST(0, stock - item.quantity)
                WHERE id = item.variant_id;
            ELSIF item.product_id IS NOT NULL THEN
                UPDATE products
                SET stock = GREATEST(0, stock - item.quantity)
                WHERE id = item.product_id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for order status update
DROP TRIGGER IF EXISTS tr_stock_on_order_status_change ON orders;
CREATE TRIGGER tr_stock_on_order_status_change
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_stock_on_order_status_change();

-- 5. Function to sync product stock from variants
CREATE OR REPLACE FUNCTION sync_product_stock_from_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent product's stock to be the sum of all its variants' stock
    UPDATE products
    SET stock = (
        SELECT COALESCE(SUM(stock), 0)
        FROM product_variants
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to sync stock on variant changes (insert, update, delete)
DROP TRIGGER IF EXISTS tr_sync_product_stock ON product_variants;
CREATE TRIGGER tr_sync_product_stock
AFTER INSERT OR UPDATE OF stock OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock_from_variants();
