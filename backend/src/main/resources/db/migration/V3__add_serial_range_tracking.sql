ALTER TABLE card_batches
    ADD COLUMN start_serial_number VARCHAR(50) AFTER quantity,
    ADD COLUMN end_serial_number VARCHAR(50) AFTER start_serial_number;

ALTER TABLE sales_order_items
    ADD COLUMN start_serial_number VARCHAR(50) AFTER batch_id,
    ADD COLUMN end_serial_number VARCHAR(50) AFTER start_serial_number,
    ADD COLUMN serial_range VARCHAR(120) AFTER end_serial_number;

ALTER TABLE sales_orders
    ADD COLUMN serial_ranges_summary TEXT AFTER notes;
