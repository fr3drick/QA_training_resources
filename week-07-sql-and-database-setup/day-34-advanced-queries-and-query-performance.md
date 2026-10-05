# Day 34 — Advanced Queries, and Why Some Queries Are Slow

> **Week 7 · Day 34 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4 (test analysis — data analysis as a test technique), Chapter 2.2.2 (performance efficiency)
> Prerequisites: Days 15, 33; Day 29 (capacity curve)

---

## At a glance

Day 15 gave you `SELECT`, `JOIN` and `GROUP BY`. Real data questions need more: *each customer's
latest order*, *days with no sales*, *customers spending more than average*. And on Day 29 you
watched search drag QA Shop to its knee — today you find out why, in the query plan, and fix it
with one line.

By the end of this session you should be able to:

1. Use **subqueries**, **`EXISTS`** and **CTEs** to break a question into steps.
2. Use **window functions** — `ROW_NUMBER`, `RANK`, `LAG`, running `SUM` — for "per group" and
   "compared with the previous row" questions.
3. Use **`CASE`**, date functions and **views**.
4. Read an **`EXPLAIN ANALYZE`** plan and spot a sequential scan.
5. Show, with numbers, how an **index** changes a query — and a load test.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: the 60-order customer and `GET /orders` |
| 0:04 – 0:12 | Subqueries, EXISTS and CTEs |
| 0:12 – 0:22 | Window functions |
| 0:22 – 0:27 | CASE, dates, views |
| 0:27 – 0:39 | EXPLAIN ANALYZE and indexes — QA Shop's search |
| 0:39 – 0:57 | **Lab:** ten questions, then fix search and re-measure |
| 0:57 – 1:00 | Homework |

---

## 1. Subqueries, EXISTS and CTEs

### Subqueries

A query inside a query. Three common shapes:

```sql
-- IN: orders for products in the 'books' category
SELECT * FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE category = 'books');

-- scalar: a single value used in a comparison
SELECT id, total_amount FROM orders
WHERE total_amount > (SELECT avg(total_amount) FROM orders);

-- EXISTS / NOT EXISTS: is there at least one matching row?
SELECT c.id, c.email
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

`NOT EXISTS` is the safe way to ask "which have none?". It does the same job as Day 15's
`LEFT JOIN … WHERE … IS NULL`, and — unlike `NOT IN` — it doesn't silently return nothing when the
subquery contains a `NULL`. (`x NOT IN (1, 2, NULL)` is never true: Day 15's three-valued logic
again.)

### CTEs: name the steps

A **Common Table Expression** (`WITH name AS (…)`) names an intermediate result so the final
query reads top to bottom:

```sql
WITH spend AS (
  SELECT customer_id, sum(total_amount) AS total_spend
  FROM orders
  WHERE status <> 'cancelled'
  GROUP BY customer_id
)
SELECT customer_id, total_spend
FROM spend
WHERE total_spend > (SELECT avg(total_spend) FROM spend)
ORDER BY total_spend DESC;
```

For a tester, CTEs make **data-validation queries reviewable**. A colleague can check each step's
logic separately — and so can you, by running the CTE on its own first.

---

## 2. Window functions

`GROUP BY` collapses rows into one per group. A **window function** computes across a group of
rows **without collapsing them** — every row keeps its identity and gains a new column.

```
function() OVER (PARTITION BY <group> ORDER BY <order>)
```

### "The latest X per Y" — `ROW_NUMBER`

```sql
SELECT customer_id, id AS order_id, status, created_at
FROM (
  SELECT o.*,
         row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders o
) ranked
WHERE rn = 1
ORDER BY customer_id;
```

Each customer's orders are numbered 1, 2, 3… newest first; keep number 1. This pattern answers a
huge family of questions: latest order, first login, most recent status change, current price.

### Duplicates — keep one, show the rest

```sql
SELECT id, email
FROM (
  SELECT id, email,
         row_number() OVER (PARTITION BY lower(btrim(email)) ORDER BY id) AS n
  FROM customers
) t
WHERE n > 1;
```

→ customer 5, `Ada@Example.com`: the duplicate of customer 2. Day 15 found *that* duplicates
exist (`GROUP BY … HAVING count(*) > 1`); this shows *which rows* are the extra copies — what a
clean-up script needs.

### `RANK` — ties share a place

```sql
SELECT customer_id, count(*) AS orders,
       rank() OVER (ORDER BY count(*) DESC) AS place
