# Day 23 — Chaining, Workflows, Multiple Users and Data-Driven Tests

> **Week 5 · Day 23 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4.2.4 (state transition testing), Chapter 6 (test tools — data-driven testing)
> Prerequisites: Day 22, Day 7 (state transitions)

---

## At a glance

Single requests test single rules. Real defects hide in **sequences**: pay, then cancel; use a
coupon, then use it again; log in as one customer, then ask for another's data. Today the
collection learns to walk through journeys, act as more than one user, and run one test against
a whole table of inputs.

By the end of this session you should be able to:

1. Chain requests so each one uses what the previous one produced.
2. Make every folder runnable on its own with a collection-level **auto-login**.
3. Use `pm.sendRequest` to arrange state inside a test.
4. Test **authorisation** properly, with two users.
5. Turn the order lifecycle into **state transition** tests.
6. Drive one request from a **CSV or JSON data file** — and avoid the type trap.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: the order lifecycle transitions |
| 0:04 – 0:12 | Chaining and end-to-end workflows |
| 0:12 – 0:20 | Auto-login, `pm.sendRequest`, and test independence |
| 0:20 – 0:26 | Two users: testing authorisation (BOLA) |
| 0:26 – 0:30 | State transition tests for orders |
| 0:30 – 0:38 | Data-driven testing with the Collection Runner |
| 0:38 – 0:57 | **Lab:** workflow, BOLA, transitions, data-driven |
| 0:57 – 1:00 | Homework |

---

## 1. Chaining: a journey, not a list

A **chain** is a sequence of requests where each one consumes something the previous one
produced:

```
POST /auth/login          → save access_token
POST /orders              → save order_id          (from the body, or the Location header)
GET  /orders/{{order_id}} → assert it's pending
POST /orders/{{order_id}}/pay      → assert paid
POST /orders/{{order_id}}/pay      → assert 409 — can't pay twice (R18)
POST /orders/{{order_id}}/cancel   → assert cancelled — paid orders can be cancelled (R19)
POST /orders/{{order_id}}/cancel   → assert 409 — already cancelled
GET  /orders              → assert the order is in my list
```

Capturing the ID:

```javascript
// POST /orders - post-response
pm.test("Status is 201", () => pm.response.to.have.status(201));
const order = pm.response.json();
pm.test("Location header points at the new order", () => {
    pm.expect(pm.response.headers.get("Location")).to.eql("/orders/" + order.id);
});
pm.environment.set("order_id", order.id);
```

**Assert the side-effects too.** After creating an order for 2 × product 6, `GET /products/6`
should show stock 2 lower. After cancelling, it should be back. A chain that doesn't check
side-effects only proves the endpoints return the right status codes.

**The cost of chains:** they are **order-dependent**. Run "Pay order" on its own and
`{{order_id}}` is empty or stale. That's acceptable *inside* a workflow folder that is always run
top to bottom — but it must be a deliberate choice, and the folder's description should say so.

---

## 2. Independence: auto-login and `pm.sendRequest`

Tomorrow you'll run folders individually from the command line, where **nothing carries over
between runs** — every Newman run starts with the environment file as it is on disk, token
empty. If only the `01 Smoke` login request sets the token, then running `03 Products` alone
fails with a wall of 401s, and you waste an hour "debugging" the API.

### Auto-login at collection level

Put this in the **collection's pre-request** script. Before every request, it checks whether
you hold a token that isn't about to expire, and logs in if not:

```javascript
const token = pm.environment.get("access_token");
const expiresAt = Number(pm.environment.get("access_token_expires_at") || 0);

if (!token || Date.now() > expiresAt - 60000) {
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/auth/login",
        method: "POST",
        header: { "Content-Type": "application/json" },
        body: { mode: "raw", raw: JSON.stringify({
            email: pm.environment.get("customer_email"),
            password: pm.environment.get("customer_password")
        }) }
    }, (err, res) => {
        if (err || res.code !== 200) {
            console.error("Auto-login failed", err || res.code);
            return;
        }
        pm.environment.set("access_token", res.json().access_token);
        pm.environment.set("access_token_expires_at", Date.now() + res.json().expires_in * 1000);
    });
}
```

Now any folder — any single request — can run on its own.

### `pm.sendRequest` to arrange state

