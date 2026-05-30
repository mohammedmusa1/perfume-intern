-- AuraPerfume — Seed Data
-- Admin user (password: Admin@123456)
INSERT INTO users (id, email, password, first_name, last_name, role, is_verified) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@auraperfume.com', '$2a$12$LJ3f4xVPOx5M4xN5xTd0e.LGf0RQWpbMQjLbKw3X9YCkz0hGxkDi6', 'Aura', 'Admin', 'admin', true);

-- Sample customer (password: Customer@123)
INSERT INTO users (id, email, password, first_name, last_name, role, is_verified) VALUES
('b0000000-0000-0000-0000-000000000001', 'customer@example.com', '$2a$12$LJ3f4xVPOx5M4xN5xTd0e.LGf0RQWpbMQjLbKw3X9YCkz0hGxkDi6', 'Riya', 'Sharma', 'customer', true);

-- Sample address
INSERT INTO addresses (user_id, label, street, city, state, zip_code, country, is_default) VALUES
('b0000000-0000-0000-0000-000000000001', 'Home', '42 Marine Drive', 'Mumbai', 'Maharashtra', '400020', 'India', true);

-- Category groups
INSERT INTO category_groups (name, slug, description, image_url, sort_order) VALUES
('Men', 'men', 'Premium fragrances for men', 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=400', 1),
('Women', 'women', 'Elegant fragrances for women', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', 2),
('Unisex', 'unisex', 'Universal fragrances', 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400', 3);

-- Perfumes
INSERT INTO perfumes (id, name, slug, brand, description, short_description, price, sale_price, category, fragrance_family, top_notes, middle_notes, base_notes, size_ml, images, thumbnail, is_featured, is_best_seller, is_trending, average_rating, total_reviews) VALUES
('a0000000-0000-0000-0000-000000000001', 'Royal Oud Noir', 'royal-oud-noir', 'AuraPerfume', 'A majestic blend of rare oud, smoky incense, and rich amber. This opulent fragrance embodies royalty with deep woody layers and a warm, lingering trail that commands attention.', 'Majestic oud with smoky incense and rich amber', 4999.00, 3999.00, 'men', 'oud', ARRAY['Bergamot','Saffron','Pink Pepper'], ARRAY['Oud','Rose','Incense'], ARRAY['Amber','Sandalwood','Musk'], 100, ARRAY['https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=600'], 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=300', true, true, true, 4.8, 124),

('a0000000-0000-0000-0000-000000000002', 'Velvet Rose Elixir', 'velvet-rose-elixir', 'AuraPerfume', 'An enchanting bouquet of Bulgarian roses, velvety peony, and warm vanilla. This luxurious floral fragrance wraps you in elegance, perfect for evenings and special occasions.', 'Enchanting roses with peony and warm vanilla', 3499.00, NULL, 'women', 'floral', ARRAY['Rose','Lychee','Pink Pepper'], ARRAY['Peony','Jasmine','Iris'], ARRAY['Vanilla','Patchouli','White Musk'], 100, ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600'], 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300', true, true, false, 4.7, 89),

('a0000000-0000-0000-0000-000000000003', 'Ocean Breeze Aqua', 'ocean-breeze-aqua', 'AuraPerfume', 'A refreshing splash of ocean mist, crisp cucumber, and citrus zest. This invigorating aquatic fragrance captures the essence of a cool sea breeze on a warm summer day.', 'Refreshing ocean mist with cucumber and citrus', 2499.00, 1999.00, 'unisex', 'fresh', ARRAY['Sea Salt','Lemon','Cucumber'], ARRAY['Lotus','Green Tea','Mint'], ARRAY['Driftwood','White Cedar','Musk'], 75, ARRAY['https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600'], 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=300', true, false, true, 4.5, 67),

('a0000000-0000-0000-0000-000000000004', 'Midnight Amber', 'midnight-amber', 'AuraPerfume', 'A seductive blend of warm amber, smoky vetiver, and exotic spices. This captivating Oriental fragrance is designed for those who embrace the mystery of the night.', 'Seductive amber with vetiver and exotic spices', 5499.00, NULL, 'men', 'oriental', ARRAY['Cardamom','Cinnamon','Bergamot'], ARRAY['Amber','Oud','Labdanum'], ARRAY['Vetiver','Benzoin','Tonka Bean'], 100, ARRAY['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600'], 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300', true, true, false, 4.9, 156),

('a0000000-0000-0000-0000-000000000005', 'Sakura Bloom', 'sakura-bloom', 'AuraPerfume', 'Delicate cherry blossom petals dance with soft peach and creamy sandalwood in this ethereal Japanese-inspired fragrance. A celebration of spring renewal and feminine grace.', 'Delicate cherry blossom with peach and sandalwood', 2999.00, 2499.00, 'women', 'floral', ARRAY['Cherry Blossom','Peach','Bergamot'], ARRAY['Magnolia','Lily','Rose'], ARRAY['Sandalwood','Vanilla','Musk'], 50, ARRAY['https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600'], 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=300', false, true, true, 4.6, 93),

('a0000000-0000-0000-0000-000000000006', 'Cedar & Sage', 'cedar-sage', 'AuraPerfume', 'A grounding blend of atlas cedarwood, wild sage, and earthy moss. This woody masterpiece evokes the tranquil majesty of an ancient forest at dawn.', 'Grounding cedarwood with sage and earthy moss', 3999.00, NULL, 'men', 'woody', ARRAY['Sage','Lavender','Lemon'], ARRAY['Cedarwood','Geranium','Pine'], ARRAY['Vetiver','Moss','Leather'], 100, ARRAY['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600'], 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300', false, false, true, 4.4, 45),

('a0000000-0000-0000-0000-000000000007', 'Golden Saffron', 'golden-saffron', 'AuraPerfume', 'Precious saffron threads woven with rich rose absolute and warm oud create this opulent luxury fragrance. An olfactory treasure worthy of royalty.', 'Precious saffron with rose absolute and oud', 7999.00, 6499.00, 'unisex', 'luxury', ARRAY['Saffron','Cinnamon','Nutmeg'], ARRAY['Rose','Oud','Leather'], ARRAY['Amber','Musk','Sandalwood'], 100, ARRAY['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600'], 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300', true, true, true, 4.9, 201),

('a0000000-0000-0000-0000-000000000008', 'Citrus Soleil', 'citrus-soleil', 'AuraPerfume', 'Sun-kissed Sicilian lemons, juicy mandarin, and sparkling grapefruit burst with energy. This vibrant citrus fragrance is pure bottled sunshine for the vivacious spirit.', 'Sun-kissed lemons and mandarin burst with energy', 1999.00, NULL, 'unisex', 'citrus', ARRAY['Lemon','Mandarin','Grapefruit'], ARRAY['Neroli','Green Tea','Ginger'], ARRAY['White Cedar','Musk','Amber'], 75, ARRAY['https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=600'], 'https://images.unsplash.com/photo-1594035910387-fea081ac05b2?w=300', false, false, false, 4.3, 38);

-- Inventory
INSERT INTO inventory (perfume_id, quantity, low_stock_threshold) VALUES
('a0000000-0000-0000-0000-000000000001', 50, 10),
('a0000000-0000-0000-0000-000000000002', 75, 10),
('a0000000-0000-0000-0000-000000000003', 120, 15),
('a0000000-0000-0000-0000-000000000004', 30, 10),
('a0000000-0000-0000-0000-000000000005', 85, 10),
('a0000000-0000-0000-0000-000000000006', 60, 10),
('a0000000-0000-0000-0000-000000000007', 15, 5),
('a0000000-0000-0000-0000-000000000008', 200, 20);

-- Coupons
INSERT INTO coupons (code, type, value, min_order_amount, max_discount, is_one_time, max_usages, expires_at) VALUES
('WELCOME20', 'percentage', 20, 1000, 500, true, 1000, '2027-12-31 23:59:59'),
('FLAT500', 'flat', 500, 2000, NULL, false, 500, '2027-06-30 23:59:59'),
('LUXURY15', 'percentage', 15, 5000, 1500, false, 200, '2027-12-31 23:59:59');

-- Sample reviews
INSERT INTO reviews (perfume_id, user_id, rating, title, comment, is_verified) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 5, 'Absolutely Royal', 'The oud in this is incredible. Long lasting and perfect for evenings.', true);
