# Day 22 — Assertions, Scripts and Schema Validation

> **Week 5 · Day 22 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4.2 (black-box techniques applied), Chapter 6.2 (benefits and risks of test automation)
> Prerequisites: Day 21

---

## At a glance

Yesterday you **sent** requests and looked at the responses. A human looking is a manual test.
Today the collection learns to look for itself.

By the end of this session you should be able to:

1. Write Postman tests with `pm.test` and Chai assertions that check **values**, not just status.
2. Explain the order in which collection, folder and request scripts run.
3. Validate a response against a **JSON Schema**.
4. Use pre-request scripts to generate data and test scripts to store values.
5. Turn the QA Shop rules into positive, negative and boundary tests — and find real defects.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the gaps you found in the spec |
| 0:05 – 0:12 | From looking to checking: anatomy of a Postman test |
| 0:12 – 0:22 | The assertion toolkit, and what a *good* assertion looks like |
| 0:22 – 0:28 | Script order, pre-request scripts, storing values |
| 0:28 – 0:34 | JSON Schema validation |
| 0:34 – 0:57 | **Lab:** assert, then attack the rules |
| 0:57 – 1:00 | Homework |

---

## 1. From looking to checking

A Postman **test** is JavaScript in the request's *Scripts → Post-response* tab (older versions
call it the *Tests* tab). It runs after the response arrives.

```javascript
pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
});
```

- `pm.test(name, fn)` — one named check. It **passes** if `fn` runs without throwing, and
  **fails** if any assertion inside throws.
- The name is what appears in reports. Write it as the expected behaviour: `"Status is 200"`,
  `"Returns the logged-in customer"`, `"Rejects qty 11 (R11)"`.
- One `pm.test` should check **one behaviour**. Five unrelated assertions in one test means a
  failure tells you "something is wrong" instead of *what*.

**What it replaces:** you, squinting at JSON and deciding whether it looks right. The script
decides the same way every time, in milliseconds, at 2 a.m., without getting bored.

---

## 2. The assertion toolkit

### Reading the response

| Expression | Gives you |
|---|---|
| `pm.response.code` | `201` |
| `pm.response.json()` | The body, parsed into an object |
| `pm.response.text()` | The raw body as a string |
| `pm.response.headers.get("Location")` | One header's value |
| `pm.response.responseTime` | Milliseconds |

### Postman's built-in response assertions

```javascript
pm.response.to.have.status(201);
pm.response.to.have.header("Location");
pm.response.to.not.be.serverError;       // anything but 5xx — note: no brackets
pm.response.to.have.jsonSchema(schema);   // section 4
```

`status(…)`, `header(…)` and `jsonSchema(…)` are called with brackets; the "is it this class of
response" checks — `ok`, `serverError`, `clientError`, `notFound` — are properties, written
without brackets. Adding `()` to those throws a `TypeError`.

### Chai `expect` — the workhorse

Postman bundles the **Chai** assertion library. Almost every check you write is
`pm.expect(actual).to.<something>(expected)`:

```javascript
const body = pm.response.json();

pm.expect(body.status).to.eql("pending");                  // equality (deep, for objects/arrays)
pm.expect(body.total_amount).to.equal(7000);               // strict === equality
pm.expect(body.id).to.be.a("number");                      // type
pm.expect(body.items).to.be.an("array").that.is.not.empty; // chained
pm.expect(body.items).to.have.lengthOf(1);
pm.expect(body).to.have.property("created_at");
pm.expect(body).to.not.have.any.keys("password", "password_hash");
pm.expect(pm.response.code).to.be.oneOf([403, 404]);
pm.expect(body.error).to.include("at least 8");            // substring
pm.expect(body.email).to.match(/^qa\.intern\+\d+@example\.com$/);
pm.expect(pm.response.responseTime).to.be.below(1000);
pm.expect(body.discount).to.be.closeTo(700, 0.01);         // money as floating point
```

