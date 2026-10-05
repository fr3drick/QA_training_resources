# Day 32 — Designing Tables: Data Types, Constraints and Schema Review

> **Week 7 · Day 32 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 3 (static testing — reviewing a work product), Chapter 4.2 (black-box techniques applied to constraints)
> Prerequisites: Day 31

---

## At a glance

The application is supposed to stop bad data. Sometimes it doesn't — you've spent two weeks
proving that about QA Shop. **Constraints** are the database's own rules, and they hold no matter
which bug, script or person tries to break them. Reviewing a schema for missing constraints is
one of the highest-value static tests a tester can do: it finds whole classes of defect before a
single test runs.

By the end of this session you should be able to:

1. Choose the right **data type** — and recognise the wrong one (money as `float`, times without
   zones).
2. Write `CREATE TABLE` with **PRIMARY KEY, NOT NULL, UNIQUE, CHECK, FOREIGN KEY** and
   **DEFAULT**.
3. **Test constraints** by attacking them, and read the error codes.
4. **Review a schema** for missing constraints and justify each one with a rule.
5. Explain why adding a constraint to a live table can fail — and what `NOT VALID` does.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: QA Shop's existing constraints |
| 0:04 – 0:12 | Data types, and the ones that cause bugs |
| 0:12 – 0:24 | Constraints, with a correctly designed schema |
| 0:24 – 0:30 | Testing constraints: attack and read the error |
| 0:30 – 0:38 | Changing schemas: ALTER, NOT VALID, migrations |
| 0:38 – 0:57 | **Lab:** build, attack, then review QA Shop's schema |
| 0:57 – 1:00 | Homework |

---

## 1. Data types — and the ones that cause bugs

| Need | Use | Avoid, and why |
|---|---|---|
| Whole numbers | `integer` (±2.1 billion), `bigint` for IDs that may grow | `integer` for a high-volume ID — it **will** run out |
| **Money** | `numeric(12,2)` — exact decimal | `real` / `double precision` / `float`: binary floating point. `0.1 + 0.2 = 0.30000000000000004` |
| Text | `text` (PostgreSQL), or `varchar(n)` where a real limit exists | `char(n)` except for fixed codes — it pads with spaces |
| Yes/no | `boolean` | `'Y'`/`'N'` strings, `0`/`1` integers |
| A calendar date | `date` | Storing dates as text — `'03/04/2026'` is March or April depending on who reads it |
| A moment in time | `timestamptz` (timestamp **with** time zone) | `timestamp` without a zone — 14:00 *where?* |
| Unique IDs across systems | `uuid` | — |
| Flexible documents | `jsonb` | Using it to avoid designing a schema |

Try the money one in `psql`:

```sql
SELECT 0.1::float + 0.2::float  AS float_sum,      -- 0.30000000000000004
       0.1::numeric + 0.2::numeric AS numeric_sum; -- 0.3
```

Now imagine summing 3,000 order totals stored as `float` and reconciling them against the bank.
**A tester who sees money in a float column has found a defect** — before any test has run.

`timestamptz` doesn't store a zone; it stores an exact instant (in UTC) and converts on display.
`timestamp` stores a wall-clock reading with no zone at all. When servers in Lagos and Frankfurt
both write `2026-10-12 14:00` into a plain `timestamp`, those are two different moments recorded
as the same value. Day 15's "off-by-one-hour bugs" live here.

---

## 2. Constraints

| Constraint | Guarantees | Error when broken (SQLSTATE) |
|---|---|---|
| `NOT NULL` | A value is always present | `23502` not_null_violation |
| `UNIQUE` | No two rows share the value | `23505` unique_violation |
| `PRIMARY KEY` | `NOT NULL` + `UNIQUE`; the row's identity | `23505` / `23502` |
| `FOREIGN KEY` (`REFERENCES`) | The referenced row exists — no orphans | `23503` foreign_key_violation |
| `CHECK (condition)` | The condition is true for every row | `23514` check_violation |
| `DEFAULT` | A value when none is given | (not a check — a convenience) |

### A correctly designed version of QA Shop's core

Here is how QA Shop's main tables *could* have been designed, with every rule from the README
that the database can enforce. Read each constraint and find the rule it implements.

