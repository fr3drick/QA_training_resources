# Day 15 — SQL for Testers and Data Validation

> **Week 3 · Day 15 · 60 minutes**
> Prerequisites: Day 14

---

## At a glance

By the end of this session you should be able to:

1. Write `SELECT` queries with `WHERE`, `ORDER BY`, `LIMIT` and the operators that matter.
2. Aggregate with `COUNT`, `SUM`, `AVG`, `GROUP BY` and `HAVING`.
3. Join tables, and know which join to reach for.
4. Use SQL to **validate data after a test** and to **set up test data** safely.
5. Recognise SQL injection and test for it responsibly.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: database types |
| 0:04 – 0:16 | SELECT, WHERE, and the operators |
| 0:16 – 0:26 | Aggregates and GROUP BY |
| 0:26 – 0:38 | JOINs |
| 0:38 – 0:46 | Data validation queries a tester actually runs |
| 0:46 – 0:52 | Safety, and SQL injection |
| 0:52 – 0:58 | **Activity:** write queries against the sample schema |
| 0:58 – 1:00 | Week 3 wrap-up + weekend homework |

---

## The sample data used throughout

**`customers`**

| id | first_name | last_name | email | country | created_at | is_active |
|---|---|---|---|---|---|---|
| 1 | Efe | Irubor | efe@example.com | NG | 2026-01-15 | true |
| 2 | Ada | Okafor | ada@example.com | NG | 2026-02-03 | true |
| 3 | Bola | Adeyemi | bola@example.com | GH | 2026-02-19 | false |
| 4 | Chidi | Nwosu | chidi@example.com | NG | 2026-03-01 | true |

**`orders`**

| id | customer_id | order_date | status | total_amount | coupon_code |
|---|---|---|---|---|---|
| 1001 | 1 | 2026-03-01 | delivered | 45000.00 | NULL |
| 1002 | 1 | 2026-03-04 | paid | 12500.00 | SAVE20 |
| 1003 | 2 | 2026-03-05 | cancelled | 8000.00 | NULL |
| 1004 | 2 | 2026-03-06 | paid | 32000.00 | SAVE20 |
| 1005 | 4 | 2026-03-07 | pending | 0.00 | SAVE20 |

---

## 1. SELECT and WHERE

```sql
SELECT * FROM customers;                          -- every column, every row
SELECT first_name, email FROM customers;          -- only these columns
SELECT * FROM customers WHERE country = 'NG';     -- filter
SELECT * FROM customers WHERE is_active = false;
SELECT * FROM orders WHERE total_amount > 10000;
```

**Operators you'll use constantly:**

| Operator | Meaning | Example |
|---|---|---|
| `=` `<>` / `!=` | Equal / not equal | `WHERE status = 'paid'` |
| `>` `<` `>=` `<=` | Comparison | `WHERE total_amount >= 10000` |
| `AND` `OR` `NOT` | Combine conditions | `WHERE country = 'NG' AND is_active = true` |
| `IN` | Any of a list | `WHERE status IN ('paid', 'pending')` |
| `BETWEEN` | Inclusive range | `WHERE order_date BETWEEN '2026-03-01' AND '2026-03-05'` |
| `LIKE` | Pattern match: `%` = any characters, `_` = one character | `WHERE email LIKE '%@example.com'` |
| `IS NULL` / `IS NOT NULL` | Missing value check | `WHERE coupon_code IS NULL` |

**The NULL trap — this catches everyone once.** `NULL` means "unknown", so it is not equal to
anything, including itself. `WHERE coupon_code = NULL` returns **zero rows, always**. You must
write `WHERE coupon_code IS NULL`. Worse: `WHERE coupon_code <> 'SAVE20'` **excludes the NULL
rows too**, because "unknown ≠ SAVE20" evaluates to unknown, not true. If you want them, write
`WHERE coupon_code <> 'SAVE20' OR coupon_code IS NULL`.

That single paragraph will save you from at least one wrong bug report per year.

**Sorting and limiting:**

```sql
SELECT * FROM orders ORDER BY order_date DESC;          -- newest first
SELECT * FROM orders ORDER BY status ASC, total_amount DESC;
SELECT * FROM orders ORDER BY order_date DESC LIMIT 10; -- most recent 10
                                                        -- (SQL Server: SELECT TOP 10 ...)
SELECT DISTINCT status FROM orders;                     -- unique values only
```

