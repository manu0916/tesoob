CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100),
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(16) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_identity CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL),
    CONSTRAINT email_normalized CHECK (email = lower(trim(email)))
);
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(140) NOT NULL CHECK (length(trim(name)) > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price > 0),
    image_url VARCHAR(2048) NOT NULL,
    description TEXT NOT NULL CHECK (length(trim(description)) > 0),
    observation TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nonblank_observation CHECK (observation IS NULL OR length(trim(observation)) > 0)
);
CREATE INDEX products_public ON products (active, created_at DESC);
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(140) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
    total NUMERIC(14,2) NOT NULL CHECK (total > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
    status VARCHAR(32) NOT NULL CHECK (status IN ('AWAITING_INTEGRATION', 'PENDING_PAYMENT', 'PAID', 'CANCELLED')),
    -- AES-256-GCM envelope: key-id.base64(nonce).base64(ciphertext+authentication-tag).
    -- JSON inside contains recipient, CPF, billing/shipping address; no PAN/CVV.
    checkout_ciphertext TEXT NOT NULL,
    idempotency_key UUID NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT checkout_encrypted CHECK (checkout_ciphertext LIKE '%.%.%'),
    CONSTRAINT orders_amount CHECK (total = unit_price * quantity),
    CONSTRAINT orders_idempotency UNIQUE(user_id, idempotency_key)
);
CREATE INDEX orders_owner ON orders(user_id, created_at DESC);
