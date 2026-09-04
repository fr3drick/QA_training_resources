# Day 16 — HTTP: Methods, Status Codes and Headers

> **Week 4 · Day 16 · 60 minutes**
> Prerequisites: Week 3

---

## At a glance

By the end of this session you should be able to:

1. Read an HTTP request and response, line by line.
2. Name every common **method** and explain **safe** and **idempotent** — and why testers care.
3. Read **status codes** as a signal of who owns the problem.
4. Name the headers that matter in testing, and what breaks when they're wrong.
5. Explain cookies, sessions and CORS well enough to diagnose them.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Weekend homework review: SQL practice |
| 0:05 – 0:14 | The shape of a request and a response |
| 0:14 – 0:30 | Methods, safety, idempotence — and the tests each implies |
| 0:30 – 0:42 | Status codes |
| 0:42 – 0:52 | Headers, cookies, CORS |
| 0:52 – 0:58 | **Activity:** read raw traffic |
| 0:58 – 1:00 | Homework |

---

## 1. The shape of HTTP

HTTP is a **request/response** protocol, and it is **stateless** — the server remembers nothing
between requests. Every request must carry everything needed to understand it, which is why
cookies and tokens exist.

### A request

```http
POST /v2/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0
Content-Length: 68

{"sku":"BK-1099","qty":2,"coupon":"SAVE20","delivery":"standard"}
```

1. **Request line** — method, path (+ query string), HTTP version.
2. **Headers** — metadata, one per line.
3. **Blank line**.
4. **Body** — optional; the payload.

### A response

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /v2/orders/1006
Cache-Control: no-store
X-Request-Id: 7c2a1f9e-4b33-4a51-9d8f-1f2e3a4b5c6d
Content-Length: 142

{"id":1006,"status":"pending","total":36000,"currency":"NGN","created_at":"2026-03-12T14:32:10Z"}
```

1. **Status line** — version, status code, reason phrase.
2. **Headers**.
3. **Blank line**.
4. **Body**.

**`X-Request-Id` (or `X-Correlation-Id`, `traceparent`) is the single most useful header for a
tester.** Copy it into every bug report — a developer can search the logs by it and land on the
exact request in seconds.

---

## 2. HTTP methods and their significance

| Method | Purpose | Body? | **Safe?** | **Idempotent?** | Typical success |
|---|---|---|---|---|---|
| **GET** | Retrieve a resource | No | ✅ Yes | ✅ Yes | 200 |
| **POST** | Create a resource; submit data; trigger an action | Yes | ❌ No | ❌ **No** | 201 (or 200) |
| **PUT** | Replace a resource entirely | Yes | ❌ No | ✅ Yes | 200 / 204 |
| **PATCH** | Partially update a resource | Yes | ❌ No | ⚠️ Usually, not required | 200 / 204 |
| **DELETE** | Remove a resource | Rarely | ❌ No | ✅ Yes | 204 (or 200) |
| **HEAD** | Like GET, headers only, no body | No | ✅ Yes | ✅ Yes | 200 |
| **OPTIONS** | Ask what's allowed (used by CORS preflight) | No | ✅ Yes | ✅ Yes | 200 / 204 |

### Safe and idempotent — the two words that matter

**Safe** = it does not change server state. Only `GET`, `HEAD` and `OPTIONS` are safe.

> **Test:** does a `GET` in your product change anything? If `GET /orders/1001/cancel` cancels
> an order, that's a real defect — browsers, crawlers, link previewers and prefetchers all issue
> GETs speculatively. A messaging app's link preview can silently cancel your customer's order.
> This is a genuine, classic production incident, and it is exactly the kind of thing a tester
> who knows HTTP catches and a tester who doesn't never sees.

**Idempotent** = making the same request many times has the same effect as making it once.

- `DELETE /orders/1001` five times → the order is deleted; the last four change nothing. Idempotent.
- `POST /orders` five times → **five orders**. Not idempotent.

> **Test:** send the same `POST` twice, quickly. Do you get two orders, two charges, two emails?
> This is the double-click bug from Day 8, and now you can test it precisely rather than by
> clicking fast. The correct fix is an **idempotency key** — a client-generated unique value the
> server uses to recognise and collapse duplicates. Ask whether the payment endpoint has one; if
> it doesn't, that's a design finding worth raising.

**PUT vs PATCH — a test that finds real bugs.** `PUT` replaces the whole resource; any field you
omit should be cleared or defaulted. `PATCH` updates only what you send.

```http
PUT /v2/customers/1     {"first_name":"Efe"}
```
If the implementation is a correct `PUT`, `last_name` and `email` are now gone. If the team
*meant* `PATCH` and wired it to `PUT`, sending a partial update silently wipes fields. Send a
partial `PUT` and check the whole record in the database — this finds data-loss bugs that never
appear through the UI, because the UI always sends every field.

### Method-related tests worth running on any API

- Send a method the endpoint doesn't support → expect **405 Method Not Allowed**, not 500.
- Send `GET` where the UI uses `POST` — is authorisation checked on both?
- Send `DELETE` twice → second should be 204 or 404, never 500.
- Check whether dangerous methods are exposed where they shouldn't be (`PUT`/`DELETE` on a
  read-only service).

---

## 3. Status codes

Read the **first digit** as ownership: 4xx means *we sent something wrong*, 5xx means *the
server broke*. That one habit routes bugs to the right team.

### 2xx — Success

| Code | Meaning | Tester's note |
|---|---|---|
| **200 OK** | Success, body returned | Check the body is actually right — 200 with `{"results":[]}` was the Day 10 apostrophe bug |
| **201 Created** | Resource created | Should include a `Location` header pointing at the new resource |
| **202 Accepted** | Accepted for **async** processing, not yet done | The work may still fail later. Test what happens then — is the user told? |
| **204 No Content** | Success, deliberately no body | Common for DELETE and PUT |
| 206 Partial Content | Range request | Video streaming, resumable downloads |

### 3xx — Redirection

| Code | Meaning | Tester's note |
|---|---|---|
| **301 Moved Permanently** | Permanent | **Browsers cache this aggressively.** A wrong 301 in production is painful to undo |
| **302 Found** / 307 | Temporary | The common post-login redirect |
| **304 Not Modified** | Your cached copy is still valid | Seeing this is normal and good |
| 308 | Permanent, method preserved | |

> **Test:** redirect **loops** (A → B → A) show as `ERR_TOO_MANY_REDIRECTS`. Also test that
> `http://` → `https://` and that the redirect target preserves the query string and the
> original path — losing "where I was going" after login is a very common defect.

