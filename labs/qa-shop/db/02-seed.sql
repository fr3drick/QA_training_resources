-- QA Shop — seed data
-- Deterministic: setseed() means every intern gets exactly the same "random" data.
-- Every account's password is:  Passw0rd!

SELECT setseed(0.42);

-- ---------------------------------------------------------------------------
-- Customers
-- ids 1-4 are the customers from Day 15. 5 and 6 are deliberate data defects.
-- ids 7-106 are load-test accounts used in Week 6.
-- ---------------------------------------------------------------------------
INSERT INTO customers (first_name, last_name, email, password_hash, country, is_active, created_at) VALUES
  ('Efe',   'Irubor',  'efe@example.com',    encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG', true,  '2026-01-15 09:12:00+01'),
  ('Ada',   'Okafor',  'ada@example.com',    encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG', true,  '2026-02-03 14:40:00+01'),
  ('Bola',  'Adeyemi', 'bola@example.com',   encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'GH', false, '2026-02-19 11:05:00+01'),
  ('Chidi', 'Nwosu',   'chidi@example.com',  encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG', true,  '2026-03-01 08:30:00+01'),
  ('Ada',   'Okafor',  'Ada@Example.com',    encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG', true,  '2026-03-02 10:00:00+01'),
  ('Tunde', 'Bakare',  'tunde@example.com ', encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG', true,  '2026-03-10 16:20:00+01');

INSERT INTO customers (first_name, last_name, email, password_hash, country, created_at)
SELECT 'Load',
       'User ' || lpad(g::text, 3, '0'),
       'loadtest' || lpad(g::text, 3, '0') || '@qa-shop.test',
       encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'),
       'NG',
       '2026-04-01'::timestamptz + (g || ' hours')::interval
FROM generate_series(1, 100) AS g;

-- ---------------------------------------------------------------------------
-- Products
-- ids 1-20 are the "real" catalogue. Product 7 has deliberately low stock.
-- Product 20 is inactive. Then 200,000 generated products give the search
-- endpoint something to be slow on.
-- ---------------------------------------------------------------------------
INSERT INTO products (sku, name, description, category, price, stock, is_active) VALUES
  ('ELEC-001', 'Wireless Earbuds',            'Bluetooth 5.3 earbuds with charging case',        'electronics', 18500.00, 120, true),
  ('ELEC-002', 'USB-C Charger 65W',           'GaN fast charger, one USB-C port',                 'electronics', 12500.00, 300, true),
  ('ELEC-003', 'Smart Watch',                 'Fitness tracking, heart rate, 7-day battery',      'electronics', 45000.00,  60, true),
  ('BOOK-001', 'Lessons Learned in Software Testing', 'Kaner, Bach and Pettichord',              'books',        9500.00,  40, true),
  ('BOOK-002', 'Explore It!',                 'Elisabeth Hendrickson on exploratory testing',     'books',        8000.00,  35, true),
  ('HOME-001', 'Ceramic Mug',                 '350ml, dishwasher safe',                           'home',         3500.00, 500, true),
  ('HOME-002', 'Limited Edition Jollof Pot',  'Cast iron, 5 litre. Strictly limited run.',        'home',        32000.00,  25, true),
  ('HOME-003', 'Desk Lamp',                   'LED, three colour temperatures',                   'home',        14000.00,  80, true),
  ('FASH-001', 'Ankara Print Shirt',          '100% cotton, sizes S-XXL',                         'fashion',     16000.00, 150, true),
  ('FASH-002', 'Leather Sandals',             'Handmade in Aba',                                  'fashion',     22000.00,  70, true),
  ('GROC-001', 'Premium Rice 5kg',            'Long grain parboiled',                             'grocery',      9800.00, 400, true),
  ('GROC-002', 'Palm Oil 2L',                 'Unrefined red palm oil',                           'grocery',      6500.00, 250, true),
  ('GROC-003', 'Ground Coffee 500g',          'Medium roast',                                     'grocery',      7200.00, 180, true),
  ('TOYS-001', 'Building Blocks Set',         '500 pieces, ages 6+',                              'toys',        19500.00,  90, true),
  ('TOYS-002', 'Remote Control Car',          'Rechargeable, 2.4GHz',                             'toys',        27500.00,  45, true),
  ('ELEC-004', 'Power Bank 20000mAh',         'Two USB-A, one USB-C',                             'electronics', 15500.00, 200, true),
  ('HOME-004', 'Blender 1.5L',                '600W, glass jar',                                  'home',        38000.00,  55, true),
  ('BOOK-003', 'Agile Testing',               'Crispin and Gregory',                              'books',       11000.00,  30, true),
  ('FASH-003', 'Aso Oke Cap',                 'Hand-woven',                                       'fashion',      5000.00, 120, true),
  ('ELEC-005', 'Discontinued Radio',          'No longer sold',                                   'electronics',  4000.00,  10, false);

INSERT INTO products (sku, name, description, category, price, stock)
SELECT 'GEN-' || lpad(g::text, 6, '0'),
       initcap((ARRAY['basic','classic','deluxe','eco','pro','mini','max','smart'])[1 + (g % 8)])
         || ' ' || (ARRAY['electronics','books','home','fashion','grocery','toys'])[1 + (g % 6)]
         || ' item ' || g,
       repeat(md5(g::text), 3),
       (ARRAY['electronics','books','home','fashion','grocery','toys'])[1 + (g % 6)],
       round((500 + random() * 49500)::numeric, 2),
       1000
FROM generate_series(1, 200000) AS g;

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------
INSERT INTO coupons (code, percent_off, min_order_amount, expires_at, is_active) VALUES
  ('SAVE20',     20,      0, '2030-12-31 23:59:59+01', true),
  ('WELCOME10',  10,   5000, '2030-12-31 23:59:59+01', true),
  ('BIGSPEND50', 50, 100000, '2030-12-31 23:59:59+01', true),
  ('EXPIRED15',  15,      0, '2025-01-01 00:00:00+01', true),
  ('INACTIVE5',   5,      0, '2030-12-31 23:59:59+01', false);

-- ---------------------------------------------------------------------------
-- Orders 1001-1005: the Day 15 sample orders, with their items.
-- ---------------------------------------------------------------------------
INSERT INTO orders (customer_id, status, subtotal, discount, total_amount, coupon_code, created_at, updated_at) VALUES
  (1, 'delivered', 45000.00,    0.00, 45000.00, NULL,     '2026-03-01 10:00:00+01', '2026-03-03 15:00:00+01'),
  (1, 'paid',      15625.00, 3125.00, 12500.00, 'SAVE20', '2026-03-04 12:30:00+01', '2026-03-04 12:31:00+01'),
  (2, 'cancelled',  8000.00,    0.00,  8000.00, NULL,     '2026-03-05 09:15:00+01', '2026-03-05 18:00:00+01'),
  (2, 'paid',      40000.00, 8000.00, 32000.00, 'SAVE20', '2026-03-06 19:45:00+01', '2026-03-06 19:46:00+01'),
  (4, 'pending',   18500.00, 3700.00,     0.00, 'SAVE20', '2026-03-07 08:00:00+01', '2026-03-07 08:00:00+01');

INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES
  (1001,  3, 1, 45000.00, 45000.00),
  (1002,  2, 1, 12500.00, 12500.00),
  (1002, 19, 1,  3125.00,  3125.00),
  (1003,  5, 1,  8000.00,  8000.00),
  (1004,  9, 1, 16000.00, 16000.00),
  (1004, 10, 1, 22000.00, 22000.00),
  (1004, 13, 1,  2000.00,  2000.00),
  (1005,  1, 1, 18500.00, 18500.00);

-- ---------------------------------------------------------------------------
-- Order history: 3,000 orders for the load-test customers over the last 180 days.
-- ---------------------------------------------------------------------------
INSERT INTO orders (customer_id, status, created_at, updated_at)
SELECT customer_id, status, ts, ts + interval '2 hours'
FROM (
  SELECT 7 + floor(random() * 100)::int AS customer_id,
         (ARRAY['pending','paid','paid','shipped','delivered','delivered','delivered','cancelled'])[1 + floor(random() * 8)::int] AS status,
         date_trunc('minute', now() - random() * interval '180 days') AS ts
  FROM generate_series(1, 3000)
) AS s;

INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total)
SELECT o.id, p.id, l.qty, p.price, p.price * l.qty
FROM orders o
CROSS JOIN LATERAL (
  SELECT 1 + floor(random() * 19)::int AS product_id,
         1 + floor(random() * 3)::int  AS qty
  FROM generate_series(1, 1 + (o.id % 3))
) AS l
JOIN products p ON p.id = l.product_id
WHERE o.id > 1005;

UPDATE orders o
SET subtotal = t.subtotal, total_amount = t.subtotal
FROM (SELECT order_id, sum(line_total) AS subtotal FROM order_items GROUP BY order_id) AS t
WHERE t.order_id = o.id AND o.id > 1005;

UPDATE orders
SET coupon_code  = 'SAVE20',
    discount     = round(subtotal * 0.20, 2),
    total_amount = subtotal - round(subtotal * 0.20, 2)
WHERE id > 1005 AND id % 7 = 0;

-- ---------------------------------------------------------------------------
-- A few more historical data defects for Week 7 to find.
-- ---------------------------------------------------------------------------
UPDATE orders SET updated_at = created_at - interval '1 day' WHERE id = 1500;
UPDATE orders SET total_amount = total_amount + 1000         WHERE id = 2222;
DELETE FROM order_items                                      WHERE order_id = 2750;
UPDATE orders SET status = 'delivered'                       WHERE id = 2750;
