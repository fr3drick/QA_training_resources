# Day 31 — Setting Up a Database: Servers, Clients, Roles and Connections

> **Week 7 · Day 31 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 5.1 (test environment and test data preparation)
> Prerequisites: Days 14–15 (databases, SQL basics); Docker working (Week 5)

---

## At a glance

In Week 3 you queried a database someone else had set up. This week you set them up yourself —
because a tester who can stand up a database in five minutes can reproduce bugs locally, prepare
their own test data, test migrations, and stop waiting for someone else's environment.

By the end of this session you should be able to:

1. Explain **server, database, schema, table, role** and how a client connects.
2. Run PostgreSQL in Docker with a **persistent volume**, and manage its lifecycle.
3. Use **`psql`** and its meta-commands, and connect **DBeaver**.
4. Create a database, an owner role and a **read-only tester role** — and test that it really is
   read-only.
5. Read and write a **connection string**.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: where's the race condition in `POST /orders`? |
| 0:05 – 0:13 | The pieces: server, databases, schemas, roles, clients |
| 0:13 – 0:23 | PostgreSQL in Docker, step by step |
| 0:23 – 0:31 | `psql` survival kit |
| 0:31 – 0:40 | Roles and privileges — and testing them |
| 0:40 – 0:57 | **Lab:** build the `training` sandbox and explore QA Shop |
| 0:57 – 1:00 | Homework |

---

## 1. The pieces

```
                 ┌───────────────── PostgreSQL server (one running process, one port) ────────┐
 psql ──┐        │                                                                              │
 DBeaver├──TCP──►│  database: qa_shop               database: training      database: postgres │
 API ───┘ :5432  │   └ schema: public                └ schema: public        (default, admin)   │
                 │       ├ table: customers              └ table: ...                           │
                 │       ├ table: orders                                                         │
                 │       └ ...                                                                   │
                 │  roles: qa, qa_admin, qa_readonly, postgres  ← server-wide                   │
                 └──────────────────────────────────────────────────────────────────────────────┘
```

| Term | Meaning | Analogy |
|---|---|---|
| **Server** (or *cluster*) | One running PostgreSQL process listening on a port | The building |
| **Database** | An isolated collection of schemas. A connection goes to exactly **one** database | A flat in the building |
| **Schema** | A namespace inside a database; `public` by default | A room |
| **Table** | Rows and columns | A cupboard |
| **Role** | A user (if it can log in) or a group. Defined for the whole server | A keyholder |
| **Privilege** | What a role may do to an object: `CONNECT`, `USAGE`, `SELECT`, `INSERT`… | Which keys they hold |
| **Client** | Any program that connects and sends SQL: `psql`, DBeaver, the QA Shop API | A visitor |

You can't `JOIN` across databases in PostgreSQL — another reason a connection string must name
the right one.

### Connection strings

Every client needs the same five facts. Written as a URL:

```
postgresql://qa_readonly:readonly-pass@localhost:5433/training?sslmode=disable
└──scheme──┘ └──user───┘ └─password──┘ └─host──┘└port┘└─db───┘ └──options───┘
```

QA Shop's API uses `postgres://qa:qa@db:5432/qa_shop` — note the host is `db`, the Docker
Compose service name, because the API runs *inside* Docker's network. From your laptop the same
database is `localhost:5432`. "Which host is right depends on where the client runs" is Day 11's
DNS lesson again, and it's the cause of half of all "can't connect" problems.

> **Connection strings contain passwords.** Don't paste them into tickets, chat or Git. In CI
> they come from masked variables (Week 8).

---

## 2. PostgreSQL in Docker

You already have one PostgreSQL server: QA Shop's `db` container on port 5432. Now create your
own, separate **sandbox** on port **5433** — somewhere you can create, break and drop things
without touching QA Shop.

```bash
docker run --name qa-sandbox \
  -e POSTGRES_PASSWORD=sandbox \
  -p 5433:5432 \
  -v qa_sandbox_data:/var/lib/postgresql/data \
  -d postgres:17-alpine
```

