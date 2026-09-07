INSERT INTO users (username, password, full_name, email, phone, role, status, balance, credit_limit, discount_rate, address)
VALUES
('admin', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'System Administrator', 'admin@voipsnd.com', '+880-1700-000001', 'ADMIN', 'ACTIVE', 0.00, 0.00, 0.00, 'Gulshan-2, Dhaka, Bangladesh'),
('dist_metro', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'Dhaka Metro Telecom Ltd.', 'sales@metrotelecom.bd', '+880-1811-223344', 'DISTRIBUTOR', 'ACTIVE', 50000.00, 100000.00, 8.50, 'Motijheel C/A, Dhaka-1000'),
('dist_apex', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'Apex Global Connect Dist', 'billing@apexconnect.bd', '+880-1911-556677', 'DISTRIBUTOR', 'ACTIVE', 25000.00, 50000.00, 6.00, 'Agrabad C/A, Chattogram'),
('dist_horizon', '$2a$10$EblZqNptyYvcLm/VwDCVAuBjzZOI7khzdyGPBr08PpIi0na624b8.', 'Horizon VoIP Networks', 'agent@horizonvoip.bd', '+880-1611-998877', 'DISTRIBUTOR', 'ACTIVE', 12000.00, 30000.00, 5.00, 'Zindabazar, Sylhet');

INSERT INTO card_denominations (name, face_value, currency, validity_days, description, is_active)
VALUES
('VoIP Mini ৳50', 50.00, 'BDT', 180, 'Starter card for casual VoIP calling and verification', TRUE),
('VoIP Standard ৳100', 100.00, 'BDT', 365, 'Most popular standard card for international dial-out', TRUE),
('VoIP Plus ৳200', 200.00, 'BDT', 365, 'High-usage card with bonus talk-time credits', TRUE),
('VoIP Gold ৳500', 500.00, 'BDT', 730, 'Enterprise & heavy user calling card with premium priority', TRUE),
('VoIP Platinum ৳1000', 1000.00, 'BDT', 730, 'Premium wholesale denomination with maximum volume discount', TRUE);

INSERT INTO card_batches (batch_number, denomination_id, start_serial_number, end_serial_number, quantity, total_face_value, status, generated_at, notes, created_by)
VALUES
('BATCH-50-202601', 1, 'BATCH-50-0001', 'BATCH-50-0100', 100, 5000.00, 'AVAILABLE', CURRENT_TIMESTAMP, 'Initial production batch of ৳50 cards', 'admin'),
('BATCH-100-202601', 2, 'BATCH-100-0001', 'BATCH-100-0200', 200, 20000.00, 'AVAILABLE', CURRENT_TIMESTAMP,  'Initial production batch of ৳100 cards', 'admin'),
('BATCH-200-202601', 3, 'BATCH-200-0001', 'BATCH-200-0100', 100, 20000.00, 'AVAILABLE', CURRENT_TIMESTAMP,  'Initial production batch of ৳200 cards', 'admin'),
('BATCH-500-202601', 4, 'BATCH-500-0001', 'BATCH-500-0050', 50, 25000.00, 'AVAILABLE', CURRENT_TIMESTAMP,  'Initial production batch of ৳500 cards', 'admin');

-- Initial distributor wallet deposits in BDT
INSERT INTO distributor_transactions (distributor_id, transaction_type, amount, previous_balance, new_balance, reference_type, reference_id, notes)
VALUES
(2, 'CREDIT', 50000.00, 0.00, 50000.00, 'BANK_TRANSFER', 'TXN-BANK-00912', 'Initial working capital credit deposit in BDT'),
(3, 'CREDIT', 25000.00, 0.00, 25000.00, 'BANK_TRANSFER', 'TXN-BANK-00913', 'Initial working capital credit deposit in BDT'),
(4, 'CREDIT', 12000.00, 0.00, 12000.00, 'CASH_DEPOSIT', 'TXN-CASH-00104', 'Initial cash balance opening in BDT');
