# Day 35 — Database Testing Project: Verify, Audit, and Reproduce the Race by Hand

> **Week 7 · Day 35 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4 (test techniques), Chapter 5.3 (test reporting), Chapter 5.5 (defect management)
> Prerequisites: Days 31–34
> This session is mostly the interns working. Keep your own talking to about 15 minutes.

---

## At a glance

Four weeks of QA Shop testing have each looked at one layer: the API's responses, its behaviour
under load, the schema. Today you test what all of them ultimately produce — **the data** — and
build the automated data-quality checks that Week 8's pipeline will run on every change.

By the end of this session you should be able to:

1. Verify **every API action against the database**, not just its response.
2. Build an automated **data-quality suite** that fails with a non-zero exit code.
3. Reproduce a **race condition by hand** with two `psql` sessions, and explain the fixes.
4. Report a **data defect** properly — including the data clean-up, not just the code fix.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: the search performance finding |
| 0:04 – 0:10 | API → database verification |
| 0:10 – 0:16 | Data-quality suites that a pipeline can run |
| 0:16 – 0:24 | **Demo:** the race condition, by hand, in two terminals |
| 0:24 – 0:28 | Reporting data defects |
| 0:28 – 0:55 | **Project** |
| 0:55 – 1:00 | Week 7 wrap-up |

---

## 1. API → database verification

An API response is the system's *claim* about what it did. The database is the *evidence*. For
every action that writes, there's a query that checks the claim:

| API action | What the response claims | What to verify in the database |
|---|---|---|
| `POST /auth/register` | Customer created | One new row; email stored exactly as sent (or normalised, if the spec says so — R2?); `password_hash` is **not** the plain password; `is_active = true`; `created_at` ≈ now |
| `POST /orders` (2 × product 6) | Order 4006 created, total 7,000 | `orders` row with matching totals; exactly one `order_items` line with `qty = 2`, `line_total = 7000`; product 6 stock **down by 2** |
| `POST /orders` with `WELCOME10` | 10% discount | `discount = 700`, `coupon_code = 'WELCOME10'`; and R15 — how many non-cancelled orders does this customer now have with this coupon? |
| `POST /orders/{id}/pay` | Status `paid` | `status = 'paid'`; `updated_at` changed and is ≥ `created_at`; nothing else changed |
| `POST /orders/{id}/cancel` | Status `cancelled` | Status changed; **stock returned** for every line, exactly once |
| A request that failed (`400`, `409`, `500`) | Nothing happened | **Nothing changed**: no half-written order, no stock moved. Failed requests that leave partial data are a classic defect |

Pattern for each:

```sql
-- BEFORE the API call
SELECT stock FROM products WHERE id = 6;                              -- e.g. 500
SELECT count(*) FROM orders WHERE customer_id = 1;                    -- e.g. 2

-- (call the API)

-- AFTER
SELECT stock FROM products WHERE id = 6;                              -- expect 498
SELECT o.id, o.status, o.subtotal, o.discount, o.total_amount,
       i.product_id, i.qty, i.unit_price, i.line_total
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE o.id = 4006;                                                    -- the id from the response
```

That last row of the table is the one people forget. Ask: *if this request failed half-way, what
would be left behind?* In QA Shop's `POST /orders`, the order row is inserted, then each line,
then each stock update — **without a transaction** (read `app/src/app.js`). If anything fails
after the first insert, the customer gets an error and the database keeps a partial order.

---

## 2. A data-quality suite a pipeline can run

Day 15 gave you validation queries one at a time. A **data-quality suite** runs them all, reports
the results, and — crucially — **fails** when something important is wrong, so a pipeline can act
on it.

The reference suite is `labs/qa-shop/reference/sql/data-checks.sql`. Its shape:

