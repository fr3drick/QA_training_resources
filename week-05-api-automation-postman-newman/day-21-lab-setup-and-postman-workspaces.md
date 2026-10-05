# Day 21 — Lab Setup, the Practice System, and Organising Postman Properly

> **Week 5 · Day 21 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 1.4 (test basis, testware), Chapter 6 (test tools)
> Prerequisites: Days 16–18 (HTTP, API testing, authentication)

---

## At a glance

Weeks 1–4 taught you what to test and why. Weeks 5–8 are practical: you will build real
automated testware against a real system, then run it in a real pipeline. From today, every
session is mostly hands-on.

By the end of this session you should be able to:

1. Start, check, reset and stop the **QA Shop** practice system.
2. Read its specification as a **test basis** and spot gaps in it.
3. Organise a Postman workspace the way a team would: collections, folders, naming.
4. Use **environments and variables** correctly — including scope and precedence.
5. Use the Postman Console to see exactly what was sent and received.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | What Weeks 5–8 look like, and why we run our own system |
| 0:05 – 0:15 | Setup check: Docker, QA Shop, Postman, Node, Newman |
| 0:15 – 0:22 | Reading the QA Shop specification as a test basis |
| 0:22 – 0:35 | Postman organisation: collections, folders, variables, auth inheritance |
| 0:35 – 0:56 | **Lab:** build the skeleton of your QA Shop collection |
| 0:56 – 1:00 | Homework |

> **Instructor:** if you can get 90 minutes for Weeks 5–8, give every extra minute to the lab.
> Setup problems on Day 21 are normal — have the Docker prerequisites checked *before* the
> session (see `labs/qa-shop/INSTRUCTOR_NOTES.md`).

---

## 1. The next four weeks

| Week | You will | Tools |
|---|---|---|
| 5 | Turn manual API checks into an automated, data-driven regression suite | Postman, Newman |
| 6 | Measure how the system behaves under load, and find where it breaks | Apache JMeter |
| 7 | Set up databases, design and query them, and validate data at scale | PostgreSQL, psql, DBeaver |
| 8 | Run all of it automatically on every change | Git, GitLab CI |

All four weeks test **one system**: QA Shop, a small online-shop API with a PostgreSQL database.
It lives in [`labs/qa-shop/`](../labs/qa-shop/). Using one system throughout is deliberate — by
Week 8 you will have a Postman suite, a JMeter plan and a set of SQL checks for the same product,
and you will wire them into a single pipeline. That's what a QA engineer's testware looks like in
a real team.

### Why we run our own system

In Week 4 you tested public APIs like `reqres.in`. That's fine for learning requests, but you
**cannot** do the next three weeks against someone else's service:

- **Load testing a system you don't own is an attack.** Sending thousands of requests to a third
  party is indistinguishable from a denial-of-service attempt, and in many countries it is a crime.
- **Security testing without permission is an attack.** Same reason.
- **You can't see their database**, so you can't verify what was stored.
- **You can't reset their data**, so your tests can't be repeatable.

QA Shop runs on your laptop. You own it, you can reset it in three seconds, and you can break it
as hard as you like.

> **The rule for your whole career:** never load-test, security-test or fuzz a system without
> written permission from its owner. "It's only a test" is not a defence.

---

## 2. Setup check

Work through this list. Every line has an expected result — if yours differs, fix it now, not
on Thursday.

| # | Command | Expected |
|---|---|---|
| 1 | `docker --version` | `Docker version 2x.x.x` or later |
| 2 | `docker compose version` | `Docker Compose version v2.x` |
| 3 | `cd labs/qa-shop` then `docker compose up -d --build` | Two containers start; first run takes 1–2 minutes |
| 4 | `docker compose ps` | `db` is `healthy`, `api` is `running` |
| 5 | `curl http://localhost:3000/health` | `{"status":"ok","db":"up","version":"1.0.0"}` |
| 6 | `node --version` | `v20` or later |
| 7 | `npm install -g newman newman-reporter-htmlextra` | Installs without errors |
| 8 | `newman --version` | `6.x` |
| 9 | Open Postman | Signed in (a free account is fine) |

