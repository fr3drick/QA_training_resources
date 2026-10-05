# Day 33 — Test Data with SQL: Create, Change, Seed, Reset, Snapshot

> **Week 7 · Day 33 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 5.1 (test environment and test data preparation), Chapter 1.4 (testware)
> Prerequisites: Days 15, 31, 32

---

## At a glance

Most test failures that aren't product defects are **data** problems: the record you needed
doesn't exist, is in the wrong state, or was changed by someone else's test. Today you learn to
create exactly the data a test needs, in states the application can't reach, repeatably — and to
put the database back afterwards.

By the end of this session you should be able to:

1. Insert data with **multi-row `INSERT`, `INSERT … SELECT`, `RETURNING`** and chained CTE inserts.
2. Generate **bulk data** with `generate_series`.
3. Update and delete safely with **`UPDATE … FROM`**, **`DELETE … USING`** and **savepoints**.
4. Write **idempotent seed scripts** with `ON CONFLICT` (upsert).
5. **Export, import, snapshot and restore** data — and know the legal limits on copying
   production data.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: the `reviews` table designs |
| 0:04 – 0:16 | Creating data, including states the API can't reach |
| 0:16 – 0:24 | Changing and removing data safely |
| 0:24 – 0:32 | Seed scripts, upserts, and reset |
| 0:32 – 0:38 | CSV in and out; snapshots; production data and privacy |
| 0:38 – 0:57 | **Lab:** test data for QA Shop |
| 0:57 – 1:00 | Homework |

---

## 1. Creating data

### The basics, plus `RETURNING`

```sql
-- several rows at once
INSERT INTO coupons (code, percent_off, min_order_amount, expires_at) VALUES
  ('QA-TEN',     10,     0, '2030-12-31'),
  ('QA-HALF',    50, 20000, '2030-12-31'),
  ('QA-EXPIRED', 15,     0, '2025-01-01');

-- get back what the database generated — never guess an ID (Day 32)
INSERT INTO customers (first_name, last_name, email, password_hash, country)
VALUES ('Kemi', 'Adebayo', 'qa.kemi@example.com',
        encode(sha256(convert_to('qa-shop:Passw0rd!', 'UTF8')), 'hex'), 'NG')
RETURNING id, created_at;
```

(That `encode(sha256(…))` is how QA Shop stores passwords, so this customer can log in through
the API with `Passw0rd!`. You'd find this out by reading the seed script — always read the seed
script.)

### States the API can't reach

Day 23 needed a **shipped** order to test R19 ("shipped orders cannot be cancelled"), and no
customer-facing endpoint can ship one. SQL can. A **CTE** (`WITH …`, Day 34 covers it properly)
lets one statement insert the order and use its new ID for the lines:

```sql
BEGIN;

WITH new_order AS (
  INSERT INTO orders (customer_id, status, subtotal, discount, total_amount, created_at, updated_at)
  VALUES (1, 'shipped', 0, 0, 0, now() - interval '2 days', now() - interval '1 day')
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total)
SELECT new_order.id, p.id, 1, p.price, p.price
FROM new_order
JOIN products p ON p.id IN (8, 13, 19)        -- Desk Lamp, Ground Coffee, Aso Oke Cap
RETURNING order_id, product_id, line_total;

-- totals FROM the lines, not typed by hand (use the order_id returned above)
UPDATE orders o
SET subtotal = t.lines_total, total_amount = t.lines_total - o.discount
FROM (SELECT order_id, sum(line_total) AS lines_total FROM order_items GROUP BY order_id) t
WHERE t.order_id = o.id AND o.id = 4006
RETURNING o.id, o.status, o.subtotal, o.total_amount;

COMMIT;
```

Why compute the totals instead of typing `37000`? Because when this lesson was written, the
author typed `37000` — and the three products actually cost ₦26,200. **Hand-made test data that
breaks the system's own invariants creates false bugs**: a later test fails, someone spends an
afternoon on it, and the "defect" is in the test data. Derive values, don't type them, and run
your data checks (Day 35) over your test data too.

Now log in as Efe and `POST /orders/4006/cancel`. R19 says `409`. What do you get?

### Bulk data with `generate_series`

`generate_series(1, 500)` produces the numbers 1 to 500 as rows. Build rows from them:

```sql
INSERT INTO products (sku, name, description, category, price, stock)
SELECT 'QA-TOY-' || lpad(g::text, 4, '0'),
       'QA test toy ' || g,
       'Created for testing',
       'toys',
       1000 + g,
       50
FROM generate_series(1, 500) AS g;
```