| Part | Meaning |
|---|---|
| `--name qa-sandbox` | A name to refer to the container by |
| `-e POSTGRES_PASSWORD=sandbox` | Password for the built-in superuser `postgres`. The image refuses to start without one |
| `-p 5433:5432` | Your laptop's port 5433 → the container's port 5432 (5432 is taken by QA Shop) |
| `-v qa_sandbox_data:/var/lib/postgresql/data` | Store the data in a named **volume** so it survives the container being removed |
| `-d` | Run in the background ("detached") |
| `postgres:17-alpine` | Image and version. **Pin the version** — `latest` changes under you |

PowerShell: same command, with backticks instead of backslashes, or on one line.

### Lifecycle

| Task | Command |
|---|---|
| Is it running? | `docker ps` |
| Why did it stop / fail to start? | `docker logs qa-sandbox` |
| Open `psql` inside it | `docker exec -it qa-sandbox psql -U postgres` |
| Stop / start (data kept) | `docker stop qa-sandbox` / `docker start qa-sandbox` |
| Remove the container (data kept in the volume) | `docker rm -f qa-sandbox` |
| Delete the data too — **irreversible** | `docker volume rm qa_sandbox_data` |

**Why the volume matters.** Without `-v`, the data lives inside the container and disappears when
the container is removed. That's sometimes exactly what you want for a throwaway test database —
but it should be a choice, not a surprise.

### Without Docker

Native installers exist for every OS (EDB installer on Windows, Homebrew on macOS, `apt install
postgresql` on Debian/Ubuntu). They work, but they install a server that runs permanently, on one
version, on the default port. Docker lets you run several versions side by side and throw them away.

---

## 3. `psql` survival kit

`psql` is the command-line client. It's on every server you'll ever SSH into, so learn it even if
you prefer a GUI.

```bash
docker exec -it qa-sandbox psql -U postgres                       # inside the container
psql "postgresql://postgres:sandbox@localhost:5433/postgres"     # if psql is installed locally
```

SQL statements end with `;`. Commands starting with a backslash are **meta-commands** — psql
features, not SQL, and they don't need a `;`.

| Meta-command | Does |
|---|---|
| `\l` | List databases |
| `\c training` | Connect to database `training` |
| `\conninfo` | Which database, user, host and port am I on? **Use it constantly** |
| `\dn` | List schemas |
| `\dt` | List tables |
| `\d orders` | Describe a table: columns, types, constraints, indexes |
| `\du` | List roles |
| `\dp orders` | Show privileges on a table |
| `\x` | Toggle expanded display (one column per line) — for wide rows |
| `\timing` | Show how long each query took |
| `\i file.sql` | Run a SQL file |
| `\copy` | Import/export CSV from the client side (Day 33) |
| `\?` / `\h SELECT` | Help on meta-commands / on SQL syntax |
| `\q` | Quit |

If the prompt changes from `training=#` to `training-#`, psql is waiting for the rest of a
statement — you forgot the `;`. Type `;` and Enter, or `\r` to reset.

---

## 4. Roles and privileges

Day 15's first safety rule was *you should not have write access to production*. Here's how that
rule is actually implemented — and how you test it.

Connected as `postgres` (the superuser):

```sql
-- the database and its owner
CREATE DATABASE training;
CREATE ROLE qa_admin LOGIN PASSWORD 'admin-pass';
ALTER DATABASE training OWNER TO qa_admin;

-- a read-only role for testers
CREATE ROLE qa_readonly LOGIN PASSWORD 'readonly-pass';

\c training

GRANT CONNECT ON DATABASE training TO qa_readonly;
GRANT USAGE ON SCHEMA public TO qa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_readonly;
-- ...and on tables qa_admin creates in future:
ALTER DEFAULT PRIVILEGES FOR ROLE qa_admin IN SCHEMA public
  GRANT SELECT ON TABLES TO qa_readonly;
```

