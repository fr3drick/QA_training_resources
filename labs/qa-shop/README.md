# QA Shop — the practice system for Weeks 5–8

QA Shop is a small online-shop API backed by a PostgreSQL database. It exists so you have a
system you are **allowed to break**: you will test it with Postman and Newman (Week 5),
load it with JMeter (Week 6), query and set up its database (Week 7), and wire all of that
into a GitLab CI pipeline (Week 8).

It is deliberately not perfect. This file is the **specification** — your test basis. Where the
API behaves differently from what is written here, you have found a defect.

> **Never load-test or attack a system you do not own or have written permission to test.**
> QA Shop runs on your own machine precisely so that you can do both.

---

## What's in this folder

```
labs/qa-shop/
├── README.md              ← you are here: setup + the API specification
├── docker-compose.yml     ← starts the database and the API together
├── app/                   ← the API (Node.js + Express)
├── db/                    ← schema and seed data, applied automatically on first start
├── postman/               ← YOUR Postman collection and environment go here (Week 5)
├── jmeter/                ← YOUR JMeter test plans go here (Week 6)
├── sql/                   ← YOUR SQL scripts go here (Week 7)
└── reference/             ← the instructor's reference solutions — try yours first
    ├── postman/
    ├── jmeter/
    ├── sql/
    └── .gitlab-ci.yml
```

---

## Running it

### Option A — Docker (recommended)

You need **Docker Desktop** (Windows/macOS) or Docker Engine (Linux). On Windows, Docker Desktop
needs WSL 2 — the installer walks you through it.

```bash
cd labs/qa-shop
docker compose up -d --build      # first start takes 1–2 minutes: it builds and seeds
docker compose ps                 # both services should be "running" / "healthy"
curl http://localhost:3000/health
# {"status":"ok","db":"up","version":"1.0.0"}
```

| Task | Command |
|---|---|
| Watch the API log (one line per request) | `docker compose logs -f api` |
| Stop everything, keep the data | `docker compose stop` |
| Start again | `docker compose start` |
| **Reset the data to the original seed** | `docker compose exec api npm run db:reset` |
| Remove everything, including the data | `docker compose down -v` |
| Open a SQL prompt | `docker compose exec db psql -U qa -d qa_shop` |

### Option B — without Docker

You need **Node.js 20+** and **PostgreSQL 15+** installed locally.

```bash
# create a database and user (once)
psql -U postgres -c "CREATE USER qa WITH PASSWORD 'qa';"
psql -U postgres -c "CREATE DATABASE qa_shop OWNER qa;"

cd labs/qa-shop/app
npm install
npm start                          # creates the schema and seed data on first start
npm run db:reset                   # reset to the original seed whenever you like
```

Set `DATABASE_URL` if your database is not at `postgres://qa:qa@localhost:5432/qa_shop`.

### Connection details

| | |
|---|---|
| API base URL | `http://localhost:3000` |
| Database | host `localhost`, port `5432`, database `qa_shop`, user `qa`, password `qa` |

If port 5432 is already in use (you have Postgres installed locally), change the left-hand side
of `"5432:5432"` in `docker-compose.yml` to `"5433:5432"` and connect to port 5433 instead.

---

## Test accounts

Every account's password is **`Passw0rd!`**.

| Email | Notes |
|---|---|
| `efe@example.com` | Active customer with order history (orders 1001, 1002) |
| `ada@example.com` | Active customer (orders 1003, 1004) |
| `bola@example.com` | **Disabled** account |
| `chidi@example.com` | Active customer (order 1005) |
| `loadtest001@qa-shop.test` … `loadtest100@qa-shop.test` | 100 accounts for load testing (Week 6) |

You can also register your own with `POST /auth/register`.

---

## API specification

All requests and responses are JSON. Errors are returned as `{"error": "<message>"}`.
Protected endpoints need the header `Authorization: Bearer <access_token>`.

### Health

| Method & path | Auth | Success | Notes |
|---|---|---|---|
| `GET /health` | — | `200 {"status":"ok","db":"up","version":"1.0.0"}` | `503` if the database is unreachable |

### Authentication

| Method & path | Auth | Request body | Success |
|---|---|---|---|
| `POST /auth/register` | — | `{"first_name","last_name","email","password","country"?}` | `201` + the customer (never the password) |
| `POST /auth/login` | — | `{"email","password"}` | `200 {"access_token","token_type":"Bearer","expires_in":3600}` |
| `GET /me` | Bearer | — | `200` + the logged-in customer |

**Rules**