`SELECT DISTINCT status FROM orders;` is one of the most useful queries a tester can run: it
tells you every state the data is actually in, which is often more (or fewer) than the
specification claims. Run it on any status column you're testing.

---

## 2. Aggregates and GROUP BY

```sql
SELECT COUNT(*) FROM orders;                             -- 5
SELECT COUNT(*) FROM orders WHERE status = 'paid';       -- 2
SELECT SUM(total_amount) FROM orders WHERE status <> 'cancelled';
SELECT AVG(total_amount), MIN(total_amount), MAX(total_amount) FROM orders;
```

`GROUP BY` collapses rows into groups and aggregates each:

```sql
SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS revenue
FROM orders
GROUP BY status
ORDER BY order_count DESC;
```

| status | order_count | revenue |
|---|---|---|
| paid | 2 | 44500.00 |
| delivered | 1 | 45000.00 |
| cancelled | 1 | 8000.00 |
| pending | 1 | 0.00 |

`HAVING` filters **after** grouping (`WHERE` filters before):

```sql
-- customers who have placed more than one order
SELECT customer_id, COUNT(*) AS orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

**Testers use aggregates constantly:**
- Counting rows before and after an operation — the fastest possible integrity check.
- Finding duplicates (below).
- Reconciling a total shown in the UI against `SUM()` in the database. When a dashboard says
  "₦44,500 revenue" and your query says something else, you have a real, quantified bug.

---

## 3. JOINs

Joins combine rows from multiple tables using a related column.

```sql
SELECT c.first_name, c.last_name, o.id AS order_id, o.total_amount, o.status
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id
ORDER BY c.id;
```

| first_name | last_name | order_id | total_amount | status |
|---|---|---|---|---|
| Efe | Irubor | 1001 | 45000.00 | delivered |
| Efe | Irubor | 1002 | 12500.00 | paid |
| Ada | Okafor | 1003 | 8000.00 | cancelled |
| Ada | Okafor | 1004 | 32000.00 | paid |
| Chidi | Nwosu | 1005 | 0.00 | pending |

Note Bola (id 3) is **absent** — an `INNER JOIN` only returns rows that match on both sides.

| Join | Returns | Tester's use |
|---|---|---|
| `INNER JOIN` | Only rows matching in both tables | The normal case |
| `LEFT JOIN` | All rows from the left table; NULLs where no match | **Finding orphans and gaps** |
| `RIGHT JOIN` | All from the right table | Rarely used; flip the tables instead |
| `FULL OUTER JOIN` | Everything from both sides | Reconciling two datasets |

**The `LEFT JOIN` + `IS NULL` pattern is a tester's best friend** — it finds things that are
*missing*:

```sql
-- Customers who have never ordered
SELECT c.id, c.email
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```
→ Bola. Now go check that the "no orders yet" empty state renders correctly for her.

```sql
-- Orphaned orders: orders whose customer no longer exists (integrity failure)
SELECT o.id, o.customer_id
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE c.id IS NULL;
```
→ Any rows here are a **data integrity defect**. Log them.

---

## 4. The queries a tester actually runs

Keep these in a personal snippets file. You'll use them weekly for the rest of your career.

**Find your own test data:**
```sql
SELECT * FROM customers WHERE email LIKE 'qa.efe+%' ORDER BY created_at DESC;
```

**Verify what the UI just saved (with the raw values, not the formatted ones):**
```sql
SELECT id, first_name, last_name, email, updated_at
FROM customers WHERE id = 42;
```

**Find duplicates that shouldn't exist:**
```sql
SELECT email, COUNT(*) AS n
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;
```

**Case-insensitive duplicates — the bug the UNIQUE constraint misses:**
```sql
SELECT LOWER(email), COUNT(*) AS n
FROM customers
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```
If `Efe@example.com` and `efe@example.com` both exist, you can register twice with "the same"
address. That's a real defect, and it's invisible from the UI.

**Hidden whitespace and invisible characters:**
```sql
SELECT id, email, LENGTH(email) AS len
FROM customers
WHERE email <> TRIM(email);
```
A trailing space in an email address means login fails with "correct" credentials — one of the
most maddening bugs to diagnose from the UI alone.

**Impossible or invalid values (constraint gaps):**
```sql
SELECT * FROM orders WHERE total_amount < 0;
SELECT * FROM orders WHERE status NOT IN ('pending','paid','delivered','cancelled');
SELECT * FROM orders WHERE order_date > CURRENT_DATE;      -- future-dated orders
SELECT * FROM loans  WHERE returned_at < borrowed_at;      -- returned before borrowed
```

**Required fields that are empty:**
```sql
SELECT COUNT(*) FROM customers WHERE email IS NULL OR email = '';
```

**Before/after counts around an operation:**
```sql
SELECT COUNT(*) FROM orders;   -- run before, run after, compare
```

**Reconcile the UI against the data:**
```sql
SELECT SUM(total_amount) FROM orders
WHERE status IN ('paid','delivered')
  AND order_date BETWEEN '2026-03-01' AND '2026-03-31';
