-- Flyway migration V10: Create tables for Campaign, Internal Use, and other card disbursements

-- 1. Create campaign_expenses table (header)
CREATE TABLE IF NOT EXISTS campaign_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference_no VARCHAR(100) NOT NULL UNIQUE,
    campaign_name VARCHAR(255) NOT NULL,
    purpose_category VARCHAR(50) NOT NULL, -- 'CAMPAIGN', 'INTERNAL_USE', 'PROMOTION', 'COMPLIMENTARY', 'TESTING', 'OTHER'
    beneficiary_dept VARCHAR(150) NULL,
    total_cards_count INT NOT NULL DEFAULT 0,
    total_wholesale_cost DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_face_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    cost_variance_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    disbursed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disbursed_by VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_campaign_purpose (purpose_category),
    INDEX idx_campaign_date (disbursed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create campaign_expense_items table (line items)
CREATE TABLE IF NOT EXISTS campaign_expense_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_expense_id BIGINT NOT NULL,
    denomination_id BIGINT NOT NULL,
    batch_id BIGINT NULL,
    batch_number VARCHAR(100) NULL,
    start_serial_number VARCHAR(50) NOT NULL,
    end_serial_number VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_wholesale_price DECIMAL(10, 2) NOT NULL,
    unit_face_value DECIMAL(10, 2) NOT NULL,
    subtotal_wholesale_cost DECIMAL(15, 2) NOT NULL,
    subtotal_face_value DECIMAL(15, 2) NOT NULL,
    notes VARCHAR(255) NULL,
    FOREIGN KEY (campaign_expense_id) REFERENCES campaign_expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (denomination_id) REFERENCES card_denominations(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES card_batches(id) ON DELETE SET NULL,
    INDEX idx_camp_item_expense (campaign_expense_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Link recharge_cards to campaign_expenses
SET @exist_col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_cards' AND COLUMN_NAME = 'campaign_expense_id');
SET @sqlstmt_col := IF(@exist_col = 0, 'ALTER TABLE recharge_cards ADD COLUMN campaign_expense_id BIGINT NULL', 'SELECT 1');
PREPARE stmt_col FROM @sqlstmt_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

SET @exist_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_cards' AND CONSTRAINT_NAME = 'fk_card_campaign');
SET @sqlstmt_fk := IF(@exist_fk = 0, 'ALTER TABLE recharge_cards ADD CONSTRAINT fk_card_campaign FOREIGN KEY (campaign_expense_id) REFERENCES campaign_expenses(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk FROM @sqlstmt_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recharge_cards' AND INDEX_NAME = 'idx_card_campaign');
SET @sqlstmt_idx := IF(@exist_idx = 0, 'CREATE INDEX idx_card_campaign ON recharge_cards(campaign_expense_id)', 'SELECT 1');
PREPARE stmt_idx FROM @sqlstmt_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