```sql
CREATE TABLE customers (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name  text        NOT NULL,
  last_name   text        NOT NULL,
  email       text        NOT NULL,
  country     char(2),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_first_name_not_blank CHECK (length(btrim(first_name)) > 0),
  CONSTRAINT customers_last_name_not_blank  CHECK (length(btrim(last_name)) > 0),
  CONSTRAINT customers_email_trimmed        CHECK (email = btrim(email)),
  CONSTRAINT customers_email_shape          CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT customers_country_iso          CHECK (country ~ '^[A-Z]{2}$')
);
-- R2: unique ignoring case. A plain UNIQUE (email) would allow Efe@ and efe@.
CREATE UNIQUE INDEX customers_email_lower_key ON customers (lower(email));

CREATE TABLE products (
  id        integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku       text          NOT NULL UNIQUE,
  name      text          NOT NULL,
  price     numeric(12,2) NOT NULL,
  stock     integer       NOT NULL DEFAULT 0,
  is_active boolean       NOT NULL DEFAULT true,
  CONSTRAINT products_price_non_negative CHECK (price >= 0),
  CONSTRAINT products_stock_non_negative CHECK (stock >= 0)           -- R13
);

CREATE TABLE orders (
  id           integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  integer       NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  status       text          NOT NULL DEFAULT 'pending',
  subtotal     numeric(12,2) NOT NULL,
  discount     numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_valid CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  CONSTRAINT orders_subtotal_non_negative CHECK (subtotal >= 0),
  CONSTRAINT orders_discount_in_range     CHECK (discount >= 0 AND discount <= subtotal),
  CONSTRAINT orders_total_matches         CHECK (total_amount = subtotal - discount),     -- R16
  CONSTRAINT orders_updated_after_created CHECK (updated_at >= created_at)
);

CREATE TABLE order_items (
  id         integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   integer       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id integer       NOT NULL REFERENCES products (id),
  qty        integer       NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) NOT NULL,
  CONSTRAINT order_items_qty_range       CHECK (qty BETWEEN 1 AND 10),            -- R11
  CONSTRAINT order_items_price_non_neg   CHECK (unit_price >= 0),
  CONSTRAINT order_items_line_total      CHECK (line_total = unit_price * qty),
  CONSTRAINT order_items_one_line_per_product UNIQUE (order_id, product_id)
);
```

Things to notice:

- **Name your constraints.** Unnamed table-level checks get names like `orders_check1`. When one
  fires in production at 3 a.m., `orders_total_matches` tells you what broke; `orders_check1`
  doesn't.
- **Foreign key actions are business decisions.** `ON DELETE CASCADE` on `order_items` means
  deleting an order deletes its lines — sensible. `ON DELETE RESTRICT` on `orders.customer_id`
  means you *cannot* delete a customer who has orders — also sensible, because financial records
  must survive. `CASCADE` there would silently delete a customer's entire order history. A tester
  reviewing a schema should ask "what happens when the parent is deleted?" for every foreign key.
- **`GENERATED ALWAYS AS IDENTITY`** refuses manually supplied IDs; `GENERATED BY DEFAULT` (what
  QA Shop uses) allows them, which is handy for seed data and risky everywhere else.
- **Some rules can't be constraints.** "One coupon per customer, unless cancelled" (R15) spans
  rows and depends on status. That needs application logic, a trigger, or a partial unique index
  — and is exactly the kind of rule that ends up broken. Constraints catch what they can; tests
  catch the rest.

### Normalisation in two minutes

`orders.subtotal` is a stored copy of `sum(order_items.line_total)`. That's **denormalised** —
duplicated data, kept for speed. Duplicated data can disagree with itself. The
`orders_total_matches` check protects one relationship, but nothing in the schema guarantees
`subtotal` equals the sum of the lines. **Every denormalised value is a consistency risk, and
deserves a data check** (Day 35). The normal forms (1NF, 2NF, 3NF) are the formal rules for
avoiding this; the practical version is "store each fact once, or test that the copies agree".

---

## 3. Testing constraints

A constraint is a requirement implemented in the database. Test it like one: for each
constraint, write a row that **should** be rejected, and check that it is — with the right error.

| Attack | Expected |
|---|---|
| `INSERT INTO customers (first_name, last_name, email) VALUES ('Ada','Okafor',NULL);` | `23502` not-null on `email` |
| `… VALUES ('Efe','Again','EFE@example.com');` (Efe exists) | `23505` on `customers_email_lower_key` |
| `… VALUES ('Tunde','Bakare','tunde@example.com ');` | `23514` `customers_email_trimmed` |
| `INSERT INTO products (sku,name,price,stock) VALUES ('HOME-002','Pot',32000,-1);` | `23514` `products_stock_non_negative` |
| `INSERT INTO orders (customer_id,subtotal,discount,total_amount) VALUES (999,100,0,100);` | `23503` FK — customer 999 doesn't exist |
| `… VALUES (1,100,0,90);` | `23514` `orders_total_matches` |
| `INSERT INTO orders (customer_id,status,subtotal,total_amount) VALUES (1,'refunded',100,100);` | `23514` `orders_status_valid` |
| `INSERT INTO order_items (…) VALUES (<order>,1,0,3500,0);` | `23514` `order_items_qty_range` |
| `DELETE FROM customers WHERE id = 1;` (has orders) | `23503` — violates RESTRICT |