FROM orders
GROUP BY customer_id
ORDER BY place
LIMIT 10;
```

Two customers with 42 orders both get place 3; the next gets 5. (`dense_rank()` would give 4.)

### `LAG` — compare with the previous row

```sql
-- average days between a customer's consecutive orders
SELECT customer_id,
       round(avg(extract(epoch FROM created_at - prev_at) / 86400)::numeric, 1) AS avg_days_between
FROM (
  SELECT customer_id, created_at,
         lag(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) AS prev_at
  FROM orders
) t
WHERE prev_at IS NOT NULL
GROUP BY customer_id
ORDER BY avg_days_between
LIMIT 5;
```

Testers use `LAG` to find **sequence anomalies**: a status that went backwards, a balance that
jumped, two events seconds apart that should be minutes apart (double submissions!).

### Running totals

```sql
WITH daily AS (
  SELECT date_trunc('day', created_at)::date AS day, sum(total_amount) AS revenue
  FROM orders
  WHERE status IN ('paid', 'shipped', 'delivered')
    AND created_at >= now() - interval '7 days'
  GROUP BY 1
)
SELECT day, revenue,
       sum(revenue) OVER (ORDER BY day) AS running_total
FROM daily
ORDER BY day;
```

---

## 3. CASE, dates and views

### `CASE` — bucket and label

```sql
SELECT CASE
         WHEN total_amount < 20000 THEN 'small (< 20k)'
         WHEN total_amount < 60000 THEN 'medium (20k–60k)'
         ELSE 'large (60k+)'
       END AS size,
       count(*) AS orders
FROM orders
GROUP BY 1
ORDER BY min(total_amount);
```

Equivalence partitions (Day 7), in SQL: you've just checked how real data spreads across the
partitions — which tells you where tests matter most.

### Dates

| Expression | Gives |
|---|---|
| `date_trunc('month', created_at)` | The start of the month — for grouping |
| `extract(hour FROM created_at)` | 0–23 — "which hour is busiest?" (load-test workload modelling!) |
| `now() - interval '7 days'` | A week ago |
| `created_at AT TIME ZONE 'Africa/Lagos'` | The wall-clock time in Lagos |
| `generate_series(start, end, interval '1 day')` | Every day in a range — for finding gaps |

**Time zones affect grouping.** `date_trunc('day', created_at)` truncates in the *session's* time
zone. Docker's PostgreSQL defaults to UTC, so an order at 00:30 in Lagos (23:30 UTC the day
before) lands in "yesterday". For business reports, convert first:
`date_trunc('day', created_at AT TIME ZONE 'Africa/Lagos')`. A daily-sales figure that doesn't
match the finance team's is very often this.

Gap detection — days with **no** orders:

```sql
SELECT d::date AS day
FROM generate_series(date_trunc('day', now()) - interval '199 days',
                     date_trunc('day', now()),
                     interval '1 day') AS d
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.created_at >= d AND o.created_at < d + interval '1 day'
)
ORDER BY day;
```

A day with zero orders in a busy shop is either a holiday or an outage nobody noticed.

### Views

Save a query you run often as a **view** — a named query that behaves like a table:

```sql
CREATE VIEW order_totals_check AS
SELECT o.id, o.subtotal, coalesce(sum(i.line_total), 0) AS lines_total
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.subtotal;

SELECT * FROM order_totals_check WHERE subtotal <> lines_total;
```

→ order 2750: a subtotal of ₦147,600 and no lines at all. A view stores the *query*, not the
data, so it's always current.

---

## 4. Why is search slow? `EXPLAIN ANALYZE`

On Day 29, `GET /products/search` and its database work dragged QA Shop to its knee. Here's the
query the API runs:

```sql
SELECT id, sku, name, description, category, price, stock FROM products
WHERE is_active = true
  AND (name ILIKE '%' || 'deluxe' || '%' OR description ILIKE '%' || 'deluxe' || '%')