```

**Check timestamps and time zones:**
```sql
SELECT id, created_at, updated_at, created_at AT TIME ZONE 'Africa/Lagos' AS local_time
FROM orders ORDER BY created_at DESC LIMIT 5;
```
Was `updated_at` actually touched by your edit? Is the stored time UTC while the UI shows local?
Off-by-one-hour bugs live here.

---

## 5. Safety, and modifying data

### The rules

1. **Know which environment you are connected to.** Colour-code your connections in your client:
   green = local, amber = QA, red = production. Many clients support this. Use it.
2. **You should not have write access to production.** If you do, treat every query as radioactive.
3. **Always write the `SELECT` first**, confirm the rows, *then* change the verb:

```sql
-- Step 1: see exactly what will be affected
SELECT * FROM customers WHERE email = 'qa.efe+lock01@example.com';

-- Step 2: only now, with the SAME where clause
UPDATE customers SET failed_attempts = 0, locked_until = NULL
WHERE email = 'qa.efe+lock01@example.com';
```

4. **Wrap risky changes in a transaction** so you can undo:

```sql
BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 1005;
SELECT * FROM orders WHERE id = 1005;   -- verify
-- ROLLBACK;   -- undo, if it's wrong
COMMIT;        -- keep it, if it's right
```

5. **Never `UPDATE` or `DELETE` without a `WHERE` clause.** `DELETE FROM orders;` deletes every
   order. This is not a hypothetical; it is a rite of passage nobody should have.
6. **Don't fix data to make a test pass.** If the application wrote bad data, the bad data is
   the finding.

### SQL injection — recognise it, test for it responsibly

SQL injection happens when user input is concatenated into a query instead of being safely
parameterised.

```
-- Vulnerable code builds:  SELECT * FROM users WHERE email = '<input>'
-- Tester enters:           ' OR '1'='1
-- Resulting query:         SELECT * FROM users WHERE email = '' OR '1'='1'
--                          → returns every user
```

**Safe test inputs to try in text fields** (in a **test environment**, with **authorisation**):

```
'                      -- a lone apostrophe: a 500 error suggests unescaped input
' OR '1'='1
"; SELECT 1; --
O'Brien                -- a legitimate name that must work
1' AND '1'='2
```

**What each result means:**
- Handled cleanly (rejected or treated as literal text) → good.
- A 500 error or a raw database error message on screen → **a defect** (both the injection risk
  and the information disclosure).
- Different results returned, or a login bypassed → **critical security defect**. Stop, log it
  as security-sensitive, and follow your organisation's disclosure process rather than
  experimenting further.

**Rules of engagement:** only against systems you are authorised to test, never against
production, never against a third party, and never with a destructive payload
(`'; DROP TABLE users; --` is not a test, it's an outage). Your job is to demonstrate that input
is not sanitised, not to prove how much damage you can do.

**The correct fix, so you can speak to it:** parameterised queries / prepared statements, where
input is sent separately from the SQL and can never be interpreted as code. Input validation and
escaping are useful defence in depth, but parameterisation is the actual fix.

---

## Live activity (6 minutes)

Using the sample `customers` and `orders` tables above, write the SQL for:

1. All orders over ₦10,000 that used a coupon.
2. The number of orders per customer, including customers with zero orders.
3. Any customer whose email is duplicated, ignoring case.
4. The total revenue from orders that are `paid` or `delivered`.
5. Any order with a total of zero — and say why a tester would look for these.

<details>
<summary>Answers</summary>

```sql
-- 1
SELECT * FROM orders
WHERE total_amount > 10000 AND coupon_code IS NOT NULL;

-- 2  (LEFT JOIN so zero-order customers still appear)
SELECT c.id, c.email, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.email
ORDER BY order_count DESC;

-- 3
SELECT LOWER(email) AS email, COUNT(*) AS n
FROM customers
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- 4
SELECT SUM(total_amount) AS revenue
FROM orders
WHERE status IN ('paid', 'delivered');

-- 5
SELECT * FROM orders WHERE total_amount = 0;
```