Also test that **valid** boundary values are *accepted*: `qty` 1 and 10, `stock` 0, `discount`
equal to `subtotal`. A constraint that's too strict is a defect too — it blocks legitimate
business.

**A surprise worth knowing:** every failed `INSERT` still consumes an identity value. After a few
rejected orders, the next successful one might get `id` 5, not 1. IDs are unique, **not
gap-free** — a tester who reports "order IDs skip numbers" as a defect needs to know this. (If the
business needs gap-free invoice numbers — some tax authorities do — that's a separate
requirement needing a separate design.) And it's why you should capture the real ID with
`INSERT … RETURNING id` (Day 33) instead of assuming it.

---

## 4. Changing schemas

### ALTER TABLE

```sql
ALTER TABLE products ADD COLUMN weight_kg numeric(6,2);
ALTER TABLE products ADD CONSTRAINT products_weight_positive CHECK (weight_kg > 0);
ALTER TABLE products DROP CONSTRAINT products_weight_positive;
ALTER TABLE products RENAME COLUMN weight_kg TO weight;
```

### Adding a constraint to a table that already has bad data

`ALTER TABLE … ADD CONSTRAINT` checks **every existing row**. If any row violates it, the whole
statement fails:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_total_matches CHECK (total_amount = subtotal - discount);
-- ERROR:  check constraint "orders_total_matches" of relation "orders" is violated by some row
```

That error is a finding: *there is already bad data*. You now have to find it (Day 35) and decide
what to do with it. Meanwhile, you can protect **new** rows immediately:

```sql
ALTER TABLE orders
  ADD CONSTRAINT orders_total_matches CHECK (total_amount = subtotal - discount) NOT VALID;
-- new and updated rows are checked from now on; existing rows are not

