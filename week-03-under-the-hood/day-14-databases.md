# Day 14 — Databases and Types of Databases

> **Week 3 · Day 14 · 60 minutes**
> Prerequisites: Days 11–13. No prior database knowledge assumed.

---

## At a glance

By the end of this session you should be able to:

1. Explain what a database is and why applications need one.
2. Describe the **relational model**: tables, rows, columns, keys, relationships, schema.
3. Name and distinguish the major **types of database** and when each is used.
4. Explain **ACID** vs **BASE**, and normalisation, well enough to hold a conversation.
5. Say what a tester should check in the database, and what a tester must never do.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the toolkit drill |
| 0:05 – 0:12 | What a database is; where it sits |
| 0:12 – 0:28 | The relational model: tables, keys, relationships |
| 0:28 – 0:42 | Types of database |
| 0:42 – 0:50 | ACID, transactions, normalisation, indexes |
| 0:50 – 0:57 | **Activity:** design a schema, then find the bugs it enables |
| 0:57 – 1:00 | Homework |

---

## 1. What a database is, and why you care

**A database is organised, persistent storage that lets many users read and write data
concurrently, safely.**

"Persistent" is the key word: turn the application off, and the data is still there. Everything
a user creates — accounts, orders, messages, settings — ends up in one.

**A DBMS** (Database Management System) is the software that manages it: PostgreSQL, MySQL,
Oracle, SQL Server, MongoDB, Redis.

**Why a tester cares — three reasons, in order of importance:**

1. **The UI can lie.** A page can show a success message while nothing was saved, or display a
   cached value while the stored one is wrong. The database is the source of truth.
2. **Setting up test data.** The fastest way to get an account into an awkward state (an expired
   subscription, 1,240 orders, a soft-deleted record) is often a direct insert or update.
3. **Diagnosing bugs.** "The total shows ₦32,000 but the `orders.total_amount` column says
   ₦36,000" localises the defect instantly to the display layer rather than the calculation.

---

## 2. The relational model

The dominant model for 50 years, and the one you must know.

### Tables, rows, columns

A **table** stores one kind of thing. **Rows** (records) are individual instances. **Columns**
(fields) are the attributes, each with a **data type**.

**Table: `customers`**

| id | first_name | last_name | email | created_at | is_active |
|---|---|---|---|---|---|
| 1 | Efe | Irubor | efe@example.com | 2026-01-15 09:22:01 | true |
| 2 | Ada | Okafor | ada@example.com | 2026-02-03 14:01:55 | true |
| 3 | Bola | Adeyemi | bola@example.com | 2026-02-19 08:45:12 | false |

**Table: `orders`**

| id | customer_id | order_date | status | total_amount | currency |
|---|---|---|---|---|---|
| 1001 | 1 | 2026-03-01 | delivered | 45000.00 | NGN |
| 1002 | 1 | 2026-03-04 | paid | 12500.00 | NGN |
| 1003 | 2 | 2026-03-05 | cancelled | 8000.00 | NGN |

### Keys

| Key | What it is | Example |
|---|---|---|
| **Primary key (PK)** | Uniquely identifies a row. Never null, never duplicated | `customers.id` |
| **Foreign key (FK)** | A column pointing at another table's primary key | `orders.customer_id` → `customers.id` |
| **Composite key** | A primary key made of several columns together | `(order_id, product_id)` in `order_items` |
| **Unique constraint** | Not the PK, but still must be unique | `customers.email` |
| **Natural vs surrogate key** | A real-world identifier (email, ISBN) vs an artificial one (auto-increment id) | Surrogate keys are usually safer — real-world values change |

**Referential integrity** is the database refusing to let `orders.customer_id = 99` exist when
there is no customer 99. **This is a testable behaviour and a rich source of bugs.** What happens
when you delete a customer who has orders? Options the designer must choose between:
- `RESTRICT` — refuse the delete.
- `CASCADE` — delete the orders too. (Dangerous. Test it deliberately.)
- `SET NULL` — orphan the orders.
If nobody chose, you've found a requirements gap — exactly the Day 4 lesson, in the data layer.

