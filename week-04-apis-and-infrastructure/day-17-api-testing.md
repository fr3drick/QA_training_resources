# Day 17 — API Testing Fundamentals

> **Week 4 · Day 17 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2 (test levels — integration/API), Chapter 6 (test tools)
> Prerequisites: Day 16

---

## At a glance

By the end of this session you should be able to:

1. Explain what an API is and why testing at API level beats testing through the UI.
2. Distinguish **REST**, **SOAP** and **GraphQL**.
3. Send requests in Postman (or `curl`) and assert on the response.
4. Say **what to check** in every API response — status, body, schema, headers, timing.
5. Design negative, boundary and security tests for an endpoint.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: status code drill |
| 0:05 – 0:13 | What an API is; why test at this level |
| 0:13 – 0:22 | REST vs SOAP vs GraphQL |
| 0:22 – 0:34 | The API test checklist |
| 0:34 – 0:44 | Postman: collections, variables, assertions, chaining |
| 0:44 – 0:57 | **Activity:** test a live API |
| 0:57 – 1:00 | Homework |

---

## 1. What an API is, and why test there

**An API (Application Programming Interface) is a contract that lets one piece of software ask
another to do something.** A web API is that contract exposed over HTTP.

Your application is not one thing. It's a browser or mobile app talking to a backend, which
talks to other services:

```
Mobile app ─┐
Web app   ──┼─► API Gateway ─► Order Service ─► Payment Service ─► Bank
Partner   ──┘                       │
                                    └────────► Inventory Service ─► Database
```

**Every arrow is an API call, and every arrow is a place a defect can live.**

### Why API testing beats UI testing for most checks

| | UI test | API test |
|---|---|---|
| Speed | Seconds to minutes | Milliseconds |
| Stability | Breaks when a button moves | Breaks only when the contract changes |
| When available | After the UI is built | **As soon as the endpoint exists** — shift left |
| Diagnosis | "Checkout failed" — where? | "POST /orders returned 500" — precise |
| Coverage per test | One path through one screen | Every field, every combination, fast |
| Can it test what the UI prevents? | No — the UI hides the button | **Yes — this is the big one** |

That last row is the heart of it. The UI disables the "Cancel" button on a shipped order. The
API doesn't. **Every invalid state transition from Day 7 is testable here, and only here.**
Testers who only click buttons never find these bugs.

### What the UI still catches that APIs don't

Layout, usability, accessibility, browser compatibility, and whether the correct data is
actually *displayed* correctly. Do both — most checks at API level, judgement at UI level.

---

## 2. REST vs SOAP vs GraphQL

### REST (Representational State Transfer)

The dominant style. Resources are identified by URLs; HTTP methods say what to do with them.

```
GET    /v2/orders           list orders
POST   /v2/orders           create an order
GET    /v2/orders/1001      get one order
PUT    /v2/orders/1001      replace it
PATCH  /v2/orders/1001      update part of it
DELETE /v2/orders/1001      delete it
GET    /v2/orders/1001/items    sub-resource
GET    /v2/orders?status=paid&page=2&limit=50   filter and paginate
```

Usually JSON. Stateless. Cacheable. Conventions matter: nouns not verbs in paths
(`/orders`, not `/getOrders`), plural collections, versioning in the path or a header.

### SOAP

Older, heavier, XML-only, with a formal **WSDL** contract describing every operation. Requests
go in an XML "envelope", usually all to one endpoint via POST.

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetOrder xmlns="http://example.com/orders">
      <OrderId>1001</OrderId>
    </GetOrder>
  </soap:Body>