- R1. `first_name`, `last_name`, `email` and `password` are required → `400` naming the missing fields.
- R2. `email` must be a valid address and **unique, ignoring case** → `400` / `409`.
- R3. `password` must be at least 8 characters → `400`.
- R4. Wrong email or wrong password → `401` with the **same** message either way, so an attacker
  cannot discover which emails are registered.
- R5. A disabled account cannot log in → `403`.
- R6. Tokens expire after 1 hour. A missing, malformed, tampered or expired token → `401`.

### Products

| Method & path | Auth | Success |
|---|---|---|
| `GET /products?page=1&limit=20&category=books` | — | `200 {"data":[…],"page","limit","total"}` |
| `GET /products/{id}` | — | `200` + one product |
| `GET /products/search?q=mug` | — | `200 {"data":[…],"count"}` |

**Rules**

- R7. `page` is an integer ≥ 1 (default 1). `limit` is an integer from 1 to 100 (default 20).
  Anything else → `400`.
- R8. Inactive products are never returned by any endpoint.
- R9. `GET /products/{id}`: a non-numeric id → `400`; an id that does not exist → `404`.
- R10. Search needs `q` of at least 2 characters (`400` otherwise), matches name or description
  case-insensitively, and returns at most 50 results ordered by name.

### Orders

| Method & path | Auth | Request body | Success |
|---|---|---|---|
| `POST /orders` | Bearer | `{"items":[{"product_id":1,"qty":2}],"coupon_code":"SAVE20"?}` | `201` + the order, `Location: /orders/{id}` |
| `GET /orders` | Bearer | — | `200 {"data":[…],"count"}` — your 50 most recent orders |
| `GET /orders/{id}` | Bearer | — | `200` + the order with its items |
| `POST /orders/{id}/pay` | Bearer | — | `200` + the order, now `paid` |
| `POST /orders/{id}/cancel` | Bearer | — | `200` + the order, now `cancelled` |

**Rules**

- R11. `items` must be a non-empty array. Each `qty` is an **integer from 1 to 10** → `400` otherwise.
- R12. Each product must exist and be active → `422`.
- R13. There must be enough stock → `409`. **Stock must never go below zero**, including when many
  customers order the same product at the same time.
- R14. A coupon must exist, be active and not expired → `422`; the order subtotal must meet the
  coupon's minimum → `422`.
- R15. **Each customer may use each coupon once.** Any earlier order with that coupon that is not
  cancelled counts as a use → `409`.
- R16. `discount = subtotal × percent_off / 100`, rounded to 2 decimal places.
  `total_amount = subtotal − discount`. Currency is always NGN.
- R17. **A customer can only see, pay for or cancel their own orders.** Anyone else's order → `404`.
- R18. New orders are `pending`. Only a `pending` order can be paid → `409` otherwise.
- R19. Only `pending` or `paid` orders can be cancelled; `shipped` and `delivered` orders cannot,
  and nor can an order that is already cancelled → `409`. Cancelling returns the items to stock.

**Order status lifecycle**

```
            pay               (warehouse)           (courier)
 pending ─────────► paid ─────────────► shipped ─────────────► delivered
    │                │
    └─── cancel ─────┴──────► cancelled
```

### Coupons in the seed data

| Code | Discount | Minimum order | State |
|---|---|---|---|
| `SAVE20` | 20% | — | Active |
| `WELCOME10` | 10% | ₦5,000 | Active |
| `BIGSPEND50` | 50% | ₦100,000 | Active |
| `EXPIRED15` | 15% | — | Expired 1 Jan 2025 |
| `INACTIVE5` | 5% | — | Deactivated |

### General rules

- R20. Malformed JSON → `400`. Unknown routes → `404`.
- R21. Error responses **never** contain stack traces, file paths, SQL or other internal detail.
- R22. Every response is JSON with `Content-Type: application/json`.

### Non-functional requirements

- NFR1. With 20 concurrent shoppers, the 95th-percentile response time of every endpoint is
  under **1,000 ms**, except search, which is under **2,000 ms**.
- NFR2. Under that load the error rate is below **1%**.
- NFR3. Data integrity holds under load: no negative stock, no orders without items, and every
  order's totals add up.

---

## The database

Five tables. Week 7 goes through them in detail.

```
customers 1───* orders 1───* order_items *───1 products
                   *
                   │
                   1
                coupons
```

The seed creates 106 customers, 200,020 products (20 real ones plus 200,000 generated ones that
make search slow), 5 coupons and about 3,000 historical orders. The data is generated with a
fixed random seed, so everyone's database is identical — which means you can compare answers.