**`eql` vs `equal`:** `equal` is strict `===`, so `{a: 1}` does not `equal` `{a: 1}` (two
different objects). `eql` compares contents. Use `eql` for objects and arrays; either works for
plain numbers and strings.

### What a good assertion checks

Recall the Day 17 checklist. Every endpoint deserves assertions at four depths:

| Depth | Weak | Strong |
|---|---|---|
| Status | `status is 2xx` | `status is 201` — the *exact* code the spec says |
| Shape | `body has id` | Schema: every field present, correctly typed, nothing extra |
| Values | `total exists` | `total_amount === subtotal − discount === 7000` |
| Side-effects | — | The order appears in `GET /orders`; stock went down by 2 |

The weak column passes on a broken system. **A test that can't fail is not a test.** A useful
habit: after writing an assertion, change the expected value to something wrong and confirm the
test goes red. If it stays green, the assertion isn't checking what you think.

### Assert on the business rule, not on whatever came back

The classic junior mistake: send the request, copy the response into the assertion, done. That
**encodes the current behaviour — bugs included — as "expected"**. Derive the expected result
from the specification:

```javascript
// R16: discount = subtotal × percent_off / 100, total = subtotal − discount
// 2 × Ceramic Mug at ₦3,500 with WELCOME10 (10%)
pm.test("10% off a 7,000 subtotal (R16)", () => {
    const order = pm.response.json();
    pm.expect(order.subtotal).to.eql(7000);
    pm.expect(order.discount).to.eql(700);
    pm.expect(order.total_amount).to.eql(6300);
});
```

---

## 3. Scripts: order, pre-request, and storing values

### Execution order

Scripts can live on the collection, on each folder, and on each request. For every request
Postman runs them in this order:

```
 collection pre-request ─► folder pre-request ─► request pre-request
                                                         │
                                                  ── HTTP request ──
                                                         │
 collection post-response ─► folder post-response ─► request post-response
```

That means you can put **checks that apply to every request** at collection level, once:

```javascript
// Collection → Scripts → Post-response: runs after EVERY request
pm.test("[all] Responds in under 2000 ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
pm.test("[all] Responds with JSON (R22)", () => {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});
```

### Storing a value for later requests

In the login request's post-response script:

```javascript
pm.test("Status is 200", () => pm.response.to.have.status(200));

const body = pm.response.json();
pm.test("Returns a bearer token (R6)", () => {
    pm.expect(body.access_token).to.be.a("string").and.not.be.empty;
    pm.expect(body.access_token.split(".")).to.have.lengthOf(3);   // header.payload.signature
    pm.expect(body.token_type).to.eql("Bearer");
    pm.expect(body.expires_in).to.eql(3600);
});

pm.environment.set("access_token", body.access_token);
```

Now every request that inherits collection auth uses the fresh token. No more pasting.

### Pre-request scripts

Run *before* the request is sent. Use them to **prepare data**:

```javascript
// POST /auth/register - pre-request: a unique email every run
pm.environment.set("new_email", "qa.intern+" + Date.now() + "@example.com");
```

```javascript
// GET /me - tampered token: flip the last character of a real token
const token = pm.environment.get("access_token");
const last = token.slice(-1) === "A" ? "B" : "A";
pm.variables.set("tampered_token", token.slice(0, -1) + last);   // local scope: this request only
```

Then the request body or auth uses `{{new_email}}` or `{{tampered_token}}`.

**Rule of thumb:** pre-request scripts *arrange*; post-response scripts *assert* and *store*.
Keep logic out of request bodies.

---

## 4. JSON Schema validation

Asserting fields one by one gets long, and you'll always forget one. A **JSON Schema** describes
the whole shape of a response — required fields, types, allowed values — and checks it in one
assertion.