-- ...after the existing data is cleaned up:
ALTER TABLE orders VALIDATE CONSTRAINT orders_total_matches;
```

(`NOT VALID` works for `CHECK` and `FOREIGN KEY`. A unique index has no equivalent — duplicates
must be resolved first.)

### Transactional DDL

In PostgreSQL, schema changes are transactional. You can **try** one safely:

```sql
BEGIN;
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
ROLLBACK;   -- undo, whatever happened
```

That's how you'll review QA Shop in the lab — without changing it. (MySQL does *not* roll back
DDL; there, a `CREATE` or `ALTER` commits immediately.)

### Migrations

In a real team, nobody runs `ALTER TABLE` by hand on a shared database. Schema changes are
**migrations**: numbered scripts in Git, applied in order by a tool (Flyway, Liquibase, Alembic,
Prisma, Rails, Django…). Migrations are code, and they need testing:

- Does it apply cleanly to a **copy of real data**, not just an empty database? (The `NOT VALID`
  story above is what happens when nobody checks.)
- Does the application still work after it — and *during* it, if deployments are rolling?
- Is there a **rollback** migration, and does it actually restore the previous state without
  losing data?
- How long does it take on production-size tables? Adding an index to 200 million rows can lock a
  table for minutes.

---

## Lab (19 minutes)

**Part A — build (5 min).** In your sandbox's `training` database (as `qa_admin`), create the four
tables from section 2. Insert one customer (`Efe`, `efe@example.com`, `NG`) and one product
(`HOME-001`, Ceramic Mug, 3500.00, stock 10). Create an order for Efe with
`INSERT … RETURNING id;` — note the id.

**Part B — attack (6 min).** Work through the attack table in section 3. For each, record the
error message and constraint name. Then test the accepted boundaries: `qty` 1 and 10, `stock` 0,
`discount = subtotal`. Did any valid value get rejected?

**Part C — review QA Shop (8 min).** Open `labs/qa-shop/db/01-schema.sql`. Compare it with
section 2 and list **every constraint QA Shop is missing**, with the README rule each one would
enforce.

Then connect to the QA Shop database (`qa_shop`, port 5432) and try adding each missing
constraint **inside a transaction**:

```sql
BEGIN;
ALTER TABLE products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
ROLLBACK;
```

Record which succeed and which fail, and the error for each failure.

**Debrief questions**
- Which constraints could QA Shop add today? Which fail, and what does each failure tell you about
  the existing data?
- After Week 6's race test, would `products_stock_non_negative` still add cleanly? Why not?
- If QA Shop had `CHECK (stock >= 0)` during the race test, what would the oversold customers have
  seen instead of a `201`? Would the data be fully correct? (Look at the order in which
  `POST /orders` inserts the order, inserts the lines and updates stock.)

---

## Common mistakes juniors make

- Money in `float`. Times in `timestamp` without a zone. Dates in `text`.
- Unnamed constraints that produce `orders_check1` in error logs.
- `UNIQUE (email)` and assuming it handles case.
- `ON DELETE CASCADE` everywhere "to make deletes work", wiping history with one statement.
- Only testing that bad rows are rejected — never that valid boundary rows are accepted.
- Running `ALTER TABLE` experiments on a shared database without a transaction.
- Treating "the app validates it" as a reason not to have a constraint. The app has bugs. You've
  spent two weeks proving it.

---

## Homework (about 45 minutes)

1. **Write up the schema review** as a short report: each missing constraint, the rule it
   enforces, whether it can be added to today's data, and — if not — the query that finds the
   violating rows. (Use your Day 15 SQL; Day 35 will make these a proper suite.)
2. **Foreign key policy.** For each foreign key in QA Shop, decide what `ON DELETE` behaviour the
   business needs (`RESTRICT`, `CASCADE`, `SET NULL`) and justify it in one sentence.
3. **Design exercise.** Design a `reviews` table for QA Shop: a customer reviews a product they
   bought, rating 1–5, optional text up to 2,000 characters, one review per customer per product.
   Write the `CREATE TABLE` with named constraints, then write five attack `INSERT`s and the
   constraint each should trip.

---

## Check your understanding

<details>
<summary>1. Why is <code>numeric(12,2)</code> correct for money and <code>double precision</code> wrong?</summary>

`numeric` stores exact decimal values, so 0.10 + 0.20 is exactly 0.30 and sums reconcile to the
kobo. `double precision` is binary floating point, which cannot represent most decimal fractions
exactly; tiny errors accumulate across thousands of rows, totals fail to reconcile, and equality
checks (`total = subtotal - discount`) fail unpredictably.
</details>

<details>
<summary>2. QA Shop has <code>email text NOT NULL UNIQUE</code>. What can still go wrong, and how would you fix it in the schema?</summary>

Case variants (`Ada@Example.com` vs `ada@example.com`) and leading/trailing spaces
(`'tunde@example.com '`) are different strings, so both pass `UNIQUE` — creating duplicate
accounts and un-loginable ones. Fix with a unique index on `lower(email)` and a check that
`email = btrim(email)` (and normalise input in the application). On QA Shop today, both changes
fail until the existing bad rows are cleaned up.
</details>

<details>
<summary>3. <code>ALTER TABLE orders ADD CONSTRAINT … CHECK (total_amount = subtotal - discount)</code> fails. What has the tester learned, and what are the options?</summary>

That rows already exist where the total doesn't add up — a data defect, now proven. Options:
find and fix (or explicitly accept) the bad rows and then add the constraint; or add it `NOT
VALID` immediately so no new bad rows can be written, clean up the history, and run `VALIDATE
CONSTRAINT` afterwards. Either way, the failing rows need a bug report — someone may have been
charged the wrong amount.
</details>

<details>
<summary>4. Why is reviewing a schema "static testing", and why is it so cost-effective?</summary>

It examines a work product (the schema definition) without executing the software — like a
requirements or code review (ISTQB chapter 3). It's cost-effective because one missing constraint
corresponds to a whole class of defects (every code path that could write a negative stock, a
duplicate email, a mismatched total). Finding it in review prevents those defects regardless of
which future bug, script or migration would have caused them.
</details>

---

## Glossary additions

`DDL` · `data type` · `numeric` · `floating point` · `timestamptz` · `constraint` ·
`NOT NULL` · `UNIQUE` · `PRIMARY KEY` · `FOREIGN KEY` · `CHECK` · `DEFAULT` · `SQLSTATE` ·
`ON DELETE CASCADE / RESTRICT / SET NULL` · `identity column` · `expression index` ·
`denormalisation` · `normal forms` · `ALTER TABLE` · `NOT VALID` · `VALIDATE CONSTRAINT` ·
`transactional DDL` · `migration` · `schema review`
