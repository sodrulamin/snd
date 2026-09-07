-- Flyway migration V7: Allow non-unique batch_number for split lots and make order direct serials optional

-- 1. Drop unique constraint on batch_number if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'card_batches' AND INDEX_NAME = 'batch_number');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE card_batches DROP INDEX batch_number', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Make serial_ranges_summary optional on sales_orders
ALTER TABLE sales_orders MODIFY serial_ranges_summary TEXT NULL;

-- 3. Make start_serial_number and end_serial_number optional on sales_order_items (item references sold card_batches record)
ALTER TABLE sales_order_items MODIFY start_serial_number VARCHAR(50) NULL;
ALTER TABLE sales_order_items MODIFY end_serial_number VARCHAR(50) NULL;