### Relationships

| Type | Meaning | Example | How it's stored |
|---|---|---|---|
| **One-to-one** | One row ↔ one row | A user ↔ their profile | FK with a unique constraint |
| **One-to-many** | One row ↔ many rows | One customer → many orders | FK on the "many" side |
| **Many-to-many** | Many ↔ many | Orders ↔ products | A **junction/join table** (`order_items`) |

### Schema, constraints and data types

The **schema** is the structure: the tables, columns, types and rules. Constraints are the rules
the database enforces itself:

| Constraint | Meaning | Bug it prevents — and the test it implies |
|---|---|---|
| `NOT NULL` | Must have a value | Blank required fields. *Test: can the API create a record without it?* |
| `UNIQUE` | No duplicates | Two accounts with the same email. *Test: register twice, and try differing only in case* |
| `CHECK` | Value must satisfy a condition | Negative prices, quantity of 0. *Test: submit a negative amount via the API* |
| `DEFAULT` | Value if none supplied | Missing status on new records |
| `FOREIGN KEY` | Must reference an existing row | Orphaned records |

**Data types matter to testers.** `VARCHAR(50)` means the 51st character is rejected or
truncated — a **boundary** (Day 7). Storing money in a `FLOAT` causes rounding errors
(0.1 + 0.2 = 0.30000000000000004) — money should be `DECIMAL`/`NUMERIC` or stored in the
smallest unit (kobo, cents) as an integer. **If you see money in a float column, that is a bug
worth raising.** Dates should be timezone-aware (`TIMESTAMPTZ`) or the system will misbehave
across time zones.

---

## 3. Types of database

### Relational (SQL)

**Data in tables with a fixed schema, related by keys, queried with SQL.**

**Examples:** PostgreSQL, MySQL/MariaDB, Oracle, Microsoft SQL Server, SQLite.

**Strengths:** strong consistency and ACID transactions; enforced integrity; mature tooling;
SQL is a universal skill; excellent for complex queries joining many entities.

**Weaknesses:** schema changes on huge tables are painful; horizontal scaling is harder;
awkward for deeply nested or highly variable data.

**Use for:** anything with money, relationships and integrity requirements — banking, orders,
inventory, HR, bookings. **Most business applications you test will use one.**

---

### NoSQL — four families

"NoSQL" means "not only SQL". It's an umbrella over four quite different things.

#### a) Document databases

Store **documents** (JSON-like), each self-contained, with a flexible schema.

**Examples:** MongoDB, CouchDB, Amazon DocumentDB, Firestore.

```json
{
  "_id": "ord_1001",
  "customer": { "id": 1, "name": "Efe Irubor", "email": "efe@example.com" },
  "items": [
    { "sku": "BK-1099", "name": "Notebook", "qty": 2, "price": 20000 },
    { "sku": "PN-0042", "name": "Pen",      "qty": 1, "price": 5000 }
  ],
  "total": 45000,
  "status": "delivered"
}
```

The whole order — customer and line items — is one document. No joins needed to display it.

**Strengths:** flexible schema (fields can differ between documents); maps naturally onto
application objects and API responses; scales horizontally well.

**Weaknesses:** **no enforced schema means the application must enforce it** — this is where
testers earn their money; data is often duplicated, so updates must propagate (if a customer
changes their email, does it update in every past order document?); relationships across
documents are harder.

**Testing angle:** deliberately create documents with a missing field, an extra unexpected
field, a field of the wrong type (a string where a number is expected), and a deeply nested
structure. In a relational database the DB rejects these; in a document store, they get saved,
and something downstream breaks days later.

#### b) Key-value stores

The simplest model: a key, and a value. Extremely fast.

**Examples:** Redis, Memcached, Amazon DynamoDB (also document-ish), etcd.

```
session:a1b2c3d4  →  {"user_id": 1, "role": "admin", "expires": 1710000000}
cart:user_1       →  ["BK-1099", "PN-0042"]
rate_limit:ip_10.0.0.5 → 47
```

**Use for:** sessions, caches, rate limiting, feature flags, leaderboards, queues.