```javascript
const productSchema = {
    type: "object",
    required: ["id", "sku", "name", "category", "price", "stock"],
    properties: {
        id:          { type: "integer" },
        sku:         { type: "string" },
        name:        { type: "string", minLength: 1 },
        description: { type: ["string", "null"] },
        category:    { type: "string", enum: ["electronics", "books", "home", "fashion", "grocery", "toys"] },
        price:       { type: "number", minimum: 0 },
        stock:       { type: "integer" }
    },
    additionalProperties: false
};

pm.test("Matches the product schema", () => {
    pm.response.to.have.jsonSchema(productSchema);
});
```

What each part buys you:

| Keyword | Catches |
|---|---|
| `required` | A field silently dropped by a refactor |
| `type` | `"price": "18500"` (string) instead of `18500` — breaks every mobile client |
| `enum` | A new, undocumented category value |
| `minimum` | Negative prices |
| `["string", "null"]` | Documents that `null` is allowed — and makes "missing" a failure |
| `additionalProperties: false` | **New fields appearing** — including ones that should never be exposed, like `password_hash` or `internal_cost` |

That last one is a security check in disguise. If someone adds `password_hash` to a `SELECT *`,
the schema test fails before a customer ever sees it.

**Where schemas come from:** if the team has OpenAPI documentation, the schemas are already in
it — copy them, don't reinvent them. If the API's response doesn't match its own published
schema, that's documentation drift (Day 17), and it's a defect either way.

---

## 5. Turning rules into tests

Use Day 7's techniques on the QA Shop rules. Example — **R11: `qty` is an integer from 1 to 10**:

| Technique | Test | Expected |
|---|---|---|
| BVA | `qty: 0` | 400 |
| BVA | `qty: 1` | 201 |
| BVA | `qty: 10` | 201 |
| BVA | `qty: 11` | 400 |
| EP (invalid type) | `qty: "2"` | 400 |
| EP (invalid type) | `qty: 1.5` | 400 |
| EP (invalid) | `qty: -1` | 400 |
| EP (missing) | `{"product_id": 6}` | 400 |

Eight tests from one sentence. Do the same for R7 (`page` and `limit`), R3 (password length) and
R14 (coupon minimum) and you have a negative suite that will find real defects.

**When a test fails, who's wrong?** Check in this order:

1. **The Console** — did the request you *think* you sent actually get sent?
2. **The spec** — is your expected result really what the rule says?
3. **The data** — has an earlier run changed the state? (Reset and re-run.)
4. Only then: **the product**. Now it's a defect — write it up properly (Day 10).

---

## Lab (23 minutes)

Reset the database first: `docker compose exec api npm run db:reset`.

**Part A — assert the happy paths (8 min)**
1. Add the collection-level `[all]` checks from section 3.
2. Login: the full test and `pm.environment.set` from section 3. Delete your hand-pasted token
   and confirm `/me` still works.
3. `GET /products/1`: status, and the product schema from section 4.
4. `POST /orders` (2 × product 6): status 201, `status === "pending"`, totals per R16, and a
   `Location` header of `/orders/<id>`.
5. Mutation check: change one expected value to something wrong and confirm the test fails.

**Part B — attack the rules (15 min)**
Create a folder `05 Order validation` (and add to `02 Auth` / `03 Products`). Write a request
with assertions for each of these. The expected result comes **from the spec**, not from what
the API does:

| # | Request | Rule |
|---|---|---|
| 1 | Register with only `first_name` | R1 |
| 2 | Register with a 7-character password | R3 |
| 3 | Register with an email that already exists | R2 |
| 4 | Login with a wrong password | R4 |
| 5 | Login with an email that doesn't exist — **compare the message with #4** | R4 |
| 6 | `GET /products/abc` | R9 |
| 7 | `GET /products?page=0` | R7 |
| 8 | `GET /products?limit=101` | R7 |
| 9 | `POST /orders` with `qty: 0`, `qty: 10`, `qty: 11` | R11 |
| 10 | `POST /orders` with coupon `EXPIRED15` | R14 |
| 11 | Send malformed JSON (`{"email": "efe@example.com",`) to `/auth/login` | R20, R21 |

