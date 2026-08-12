-- GoodPay v2.0.0.1 Database Schema
-- Compatible with SQLite and MySQL

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    is_verified INTEGER DEFAULT 0, -- 0 = Not Verified, 1 = Verified
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    card_number VARCHAR(19) NOT NULL, -- e.g. "4532 8912 3456 1234"
    cvv VARCHAR(4) NOT NULL,          -- e.g. "892"
    expiry_date VARCHAR(7) NOT NULL,   -- e.g. "08/31"
    balance DECIMAL(10,2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'unpurchased', -- 'unpurchased', 'processing', 'active'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recharges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    usd_amount DECIMAL(10,2) NOT NULL,
    exchange_rate DECIMAL(10,2) NOT NULL,
    cashout_charge_pct DECIMAL(5,2) NOT NULL,
    total_bdt DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- 'bKash', 'Nagad', 'Rocket'
    sender_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS card_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    card_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- 'bKash', 'Nagad', 'Rocket'
    sender_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mfs_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bkash_number VARCHAR(20) DEFAULT '01794146475',
    nagad_number VARCHAR(20) DEFAULT '01794146475',
    rocket_number VARCHAR(20) DEFAULT '01794146475',
    card_price_bdt DECIMAL(10,2) DEFAULT 1350.00,
    usd_to_bdt_rate DECIMAL(10,2) DEFAULT 135.00,
    cashout_charge_pct DECIMAL(5,2) DEFAULT 2.00,
    card_activation_fee_usd DECIMAL(10,2) DEFAULT 8.00,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT 'Admin Masud'
);