### 4xx — Client errors (our request was wrong)

| Code | Meaning | What it usually means in practice |
|---|---|---|
| **400 Bad Request** | Malformed request or failed validation | Check the body — good APIs name the offending field |
| **401 Unauthorized** | **Not authenticated** — no valid credentials | Missing, malformed or **expired** token. (Misnamed; it means unauthenticated) |
| **403 Forbidden** | **Authenticated, but not allowed** | Wrong role or permission. Or a WAF blocking you (Day 12) |
| **404 Not Found** | No such resource | Sometimes used deliberately instead of 403, to avoid revealing that a record exists |
| **405 Method Not Allowed** | Wrong method for this path | |
| **409 Conflict** | Conflicts with current state | Duplicate email; editing a record someone else changed |
| **410 Gone** | Existed, permanently removed | |
| **413 Payload Too Large** | Body exceeds the limit | Your file-upload boundary test |
| **415 Unsupported Media Type** | Wrong `Content-Type` | Sending JSON without the header |
| **422 Unprocessable Entity** | Well-formed but semantically invalid | Widely used for validation failures |
| **429 Too Many Requests** | Rate limited | Check for a `Retry-After` header. **Automated tests trip this constantly** |

**401 vs 403 is the distinction to memorise:** 401 = *I don't know who you are*.
403 = *I know who you are, and no*. Getting 403 where you expect 200 is a permissions bug;
getting 401 halfway through a session is a token-expiry bug. They go to different developers.

### 5xx — Server errors (the server broke)