This is exactly how QA Shop's 200,000 products and 3,000 orders were made (read
`labs/qa-shop/db/02-seed.sql`). Use it for **volume testing** (Day 26) — does pagination still
work with 500 toys? Does the list still respond in time with 2 million products?

Random data, made **repeatable**:

```sql
SELECT setseed(0.42);                               -- same "random" numbers every run
SELECT round((500 + random() * 49500)::numeric, 2);  -- a price between 500 and 50,000
```

Without `setseed`, every run produces different data, and a test that fails once may never fail
again. Repeatable data is debuggable data.

**Mark your test data.** Prefixes like `QA-TOY-`, `qa.intern+…@example.com` or a
`created_by = 'qa'` column make test data easy to find and remove — and impossible to mistake for
real customers.

---

## 2. Changing and removing data safely

Day 15's rules still apply: know your connection (`\conninfo`), `SELECT` first, use a
transaction, never `UPDATE`/`DELETE` without `WHERE`.

### `UPDATE … FROM` — update from a join

```sql
-- put back the stock for everything in order 1001
UPDATE products p
SET stock = p.stock + s.sold
FROM (SELECT product_id, sum(qty) AS sold
      FROM order_items WHERE order_id = 1001
      GROUP BY product_id) s
WHERE s.product_id = p.id
RETURNING p.id, p.stock;
```

### `DELETE … USING` — delete based on another table

```sql
-- remove orders placed by accounts the Postman suite registered
-- (their order lines go too, via ON DELETE CASCADE)
DELETE FROM orders o
USING customers c
WHERE c.id = o.customer_id
  AND c.email LIKE 'qa.intern+%@example.com'
RETURNING o.id;
```

`RETURNING` on an `UPDATE` or `DELETE` shows you exactly which rows were affected — evidence for
your notes, and an early warning if the count is not what you expected.

### Savepoints

Inside a transaction, a **savepoint** is a bookmark you can roll back to without losing
everything before it:

```sql
BEGIN;
INSERT INTO coupons (code, percent_off) VALUES ('QA-FIVE', 5);
SAVEPOINT before_risky;
UPDATE coupons SET percent_off = 95 WHERE code LIKE 'QA-%';   -- oops, too broad?
ROLLBACK TO SAVEPOINT before_risky;                          -- undo just the update
COMMIT;                                                      -- QA-FIVE is kept
```

Note: in PostgreSQL, once any statement in a transaction **errors**, the whole transaction is
aborted until you `ROLLBACK` (or roll back to a savepoint taken before the error). "current
transaction is aborted, commands ignored until end of transaction block" means exactly that.

---

## 3. Seed scripts, upserts and reset

A **seed script** creates the baseline data every test can rely on. QA Shop's is
`db/02-seed.sql`, and `npm run db:reset` drops everything and reapplies it.

Good seed scripts are:

| Property | How |
|---|---|
| **Deterministic** | Fixed values; `setseed()` before any `random()` |
| **Ordered** | Parents before children (customers before orders) |
| **Idempotent** — safe to run twice | `ON CONFLICT`, or truncate first |
| **Documented** | The README lists what's in it (QA Shop's lists test accounts and coupons) |
| **In version control** | Reviewed and changed like code |

### Upsert: `INSERT … ON CONFLICT`

```sql
INSERT INTO coupons (code, percent_off, min_order_amount, expires_at) VALUES
  ('QA-TEN',     10,     0, '2030-12-31'),
  ('QA-HALF',    50, 20000, '2030-12-31'),
  ('QA-EXPIRED', 15,     0, '2025-01-01')
ON CONFLICT (code) DO UPDATE
SET percent_off      = EXCLUDED.percent_off,
    min_order_amount = EXCLUDED.min_order_amount,
    expires_at       = EXCLUDED.expires_at,
    is_active        = true;
```

If the code doesn't exist, insert it. If it does, update it to these values (`EXCLUDED` is the row
you tried to insert). Run it once or fifty times — you end up in the same state. Use
`ON CONFLICT (code) DO NOTHING` when you only want to add what's missing. (`ON CONFLICT` needs a
unique constraint or index on the conflict columns.)

### Reset strategies