</soap:Envelope>
```

Still very much alive in banking, telecoms, insurance and government. Strengths: a strict
contract, built-in standards for security and transactions. Weaknesses: verbose and rigid.
If you test in a bank, you will meet SOAP — and errors come back as a `<soap:Fault>` with
**HTTP 200**, so you cannot judge success by status code alone.

### GraphQL

One endpoint (`/graphql`), and the *client* specifies exactly what it wants.

```graphql
query {
  order(id: 1001) {
    id
    total
    customer { name email }
    items { sku qty price }
  }
}
```

Strengths: no over-fetching or under-fetching; one round trip for nested data.
**Testing angles unique to GraphQL:** everything returns **HTTP 200**, even errors — the real
outcome is in an `errors` array in the body, so asserting on status code alone is worthless.
Also test query depth and complexity limits (a deeply nested query can be a denial-of-service),
and check that field-level authorisation is enforced — asking for a field you shouldn't see is
the classic GraphQL vulnerability.

| | REST | SOAP | GraphQL |
|---|---|---|---|
| Format | JSON (usually) | XML only | JSON |
| Contract | OpenAPI/Swagger (optional) | WSDL (mandatory) | Schema (mandatory) |
| Endpoints | Many | Usually one | One |
| Errors | HTTP status codes | HTTP 200 + `<soap:Fault>` | HTTP 200 + `errors` array |
| Test with | Postman, curl | SoapUI, Postman | Postman, GraphQL clients |

---

## 3. What to check in every API response

Run through this list for every endpoint. It's the API equivalent of the bug-report checklist.

### The response itself
- [ ] **Status code** is the right one (201 for creation, not 200; 204 for delete)
- [ ] **Response body** — every field present, correctly named, correctly typed
- [ ] **Values are correct**, not just present. Is the total actually right?
- [ ] **Data types** — is `qty` the number `2` or the string `"2"`? Is a boolean `true` or `"true"`?
- [ ] **Nulls vs missing vs empty string** — `null`, `""` and an absent key are three different
      things, and clients handle them differently. This is a very common source of mobile crashes
- [ ] **Nested objects and arrays** are correctly structured
- [ ] **Empty results** return `[]` and a 200 — not `null`, not a 404
- [ ] **Schema validation** — does the response match the documented contract?
- [ ] **Headers** — `Content-Type`, caching, security headers
- [ ] **Response time** against the NFR

### The request side
- [ ] **Required fields missing** → 400/422, with a message naming the field
- [ ] **Extra unexpected fields** → ignored, or rejected? (Either is fine; **undefined is not**)
- [ ] **Wrong data types** → `{"qty": "abc"}`, `{"qty": null}`, `{"qty": -1}`, `{"qty": 1.5}`
- [ ] **Boundaries** (Day 7) → 0, 1, max, max+1, empty string, maximum-length string
- [ ] **Malformed JSON** → 400, never a 500
- [ ] **Wrong `Content-Type`** → 415
- [ ] **Unsupported method** → 405
- [ ] **Very large payload** → 413, not a hang
- [ ] **Unicode, emoji, RTL text, and `O'Brien`** → stored and returned intact

### State and business rules
- [ ] **Invalid state transitions** — cancel a delivered order, refund twice, pay a cancelled order
- [ ] **Non-existent IDs** → 404
- [ ] **Someone else's ID** → 403 or 404, **never** 200 (see below)
- [ ] **Idempotency** — send the same POST twice
- [ ] **Concurrency** — two requests changing the same record at once
- [ ] **Pagination** — page 0, page 1, the last page, one past the last, `limit=0`, `limit=99999`
- [ ] **Sorting and filtering** — invalid field names, injection attempts in sort parameters

### Security (the essentials — Day 18 goes deeper)
- [ ] **No token** → 401
- [ ] **Expired / malformed / tampered token** → 401
- [ ] **Valid token, wrong role** → 403
- [ ] **BOLA / IDOR** — authenticate as user A, request user B's resource by ID. If you get
      user B's data, that is a **critical** defect, and it is the single most common serious API
      vulnerability in the wild. **Test it on every endpoint that takes an ID**
- [ ] **Sensitive data in responses** — password hashes, internal IDs, other users' emails,
      full card numbers, stack traces
- [ ] **Rate limiting** exists on authentication and expensive endpoints

---

## 4. Postman in ten minutes

**Collection** — a folder of saved requests. Structure it by feature.

**Environment** — a named set of variables so one collection runs against dev, QA and staging:

```
base_url    = https://api.qa2.example.com
token       = (set automatically by the login request)
customer_id = 1
```
Then requests use `{{base_url}}/v2/orders/{{order_id}}`. Never hard-code a URL.

**Tests (assertions)** — JavaScript that runs after the response. This is what turns a manual
poke into a repeatable check:

```javascript
pm.test("Status is 201", () => pm.response.to.have.status(201));

pm.test("Responds within 2 seconds", () => pm.expect(pm.response.responseTime).to.be.below(2000));

pm.test("Body has the expected shape and values", () => {
    const body = pm.response.json();
    pm.expect(body).to.have.property("id");
    pm.expect(body.status).to.eql("pending");
    pm.expect(body.total).to.eql(36000);
    pm.expect(body.currency).to.eql("NGN");
    pm.expect(body.items).to.be.an("array").that.is.not.empty;
});

pm.test("No sensitive fields leaked", () => {
    const raw = pm.response.text();
    pm.expect(raw).to.not.include("password");
    pm.expect(raw).to.not.include("card_number");
});

// Chain: save a value for the next request
const body = pm.response.json();
pm.environment.set("order_id", body.id);
```

**Chaining** is how you build realistic flows: log in → save the token → create an order → save
the order ID → fetch it → cancel it → confirm the state. Each request uses what the last one
produced.

**Collection Runner** executes the whole collection in order — your API regression suite. The
same collection can run in CI via **Newman** (`newman run collection.json -e qa.json`), which is
often a QA intern's first genuine contribution to a pipeline.

**Equivalent in `curl`,** for when you have no GUI:

```bash
TOKEN=$(curl -s -X POST https://api.example.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@example.com","password":"Pass123!"}' | jq -r .token)

curl -s https://api.example.com/v2/orders \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, status, total}'
```

`jq` is worth 15 minutes of your life to learn.

---

## 5. Reading the API contract

If the team has **OpenAPI/Swagger** documentation, it is your test basis — treat it exactly like
a requirements document from Day 4 and review it: are all status codes documented? Are required
fields marked? Are the examples valid? Does the documentation match reality? **Documentation
drift is a defect**: if the docs say a field is a string and the API returns a number, someone's
client will break, and the bug is real regardless of which side is "wrong".