| Code | Meaning | Tester's note |
|---|---|---|
| **500 Internal Server Error** | Unhandled exception | **Always a bug.** Get the logs and the request ID |
| 501 Not Implemented | Method not supported at all | |
| **502 Bad Gateway** | The proxy got an invalid response from upstream | The app behind the proxy is down or crashed |
| **503 Service Unavailable** | Temporarily down/overloaded | Check for `Retry-After`. Common during deploys |
| **504 Gateway Timeout** | Upstream took too long | Slow query, slow dependency (Day 13's example) |

**A 500 is never "working as designed".** Even for invalid input, the correct response is a 4xx
with a helpful message. A 500 means nobody handled the case — log it every time, with the
request ID.

---

## 4. Headers that matter

### Request headers

| Header | Purpose | Testing angle |
|---|---|---|
| `Host` | Which site on a shared server | |
| `Authorization` | Credentials (Day 18) | Remove it, corrupt it, expire it — what happens? |
| `Content-Type` | Format of the body being sent | Send the wrong one → expect 415, not 500 |
| `Accept` | Formats the client will take | Ask for XML from a JSON-only API |
| `Cookie` | Cookies going back to the server | |
| `User-Agent` | Client identification | Some apps behave differently per browser — spoof it and see |
| `Referer` | The previous page | Sometimes used (badly) for security. Check for data leaking in it |
| `Accept-Language` | Preferred language | Localisation testing starts here |
| `If-None-Match` / `If-Modified-Since` | Conditional requests | Produce the 304s |
| `X-Forwarded-For` | Original client IP through a proxy | Relevant to rate limiting and geo rules |

### Response headers

| Header | Purpose | Testing angle |
|---|---|---|
| `Content-Type` | Format of the body | `text/html` where JSON is expected breaks clients |
| `Set-Cookie` | Sets a cookie | **Check the flags** — see below |
| `Cache-Control` | Caching rules | `no-store` on anything sensitive; wrong caching = users seeing each other's data |
| `Location` | Where to go (3xx) or what was created (201) | |
| `Strict-Transport-Security` | Force HTTPS | Should be present on production |
| `Content-Security-Policy` | Restricts what the page may load | Blocks XSS |
| `X-Content-Type-Options: nosniff` | Stops MIME sniffing | |
| `Access-Control-Allow-Origin` | CORS permission | See below |
| `Retry-After` | When to retry (429/503) | |
| `X-Request-Id` | Trace identifier | **Put it in your bug reports** |

**Security headers to check on production** — their absence is a legitimate, loggable finding:
`Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`,
`X-Frame-Options` (or CSP `frame-ancestors`), `Referrer-Policy`.

### Cookies and sessions

HTTP is stateless, so the server issues a cookie and the browser sends it back on every request.

```http
Set-Cookie: session_id=a1b2c3d4; Path=/; Max-Age=1800; Secure; HttpOnly; SameSite=Lax
```

| Flag | Meaning | Why a tester checks it |
|---|---|---|
| `Secure` | Only sent over HTTPS | Without it, the session can be stolen on an insecure network |
| `HttpOnly` | JavaScript cannot read it | Without it, an XSS bug becomes full account takeover |
| `SameSite=Lax/Strict` | Not sent on cross-site requests | Protects against CSRF |
| `Max-Age` / `Expires` | Lifetime | Session-expiry testing |
| `Domain` / `Path` | Scope | Too-broad scope leaks cookies to subdomains |

**Session tests worth running every time:** log in, wait for the timeout, then act — is the
message clear and is unsaved work preserved? Log out in one tab while active in another. Log in
on two devices. Check the session cookie is *rotated* on login (otherwise: session fixation).
Confirm logout actually invalidates the session **server-side** — copy the cookie, log out, and
replay a request with the old cookie. If it still works, that's a critical security defect.

### CORS, in one box

Browsers block a page on `app.example.com` from calling `api.other.com` unless the API
explicitly allows it via `Access-Control-Allow-Origin`. For anything beyond a simple request the
browser first sends an `OPTIONS` **preflight**.

**How it shows up:** the request works in Postman and `curl` but fails in the browser with a CORS
error in the console. That's not the API being down — it's the API not permitting that origin.
Knowing this stops you from filing "the API is broken" when the fix is one header. Conversely,
`Access-Control-Allow-Origin: *` on an authenticated API is a security finding.

---

## Live activity (6 minutes)

**Read raw traffic.** In a terminal:

```bash
curl -v https://httpbin.org/get
```

Walk through the output together: DNS resolution, the TCP connect, the TLS handshake and
certificate, the `>` request lines, the `<` response lines, then the body.

Then, quickly:

```bash
curl -i -X POST https://httpbin.org/post -H "Content-Type: application/json" -d '{"a":1}'
curl -i -X DELETE https://httpbin.org/delete
curl -i https://httpbin.org/status/404
curl -i https://httpbin.org/status/500
curl -i https://httpbin.org/redirect/3        # then add -L to follow
```

Ask after each: what was the status, and **whose problem would that be** in a real system?

---

## Common mistakes juniors make

- Reporting "the API returned an error" without the status code. 401, 429 and 500 are three
  different bugs owned by three different people.
- Treating a 200 as a pass without reading the body.
- Not noticing that a "success" was actually a 202 and the work failed later, silently.
- Missing that a `GET` changes state.
- Ignoring cookie flags because "it works".

---

## Homework (about 40 minutes)

1. **Status code drill.** Write the correct status code for each: a successful login; a login
   with the wrong password; requesting another user's order; creating an order successfully;
   requesting a deleted order; sending `{"qty": "two"}` where a number is required; the database
   being down; the 200th request in a minute against a 100/min limit.
2. **Safe/idempotent table** from memory for GET, POST, PUT, PATCH, DELETE — then, for your own
   product or any app you use, name one test each for the safety and idempotence properties.
3. **Cookie inspection.** On three sites, open DevTools → Application → Cookies and record which
   session cookies have `Secure`, `HttpOnly` and `SameSite`. Note any that don't.
4. Run the `curl` commands from the activity again and save the outputs.

---

## Check your understanding

<details>
<summary>1. What is the difference between 401 and 403, and why does it matter operationally?</summary>

**401 Unauthorized** actually means *unauthenticated* — the server does not know who you are
because credentials are missing, malformed or expired. **403 Forbidden** means the server knows
exactly who you are and is refusing anyway — wrong role, insufficient permission, or a firewall
rule. It matters because they route to different fixes: 401 points at the login/token/session
mechanism, 403 points at the permission model (or a WAF). Getting 401 midway through a working
session is a token-expiry defect; getting 403 on a feature the user should have is an
authorisation defect.
</details>

<details>
<summary>2. Why is it a defect if a GET request changes data?</summary>

Because GET is defined as **safe**, and the whole ecosystem relies on that: browsers prefetch
links, crawlers and search engines follow them, chat apps and email clients fetch link previews,
proxies and CDNs cache them, and users refresh and share URLs freely. A state-changing GET means
any of those can silently perform the action — cancelling an order, deleting a record,
triggering a payment — without a human ever clicking. It is also unprotected by CSRF defences
that assume state changes use POST.
</details>

<details>
<summary>3. You POST the same order twice within a second and get two orders and two charges. Is this a bug, and what's the correct fix?</summary>

Yes. POST is legitimately non-idempotent, so the *protocol* is behaving correctly — but the
*product* must not charge a customer twice because they double-clicked or their network retried.
The correct fix is an **idempotency key**: the client generates a unique value per logical
operation and sends it with the request; the server records it and returns the original result
for any repeat. Disabling the button in the UI is not a fix, because the API is still reachable
directly and mobile clients retry on flaky networks.
</details>

<details>
<summary>4. A request works in Postman but fails in the browser with a CORS error. Is the API down?</summary>

No. CORS is a browser-enforced policy, not a server outage — Postman and curl ignore it
entirely, which is why they succeed. The API is not sending an `Access-Control-Allow-Origin`
header permitting the calling page's origin (or is rejecting the `OPTIONS` preflight). Report it
as a configuration defect against the API with the failing origin, the preflight response, and
the console error — and don't report the API as unavailable.
</details>

<details>
<summary>5. Why should you copy X-Request-Id into your bug reports?</summary>

It uniquely identifies that one request in the server's logs, across every service it touched.
A developer can search for it and land on the exact stack trace, timings and downstream calls
in seconds, instead of guessing from a timestamp among thousands of concurrent requests. It
turns "it failed around 2:30pm" into a precise pointer, and it is the difference between a bug
diagnosed today and one that sits in the backlog awaiting reproduction.
</details>

---

## Glossary additions

`HTTP` · `stateless` · `request line` · `status line` · `method` · `GET` · `POST` · `PUT` ·
`PATCH` · `DELETE` · `HEAD` · `OPTIONS` · `safe method` · `idempotent` · `idempotency key` ·
`status code` · `2xx` · `3xx` · `4xx` · `5xx` · `401` · `403` · `429` · `500` · `502` · `504` ·
`header` · `Content-Type` · `Authorization` · `Cache-Control` · `cookie` · `Secure` ·
`HttpOnly` · `SameSite` · `session fixation` · `CORS` · `preflight` · `X-Request-Id`
