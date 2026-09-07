ALTER TABLE card_denominations
    ADD COLUMN code VARCHAR(50) AFTER id,
    ADD COLUMN retail_price DECIMAL(10, 2) AFTER name,
    ADD COLUMN wholesale_price DECIMAL(10, 2) AFTER retail_price;

-- Backfill existing denominations
UPDATE card_denominations SET 
    code = CONCAT('VOIP-', CAST(face_value AS UNSIGNED)),
    retail_price = face_value,
    wholesale_price = ROUND(face_value * 0.90, 2)
WHERE code IS NULL;

-- Set code as NOT NULL and UNIQUE
ALTER TABLE card_denominations
    MODIFY COLUMN code VARCHAR(50) NOT NULL,
    ADD UNIQUE KEY uk_denom_code (code);
