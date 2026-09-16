-- Flyway migration V12: Create partner_profiles table and migrate profile fields from users

CREATE TABLE IF NOT EXISTS partner_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    discount_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_partner_profile_user (user_id),
    INDEX idx_partner_profile_company (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrate existing profile data from users to partner_profiles
INSERT INTO partner_profiles (user_id, company_name, email, phone, address, balance, credit_limit, discount_rate, created_at, updated_at)
SELECT u.id,
       COALESCE(u.full_name, u.username),
       u.email,
       u.phone,
       u.address,
       COALESCE(u.balance, 0.00),
       COALESCE(u.credit_limit, 0.00),
       COALESCE(u.discount_rate, 0.00),
       COALESCE(u.created_at, CURRENT_TIMESTAMP),
       COALESCE(u.updated_at, CURRENT_TIMESTAMP)
FROM users u
LEFT JOIN partner_profiles pp ON pp.user_id = u.id
WHERE pp.id IS NULL AND (u.role = 'DISTRIBUTOR' OR u.balance > 0 OR u.credit_limit > 0 OR u.discount_rate > 0);

-- Safely drop profile columns from users table if they exist
SET @exist_bal := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'balance');
SET @sql_bal := IF(@exist_bal > 0, 'ALTER TABLE users DROP COLUMN balance', 'SELECT 1');
PREPARE stmt_bal FROM @sql_bal; EXECUTE stmt_bal; DEALLOCATE PREPARE stmt_bal;

SET @exist_crd := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'credit_limit');
SET @sql_crd := IF(@exist_crd > 0, 'ALTER TABLE users DROP COLUMN credit_limit', 'SELECT 1');
PREPARE stmt_crd FROM @sql_crd; EXECUTE stmt_crd; DEALLOCATE PREPARE stmt_crd;

SET @exist_dsc := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'discount_rate');
SET @sql_dsc := IF(@exist_dsc > 0, 'ALTER TABLE users DROP COLUMN discount_rate', 'SELECT 1');
PREPARE stmt_dsc FROM @sql_dsc; EXECUTE stmt_dsc; DEALLOCATE PREPARE stmt_dsc;

SET @exist_addr := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address');
SET @sql_addr := IF(@exist_addr > 0, 'ALTER TABLE users DROP COLUMN address', 'SELECT 1');
PREPARE stmt_addr FROM @sql_addr; EXECUTE stmt_addr; DEALLOCATE PREPARE stmt_addr;

SET @exist_fn := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name');
SET @sql_fn := IF(@exist_fn > 0, 'ALTER TABLE users DROP COLUMN full_name', 'SELECT 1');
PREPARE stmt_fn FROM @sql_fn; EXECUTE stmt_fn; DEALLOCATE PREPARE stmt_fn;

SET @exist_em := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email');
SET @sql_em := IF(@exist_em > 0, 'ALTER TABLE users DROP COLUMN email', 'SELECT 1');
PREPARE stmt_em FROM @sql_em; EXECUTE stmt_em; DEALLOCATE PREPARE stmt_em;

SET @exist_ph := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone');
SET @sql_ph := IF(@exist_ph > 0, 'ALTER TABLE users DROP COLUMN phone', 'SELECT 1');
PREPARE stmt_ph FROM @sql_ph; EXECUTE stmt_ph; DEALLOCATE PREPARE stmt_ph;