**Testing angle:** **TTL/expiry** is the big one. Sessions expire; cached values go stale. Test
what happens exactly at and after expiry, and test that a cache is invalidated when the
underlying data changes — "I updated my name but the header still shows the old one" is a
cache-invalidation bug, and they are everywhere.

#### c) Column-family / wide-column stores

Data stored by column rather than by row, optimised for enormous volumes and analytical queries.

**Examples:** Apache Cassandra, HBase, Google Bigtable, ClickHouse.

**Use for:** time-series and event data at massive scale, analytics, logging, IoT telemetry.

**Testing angle:** eventual consistency (see below) — write something, read it immediately, and
it may not be there yet. That is by design, and it produces flaky-looking test failures that are
actually correct behaviour. Know before you log.

#### d) Graph databases

Store **nodes** and **relationships** as first-class things, optimised for traversing connections.

**Examples:** Neo4j, Amazon Neptune, ArangoDB.

```
(Efe)-[:FRIENDS_WITH]->(Ada)-[:WORKS_AT]->(Acme Ltd)
(Efe)-[:PURCHASED]->(Notebook)<-[:PURCHASED]-(Ada)
```

**Use for:** social networks, recommendations ("people who bought this also bought…"), fraud
detection rings, permission hierarchies, network topology.

**Testing angle:** relationship direction and depth. Is "friend of a friend" symmetric? What
about cycles? What happens when a node with 10,000 relationships is deleted?

---

### Other types worth naming