| Strategy | Speed | Use when |
|---|---|---|
| Drop and recreate everything from scripts (`db:reset`) | Seconds–minutes | Small seed; you want a guaranteed-clean state |
| `TRUNCATE orders, order_items RESTART IDENTITY CASCADE;` then re-seed those tables | Fast | Only some tables change during tests |
| Delete only your marked test data (`… LIKE 'QA-%'`) | Fast | Shared environment you can't reset |
| Restore a snapshot (section 4) | Fast for large data | The baseline is big or hard to rebuild |
| Run each test in a transaction and roll back | Instant | Unit/integration tests inside the app's own test framework |
| Throwaway database per run (CI, Week 8) | Fresh every time | Pipelines — the best option when available |

---

## 4. CSV in and out; snapshots; privacy

### `\copy` — CSV between the database and your laptop

`\copy` is a **psql** command that streams data between a query and a file on the *client*
machine. (Plain SQL `COPY … TO 'file'` writes on the *server*, which inside Docker is somewhere
you probably can't see.)

Export the JMeter users file from Week 6 straight from the source of truth:

```sql
\copy (SELECT email, 'Passw0rd!' AS password FROM customers WHERE email LIKE 'loadtest%' ORDER BY id) TO 'users.csv' WITH (FORMAT csv, HEADER)
```

Import a CSV into a table:

```sql
\copy coupons (code, percent_off, min_order_amount, expires_at) FROM 'coupons.csv' WITH (FORMAT csv, HEADER)
```

`\copy` must be written on **one line**. When run via `docker compose exec db psql`, the file
path is inside the container; for files on your laptop, run `psql` locally or use DBeaver's
*Export Data* / *Import Data* wizards, which do the same job.

Exporting query results to CSV is also how you **attach evidence** to a bug report: "these 91
customers used the same coupon more than once" with the list attached.

### Snapshot and restore with `pg_dump` / `pg_restore`

Before a destructive test campaign, take a snapshot; afterwards, restore it:

```bash
# snapshot (custom format, compressed) — written inside the db container
docker compose exec db pg_dump -U qa -d qa_shop -Fc -f /tmp/before-tests.dump

# optional: copy it to your laptop to keep
docker compose cp db:/tmp/before-tests.dump ./before-tests.dump

# restore: drop the objects in the dump and recreate them with their data
docker compose exec db pg_restore -U qa -d qa_shop --clean --if-exists /tmp/before-tests.dump
```

If the restore hangs, something is holding a lock — stop the API (`docker compose stop api`),
restore, start it again. (Avoid piping binary dumps through PowerShell 5's `>` redirection — it
re-encodes the output and corrupts the file. Writing inside the container and using `docker
compose cp` avoids the problem.)

### Production data: just don't (without permission and masking)

"Let's copy production into QA so we have realistic data" is a common request and a serious
legal risk. Customer names, emails, phone numbers and addresses are **personal data**, protected
by law — in Nigeria the **Nigeria Data Protection Act 2023**, in Europe the **GDPR**. Copying
them into a less-protected test environment can breach those laws even if nothing leaks.

If production-shaped data is genuinely needed, it must be **masked** (anonymised) first, with
approval:

```sql
UPDATE customers
SET first_name = 'Customer',
    last_name  = id::text,
    email      = 'customer' || id || '@example.test';
```

Better still: **synthesise** realistic data with `generate_series` and known distributions, as
QA Shop does. Synthetic data has no privacy risk and is repeatable.

---

## Lab (19 minutes)

Reset QA Shop first (`docker compose exec api npm run db:reset`). Work in the `qa_shop` database
(it's a test environment you own; if it were shared, you'd use your sandbox).

1. **A shipped order (6 min).** Run the CTE insert from section 1 inside a transaction. Fix the
   order ID in the `UPDATE` to the one returned. `COMMIT`. Verify that `subtotal` equals the sum
   of the lines. Then, through Postman or `curl` as Efe, `GET` the order and try to cancel it.
   Which rule, which result? Check `products` 8, 13 and 19 — what happened to their stock?
2. **Volume (3 min).** Add the 500 `QA-TOY-` products. Call `GET /products?category=toys&limit=20`
   and check `total`. Then page to the very last page. Does the last page have the right number
   of items?
3. **Idempotent seed (3 min).** Run the `QA-` coupon upsert twice. Confirm there are exactly three
   `QA-` coupons. Use `QA-HALF` through the API on a ₦20,000+ order.
4. **Export (2 min).** Export `users.csv` for JMeter with `\copy`. Compare it with the reference
   `labs/qa-shop/reference/jmeter/data/users.csv`.
5. **Snapshot (5 min).** Snapshot with `pg_dump`. Delete all `QA-TOY-` products and the
   shipped order. Restore. Are they back?

**Debrief questions**
- Step 1: what defect did you reach, and why could only SQL get you there?
- Step 2: did paging behave correctly at the last page? How many products are in `toys` now?
- If two testers share one QA database and both run step 3, what happens? What if one of them
  had used plain `INSERT`?
- Which reset strategy would you choose for a 50 GB database? For a CI pipeline?

---

## Common mistakes juniors make

- Typing derived values (totals, counts) by hand and creating impossible data.
- Assuming the next ID instead of using `RETURNING`.
- Unmarked test data that nobody can safely clean up later — or that ends up in a real report.
- `random()` without `setseed()`, so a failure can never be reproduced.
- Seed scripts that fail with "duplicate key" when run twice.
- `COPY … TO 'file'` and wondering why the file isn't on your laptop (it's on the server — use
  `\copy`).
