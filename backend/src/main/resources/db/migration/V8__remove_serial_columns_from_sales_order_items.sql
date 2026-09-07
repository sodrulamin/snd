-- Flyway migration V8: Remove start and end serial columns from sales_order_items

SET @exist_start := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order_items' AND COLUMN_NAME = 'start_serial_number');
SET @sqlstmt_start := IF(@exist_start > 0, 'ALTER TABLE sales_order_items DROP COLUMN start_serial_number', 'SELECT 1');
PREPARE stmt_start FROM @sqlstmt_start;
EXECUTE stmt_start;
DEALLOCATE PREPARE stmt_start;

SET @exist_end := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order_items' AND COLUMN_NAME = 'end_serial_number');
SET @sqlstmt_end := IF(@exist_end > 0, 'ALTER TABLE sales_order_items DROP COLUMN end_serial_number', 'SELECT 1');
PREPARE stmt_end FROM @sqlstmt_end;
EXECUTE stmt_end;
DEALLOCATE PREPARE stmt_end;