---

## Live activity (13 minutes)

**Test a live API.** Use `https://reqres.in` (or `https://jsonplaceholder.typicode.com`).

Work through these in Postman or curl and record the status and body for each:

1. `GET https://reqres.in/api/users?page=2` — how many users, what's the pagination metadata?
2. `GET https://reqres.in/api/users/2` — a valid user.
3. `GET https://reqres.in/api/users/23` — a non-existent user. **What status? What body?**
4. `POST https://reqres.in/api/users` with `{"name":"Efe","job":"QA"}` — what status? What is
   returned that you didn't send?
5. `POST https://reqres.in/api/register` with `{"email":"eve.holt@reqres.in"}` (no password) —
   what status, and is the error message useful?
6. `DELETE https://reqres.in/api/users/2` — what status, and what body?
7. Now try to break it: send malformed JSON, send a huge string in `name`, send `{"name": null}`,
   use `PATCH` where you used `PUT`, and request `/api/users/-1` and `/api/users/abc`.

**Debrief questions:**
- Which responses would you log as defects if this were your product, and why?
- Which one returned a 200 that should have been something else?
- Did any response leak information it shouldn't?
- Write one Postman assertion for request 2.

---

## Common mistakes juniors make

- Asserting only on the status code and never reading the body.
- Testing only the happy path — no missing fields, no wrong types, no boundaries.
- Never testing another user's ID, and so never finding the most serious bug class in APIs.
- Hard-coding tokens and URLs, so the collection can't run on another environment or tomorrow.
- Ignoring response time because "it felt fine".
- Assuming a GraphQL or SOAP 200 means success.

---

## Homework (about 45 minutes)

1. **Build a small Postman collection** against `reqres.in` with at least 8 requests, an
   environment with `{{base_url}}`, and **at least two assertions per request**. Include at least
   three negative tests.
2. **Chain two requests:** create a user, capture the returned `id` into a variable, then use it
   in a follow-up request.
3. **Write 15 test cases** for this endpoint specification, using Day 7's techniques:
   > `POST /v2/transfers` — body: `{"from_account": string, "to_account": string, "amount": number,
   > "currency": "NGN"|"USD", "reference": string (max 35 chars)}`. Amount must be > 0 and
   > ≤ 1,000,000. The source account must belong to the authenticated user. Returns 201 with a
   > transfer object.
   Cover: boundaries, types, missing fields, authorisation, idempotency, and BOLA.
4. Export the collection as JSON and keep it — you'll extend it tomorrow with authentication.

---

## Check your understanding

<details>
<summary>1. Why can API testing find bugs that UI testing structurally cannot?</summary>

Because the UI only offers the actions its designers permitted — buttons are hidden or disabled
for states the developer considered invalid. The API has no such guard unless someone
implemented one server-side. So invalid state transitions (cancel a shipped order), skipped
steps, out-of-range values the form validates client-side, and requests for other users' data
are only reachable through the API. Client-side validation is a usability feature, never a
security control, and API testing is how you prove that.
</details>

<details>
<summary>2. You authenticate as user A and request GET /v2/orders/1003, which belongs to user B. You get 200 and B's data. How do you report it?</summary>

As a **critical security defect** — Broken Object Level Authorization (BOLA/IDOR). The report
needs: the authenticated user, the resource ID requested, the response proving it belongs to
another user, and the fact that it is reproducible. Redact the actual personal data in the
ticket. Mark it security-sensitive and follow your organisation's disclosure route rather than
posting it in a public channel. Then check whether the same flaw exists on the other endpoints
that take an ID — it usually does, because it's a missing check in a shared pattern.
</details>

<details>
<summary>3. An endpoint returns 200 with an empty body when a record isn't found. Is that a defect?</summary>

Yes. A request for a non-existent resource should return 404 (or 403/404 if the record exists
but isn't yours). Returning 200 with nothing forces every client to invent its own detection
logic, and it will be done inconsistently — some clients will render an empty page, others will
crash on a null. It also breaks caching and monitoring, since the request looks successful in
every dashboard. Note it as a contract defect and check the API documentation to see which
behaviour was specified.
</details>

<details>
<summary>4. Why is asserting on the HTTP status code insufficient for GraphQL and SOAP?</summary>

Both return **HTTP 200** for application-level errors. GraphQL puts failures in an `errors`
array in the body while still returning 200; SOAP returns a `<soap:Fault>` element inside a 200
envelope. A test that only checks `status == 200` will pass while the operation completely
failed — a false negative, which is the dangerous kind. You must assert on the body: absence of
an `errors` array for GraphQL, absence of `<soap:Fault>` for SOAP, plus the expected data.
</details>

---

## Glossary additions

`API` · `REST` · `endpoint` · `resource` · `SOAP` · `WSDL` · `soap:Fault` · `GraphQL` ·
`schema` · `OpenAPI` · `Swagger` · `Postman` · `collection` · `environment variable` ·
`assertion` · `chaining` · `Newman` · `jq` · `pagination` · `BOLA` · `IDOR` ·
`documentation drift` · `over-fetching`