**If step 3 fails on Windows** with "WSL 2 installation is incomplete" or "virtualization not
enabled", Docker Desktop needs WSL 2 and hardware virtualisation turned on in the BIOS. That is a
machine fix, not a QA Shop fix — ask for help.

**If step 5 hangs**, the API may still be seeding the database. Run `docker compose logs api` and
wait for `QA Shop API listening on http://localhost:3000`.

**The four commands you will use most:**

```bash
docker compose up -d                      # start
docker compose logs -f api                # watch every request the API receives
docker compose exec api npm run db:reset  # put the data back exactly as it started
docker compose stop                       # stop, keeping the data
```

`db:reset` is your best friend. Many exercises change the data — cancel orders, use coupons,
deplete stock. Reset before every session, and whenever results stop making sense.

### Watching the API log

Open a second terminal and leave this running all week:

```bash
docker compose logs -f api
```

```
api-1  | POST /auth/login 200 4.1ms
api-1  | GET /products?page=2 200 18.3ms
api-1  | GET /orders/1004 200 6.0ms
```

Every request you send shows up here with its status and duration. When a test does something
surprising, this log tells you what the server actually received — Day 13's "is it the client or
the server?" question, answered in one glance.

---

## 3. The specification is your test basis

Open [`labs/qa-shop/README.md`](../labs/qa-shop/README.md) and read the **API specification**
section. It has 22 numbered rules (R1–R22) and three non-functional requirements (NFR1–NFR3).

Treat it exactly the way Day 4 taught you to treat a requirements document:

- **Every rule is a test condition.** R11 says `qty` is an integer from 1 to 10 — that's an
  equivalence partition and four boundary values (0, 1, 10, 11) before you've opened Postman.
- **Every rule has an expected result.** "→ `409`" is your assertion.
- **The spec is not complete.** Find the gaps. Is the coupon code case-sensitive? What's the
  maximum length of a name? What happens to stock when an order is cancelled after payment? Gaps
  are questions for the product owner, and raising them *before* testing is cheaper than
  arguing about them after.
- **The system is not guaranteed to match the spec.** That's why you're here.

> **Traceability starts now.** Name your requests and tests so a reader can see which rule they
> check: `POST /orders - qty 0 rejected (R11)`. On Day 25 you will produce a coverage table from
> these names.

---

## 4. Organising Postman like a team would

A Postman collection that one person can understand is a toy. One that the whole team can run,
read and extend is testware. The difference is organisation.

### Workspaces, collections, folders

```
Workspace: QA Shop                       ← one per product or team
└── Collection: QA Shop API              ← one per API (or per service)
    ├── 01 Smoke                         ← folders = test suites, numbered so they sort
    ├── 02 Auth
    ├── 03 Products
    ├── 04 Order workflow
    ├── 05 Order validation
    └── 99 Known defects
```

**Folders are suites, not just tidy boxes.** On Day 24 you will tell Newman "run only the
`01 Smoke` folder" — so put things in folders according to *when you want to run them together*.

### Naming requests

Use one consistent pattern. A good one:

```
<METHOD> <path> - <scenario> (<rule>)

POST /auth/login - valid customer (R4)
POST /auth/login - wrong password (R4)
POST /orders - qty 11 rejected (R11)
GET /orders/{id} - another customer's order (R17)
```

When a test fails in a pipeline at 2 a.m., the name is all anyone sees. `New Request (3)` tells
them nothing; `POST /orders - qty 11 rejected (R11)` tells them exactly what broke.

### Environments

An **environment** is a named set of variables. You switch the whole collection between
targets — your laptop, the team's QA server, staging — by switching the environment.

Create **QA Shop - local**:

| Variable | Value | Type |
|---|---|---|
| `base_url` | `http://localhost:3000` | default |
| `customer_email` | `efe@example.com` | default |
| `customer_password` | `Passw0rd!` | **secret** |
| `access_token` | *(empty — set by the login request)* | **secret** |

Then every URL starts `{{base_url}}`: `{{base_url}}/products/1`. **Never hard-code a host.** A
collection with `http://localhost:3000` typed into 40 requests cannot run in a pipeline on
Day 37 without 40 edits.