| Statement | Why it's needed |
|---|---|
| `GRANT CONNECT ON DATABASE` | Without it the role can't open a connection to this database |
| `GRANT USAGE ON SCHEMA` | Without it the role can't even *see* objects in the schema |
| `GRANT SELECT ON ALL TABLES` | Read access to the tables that exist **now** |
| `ALTER DEFAULT PRIVILEGES` | Read access to tables created **later** — the step everyone forgets, so the read-only user mysteriously can't see next sprint's new table |

### Test the permissions — they're a requirement like any other

A read-only role is a security control. Controls get tested. As `qa_admin`, create a table:

```sql
-- connected as qa_admin to training
CREATE TABLE smoke (id int);
INSERT INTO smoke VALUES (1);
```

Then connect as `qa_readonly` and try to break the rule:

| Attempt as `qa_readonly` | Expected |
|---|---|
| `SELECT * FROM smoke;` | ✅ one row |
| `INSERT INTO smoke VALUES (2);` | ❌ `permission denied for table smoke` |
| `DELETE FROM smoke;` | ❌ `permission denied for table smoke` |
| `CREATE TABLE sneaky (id int);` | ❌ `permission denied for schema public` |
| `DROP TABLE smoke;` | ❌ `must be owner of table smoke` |

Every ❌ that succeeds instead is a defect in the environment's security — report it. (Since
PostgreSQL 15, ordinary roles can no longer create tables in `public` by default. On older
versions, `CREATE TABLE sneaky` *succeeds* unless someone revoked it. Version matters.)

---

## 5. DBeaver

DBeaver is a free GUI client for almost every database. Day 15's rule — *know which environment
you're connected to* — is where a GUI helps.

1. *Database → New Database Connection → PostgreSQL*.
2. Host `localhost`, port `5433`, database `training`, user `qa_readonly`, password
   `readonly-pass`. *Test Connection* (it will offer to download the driver — accept).
3. *Connection settings → General → Connection type*: choose **Development** (green). For QA
   Shop, create a second connection on port **5432** (`qa` / `qa`, database `qa_shop`) and
   choose **Test** (amber). If you're ever given a production connection, it gets **Production**
   (red), and DBeaver will ask for confirmation before data changes.
4. Name connections after what they are: `sandbox – training (readonly)`, `QA Shop (local)`.

A green/amber/red border around your SQL editor is the cheapest insurance against running an
`UPDATE` in the wrong place that you will ever buy.

### MySQL in one table

You'll meet MySQL/MariaDB too. The ideas are identical; the commands differ:

| | PostgreSQL | MySQL |
|---|---|---|
| Docker | `postgres:17-alpine`, `POSTGRES_PASSWORD` | `mysql:8.4`, `MYSQL_ROOT_PASSWORD` |
| CLI | `psql -U postgres` | `mysql -u root -p` |
| List databases | `\l` | `SHOW DATABASES;` |
| Switch database | `\c training` | `USE training;` |
| List tables | `\dt` | `SHOW TABLES;` |
| Describe table | `\d orders` | `DESCRIBE orders;` |
| Default port | 5432 | 3306 |

---

## Lab (17 minutes)

**Part A — sandbox (7 min)**
1. Start `qa-sandbox` with the `docker run` command from section 2. Check `docker ps`.
2. `docker exec -it qa-sandbox psql -U postgres`. Run `\conninfo`, `\l`, `\du`.
3. Create the `training` database and both roles from section 4.

**Part B — test the roles (5 min)**
1. Connect as `qa_admin`: `docker exec -it qa-sandbox psql -U qa_admin -d training` (inside the
   container, local connections don't ask for a password). Create and fill `smoke`.
2. Connect as `qa_readonly` and work through the attack table in section 4. Record the actual
   result of each. Any surprises?
3. As `qa_admin`, create a second table `smoke2`. Can `qa_readonly` read it? Which statement made
   that work?

**Part C — explore QA Shop (5 min)**
Connect to QA Shop's database: `docker compose exec db psql -U qa -d qa_shop` (from
`labs/qa-shop`), or DBeaver on port 5432.
1. `\dt` — how many tables? `\d orders` — list its constraints.
2. Row counts: `SELECT count(*) FROM customers;` — and the same for `products`, `orders`,
   `order_items`, `coupons`. Do they match the README?