You should end with **several failing tests**. Each one is either a mistake in your test or a
defect. Work out which. For the defects, write the rule number next to the request name.

**Debrief questions**
- How many defects did the room find? Which rules do they break?
- Look at the body of the `500` responses. What's in there that shouldn't be? (Rule R21, and
  Day 15's information-disclosure discussion.)
- Request #5 vs #4: what could an attacker do with that difference? (Day 18.)
- Did anyone's schema test catch something the field-by-field tests didn't?

---

## Common mistakes juniors make

- Asserting only `pm.response.to.have.status(200)` and calling the request "tested".
- Copying the actual response into the expected result — locking bugs in as requirements.
- Writing a test that **can't fail** (`pm.expect(body).to.be.an("object")` on any JSON body).
- One giant `pm.test` with 15 assertions — the first failure hides the other 14.
- `pm.expect(body.total).to.equal(0.3)` on floating-point money — use `closeTo` or compare
  integer minor units.
- Using `pm.globals.set` for the token, then wondering why another collection is logged in as
  the wrong user.
- Not reading the Console when a test fails, and "fixing" the test instead of finding out why.

---

## Homework (about 45 minutes)

1. **Finish Part B** of the lab. Every request in folders `02`–`05` should have at least two
   meaningful assertions.
2. **Write an order schema** (like the product schema) covering `items` as an array of objects,
   `status` as an enum of the five lifecycle states, and `currency` fixed to `"NGN"`. Apply it to
   `POST /orders` and `GET /orders/{id}`.
3. **Write three bug reports** for defects you found today, using
   [`templates/bug-report-template.md`](../templates/bug-report-template.md). Each must cite the
   rule it breaks, include the exact request and response, and justify severity *and* priority.
   At least one should be the R21 information-disclosure defect.
4. **Read ahead:** look at the order status lifecycle diagram in the QA Shop README. List every
   transition, valid and invalid. Tomorrow you test them.

---

## Check your understanding

<details>
<summary>1. Your test for <code>POST /orders</code> only asserts status 201. What can be broken while that test still passes?</summary>

Practically everything else: the totals could be wrong, the discount miscalculated, the
currency missing, the items array empty, the status not `pending`, sensitive fields exposed,
the `Location` header absent — and the stock might not have been decremented at all. Status
codes tell you the server *thinks* it succeeded. Values, schema and side-effects tell you
whether it did.
</details>

<details>
<summary>2. A collection-level post-response script and a request-level one both exist. Which runs first, and why might you put a check at collection level?</summary>

Collection-level runs first, then folder-level, then request-level. Checks that apply to every
request — response time ceilings, `Content-Type: application/json`, "no stack trace in the
body" — belong at collection level so they're written once and can't be forgotten on a new
request.
</details>

<details>
<summary>3. What does <code>additionalProperties: false</code> in a schema protect against that field-by-field assertions usually miss?</summary>

Fields you didn't know to look for. Assertions check that expected fields are present and
correct; they don't notice an *extra* field. `additionalProperties: false` fails the test when
anything undocumented appears — which catches accidental data exposure such as a
`password_hash` or internal identifier leaking after someone changes a query to `SELECT *`.
</details>

<details>
<summary>4. Login with an unknown email returns "No account found for that email"; with a wrong password it returns "Incorrect password". Both are 401. Is this a defect?</summary>

Yes — it breaks R4, and it's a security defect called **user enumeration** (Day 18). An
attacker can submit a list of email addresses and learn which ones have accounts, then target
those with password guessing or phishing. Both cases must return the same status and the same
generic message, such as "Invalid email or password". Severity is usually Major; it's not a
breach on its own, but it makes every other attack cheaper.
</details>

---

## Glossary additions

`pm.test` · `assertion` · `Chai` · `expect` · `eql vs equal` · `post-response script` ·
`pre-request script` · `script execution order` · `JSON Schema` · `additionalProperties` ·
`mutation check` · `user enumeration` · `information disclosure`