`pm.sendRequest` sends an HTTP request from inside a script, *without* it appearing as a
separate request in the collection. Use it to **arrange** the preconditions a test needs, inside
that test:

```javascript
// Pre-request for "Register - same email in different case (R2)":
// first register the lower-case address, then this request tries the upper-case one.
const stamp = Date.now();
pm.variables.set("dup_email_upper", "DUP." + stamp + "@EXAMPLE.COM");
pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/register",
    method: "POST",
    header: { "Content-Type": "application/json" },
    body: { mode: "raw", raw: JSON.stringify({
        first_name: "Dup", last_name: "Lower",
        email: "dup." + stamp + "@example.com", password: "Passw0rd!"
    }) }
}, (err, res) => pm.expect(res.code).to.eql(201));
```

The request itself then posts `{{dup_email_upper}}` and asserts `409`. The test is
**self-contained**: it creates exactly the state it needs, it works on a freshly reset database
*and* on the tenth run, and it doesn't care what ran before it.

### Chain or independent?

| | Chained workflow | Independent tests |
|---|---|---|
| Mirrors a real user journey | ✅ | ❌ |
| Runs alone / in any order | ❌ | ✅ |
| One failure… | …cascades through the rest | …fails one test |
| Good for | End-to-end journeys, smoke | Rules, validation, negative tests |

Most suites need **both**: a few workflow folders, and many independent rule tests.

---

## 3. Two users: testing authorisation

Day 17 called **BOLA** (Broken Object Level Authorization) the most common serious API
vulnerability. You can only test it with **two identities**: one that owns a resource, and one
that doesn't.

QA Shop's seed data gives you that for free. Efe owns orders 1001 and 1002; Ada owns 1003 and
1004. Rule R17: *a customer can only see, pay for or cancel their own orders — anyone else's →
404.*

Add to the environment:

```
other_customer_order_id = 1004
```

Then, logged in as Efe:

```javascript
// GET {{base_url}}/orders/{{other_customer_order_id}}
pm.test("Another customer's order is not visible (R17)", () => {
    pm.expect(pm.response.code).to.be.oneOf([403, 404]);
});
pm.test("...and none of their data leaks", () => {
    pm.expect(pm.response.text()).to.not.include("\"customer_id\":2");
});
```

Do the same for **every endpoint that takes an ID** — `GET`, `pay` and `cancel`. A system that
checks ownership on two of them and forgets the third is the normal case, not the exception.

**When you need two tokens at once** (e.g., Ada creates an order, Efe tries to read it), log the
second user in with `pm.sendRequest` and store the result in a second variable such as
`other_token`. Then set that request's auth to Bearer `{{other_token}}` instead of inheriting.

---

## 4. State transitions: the order lifecycle

Day 7 taught state transition testing. QA Shop's order lifecycle (README, R18–R19):

```
            pay               (warehouse)           (courier)
 pending ─────────► paid ─────────────► shipped ─────────────► delivered
    │                │
    └─── cancel ─────┴──────► cancelled
```

Turn it into a **state table**: every state × every event the API exposes.

| Current state | `pay` | `cancel` |
|---|---|---|
| pending | ✅ → paid (200) | ✅ → cancelled (200) |
| paid | ❌ 409 | ✅ → cancelled (200) |
| shipped | ❌ 409 | ❌ 409 |
| delivered | ❌ 409 | ❌ 409 |
| cancelled | ❌ 409 | ❌ 409 |

Ten cells, ten tests. The ❌ cells are the interesting ones — **invalid transitions** are exactly
what the UI hides and only the API can reach (Day 17).

You can reach `pending`, `paid` and `cancelled` with a chain. For `delivered`, use seeded data:
Efe's order **1001 is delivered**. (No customer-facing endpoint can ship or deliver an order — the
warehouse does that — so seed data is the only way in. That's normal: tests often need data set up
by a route the API doesn't expose. Week 7 shows you how to create it with SQL.)

> **Data that a test consumes.** `POST /orders/1001/cancel` changes order 1001. If the bug exists,
> the order is now `cancelled`, and the next run gets a 409 for a *different reason*. Assert on
> the reason as well as the code, and reset the database between runs of tests like this.

---

## 5. Data-driven testing

Yesterday R11 gave you eight `qty` tests. Eight copies of the same request is eight things to
maintain. **Data-driven testing** keeps one request and feeds it a table of inputs and expected
results.