- Copying production personal data into test environments "just this once".
- Continuing to type after an error inside a transaction, not realising everything after it was
  ignored.

---

## Homework (about 45 minutes)

1. **Write `labs/qa-shop/sql/test-data.sql`**: an idempotent script that creates, for testing:
   one `shipped` and one `delivered` order for Efe (with correct totals), three `QA-` coupons, and
   a customer with 60 orders (to test that `GET /orders` returns only 50). Running it twice must
   not create duplicates. *Hint:* mark the orders so a re-run can delete and recreate them, or
   check for existence first.
2. **Write `labs/qa-shop/sql/cleanup.sql`**: removes everything your Postman suite and
   `test-data.sql` create, and nothing else. Prove it with before/after `count(*)`s.
3. **Test `GET /orders`** against your 60-order customer. Does it return 50? The 50 most recent?
   Is there any way to get the other 10? Which rule (or missing rule) applies?
4. **Masking.** Write a masking script for `customers` that keeps emails unique and keeps the
   load-test accounts working. Explain why each column is masked or kept.

---

## Check your understanding

<details>
<summary>1. Why use <code>RETURNING id</code> instead of <code>SELECT max(id)</code> after an insert?</summary>

`max(id)` is wrong as soon as anyone else inserts concurrently — you get *their* row — and
identity values aren't guaranteed to be sequential anyway (failed inserts consume values;
caches can reorder). `RETURNING` gives you exactly the values generated for *your* rows, in the
same statement, with no race.
</details>

<details>
<summary>2. What makes a seed script idempotent, and why does that matter for testers?</summary>

Running it any number of times leaves the database in the same state — achieved with
`ON CONFLICT … DO UPDATE / DO NOTHING`, existence checks, or truncating before inserting. It
matters because seed scripts get re-run: by pipelines, by colleagues, by you after a half-failed
run. A non-idempotent script either fails on the second run or quietly doubles the data, and
every test that counts rows starts failing for reasons unrelated to the product.
</details>

<details>
<summary>3. Your team wants a copy of production in the QA environment "for realistic data". What do you say?</summary>

That production contains personal data protected by law (Nigeria Data Protection Act 2023, GDPR
and similar), and copying it into a less-controlled environment can itself be a breach. If
production-shaped data is truly needed, it must be approved and masked before it leaves
production, with masking that also covers free-text fields and backups. Usually the better answer
is synthetic data generated to match production's volumes and distributions — no privacy risk,
and repeatable.
</details>

<details>
<summary>4. You inserted a shipped order directly with SQL and the API let you cancel it. Is that a real defect, or an artefact of how you created the data?</summary>

It's a real defect, provided the data you created is valid — a state the system can genuinely be
in (orders do become `shipped` through the warehouse process), with consistent totals and lines.
The API's cancel endpoint must enforce R19 regardless of how the order reached `shipped`. That's
why the totals were derived from the lines: if your test data had been impossible (say, a total
that didn't match its lines), a developer could fairly dismiss the result.
</details>

---

## Glossary additions

`DML` · `INSERT … RETURNING` · `INSERT … SELECT` · `CTE` · `generate_series` · `setseed` ·
`UPDATE … FROM` · `DELETE … USING` · `SAVEPOINT` · `aborted transaction` · `seed script` ·
`idempotent` · `upsert` · `ON CONFLICT` · `EXCLUDED` · `TRUNCATE … RESTART IDENTITY` · `\copy` ·
`COPY` · `pg_dump` · `pg_restore` · `snapshot` · `data masking` · `synthetic data` ·
`personal data` · `NDPA` · `GDPR`
