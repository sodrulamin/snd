-- Flyway migration V9: Ensure index on card_batches(batch_number) for fast lot lookups

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'card_batches' AND INDEX_NAME = 'idx_batch_number');
SET @sqlstmt_idx := IF(@exist_idx = 0, 'CREATE INDEX idx_batch_number ON card_batches(batch_number)', 'SELECT 1');
PREPARE stmt_idx FROM @sqlstmt_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