### With a CSV file

`login-cases.csv`:

```csv
case,email,password,expected_status
valid customer,efe@example.com,Passw0rd!,200
wrong password,efe@example.com,passw0rd!,401
unknown email,nobody@example.com,Passw0rd!,401
disabled account,bola@example.com,Passw0rd!,403
empty password,efe@example.com,,400
empty email,,Passw0rd!,400
```

Request body:

```json
{ "email": "{{email}}", "password": "{{password}}" }
```

Post-response script:

```javascript
const expected = Number(pm.iterationData.get("expected_status"));
pm.test(pm.iterationData.get("case") + " -> " + expected, () => {
    pm.response.to.have.status(expected);
});
```

Run it: *Collection → Run → select the folder → Select File → `login-cases.csv`*. The runner
executes the request **once per row** (one *iteration* each), and every column is available as
`{{column}}` and via `pm.iterationData.get("column")`.

Use the `case` column in the test name. A report saying `disabled account -> 403 ✗` is
readable; `Status is correct ✗ (iteration 4)` is not.

### The type trap — and why JSON data files exist

CSV has no types: **every value is a string**. And `{{qty}}` inside a body is plain text
substitution. So for R11's "qty as a string" case:

```json
[ { "case": "qty as a string", "qty": "2", "expected_status": 400 } ]
```
```
Body template:  { "items": [{ "product_id": 6, "qty": {{qty}} }] }
Actually sent:  { "items": [{ "product_id": 6, "qty": 2 }] }      ← a number!
```

The test you meant to write — *does the API reject a string?* — never happens. It sends a valid
number, gets `201`, and fails for the wrong reason (or worse, you "fix" the expected result).

The fix: use a **JSON** data file (which keeps types) and build the body in a pre-request script
with `JSON.stringify`, which preserves them:

```javascript
// pre-request
pm.variables.set("order_body", JSON.stringify({
    items: [{ product_id: 6, qty: pm.iterationData.get("qty") }]
}));
```
```
Body:  {{order_body}}
```

`order-qty-cases.json`:

```json
[
  { "case": "qty 0 (below min)",     "qty": 0,    "expected_status": 400 },
  { "case": "qty 1 (min)",           "qty": 1,    "expected_status": 201 },
  { "case": "qty 10 (max)",          "qty": 10,   "expected_status": 201 },
  { "case": "qty 11 (above max)",    "qty": 11,   "expected_status": 400 },
  { "case": "qty -1",                "qty": -1,   "expected_status": 400 },
  { "case": "qty 1.5",               "qty": 1.5,  "expected_status": 400 },
  { "case": "qty as a string",       "qty": "2",  "expected_status": 400 },
  { "case": "qty null",              "qty": null, "expected_status": 400 }
]
```

### Keeping data-driven requests from breaking normal runs

If a data-driven request runs **without** a data file (because someone runs the whole
collection), `{{email}}` is unresolved and the test fails confusingly. Skip it instead:

```javascript
// pre-request
if (!pm.iterationData.has("expected_status")) {
    pm.execution.skipRequest();
}
```

### Flow control — use sparingly

`pm.execution.setNextRequest("Request name")` jumps to a named request; `setNextRequest(null)`
stops the run. It's tempting for loops and branching. Resist: collections that jump around are
hard to read and impossible to run folder-by-folder. Prefer data files for repetition and
`pm.sendRequest` for setup.

---

## Lab (19 minutes)

Reset first: `docker compose exec api npm run db:reset`.

**Part A — workflow (6 min).** Build `04 Order workflow` as the chain in section 1, with an
assertion on every step. Add the collection-level auto-login from section 2, then clear
`access_token` in the environment and run *only* this folder in the Runner. It should still pass.