**Why question 5 matters:** order 1005 has a total of ₦0.00 and a coupon applied. Either a
100% discount is legitimate, or the coupon calculation is broken and customers are getting free
goods. Zero-value and negative-value rows in a money column are always worth a look — this is
exactly the kind of finding that only appears when you query the data rather than clicking
through the UI.
</details>

---

## Common mistakes juniors make

- `WHERE column = NULL`. It always returns nothing. Use `IS NULL`.
- Forgetting that `<> 'value'` silently excludes NULL rows.
- Running an `UPDATE` in the wrong connection tab.
- Trusting `SELECT *` output in a GUI that truncates long values or hides whitespace — use
  `LENGTH()` when a value looks right but behaves wrong.
- Comparing a `DATE` to a `TIMESTAMP` and missing the rows from later in the day
  (`order_date = '2026-03-01'` misses `2026-03-01 14:30`). Use a range or a date cast.

---

## Week 3 wrap-up

You can now describe the whole path from a user's click to stored data, and inspect every step:
the URL and DNS, the network path and ports, the request and response, and the data at rest.
That is the foundation for Week 4, where you start sending requests yourself.

---

## Weekend homework (about 50 minutes)

1. **SQL practice.** Use a free interactive tutorial — `sqlbolt.com`, `sqlzoo.net`, or
   `pgexercises.com` — and complete the SELECT, WHERE, aggregate and JOIN sections. This is
   non-negotiable practice; SQL is the most transferable skill in this course.
2. **Build a validation checklist** of 10 queries you would run to validate a "user registration"
   feature — duplicates, whitespace, required fields, timestamps, default values, soft deletes.
   Keep it; you'll reuse it in real jobs.
3. **Reconciliation exercise:** pick any screen in any app that shows a total or a count. Write
   the SQL you *would* run to verify it, naming the tables and columns you'd expect to exist.
4. **Read ahead:** install Postman (or Bruno / Insomnia) and create a free account. Monday you
   send your first API request.

---

## Check your understanding

<details>
<summary>1. Why does `WHERE coupon_code = NULL` return no rows?</summary>

Because `NULL` means "unknown", and no comparison with an unknown value can be true — including
`NULL = NULL`. SQL uses three-valued logic (true/false/unknown), and `WHERE` only returns rows
where the condition is true. The correct forms are `IS NULL` and `IS NOT NULL`. The same trap
applies to `<>`: `WHERE status <> 'paid'` silently excludes rows where status is NULL.
</details>

<details>
<summary>2. You need every customer and their order count, including customers with no orders. Which join?</summary>

A `LEFT JOIN` from `customers` to `orders`, grouping by customer. An `INNER JOIN` would drop
every customer who has never ordered — which is exactly the population you often most want to
check, because empty states and zero-record handling are where defects hide.
</details>

<details>
<summary>3. What's the safe way to run an UPDATE in a test environment?</summary>

Confirm which environment you're connected to; write the statement as a `SELECT` with the
identical `WHERE` clause first and check the rows returned are exactly the ones you intend;
wrap the change in `BEGIN … COMMIT` so you can `ROLLBACK`; never omit the `WHERE`; and verify
with a `SELECT` afterwards before committing.
</details>

<details>
<summary>4. Entering a single apostrophe in a search field returns a 500 error page with a database error message. What have you found, and what's the severity?</summary>

Two defects. First, unescaped user input reaching the SQL layer — a probable SQL injection
vulnerability, which is Critical and should be reported through your security process rather
than explored further. Second, information disclosure: the error page is exposing internal
database details (table names, driver, sometimes the query itself) to the user, which helps an
attacker and is a defect in its own right. Report both, with the exact input and the response,
and don't attempt destructive follow-up payloads.
</details>

---

## Glossary additions

`SQL` · `SELECT` · `WHERE` · `ORDER BY` · `LIMIT` · `DISTINCT` · `LIKE` · `IN` · `BETWEEN` ·
`IS NULL` · `three-valued logic` · `COUNT` · `SUM` · `AVG` · `GROUP BY` · `HAVING` ·
`INNER JOIN` · `LEFT JOIN` · `orphaned record` · `transaction` · `BEGIN` · `COMMIT` ·
`ROLLBACK` · `SQL injection` · `parameterised query` · `prepared statement`