```sql
\set ON_ERROR_STOP on

CREATE TEMP TABLE dq_results (check_name text, severity text, violations bigint);

-- Every check counts rows that VIOLATE a rule. 0 = pass.
INSERT INTO dq_results
SELECT 'Products with negative stock', 'critical', count(*)
FROM products WHERE stock < 0;

INSERT INTO dq_results
SELECT 'Orders where total <> subtotal - discount', 'critical', count(*)
FROM orders WHERE total_amount <> subtotal - discount;

-- ... nine more ...

SELECT CASE WHEN violations = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       severity, check_name, violations
FROM dq_results ORDER BY (violations = 0), severity, check_name;

DO $$
DECLARE failed int;
BEGIN
  SELECT count(*) INTO failed FROM dq_results WHERE severity = 'critical' AND violations > 0;
  IF failed > 0 THEN
    RAISE EXCEPTION '% critical data-quality check(s) failed', failed;
  END IF;
END $$;
```

Run it:

```bash
docker compose exec -T db psql -U qa -d qa_shop -f - < reference/sql/data-checks.sql
echo $?
```

(`-f -` reads the script from standard input, which is the file on your laptop. If you have `psql`
installed locally: `psql "postgres://qa:qa@localhost:5432/qa_shop" -f reference/sql/data-checks.sql`.)

The design choices, and why:

| Choice | Why |
|---|---|
| Count **violations**, so 0 = pass | Uniform, comparable, easy to threshold |
| **Severity** per check | Critical (money, stock, integrity) fails the run; major is reported but doesn't block — the same quarantine idea as Day 24's known defects |
| `RAISE EXCEPTION` at the end + `ON_ERROR_STOP` | Makes `psql` exit **non-zero** → a pipeline job goes red (Day 38) |
| Report printed *before* the exception | The log shows every result, not just "failed" |
| Temp table | Leaves nothing behind in the database |

On a freshly seeded QA Shop it reports **3 critical and 4 major** failures — the historical data
defects planted in the seed — and exits non-zero. That's correct: the data *is* bad.

---

## 3. Demo: the race condition, by hand

On Day 30, JMeter oversold the Jollof Pot. Now see exactly how, in slow motion. Open **two
terminals**, each with `docker compose exec db psql -U qa -d qa_shop`. Call them A and B.

First, set up a single item in stock:

```sql
UPDATE products SET stock = 1 WHERE id = 7;
```

### The bug: check, then act

Run these **in order**, switching terminals as marked:

| Step | Terminal A | Terminal B |
|---|---|---|
| 1 | `BEGIN;` | |
| 2 | | `BEGIN;` |
| 3 | `SELECT stock FROM products WHERE id = 7;` → **1** — "one left, OK to sell" | |
| 4 | | `SELECT stock FROM products WHERE id = 7;` → **1** — "one left, OK to sell" |
| 5 | `UPDATE products SET stock = stock - 1 WHERE id = 7;` | |
| 6 | | `UPDATE products SET stock = stock - 1 WHERE id = 7;` → **hangs** |
| 7 | `COMMIT;` | → B's update completes |
| 8 | | `COMMIT;` |
| 9 | `SELECT stock FROM products WHERE id = 7;` → **-1** | |

Step 6 is the database doing its job: B waits for A's **row lock**. And `stock = stock - 1` reads
the latest committed value, so no decrement is lost. But both sessions **already decided** to sell
at steps 3 and 4, based on a value that was stale by the time they acted. That's the **check-then-
act race**, and it's exactly what `POST /orders` does — with a 50 ms "risk check" between the
check and the act to widen the window.

### Fix 1: lock the row when you read it

| Step | Terminal A | Terminal B |
|---|---|---|
| | `UPDATE products SET stock = 1 WHERE id = 7;` (reset) | |
| 1 | `BEGIN;` | `BEGIN;` |
| 2 | `SELECT stock FROM products WHERE id = 7 FOR UPDATE;` → 1 | |
| 3 | | `SELECT stock FROM products WHERE id = 7 FOR UPDATE;` → **hangs** |
| 4 | `UPDATE products SET stock = stock - 1 WHERE id = 7;` `COMMIT;` | → returns **0** — "sold out, reject" |
| 5 | | `ROLLBACK;` |

`FOR UPDATE` takes the lock at the *check*, so B's check waits and then sees the truth.

### Fix 2: make the check part of the act