ORDER BY name
LIMIT 50;
```

Ask PostgreSQL how it runs it:

```sql
EXPLAIN ANALYZE
SELECT id, name FROM products
WHERE is_active = true
  AND (name ILIKE '%deluxe%' OR description ILIKE '%deluxe%')
ORDER BY name LIMIT 50;
```

```
Limit  (actual time=64.4..69.4 rows=50 loops=1)
  ->  Gather Merge
        ->  Sort  (... rows=40 loops=3)
              Sort Key: name
              ->  Parallel Seq Scan on products  (actual time=0.03..32.9 rows=8333 loops=3)
                    Filter: (is_active AND ((name ~~* '%deluxe%') OR (description ~~* '%deluxe%')))
                    Rows Removed by Filter: 58340
Execution Time: 70.1 ms
```

*(Trimmed. Times are from one laptop; yours will differ.)*

How to read it — **bottom up**, innermost first:

| Line | Means |
|---|---|
| **`Seq Scan on products`** | Read **every row** of the table. On 200,000 rows, that's the problem |
| `Filter: … ~~* '%deluxe%'` | `~~*` is `ILIKE`. Every row's name *and* description is pattern-matched |
| `Rows Removed by Filter: 58340` (×3 workers) | Almost all the work was thrown away |
| `Sort` / `Limit` | Then sort what's left and keep 50 |
| `Execution Time` | Total, in the database |

70 ms sounds fast. But Day 26: multiply by concurrent users. Each search keeps a CPU core busy
for 70 ms; with 400 shoppers searching, the database runs out of cores and *everything* queues
behind search — including `POST /orders`, which never touches the `products` text columns.

> **`EXPLAIN` vs `EXPLAIN ANALYZE`:** plain `EXPLAIN` shows the *estimated* plan without running
> the query. `EXPLAIN ANALYZE` **actually runs it** and reports real times and row counts. So
> `EXPLAIN ANALYZE DELETE …` *deletes the rows*. Wrap it in `BEGIN; … ROLLBACK;` for anything
> that writes.

### Why doesn't an ordinary index help?

A normal (B-tree) index is like a phone book: sorted alphabetically, great for `name = 'Mug'` or
`name LIKE 'Mug%'`. A **leading wildcard** — `'%deluxe%'` — means "contains, anywhere", and a
sorted list can't help you find words in the middle of names.

### The fix: a trigram index

PostgreSQL's `pg_trgm` extension indexes every three-letter fragment of the text ("del", "elu",
"lux", "uxe"…), so "contains" searches can use an index:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_name_trgm_idx        ON products USING gin (name gin_trgm_ops);
CREATE INDEX products_description_trgm_idx ON products USING gin (description gin_trgm_ops);
ANALYZE products;
```

Re-run the `EXPLAIN ANALYZE`:

```
->  Bitmap Heap Scan on products  (actual time=2.5..21.4 rows=25000 loops=1)
      ->  BitmapOr
            ->  Bitmap Index Scan on products_name_trgm_idx         (actual time=2.1 ...)
            ->  Bitmap Index Scan on products_description_trgm_idx  (actual time=0.03 ...)
Execution Time: 29.7 ms
```

`Seq Scan` became `Bitmap Index Scan`. For `deluxe` — a common word matching 25,000 products —
the time halves. For a **selective** term like `jollof` (one match), it drops from tens of
milliseconds to well under one. Indexes help most when they let the database skip most of the
table.

### Re-run the load test

Same reference JMeter plan, same laptop, **400 users** — the step that broke QA Shop on Day 29:

| | p95 all | p95 search | p95 list | p95 `POST /orders` | Throughput |
|---|---|---|---|---|---|
| Without trigram indexes | 2,470 ms | 856 ms | 1,428 ms | 3,274 ms | 188 req/s |
| **With** trigram indexes | **55 ms** | **23 ms** | **138 ms** | **60 ms** | **285 req/s** |

One `CREATE INDEX` moved the knee. Notice that `POST /orders` got 50× faster too — it was never
slow itself; it was **queueing behind** search for database CPU. That's why you look for the
bottleneck instead of tuning whichever endpoint looks slowest.

### Indexes aren't free

