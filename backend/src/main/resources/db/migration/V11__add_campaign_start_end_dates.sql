-- Flyway migration V11: Add start_date and end_date to campaign_expenses

SET @exist_start := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_expenses' AND COLUMN_NAME = 'start_date');
SET @sqlstmt_start := IF(@exist_start = 0, 'ALTER TABLE campaign_expenses ADD COLUMN start_date DATE NULL', 'SELECT 1');
PREPARE stmt_start FROM @sqlstmt_start;
EXECUTE stmt_start;
DEALLOCATE PREPARE stmt_start;

SET @exist_end := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_expenses' AND COLUMN_NAME = 'end_date');
SET @sqlstmt_end := IF(@exist_end = 0, 'ALTER TABLE campaign_expenses ADD COLUMN end_date DATE NULL', 'SELECT 1');
PREPARE stmt_end FROM @sqlstmt_end;
EXECUTE stmt_end;
DEALLOCATE PREPARE stmt_end;

-- Populate existing rows with default dates based on disbursed_at
UPDATE campaign_expenses 
SET start_date = DATE(disbursed_at), 
    end_date = DATE_ADD(DATE(disbursed_at), INTERVAL 30 DAY) 
WHERE start_date IS NULL;

-- Enforce NOT NULL
ALTER TABLE campaign_expenses MODIFY COLUMN start_date DATE NOT NULL;
ALTER TABLE campaign_expenses MODIFY COLUMN end_date DATE NOT NULL;

-- Add index for date range queries
SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campaign_expenses' AND INDEX_NAME = 'idx_campaign_period');
SET @sqlstmt_idx := IF(@exist_idx = 0, 'CREATE INDEX idx_campaign_period ON campaign_expenses(start_date, end_date)', 'SELECT 1');
PREPARE stmt_idx FROM @sqlstmt_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
