-- QA Shop — automated data-quality checks
--
-- Run with:
--   psql "postgres://qa:qa@localhost:5432/qa_shop" -f data-checks.sql
--
-- Every check counts the rows that VIOLATE a rule, so 0 is a pass.
-- The script prints a report, then fails (non-zero exit code) if any CRITICAL
-- check found violations — which is what lets a CI job go red (Week 8).

\set ON_ERROR_STOP on

CREATE TEMP TABLE dq_results (
  check_name text,
  severity   text,
  violations bigint
);

-- Stock can never be negative: we cannot sell what we do not have.
INSERT INTO dq_results
SELECT 'Products with negative stock', 'critical', count(*)
FROM products WHERE stock < 0;

-- Every order line must be for at least one unit.
INSERT INTO dq_results
SELECT 'Order lines with qty <= 0', 'critical', count(*)
FROM order_items WHERE qty <= 0;

-- line_total must be unit_price x qty.
INSERT INTO dq_results
SELECT 'Order lines where line_total <> unit_price * qty', 'critical', count(*)
FROM order_items WHERE line_total <> unit_price * qty;

-- An order's subtotal must equal the sum of its lines.
INSERT INTO dq_results
SELECT 'Orders where subtotal <> sum of line totals', 'critical', count(*)
FROM orders o
LEFT JOIN (SELECT order_id, sum(line_total) AS lines_total
           FROM order_items GROUP BY order_id) i ON i.order_id = o.id
WHERE o.subtotal <> coalesce(i.lines_total, 0);

-- total_amount must be subtotal minus discount.
INSERT INTO dq_results
SELECT 'Orders where total <> subtotal - discount', 'critical', count(*)
FROM orders WHERE total_amount <> subtotal - discount;

-- An order with no lines is meaningless.
INSERT INTO dq_results
SELECT 'Orders with no order lines', 'critical', count(*)
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id);

-- A record cannot be updated before it was created.
INSERT INTO dq_results
SELECT 'Orders updated before they were created', 'major', count(*)
FROM orders WHERE updated_at < created_at;

-- Email is the login: it must be unique regardless of case.
INSERT INTO dq_results
SELECT 'Emails duplicated when case is ignored', 'major', count(*)
FROM (SELECT lower(email) FROM customers GROUP BY lower(email) HAVING count(*) > 1) d;

-- Leading/trailing spaces make an account impossible to log in to.
INSERT INTO dq_results
SELECT 'Emails with leading or trailing whitespace', 'major', count(*)
FROM customers WHERE email <> btrim(email);

-- Coupons are one per customer (cancelled orders do not count).
INSERT INTO dq_results
SELECT 'Customers who used the same coupon more than once', 'major', count(*)
FROM (SELECT customer_id, coupon_code
      FROM orders
      WHERE coupon_code IS NOT NULL AND status <> 'cancelled'
      GROUP BY customer_id, coupon_code
      HAVING count(*) > 1) d;

-- A coupon must not be applied to an order placed after it expired.
INSERT INTO dq_results
SELECT 'Orders using a coupon after it expired', 'major', count(*)
FROM orders o JOIN coupons c ON c.code = o.coupon_code
WHERE c.expires_at IS NOT NULL AND o.created_at > c.expires_at;

\echo
\echo '=== Data-quality report ==='
SELECT CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       severity, check_name, violations
FROM dq_results
ORDER BY (violations = 0), severity, check_name;

DO $$
DECLARE
  failed int;
BEGIN
  SELECT count(*) INTO failed FROM dq_results WHERE severity = 'critical' AND violations > 0;
  IF failed > 0 THEN
    RAISE EXCEPTION '% critical data-quality check(s) failed — see the report above', failed;
  END IF;
  RAISE NOTICE 'No critical data-quality violations.';
END $$;
