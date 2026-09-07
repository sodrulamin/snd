-- V7: Make PIN columns nullable for serial-only inventory cards
ALTER TABLE recharge_cards 
MODIFY COLUMN pin_hash VARCHAR(255) NULL,
MODIFY COLUMN pin_encrypted VARCHAR(255) NULL,
MODIFY COLUMN pin_masked VARCHAR(50) NULL;