- Every `INSERT`/`UPDATE` must also update every index — writes get slower.
- They take disk space (trigram indexes are large).
- Creating one on a big, busy table can lock writes for a long time (`CREATE INDEX CONCURRENTLY`
  avoids that, slowly).
- An index nobody's query uses is pure cost.

So the tester's job is not "add indexes" — it's to **measure**: show the plan, show the load-test
numbers before and after, and let the team decide.

### And `GET /products`?

```sql
EXPLAIN ANALYZE SELECT count(*) FROM products WHERE is_active = true;
```

`Parallel Seq Scan` again — counting 200,000 rows on *every* page request to fill in `total`. No
index makes an exact `count(*)` over most of a table cheap. Options a tester might suggest: cache
the count, return an estimate, or drop `total` in favour of "has next page". That's a design
conversation, and your `EXPLAIN` output is the evidence that starts it.

---

## Lab (18 minutes)

Work in the `qa_shop` database. Reset first.

**Part A — ten questions (10 min).** Write the SQL; answers below. Compare with your neighbour —
the seed is deterministic, so everyone's results should match (except anything relative to
`now()`).

1. Which customers have never placed an order? *(Hint: `NOT EXISTS`.)* Why are they interesting?
2. Each customer's most recent order (id, status, date).
3. Revenue per month for `paid`, `shipped` and `delivered` orders.
4. The 5 products with the most units sold, excluding cancelled orders.
5. How many orders are small, medium and large (bands from section 3)?
6. Which days in the last 200 have no orders?
7. The top 10 customers by number of orders, with ties ranked fairly.
8. Average days between consecutive orders, per customer — the 5 most frequent buyers.
9. Customers whose total non-cancelled spend is above the average customer's.
10. Every customer row that is a case/whitespace duplicate of an earlier one.

**Part B — fix search (8 min).**
1. Run `\timing` and the `EXPLAIN ANALYZE` from section 4 for `deluxe` and for `jollof`. Note the
   plan type and time.
2. Create the trigram indexes. Re-run both. Note the change.
3. If time: re-run your Day 29 step at (or just past) your knee and compare p95s.
4. **Reset the database afterwards** — the indexes aren't part of the official QA Shop, and
   other exercises (and Week 8's pipeline) assume they're absent.

<details>
<summary>Part A answers</summary>

```sql
-- 1  → Bola (disabled), Ada@Example.com (the duplicate), 'tunde@example.com ' (trailing space).
--    All three are data problems: a disabled account, a duplicate and an un-loginable address.
SELECT c.id, c.email FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
ORDER BY c.id;

-- 2
SELECT customer_id, id AS order_id, status, created_at
FROM (SELECT o.*, row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
      FROM orders o) ranked
WHERE rn = 1 ORDER BY customer_id;

-- 3
SELECT date_trunc('month', created_at)::date AS month, count(*) AS orders, sum(total_amount) AS revenue
FROM orders WHERE status IN ('paid', 'shipped', 'delivered')
GROUP BY 1 ORDER BY 1;

-- 4
SELECT p.id, p.name, sum(i.qty) AS units
FROM order_items i
JOIN orders o   ON o.id = i.order_id
JOIN products p ON p.id = i.product_id
WHERE o.status <> 'cancelled'
GROUP BY p.id, p.name
ORDER BY units DESC LIMIT 5;

-- 5  (section 3)

-- 6  (section 3) — the first few days of the window, before the seeded history begins

-- 7
SELECT customer_id, count(*) AS orders, rank() OVER (ORDER BY count(*) DESC) AS place
FROM orders GROUP BY customer_id ORDER BY place LIMIT 10;

-- 8  (section 2, LAG)

-- 9  (section 1, CTE)

-- 10 → customer 5
SELECT id, email FROM (
  SELECT id, email, row_number() OVER (PARTITION BY lower(btrim(email)) ORDER BY id) AS n
  FROM customers) t
WHERE n > 1;
```
</details>

**Debrief questions**
- Question 1: why might a tester be *more* interested in customers with no orders than in those
  with many?
- Part B: why did `POST /orders` get faster after an index on `products.name`?
- If adding the index slows down `INSERT INTO products` by 30%, is that acceptable? Who decides,
  and what would you measure to help them?

---

## Common mistakes juniors make

- `NOT IN (subquery)` where the subquery can return `NULL` — silently returns nothing.
- Trying to filter on a window function in the same query's `WHERE` (it's computed after `WHERE`
  — wrap it in a subquery, as in section 2).
