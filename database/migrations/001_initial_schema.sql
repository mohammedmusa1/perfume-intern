-- AuraPerfume — Initial Schema Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verify_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    avatar_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    street VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE category_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES category_groups(id),
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE perfumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(300) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    sale_price DECIMAL(10,2),
    category VARCHAR(20) NOT NULL CHECK (category IN ('men','women','unisex')),
    fragrance_family VARCHAR(20) NOT NULL,
    top_notes TEXT[] NOT NULL DEFAULT '{}',
    middle_notes TEXT[] NOT NULL DEFAULT '{}',
    base_notes TEXT[] NOT NULL DEFAULT '{}',
    size_ml INT NOT NULL DEFAULT 100,
    images TEXT[] NOT NULL DEFAULT '{}',
    thumbnail TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_reviews INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_perfumes_slug ON perfumes(slug);
CREATE INDEX idx_perfumes_category ON perfumes(category);
CREATE INDEX idx_perfumes_brand ON perfumes(brand);
CREATE INDEX idx_perfumes_price ON perfumes(price);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfume_id UUID UNIQUE NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(100) NOT NULL,
    comment TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(perfume_id, user_id)
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, perfume_id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    shipping_address_id UUID REFERENCES addresses(id),
    coupon_id UUID,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    perfume_id UUID NOT NULL REFERENCES perfumes(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    method VARCHAR(20),
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage','flat')),
    value DECIMAL(10,2) NOT NULL CHECK (value > 0),
    min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_discount DECIMAL(10,2),
    is_one_time BOOLEAN NOT NULL DEFAULT FALSE,
    max_usages INT NOT NULL DEFAULT 100,
    current_usages INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('sent','failed')),
    error TEXT,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    perfume_id UUID NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, perfume_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_perfumes BEFORE UPDATE ON perfumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_coupons BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