| Type | Examples | Used for |
|---|---|---|
| **Time-series** | InfluxDB, TimescaleDB, Prometheus | Metrics, monitoring, sensor readings |
| **Search engines** | Elasticsearch, OpenSearch, Solr | Full-text search, log aggregation |
| **In-memory** | Redis, SAP HANA | Speed above all; data lives in RAM |
| **Object storage** | Amazon S3, Azure Blob, MinIO | Files, images, videos, backups (not really a database, but it's where your uploads go) |
| **Data warehouse** | Snowflake, BigQuery, Redshift | Analytics over historical data, reporting |
| **Vector databases** | Pinecone, pgvector, Weaviate | Similarity search for AI/ML features |
| **Embedded** | SQLite, LevelDB | Inside mobile apps and browsers — **your mobile app almost certainly ships one** |

**A single product often uses several at once:** PostgreSQL for orders, Redis for sessions,
Elasticsearch for search, S3 for uploaded images, and a warehouse for reporting. When testing,
ask which store holds the data you're checking — "the database" is rarely one thing.

---

## 4. ACID, BASE, and the ideas behind them

### ACID (the guarantees of a relational transaction)

| Letter | Property | Means | Test it by |
|---|---|---|---|
| **A** | Atomicity | All of a transaction happens, or none of it | Interrupting a multi-step operation halfway — kill the network mid-transfer |
| **C** | Consistency | The database moves from one valid state to another; constraints hold | Trying to violate a constraint through the API |
| **I** | Isolation | Concurrent transactions don't corrupt each other | Two users buying the last item simultaneously |
| **D** | Durability | Once committed, it survives a crash or power loss | Restarting the service and checking the data is still there |

**A transaction** groups several operations so they succeed or fail together. The classic
example: transferring money debits one account and credits another. If the system crashes
between the two, atomicity means *neither* happened — otherwise money vanishes.

**The tester's version of this:** any operation that touches more than one thing is a
transaction test. Place an order → charge the card, decrement stock, create the order, send the
email. **What happens if the card charge succeeds and stock decrement fails?** That question,
asked in refinement, is worth more than fifty test cases.

### BASE and eventual consistency

Many distributed NoSQL systems trade strict consistency for availability and scale:
**B**asically **A**vailable, **S**oft state, **E**ventual consistency.

**Eventual consistency** means: after a write, different replicas may return different values
for a short time, but they will converge.

**Why testers must know this:** you place an order and immediately refresh the orders list, and
it isn't there. On an eventually-consistent store, that may be **correct behaviour**, not a bug.
Before logging it, find out (a) which store is involved, (b) what the expected convergence
window is, and (c) whether the *UI* handles the gap gracefully — because "the user sees a
confusing empty list for 3 seconds after ordering" **is** a legitimate UX defect even when the
data layer is behaving as designed.

### CAP theorem, in one line

In a distributed system you can have at most two of **C**onsistency, **A**vailability, and
**P**artition tolerance — and since network partitions happen whether you like it or not, real
systems choose between consistency and availability when one occurs. Know the phrase; you'll
hear architects use it.

### Normalisation and denormalisation

**Normalisation** — organising data to eliminate duplication. Store the customer's name once, in
`customers`, and reference it by ID everywhere else. Benefit: update it in one place. Cost: more
joins when reading.

**Denormalisation** — deliberately duplicating data for read speed. Storing the customer's name
*inside* the order document. Benefit: fast reads with no joins. Cost: **the copies can drift
apart** — and that drift is a defect class you should hunt for. If a customer changes their name,
do old orders show the old name (often correct — an invoice should show the name at the time) or
the new one? Whichever the requirement says, the *other* one is a bug, and nobody has usually
decided which. Ask.

### Indexes

An **index** is a lookup structure that makes searching a column fast — like the index at the
back of a book. Without one, the database scans every row.

- Missing index → the query is fine with 100 rows in QA and takes 60 seconds with 2 million rows
  in production. **This is the single most common reason a feature is fast in test and slow in
  production**, and it's why testing with realistic data volumes matters.
- Too many indexes → writes get slower, because every index must be updated.

**Practical test:** ask what the production row counts are, and test with a comparable volume,
at least for the high-risk screens.

---

## 5. What a tester does — and does not do — in a database

### Do

- **Verify data after a UI action.** Did the record save with the right values, types and
  timestamps?
- **Check what the UI hides.** Trailing whitespace, truncation, wrong case, a status column that
  didn't change, `NULL` where a value was expected.
- **Set up test data** quickly and repeatably.
- **Check data after a migration** — counts before and after, spot-check transformed values,
  look for nulls where there shouldn't be any.
- **Check soft deletes.** Most "delete" buttons set `is_deleted = true`. Does the record still
  appear in search? In reports? In exports? Can it be restored? **Does the API still return it?**
- **Check audit columns.** `created_at`, `updated_at`, `created_by` — are they populated, in the
  right time zone, and updated on change?

### Do not

- ❌ **Never run `UPDATE` or `DELETE` on production.** Ever. Not even a small one.
- ❌ **Never run `UPDATE` or `DELETE` without a `WHERE` clause.** Write the `WHERE` first.
- ❌ **Never treat write access to a shared test database as private** — you will destroy a
  colleague's test run.
- ❌ **Never copy production personal data** into a test environment unmasked (Day 6).
- ❌ **Never "fix" data to make a test pass.** If the app produced bad data, that's the finding.

**The safety habit:** write every destructive statement as a `SELECT` first, confirm the row
count is what you expect, *then* change the verb. Tomorrow's session drills this.

---

## Live activity (7 minutes)

**Design a schema, then attack it.** On the whiteboard, design tables for a simple library system:
books, members, and loans (a member borrows a book for 14 days).

Ask: what are the tables, the primary keys, the foreign keys, and the relationship types?

<details>
<summary>Facilitator notes — the schema, then the bugs it invites</summary>

**Schema:** `books(id PK, isbn UNIQUE, title, author, total_copies)`,
`members(id PK, name, email UNIQUE, joined_at, is_active)`,
`loans(id PK, book_id FK, member_id FK, borrowed_at, due_at, returned_at NULL)`.
Books ↔ members is many-to-many, resolved by `loans` as the junction table.

**Now the interesting part — the questions a tester asks:**
- What stops a book being loaned to two members at once? Nothing in this schema — you need a
  copies count and a check, or a `book_copies` table. **Test: two simultaneous loans of the
  last copy.**
- Can `returned_at` be before `borrowed_at`? Add a `CHECK`. **Test it via the API.**
- What happens when a member with active loans is deleted? RESTRICT, CASCADE or SET NULL — has
  anyone decided?
- Is `due_at` computed or stored? If stored, what happens when the loan period policy changes —
  do existing loans change? (Almost certainly they shouldn't.)
- Time zones: a loan due "14 days later" — at what hour, in whose time zone?
- Is a returned loan deleted or kept? (Keep it — you need the history.)
- What is the max title length, and what happens to a 300-character title?

The lesson: **a schema is a specification**, and reviewing one is static testing (Day 4)
applied to data.
</details>

---

## Common mistakes juniors make

- Testing only through the UI and never verifying what was actually stored.
- Assuming "delete" removes the row.
- Testing with 10 records when production has 10 million, then being surprised by production timeouts.
- Logging an eventual-consistency delay as a data-loss bug without checking the architecture.
- Running a `DELETE` in the wrong environment. (It happens. Once. Memorably.)

---

## Homework (about 40 minutes)

1. **Types drill:** for each of these, name the database type you'd choose and give one sentence
   of justification — (a) user sessions for a web app, (b) a bank's account ledger, (c) product
   search on an e-commerce site, (d) a social network's friend graph, (e) temperature readings
   from 50,000 sensors every second, (f) uploaded profile photos.
2. **Schema review:** take the library schema from the activity and write **8 test cases** that
   target the *data layer* specifically — constraints, integrity, boundaries, concurrency.
3. **Install a client** ready for tomorrow: DBeaver (free, all platforms) or TablePlus, or the
   `psql`/`mysql` CLI. Connect it to any database you have access to, or install SQLite (which
   needs no server) and create a table.

---

## Check your understanding

<details>
<summary>1. The UI shows "Profile updated successfully" but the change isn't there after a refresh. What are three possible causes, and how does the database help you decide?</summary>

(1) The write never happened — the API returned success without saving, or a transaction rolled
back silently. (2) The write happened but the read is served from a stale cache or a lagging
replica. (3) The write happened to a different field or record than expected. Query the row
directly: if the new value is stored, it's a caching/read problem; if it isn't, it's a write
problem; if a *different* row changed, you've found something much more interesting. Also check
`updated_at` — it tells you whether the row was touched at all.
</details>

<details>
<summary>2. Why would you choose a document database over a relational one?</summary>

When the data is naturally self-contained and hierarchical (an order with its line items, a CMS
article with its blocks), when the shape varies between records, when the schema evolves rapidly,
or when you need to scale reads horizontally across many nodes. The trade-off is that the
database no longer enforces structure or relationships, so validation moves into the application
— which is precisely where testers should focus their attention on such a system.
</details>

<details>
<summary>3. What is the tester's risk with denormalised data?</summary>

Duplicated copies drift apart. If the customer's name is stored both in `customers` and inside
every order document, updating one may not update the other, so the same user sees two different
names in different screens. The test is to change the source value and then check every place it
is displayed or exported. Note that "old orders keep the old name" is often *correct* for
invoices — the real bug is that nobody specified which behaviour is intended.
</details>

<details>
<summary>4. A feature is instant in QA and times out in production. What's your first hypothesis?</summary>

Data volume: a query with no suitable index performs fine over the few thousand rows in QA and
scans millions in production. Second hypotheses: production concurrency and connection-pool
contention, a larger result set being serialised, or a network hop that doesn't exist in QA.
The preventive action is to test the high-risk screens against production-like data volumes,
and to ask for the row counts before signing off performance.
</details>

---

## Glossary additions

`database` · `DBMS` · `table` · `row` · `column` · `schema` · `primary key` · `foreign key` ·
`composite key` · `referential integrity` · `cascade delete` · `constraint` · `NULL` ·
`one-to-many` · `many-to-many` · `junction table` · `relational database` · `NoSQL` ·
`document database` · `key-value store` · `column-family database` · `graph database` ·
`time-series database` · `in-memory database` · `object storage` · `data warehouse` ·
`ACID` · `transaction` · `atomicity` · `isolation` · `BASE` · `eventual consistency` ·
`CAP theorem` · `normalisation` · `denormalisation` · `index` · `soft delete` · `TTL`