**Part B — authorisation (4 min).** As Efe, test `GET`, `pay` and `cancel` on order 1004 (Ada's).
Which of the three enforce R17? Which don't?

**Part C — state transitions (5 min).** Add tests for the ❌ cells you can reach: pay a paid
order, cancel a cancelled order, **cancel delivered order 1001**. What happens? Then check
`GET /products/3` before and after — what did that cancellation do to stock?

**Part D — coupons (2 min).** Rule R15 says each customer may use a coupon once. Log in as Chidi
(`chidi@example.com`, who has never used `WELCOME10`), create an order for 2 × product 6
(₦7,000 — above the coupon's ₦5,000 minimum) with `WELCOME10`, then create **another** one. Pay
both. Then try a third. What does the API allow, and when does it finally say no?

**Part E — data-driven (2 min, finish at home).** Create `login-cases.csv`, run it through the
Runner, and read the per-iteration results.

**Debrief questions**
- Part B: why would a developer protect `pay` and `cancel` but forget `GET`?
- Part C: the delivered order was cancelled *and restocked*. What's the business impact if a
  customer can do this after receiving the goods?
- Part D: which status does the coupon check seem to count as "used"? How would you prove it?
- Which of today's defects would a UI-only tester never find?

---

## Common mistakes juniors make

- Workflow folders that only work if a different folder ran first, with no note saying so.
- Logging in once by hand and assuming the token lasts forever — then "the API broke" an hour
  later.
- Testing authorisation with **one** user. You cannot find BOLA without a second identity.
- Testing only the valid transitions of a state machine. The invalid ones are where the bugs are.
- Using CSV for type tests, so `"2"` silently becomes `2`.
- Data-driven requests that fail noisily when run without their data file.
- Tests that permanently change shared seed data and then pass or fail depending on run order.

---

## Homework (about 45 minutes)

1. **Complete Parts A–E.** Export the collection and environment to `labs/qa-shop/postman/`.
2. **Write the JSON-driven `qty` test** from section 5 (`order-qty-cases.json` in
   `labs/qa-shop/postman/data/`) and run it in the Runner. Which rows fail, and are they defects?
3. **BOLA everywhere.** List every QA Shop endpoint that takes an ID or returns per-user data.
   For each, write down the authorisation test you'd run. Implement the ones you haven't yet.
4. **Bug reports:** write up the delivered-order cancellation (R19) and the coupon reuse (R15).
   For each, state the business impact in money or customer terms, not just "the rule is
   broken".
5. **Install check for tomorrow:** `newman --version` must print 6.x.

---

## Check your understanding

<details>
<summary>1. Your <code>03 Products</code> folder passes in the Postman app but every protected request fails with 401 when a colleague runs only that folder from the command line. Why, and what's the fix?</summary>

In the app, your environment's current value still holds the token from an earlier login. Your
colleague's run starts with the environment as saved on disk — token empty — and nothing in
that folder logs in. Fix it by making each folder self-sufficient: a collection-level
pre-request auto-login that fetches a token whenever it's missing or near expiry.
</details>

<details>
<summary>2. Why can't you test BOLA with one user account?</summary>

BOLA is "user A can access user B's object". You need an object that belongs to someone else,
and a session that isn't theirs. With one account, every object you can name is your own, so
the authorisation check is never exercised. Always keep at least two test identities — ideally
also one with a different role.
</details>

<details>
<summary>3. A data-driven test feeds <code>"qty": "2"</code> from a CSV into a body template <code>{"qty": {{qty}}}</code> and gets 201. The tester changes the expected result for that row to 201. What went wrong?</summary>

Two things. First, the test never sent a string: CSV values are strings, and `{{qty}}` is text
substitution, so the body contained the number `2` — the test checked nothing. Second, the
tester changed the expectation to match the behaviour instead of the specification. The fix is
a JSON data file (which keeps types) plus a body built with `JSON.stringify` in a pre-request
script — then see what the API really does with `"2"`.
</details>

<details>
<summary>4. List the invalid transitions of the order lifecycle that are reachable through QA Shop's API. Why are these more valuable to test than the valid ones?</summary>

Pay a paid / shipped / delivered / cancelled order; cancel a shipped / delivered / cancelled
order. They're more valuable because developers naturally build and check the happy path, and
the UI prevents users from attempting invalid transitions, so nobody exercises them — but the
API accepts any request anyone sends. Missing guards on invalid transitions lead to refunds on
delivered goods, double payments and stock errors.
</details>

---

## Glossary additions

`chaining` · `workflow test` · `side-effect` · `test independence` · `auto-login` ·
`pm.sendRequest` · `arrange` · `BOLA` · `second identity` · `state table` · `invalid transition` ·
`data-driven testing` · `iteration` · `iteration data` · `data file` · `type coercion` ·
`pm.execution.skipRequest` · `setNextRequest`
