ALTER TABLE card_denominations
    ADD COLUMN available_from DATE AFTER wholesale_price,
    ADD COLUMN available_until DATE AFTER available_from;

-- Backfill existing denominations
UPDATE card_denominations SET 
    available_from = CURRENT_DATE,
    available_until = DATE_ADD(CURRENT_DATE, INTERVAL COALESCE(validity_days, 365) DAY)
WHERE available_from IS NULL;

-- Modify columns to be NOT NULL
ALTER TABLE card_denominations
    MODIFY COLUMN available_from DATE NOT NULL,
    MODIFY COLUMN available_until DATE NOT NULL;