### Variable scopes and precedence

Postman has five places a variable can live. When the same name exists in more than one, the
**narrowest scope wins**:

```
narrowest ── local        set in a script for this request only: pm.variables.set()
   │         data         from a CSV/JSON data file, one row per iteration (Day 23)
   │         environment  the selected environment
   │         collection   stored with the collection itself
widest   ── global       shared across every collection in the workspace
```

| Use this scope | For |
|---|---|
| **Environment** | Anything that changes between targets: URLs, accounts, tokens |
| **Collection** | Constants of the API itself that are the same everywhere: `api_version`, page size |
| **Data** | Test inputs for data-driven runs |
| **Local** | Temporary values inside one request's scripts |
| **Global** | Almost never. Globals leak between collections and cause "works on my machine" |

### Two values per variable — and the secret-leak trap

Postman keeps **two values** for every environment variable: one that is shared — synced to your
team and included when you export (labelled *Initial value* or *Shared value*, depending on your
Postman version) — and a **current value** that stays on your machine.

- Scripts read and write the **current** value.
- **Exports and sharing use the shared/initial value.**

So: put real passwords and tokens **only** in the current value, mark them type *secret*, and
leave the shared value empty or a placeholder. Otherwise the day you export the environment into
Git, you've committed a credential. That happens in real companies every week.

(QA Shop's `Passw0rd!` is the one exception: it's a published test password for throwaway seed
accounts — it's printed in the README — so the reference environment includes it for
convenience. Any password for a real system, including a shared QA server, is a secret.)

### Dynamic variables

Postman generates fresh values on demand — useful when a test must not collide with a previous
run:

| Variable | Example output |
|---|---|
| `{{$guid}}` | `a1f3c2e0-6b5d-4f6a-9d1e-2c3b4a5f6e7d` |
| `{{$timestamp}}` | `1791213512` |
| `{{$randomFirstName}}` | `Kemi` |
| `{{$randomEmail}}` | `Kemi.Oyelaran@yahoo.com` |
| `{{$randomInt}}` | `742` (0–1000) |

`"email": "qa.intern+{{$timestamp}}@example.com"` registers a brand-new customer on every run.

### Auth inheritance

Set authorisation **once**, on the collection: *Authorization → Bearer Token →
`{{access_token}}`*. Each request then defaults to **Inherit auth from parent**. For public
endpoints (health, login, products) set the request's auth to **No Auth** explicitly.

Why it matters: when the auth scheme changes, you change one place. And a negative test like
"no token → 401" is honest only if you've *deliberately* switched auth off for that request.

### The Postman Console

*View → Show Postman Console* (or the Console button bottom-left). It shows the **raw request
actually sent** — resolved URL, every header, the body — and the raw response, plus anything
your scripts `console.log()`.

When a request "should work but doesn't", the Console answers the question 90% of the time:
`{{base_url}}` unresolved because no environment is selected; `Bearer ` with an empty token;
`Content-Type` missing. Open it now and leave it open.

---

## Lab (21 minutes)

Build the skeleton of the collection you'll extend all week.

**Part A — environment (3 min)**
Create the **QA Shop - local** environment from section 4 and select it (top-right dropdown).

**Part B — collection (5 min)**
1. Create a collection **QA Shop API**.
2. On the collection's *Authorization* tab: Bearer Token, `{{access_token}}`.
3. Create folders `01 Smoke`, `02 Auth`, `03 Products`, `04 Order workflow`.

**Part C — first requests (10 min)**
Add these, named using the convention, each with the right auth setting:

| Folder | Request | Auth |
|---|---|---|
| 01 Smoke | `GET {{base_url}}/health` | No Auth |
| 01 Smoke | `POST {{base_url}}/auth/login` with `{"email": "{{customer_email}}", "password": "{{customer_password}}"}` | No Auth |
| 02 Auth | `GET {{base_url}}/me` | Inherit |
| 03 Products | `GET {{base_url}}/products?page=1&limit=5` | No Auth |
| 03 Products | `GET {{base_url}}/products/7` | No Auth |
| 03 Products | `GET {{base_url}}/products/search?q=jollof` | No Auth |
| 04 Order workflow | `POST {{base_url}}/orders` with `{"items": [{"product_id": 6, "qty": 2}]}` | Inherit |
| 04 Order workflow | `GET {{base_url}}/orders/1001` | Inherit |

