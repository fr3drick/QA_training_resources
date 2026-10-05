# QA Shop — instructor notes

> **Interns: stop reading here.** This file lists the bugs that were planted in QA Shop. Finding
> them yourself is the point of Weeks 5–8; reading this first turns a month of practice into a
> list of answers.

---

## Before Week 5

- Check every intern machine can run Docker Desktop (Windows needs WSL 2 and virtualisation
  enabled in the BIOS — sort this out *before* Day 21, it can take an hour per machine).
  Minimum sensible spec: 8 GB RAM, 4 cores. The seed loads 200,000 products, which takes a few
  seconds and about 150 MB of disk.
- If Docker is impossible on a machine, Option B in the README (local Node + Postgres) works.
- Run `docker compose up -d --build` once on each machine in advance so the images are cached.
- `docker compose exec api npm run db:reset` restores the original data in ~3 seconds. Reset at
  the start of every session from Week 5 onward; many exercises depend on the seed state (order
  1001 being `delivered`, Chidi never having used `WELCOME10`, and so on).

---

## The planted API defects

Each one breaks a numbered rule in the README, so every finding can be traced to the
specification. The "found in" column is where the course *expects* most interns to find it —
good interns find several earlier.

| # | Defect | Rule | How it shows | Found in | Code location |
|---|---|---|---|---|---|
| D1 | **BOLA / IDOR**: any customer can read any order | R17 | Log in as Efe, `GET /orders/1004` (Ada's) → `200` | Day 22–23 | `app.js` — `GET /orders/:id` has no ownership check (pay and cancel do) |
| D2 | `qty: 0` accepted | R11 | `POST /orders` with `qty: 0` → `201`, an order line for zero units | Day 22 (BVA) | `app.js` — `item.qty < 0` should be `< 1` |
| D3 | Delivered/shipped orders can be cancelled — **and are restocked** | R19 | Log in as Efe, `POST /orders/1001/cancel` → `200` | Day 23 (state transitions) | `app.js` — only `cancelled` is rejected |
| D4 | Coupon reusable | R15 | Create two `pending` orders with `WELCOME10` → both `201`; pay both | Day 23 | `app.js` — usage check counts only `status = 'paid'` |
| D5 | Email uniqueness is case-sensitive | R2 | Register `EFE@example.com` → `201` | Day 22 / Day 32 | `UNIQUE (email)` in schema; no `lower()` |
| D6 | User enumeration on login | R4 | Unknown email → "No account found for that email"; wrong password → "Incorrect password" | Day 22 | `app.js` — `/auth/login` |
| D7 | Stack traces and file paths in every error | R21 | `GET /products/abc`, malformed JSON, `page=0` | Day 22 | `app.js` — final error handler |
| D8 | Non-numeric product id → `500` | R9 | `GET /products/abc` | Day 22 | `app.js` — id passed straight to SQL |
| D9 | `page=0` or negative → `500` | R7 | `GET /products?page=0` | Day 22 (BVA) | `app.js` — no `page >= 1` check |
| D10 | `limit` is not capped at 100 | R7 | `GET /products?limit=100000` → 100,000 rows, ~20 MB, ~0.5 s | Day 22 / Day 26 | `app.js` — no upper bound |
| D11 | **Stock oversold under concurrency** (race condition) | R13 | JMeter with `-Jproduct_id=7` → stock goes negative | Day 30 / Day 35 | `app.js` — check-then-update with no transaction or row lock, plus a 50 ms "risk check" in between |
| D12 | Search is slow and does not scale | NFR1 | p95 climbs steeply past ~50 users; `EXPLAIN ANALYZE` shows a sequential scan | Day 29–30 / Day 34 | `ILIKE '%term%'` on name *and* description, no trigram index |
| D13 | Non-string password → `500` | R3 | `{"password": 12345678, …}` on register | Bonus | `app.js` — `password.length` on a number |
| D14 | Weak, guessable JWT secret | R6 | Secret defaults to `qa-shop-dev-secret`; a forged token for `sub: 2` is accepted | Bonus (Day 18 revisited) | `auth.js` |

**Not defects, but good questions to reward** (the spec is silent or ambiguous):

- Are coupon codes case-sensitive? (`save20` → `422`.) The spec doesn't say.
- Can `q` contain `%` or `_`? Searching `%%` returns 50 arbitrary products — wildcards aren't escaped.
- Is there a maximum length for names? There isn't.
- Login is case-sensitive on email (`EFE@EXAMPLE.COM` → `401`). Combined with D5, is that right?
- `GET /orders` silently returns only the 50 most recent orders — is there pagination?

## The planted data defects (Week 7)

All are in the seed data and are caught by `reference/sql/data-checks.sql`.

| Defect | Where | Check that finds it |
|---|---|---|
| Duplicate email ignoring case | customers 2 and 5 (`ada@…` / `Ada@Example.com`) | `lower(email)` duplicates |
| Trailing space in email | customer 6 (`'tunde@example.com '`) | `email <> btrim(email)` |
| `total_amount` ≠ `subtotal − discount` | orders 1005 (total 0.00) and 2222 (+1,000) | totals check |
| Delivered order with no items | order 2750 | `NOT EXISTS` order_items |
| `updated_at` before `created_at` | order 1500 | timestamp check |
| Same coupon used repeatedly | 91 customer/coupon pairs — evidence that D4 has been live for months | coupon reuse check |

After interns run the Known Defects folder or the stress test, two more checks start failing:
**negative stock** (D11) and **qty ≤ 0** (D2). That is the Day 35 / Day 38 "aha": the API tests
passed, the data is corrupt, and only the database checks noticed.

## Expected reference results

From a fresh `db:reset`:

| Run | Expected |
|---|---|
| `newman` folders 01–06 | All pass (≈130 assertions). Re-runnable without a reset. |
| `newman` folder 99 | 11 assertion failures — one or two per known defect. |
| JMeter, 20 threads, default think time, 120 s | 0% errors, every p95 well under 1 s on a modern laptop |
| JMeter, 100 threads, no think time, `-Jproduct_id=7` | Product 7 stock negative; `GET /products` and search p95 rise sharply |
| `data-checks.sql` | 3 critical and 4 major failures; exits non-zero |

## Week 8 notes

- On GitLab.com, new free accounts must complete identity verification before they can use the
  shared (instance) runners. Have interns do this on Day 36 *before* the session if possible.
- Free-tier compute minutes are limited. The full reference pipeline uses roughly 6–10 minutes
  per run (perf-load is the expensive one, and runs only on the default branch, on schedules or
  manually). Ask interns not to run the performance job on every push.
- Shared runners are noisy neighbours. Treat performance thresholds in CI as a smoke alarm, not
  a measurement — Day 39 discusses this.
- The capstone (Day 40) has interns fix D1 (BOLA) in a merge request and watch the quarantined
  test turn green. The fix is three lines; see below.

<details>
<summary>Reference fixes for the capstone</summary>

**D1 — BOLA** (`GET /orders/:id`):
```js
const order = await loadOrder(id);
if (!order || order.customer_id !== req.customerId) {
  return res.status(404).json({ error: 'Order not found' });
}
```

**D2 — qty 0**: change `item.qty < 0` to `item.qty < 1`.

**D3 — cancel delivered**:
```js
if (!['pending', 'paid'].includes(order.status)) {
  return res.status(409).json({ error: `Cannot cancel an order with status '${order.status}'` });
}
```

**D7 — stack traces**: return `{ error: status === 500 ? 'Internal server error' : err.message }`
and drop `stack`.

**D11 — race condition**: make the decrement conditional and check the row count, inside a
transaction — `UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2` and roll
back if it updated 0 rows. Adding `CHECK (stock >= 0)` to the table is the belt to go with those
braces.

**D12 — slow search**: `CREATE EXTENSION pg_trgm;` then
`CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);` (and the same for
description) — Day 34 does this live.
</details>