```sql
UPDATE products SET stock = 1 WHERE id = 7;   -- reset

UPDATE products SET stock = stock - 1 WHERE id = 7 AND stock >= 1 RETURNING stock;  -- A: 0
UPDATE products SET stock = stock - 1 WHERE id = 7 AND stock >= 1 RETURNING stock;  -- B: UPDATE 0
```

One atomic statement: decrement **only if** there's enough. Zero rows updated = sold out. No
window at all. Add `CHECK (stock >= 0)` (Day 32) as the safety net beneath it.

You won't usually write the fix — but a tester who can demonstrate the race in two terminals, name
it, and point at both fixes turns a "flaky oversell under load" into a bug a developer can fix in
an hour.

**Reset afterwards:** `docker compose exec api npm run db:reset`.

---

## 4. Reporting a data defect

A data defect report has two extra parts that code-defect reports don't:

1. **The query is the reproduction step.** Include it verbatim, plus the count and a few sample
   rows (masked if they contain personal data).
2. **There are two fixes**: fix the *code* so it stops happening, and fix the *data* that's already
   wrong. Fixing the code leaves every bad row in place. Someone has to decide what the correct
   data is — which, for money, may need the finance team — and write a reviewed clean-up script.

> **Title:** 91 customers have used a single-use coupon more than once (R15)
> **Query:**
> ```sql
> SELECT customer_id, coupon_code, count(*) AS uses
> FROM orders WHERE coupon_code IS NOT NULL AND status <> 'cancelled'
> GROUP BY customer_id, coupon_code HAVING count(*) > 1;
> ```
> **Result:** 91 customer/coupon pairs; worst case: 8 uses of `SAVE20` by one customer.
> **Impact:** each extra use is an unauthorised 20% discount — **₦3,850,780** in total
> (sum of `discount` on every use after a customer's first; query attached).
> **Probable cause:** `POST /orders` counts only `paid` orders as uses (reproduced via API on Day 23).
> **Fixes needed:** (1) code: count every non-cancelled order; (2) data: business decision on
> existing orders — honour, or flag for review; (3) prevention: add this check to the pipeline.
> **Severity:** Major — direct revenue loss, ongoing. **Priority:** P1.

**Quantify impact in money** when you can. "Some coupons were reused" gets triaged next sprint;
"₦3.85 million in unauthorised discounts" gets fixed this week. The query behind that number uses
Day 34's `ROW_NUMBER` to skip each customer's first, legitimate use:

```sql
SELECT sum(discount) AS over_discount
FROM (SELECT discount,
             row_number() OVER (PARTITION BY customer_id, coupon_code ORDER BY created_at) AS n
      FROM orders
      WHERE coupon_code IS NOT NULL AND status <> 'cancelled') t
WHERE n > 1;
```

---

## 5. The project (27 minutes, then homework)

Reset QA Shop. Work in pairs.

### Part A — API → DB verification (10 min)

Pick **four** rows from the table in section 1 (include the failed-request row). For each: write
the before query, make the API call (Postman or `curl`), write the after query, and record
expected vs actual. At least one should involve the coupon rules.

### Part B — corrupt it, then catch it (10 min)

1. Run `data-checks.sql` on the fresh database. Record the result.
2. Run your Postman **known defects** folder (or the reference one) — it uses `qty: 0` and cancels
   delivered order 1001.
3. Run the Day 30 JMeter race command against product 7.
4. Run `data-checks.sql` again. **Which checks changed?** Which damage was done by the API itself,
   during tests that "only" checked responses?

### Part C — extend the suite (7 min, finish at home)

Copy the reference suite to `labs/qa-shop/sql/data-checks.sql` and add **at least four** checks of
your own, with a severity and a comment explaining the rule. Ideas:

- Inactive products in non-cancelled orders placed after the product was deactivated
- Paid/shipped/delivered orders whose customer is disabled
- Orders whose `discount` doesn't match the coupon's `percent_off` × `subtotal`
- Order lines whose `unit_price` differs from the product's current price by more than 50%
- Orders with an `updated_at` in the future
- Customers whose `password_hash` isn't 64 hex characters (could a password be stored in plain text?)

### Deliverable: `labs/qa-shop/sql/DATABASE_TEST_REPORT.md`

- Part A results table: action, check, expected, actual, pass/fail.
- Part B: data-checks output before and after, with an explanation of each change.
- Part C: your extended suite's results.
- **Bug reports** for at least three data defects, each in the format of section 4, with impact
  quantified where possible.
- A one-paragraph summary: what's the state of QA Shop's data, and what would you fix first?

---

## Week 7 wrap-up

You can now stand up a database, design and review a schema, create exactly the test data you
need, ask hard questions of the data, read a query plan — and prove, with a query, that the system
is quietly corrupting its own records.

You also now hold three kinds of automated testware for the same product: a Postman suite, a
JMeter plan with pass/fail thresholds, and a SQL data-quality suite — each of which exits non-zero
when something's wrong. Next week: Git and GitLab CI, and all three running automatically on every
change.

---

## Weekend homework (about 90 minutes)

1. **Finish the report and the extended suite.**
2. **Quantify.** For each data defect in your report, write the query that measures its business
   impact (money, customers affected, units oversold).
3. **Prepare for Week 8:**
   - Create a free account on **GitLab.com** and complete identity verification (needed to use
     GitLab's shared CI runners — it can take a day).
   - Install Git if you haven't: `git --version`.
   - Set your identity: `git config --global user.name "Your Name"` and
     `git config --global user.email "you@example.com"`.
   - Create an SSH key (`ssh-keygen -t ed25519`) and add the public key to GitLab (*User settings →
     SSH Keys*), or plan to use HTTPS with a personal access token.

---

## Check your understanding

<details>
<summary>1. <code>POST /orders</code> returns 500 half-way through. The response says nothing was created. How do you check, and what might you find?</summary>

Query the database for that customer's newest orders and their lines, and the stock of the
products involved, comparing with values taken before the request. Because QA Shop inserts the
order, its lines and the stock updates as separate statements without a transaction, a failure
part-way can leave an order with some or no lines, or lines without the matching stock decrement —
"ghost" data the customer was told doesn't exist.
</details>

<details>
<summary>2. In the two-terminal demo, B's <code>UPDATE</code> waited for A — so the database prevented a conflict. Why did stock still go negative?</summary>

The lock protected the *update*, but the *decision* to sell was made earlier, at the `SELECT`,
using a value that was already stale when B acted. Both sessions checked "1 left", both decided to
sell, and the database correctly applied both decrements one after the other: 1 → 0 → -1. The fix
must make the check and the update atomic — `SELECT … FOR UPDATE` before deciding, or a single
conditional `UPDATE … WHERE stock >= qty`.
</details>

<details>
<summary>3. Why should a data-quality suite distinguish critical and major checks instead of failing on any violation?</summary>

Because known, already-reported problems (historical bad data awaiting a business decision) would
otherwise fail every run, training everyone to ignore the result — the same reason known-defect API
tests are quarantined. Critical checks (money, stock, integrity) fail the run; major ones are
reported and tracked. As data is cleaned up, checks can be promoted to critical so they never
regress.
</details>

<details>
<summary>4. A developer fixes the coupon-reuse bug and closes your ticket. What's still missing?</summary>

The existing bad data: 91 customer/coupon pairs remain in the database. Someone must decide what to
do about them (honour, flag, recover), and a reviewed clean-up script must be run. There should
also be a regression check — the coupon-reuse query in the data-quality suite and an API test in
the regression folder — so the fix is proven and stays fixed. The ticket covers the code; the data
needs its own action.
</details>

---

## Glossary additions

`database testing` · `API-to-database verification` · `partial write` · `ghost data` ·
`data-quality suite` · `violation count` · `ON_ERROR_STOP` · `RAISE EXCEPTION` · `row lock` ·
`check-then-act` · `SELECT … FOR UPDATE` · `conditional update` · `atomic` · `data defect` ·
`data clean-up` · `impact quantification`