After sending the login request, copy the `access_token` from the response into the
environment's **current value** by hand. (Tomorrow a script does this for you.)

**Part D — explore (3 min)**
Send each request. Watch the API log in your terminal at the same time. Note anything that
surprises you — **at least three observations** — and which rule (R1–R22) you think is involved.

**Save your work:** *Collection → ⋯ → Export* (v2.1) into `labs/qa-shop/postman/`, and export
the environment there too. You'll commit these to Git in Week 8.

**Debrief questions**
- What does `GET /products/7` tell you about stock that might matter later?
- What happened when you called `/me` before you'd pasted in the token? Which rule covers that?
- Did anything return a status the spec doesn't mention?

---

## Common mistakes juniors make

- Forgetting to **select** the environment, then wondering why `{{base_url}}` is unresolved.
- Putting a real password in the shared/initial value, then exporting it into Git.
- Using **globals** for everything because "it's easier" — then two collections overwrite each
  other's `token`.
- Leaving request names as `New Request`. Nobody can read a report made of those.
- Testing "no token → 401" on a request that silently inherited a valid token from the
  collection — the test passes for the wrong reason, or fails and you don't know why.
- Not resetting the database, then reporting "bugs" that are leftovers from yesterday's tests.

---

## Homework (about 40 minutes)

1. **Test-basis review.** For each rule R1–R22 in the QA Shop README, write one line: *how
   would I test this?* Include at least one negative test per rule.
2. **Find the gaps.** List **five questions** the specification doesn't answer, and for each
   write the assumption you'll test against until someone answers. (Day 4 skills.)
3. **Explore.** Send at least 15 requests beyond today's lab — different products, pages,
   categories, coupons. Log any behaviour that contradicts the spec in a scratch list. Don't
   write formal bug reports yet; just note the rule, the request and the response.
4. **Read** the Postman Learning Center pages on *variables* and *scripts*.

---

## Check your understanding

<details>
<summary>1. The same variable <code>base_url</code> exists in the globals, the collection and the selected environment, with three different values. Which one does a request use, and why is that a problem?</summary>

The environment value — environment is narrower than collection, which is narrower than
global. The problem is that two of the three values are now invisible but still present: if
someone runs the collection without selecting an environment, it silently falls back to the
collection value, and then to the global one. Define each variable in exactly one scope, chosen
deliberately.
</details>

<details>
<summary>2. Why should the access token live in the environment and not be pasted into each request's Authorization tab?</summary>

Tokens expire (QA Shop's after an hour) and differ per environment and per user. Stored once as
`{{access_token}}` and inherited from the collection, it can be refreshed in one place — and,
from tomorrow, automatically by the login request's script. Pasted into 30 requests, it means
30 edits every hour, and a real token ends up saved inside the collection file.
</details>

<details>
<summary>3. A teammate exports the environment and commits it to Git. What should you check before approving that change?</summary>

That no secret has a real shared/initial value: passwords, tokens, API keys. Only the
**shared** value is exported, so secrets should exist only as current values (marked *secret*),
with the shared value empty or a placeholder. In CI, secrets are injected at run time from
protected, masked CI/CD variables instead (Day 37).
</details>

<details>
<summary>4. Why must you never point the Week 6 load tests at <code>reqres.in</code> or any other public API?</summary>

Because you don't own it and don't have permission. A load test is indistinguishable from a
denial-of-service attack; it can degrade the service for everyone else, it breaks the
provider's terms of use, and in many jurisdictions it's illegal. It also wouldn't tell you
anything useful — you'd be measuring their infrastructure and your internet connection, not
your system.
</details>

---

## Glossary additions

`practice system` · `test basis` · `testware` · `Docker` · `container` · `docker compose` ·
`workspace` · `collection` · `folder` · `environment` · `variable scope` · `variable precedence` ·
`shared value` · `current value` · `secret variable` · `dynamic variable` · `auth inheritance` ·
`Postman Console`