3. `\timing`, then `SELECT count(*) FROM products WHERE description ILIKE '%deluxe%';` — how long?
   Remember this number for Day 34.

**Debrief questions**
- Which privilege did people forget most often? What symptom did it cause?
- Why do the API and your laptop use different hostnames for the same QA Shop database?
- If `qa_readonly` could run `CREATE TABLE`, how would you write that up, and what severity?

---

## Common mistakes juniors make

- Running a container without a volume, then losing the data when it's removed — or with one,
  and being surprised that "fresh" containers still have old data.
- Using `latest` instead of pinning a version, so the database changes underneath the tests.
- Two servers wanting port 5432; the second container fails to start and nobody reads
  `docker logs`.
- Forgetting `ALTER DEFAULT PRIVILEGES`, so the read-only role can't see new tables.
- Doing everything as the superuser "because it's easier" — then never noticing permission bugs
  the real application user would hit.
- Not running `\conninfo` before a destructive statement.
- Pasting connection strings with passwords into tickets or chat.

---

## Homework (about 40 minutes)

1. **Lifecycle drill.** Stop, start and remove `qa-sandbox`, then recreate it with the same
   volume. Is `training` still there? Then recreate it *without* `-v` on a different port, add a
   table, remove the container and recreate it. What's left?
2. **Write an environment setup guide** (one page, in `labs/qa-shop/sql/SETUP.md`) that a new
   tester could follow to get the sandbox and both roles running. Include how to verify each step.
3. **Permissions test cases.** Write six test cases (Day 6 format) for the requirement "testers
   have read-only access to the QA Shop database". Include at least two negative cases that aren't
   in today's attack table.
4. **Read ahead:** look at `labs/qa-shop/db/01-schema.sql`. For each table, list the constraints
   it has. Tomorrow you hunt for the ones it's missing.

---

## Check your understanding

<details>
<summary>1. The QA Shop API connects to host <code>db</code>; from your laptop you connect to <code>localhost</code>. Same database — why different hosts?</summary>

The API runs inside Docker Compose's private network, where each service is reachable by its
service name (`db`) through Docker's internal DNS. Your laptop is outside that network; it reaches
the database through the published port mapping (`5432:5432`) on `localhost`. The address you use
depends on where the client runs, not on where the database is.
</details>

<details>
<summary>2. You granted <code>SELECT ON ALL TABLES IN SCHEMA public</code> to the tester role last month. A table added this sprint gives "permission denied". Why?</summary>

`GRANT ... ON ALL TABLES` applies only to tables that existed when it ran. New tables need
`ALTER DEFAULT PRIVILEGES FOR ROLE <creator> IN SCHEMA public GRANT SELECT ON TABLES TO <tester>`,
which sets the privileges that future tables created by that role will get. Without it, every new
table needs a manual grant.
</details>

<details>
<summary>3. What's the difference between <code>docker rm -f qa-sandbox</code> and <code>docker volume rm qa_sandbox_data</code>?</summary>

`docker rm -f` removes the container — the running process and its filesystem — but the named
volume holding the database files survives, so a new container with the same `-v` sees all the
data. `docker volume rm` deletes the data itself, irreversibly. Treat it like `DROP DATABASE`.
</details>

<details>
<summary>4. Why is testing that a read-only role <em>can't</em> write as important as testing that it can read?</summary>

Because the role exists to enforce a security control: testers and reporting tools must not be
able to change data. If it can read but also write, it "works" in every happy-path check while the
control is completely absent — the same pattern as an API that checks the happy path but not
authorisation. Negative tests (`INSERT`, `DELETE`, `CREATE`, `DROP` all denied) are what prove the
control exists.
</details>

---

## Glossary additions

`database server` · `cluster` · `schema` · `role` · `privilege` · `GRANT` · `REVOKE` ·
`ALTER DEFAULT PRIVILEGES` · `superuser` · `connection string` · `psql` · `meta-command` ·
`\conninfo` · `DBeaver` · `Docker volume` · `port mapping` · `read-only role`
