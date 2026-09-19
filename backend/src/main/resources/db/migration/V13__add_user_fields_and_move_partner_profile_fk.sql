-- Flyway migration V13: Add user fields to users table and move partner profile relationship
-- 1. Add name, mobile, email, address, partner_profile_id to users
-- 2. Migrate existing user-partner relationships and backfill profile info into users
-- 3. Remove user_id from partner_profiles table

-- Add 'name' to users
SET @exist_name := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name');
SET @sql_name := IF(@exist_name = 0, 'ALTER TABLE users ADD COLUMN name VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt_name FROM @sql_name; EXECUTE stmt_name; DEALLOCATE PREPARE stmt_name;

-- Add 'mobile' to users
SET @exist_mobile := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'mobile');
SET @sql_mobile := IF(@exist_mobile = 0, 'ALTER TABLE users ADD COLUMN mobile VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt_mobile FROM @sql_mobile; EXECUTE stmt_mobile; DEALLOCATE PREPARE stmt_mobile;

-- Add 'email' to users
SET @exist_email := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email');
SET @sql_email := IF(@exist_email = 0, 'ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL', 'SELECT 1');
PREPARE stmt_email FROM @sql_email; EXECUTE stmt_email; DEALLOCATE PREPARE stmt_email;

-- Add 'address' to users
SET @exist_address := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address');
SET @sql_address := IF(@exist_address = 0, 'ALTER TABLE users ADD COLUMN address TEXT NULL', 'SELECT 1');
PREPARE stmt_address FROM @sql_address; EXECUTE stmt_address; DEALLOCATE PREPARE stmt_address;

-- Add 'partner_profile_id' to users
SET @exist_pp_id := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'partner_profile_id');
SET @sql_pp_id := IF(@exist_pp_id = 0, 'ALTER TABLE users ADD COLUMN partner_profile_id BIGINT NULL', 'SELECT 1');
PREPARE stmt_pp_id FROM @sql_pp_id; EXECUTE stmt_pp_id; DEALLOCATE PREPARE stmt_pp_id;

-- Backfill users.partner_profile_id and user details from partner_profiles if user_id column exists
SET @exist_pp_userid := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_profiles' AND COLUMN_NAME = 'user_id');

SET @sql_migrate := IF(@exist_pp_userid > 0,
    'UPDATE users u 
     JOIN partner_profiles pp ON pp.user_id = u.id 
     SET u.partner_profile_id = pp.id,
         u.name = COALESCE(u.name, pp.contact_person, pp.company_name),
         u.mobile = COALESCE(u.mobile, pp.phone),
         u.email = COALESCE(u.email, pp.email),
         u.address = COALESCE(u.address, pp.address)',
    'SELECT 1');
PREPARE stmt_migrate FROM @sql_migrate; EXECUTE stmt_migrate; DEALLOCATE PREPARE stmt_migrate;

-- Default name for Admin user
UPDATE users SET name = 'System Administrator' WHERE role = 'ADMIN' AND (name IS NULL OR name = '');

-- Add foreign key fk_users_partner_profile
SET @exist_fk_u_pp := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_partner_profile');
SET @sql_fk_u_pp := IF(@exist_fk_u_pp = 0, 'ALTER TABLE users ADD CONSTRAINT fk_users_partner_profile FOREIGN KEY (partner_profile_id) REFERENCES partner_profiles(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk_u_pp FROM @sql_fk_u_pp; EXECUTE stmt_fk_u_pp; DEALLOCATE PREPARE stmt_fk_u_pp;

-- Add index idx_users_partner_profile
SET @exist_idx_u_pp := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_partner_profile');
SET @sql_idx_u_pp := IF(@exist_idx_u_pp = 0, 'CREATE INDEX idx_users_partner_profile ON users(partner_profile_id)', 'SELECT 1');
PREPARE stmt_idx_u_pp FROM @sql_idx_u_pp; EXECUTE stmt_idx_u_pp; DEALLOCATE PREPARE stmt_idx_u_pp;

-- Drop foreign key fk_partner_profiles_user if exists
SET @exist_fk_pp_u := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_profiles' AND CONSTRAINT_NAME = 'fk_partner_profiles_user');
SET @sql_fk_pp_u := IF(@exist_fk_pp_u > 0, 'ALTER TABLE partner_profiles DROP FOREIGN KEY fk_partner_profiles_user', 'SELECT 1');
PREPARE stmt_fk_pp_u FROM @sql_fk_pp_u; EXECUTE stmt_fk_pp_u; DEALLOCATE PREPARE stmt_fk_pp_u;

-- Drop index idx_partner_profile_user if exists
SET @exist_idx_pp_u := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_profiles' AND INDEX_NAME = 'idx_partner_profile_user');
SET @sql_idx_pp_u := IF(@exist_idx_pp_u > 0, 'DROP INDEX idx_partner_profile_user ON partner_profiles', 'SELECT 1');
PREPARE stmt_idx_pp_u FROM @sql_idx_pp_u; EXECUTE stmt_idx_pp_u; DEALLOCATE PREPARE stmt_idx_pp_u;

-- Drop unique index user_id if exists
SET @exist_uniq_pp_u := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_profiles' AND INDEX_NAME = 'user_id');
SET @sql_uniq_pp_u := IF(@exist_uniq_pp_u > 0, 'DROP INDEX user_id ON partner_profiles', 'SELECT 1');
PREPARE stmt_uniq_pp_u FROM @sql_uniq_pp_u; EXECUTE stmt_uniq_pp_u; DEALLOCATE PREPARE stmt_uniq_pp_u;

-- Drop column user_id from partner_profiles
SET @exist_pp_userid_drop := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partner_profiles' AND COLUMN_NAME = 'user_id');
SET @sql_drop_uid := IF(@exist_pp_userid_drop > 0, 'ALTER TABLE partner_profiles DROP COLUMN user_id', 'SELECT 1');
PREPARE stmt_drop_uid FROM @sql_drop_uid; EXECUTE stmt_drop_uid; DEALLOCATE PREPARE stmt_drop_uid;
