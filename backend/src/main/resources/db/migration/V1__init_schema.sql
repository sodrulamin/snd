CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'DISTRIBUTOR',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    discount_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS card_denominations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    face_value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    validity_days INT NOT NULL DEFAULT 365,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_denom_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS card_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    denomination_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    start_serial_number VARCHAR(50),
    end_serial_number VARCHAR(50),
    total_face_value DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(100),
    FOREIGN KEY (denomination_id) REFERENCES card_denominations(id) ON DELETE RESTRICT,
    INDEX idx_batch_number (batch_number),
    INDEX idx_batch_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS sales_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    distributor_id BIGINT NOT NULL,
    total_cards_count INT NOT NULL,
    total_face_value DECIMAL(15, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BALANCE_CREDIT',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    order_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    serial_ranges_summary TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_order_distributor (distributor_id),
    INDEX idx_order_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    denomination_id BIGINT NOT NULL,
    batch_id BIGINT,
    start_serial_number VARCHAR(50),
    end_serial_number VARCHAR(50),
    quantity INT NOT NULL,
    unit_face_value DECIMAL(10, 2) NOT NULL,
    subtotal_face_value DECIMAL(15, 2) NOT NULL,
    item_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    subtotal_final DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (denomination_id) REFERENCES card_denominations(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES card_batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recharge_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    denomination_id BIGINT NOT NULL,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) NOT NULL,
    pin_encrypted VARCHAR(255) NOT NULL,
    pin_masked VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
    distributor_id BIGINT,
    order_id BIGINT,
    sold_at TIMESTAMP NULL,
    redeemed_at TIMESTAMP NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES card_batches(id) ON DELETE RESTRICT,
    FOREIGN KEY (denomination_id) REFERENCES card_denominations(id) ON DELETE RESTRICT,
    FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE SET NULL,
    INDEX idx_card_serial (serial_number),
    INDEX idx_card_status (status),
    INDEX idx_card_batch (batch_id),
    INDEX idx_card_distributor (distributor_id),
    INDEX idx_card_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS distributor_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    distributor_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    previous_balance DECIMAL(15, 2) NOT NULL,
    new_balance DECIMAL(15, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_trans_distributor (distributor_id),
    INDEX idx_trans_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS voip_redemption_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL,
    distributor_id BIGINT,
    subscriber_voip_number VARCHAR(100) NOT NULL,
    face_value DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    failure_reason VARCHAR(255),
    ip_address VARCHAR(50),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_redemption_serial (serial_number),
    INDEX idx_redemption_date (redeemed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