- Grouping by day in UTC and comparing with a report in local time.
- `EXPLAIN ANALYZE` on a `DELETE` or `UPDATE` without a transaction.
- Concluding "the index made it faster" from one run on a warm cache. Run it several times; the
  first run after a restart reads from disk.
- Adding indexes as a reflex instead of measuring — and never checking whether the new index is
  used.
- Leaving experimental indexes in a shared database, so everyone else's measurements change.

---

## Homework (about 45 minutes)

1. **Workload from data.** Using `extract(hour FROM created_at AT TIME ZONE 'Africa/Lagos')`, find
   the busiest hour for orders in QA Shop's history. (The seed's timestamps are spread uniformly at
   random, so expect a flat profile — in production data this query tells you when the real peak
   is.) Write down how you would use a real answer to set the load in a JMeter test.
2. **Sequence anomalies.** Write a `LAG` query that would find any customer who placed two orders
   less than 10 seconds apart — possible double submissions. Run it on QA Shop after a Week 6 race
   test. What do you find?
3. **Plan reading.** Run `EXPLAIN ANALYZE` on `SELECT * FROM orders WHERE customer_id = 7;` and on
   `SELECT * FROM orders WHERE status = 'paid';`. One uses an index and one doesn't. Which, why,
   and would an index on `status` help? (Think about how many rows each returns.)
4. **Write it up.** A half-page finding for the search performance problem: the evidence (plan,
   timings, load-test numbers before/after), the recommended fix, and its costs.

---

## Check your understanding

<details>
<summary>1. What's the difference between <code>GROUP BY customer_id</code> and <code>OVER (PARTITION BY customer_id)</code>?</summary>

`GROUP BY` collapses each customer's rows into one output row, so you can only select the group
key and aggregates. A window function with `PARTITION BY` computes over each customer's rows but
keeps every row, adding the computed value alongside — so you can number, rank or compare each
order within its customer while still seeing the order's own columns.
</details>

<details>
<summary>2. An <code>EXPLAIN ANALYZE</code> shows <code>Seq Scan on products ... Rows Removed by Filter: 199,950</code>. What does it tell you, and is it always bad?</summary>

The database read every row and discarded almost all of them — it had no index it could use for
this filter. On a 200,000-row table queried hundreds of times a second, that's a scalability
problem. It isn't always bad: on a small table, or when the query returns most of the table, a
sequential scan is the fastest option and the planner chooses it deliberately.
</details>

<details>
<summary>3. After adding the trigram index, <code>POST /orders</code> p95 dropped from 3.3 s to 60 ms at 400 users, though the order query never uses that index. Explain.</summary>

The bottleneck was shared database CPU, not the order query. Searches doing sequential scans
saturated the database's cores, so every other query — including the order inserts and stock
updates — waited in line. Making search cheap freed the CPU, and the queueing disappeared for
everyone. Performance problems often show up far from their cause, which is why you find the
saturated resource before tuning individual endpoints.
</details>

<details>
<summary>4. Why must you be careful with <code>EXPLAIN ANALYZE</code> on data-changing statements?</summary>

Because it actually executes the statement to measure it. `EXPLAIN ANALYZE DELETE FROM orders
WHERE …` really deletes the rows. Wrap it in `BEGIN; … ROLLBACK;`, or use plain `EXPLAIN`, which
only shows the estimated plan without running anything.
</details>

---

## Glossary additions

`subquery` · `scalar subquery` · `EXISTS` · `NOT EXISTS` · `NOT IN NULL trap` · `CTE` ·
`window function` · `PARTITION BY` · `ROW_NUMBER` · `RANK` · `DENSE_RANK` · `LAG` ·
`running total` · `CASE` · `date_trunc` · `AT TIME ZONE` · `gap detection` · `view` ·
`EXPLAIN` · `EXPLAIN ANALYZE` · `query plan` · `sequential scan` · `index scan` ·
`bitmap index scan` · `B-tree index` · `trigram index` · `pg_trgm` · `selectivity`
