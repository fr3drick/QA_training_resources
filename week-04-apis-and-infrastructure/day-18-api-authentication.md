# Day 18 — API Authentication and Authorization

> **Week 4 · Day 18 · 60 minutes**
> Prerequisites: Days 16–17

---

## At a glance

By the end of this session you should be able to:

1. Distinguish **authentication**, **authorization** and **accounting**.
2. Describe every common auth type: Basic, API key, Bearer/JWT, OAuth 2.0, session cookies,
   HMAC signatures, mTLS — and how to test each.
3. Read a JWT and know what to check in it.
4. Explain the OAuth 2.0 flows well enough to test one.
5. Write the standard auth test suite that applies to every protected endpoint.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the transfers test cases |
| 0:05 – 0:12 | AuthN vs AuthZ |
| 0:12 – 0:32 | The auth types, one by one |
| 0:32 – 0:42 | JWT in detail |
| 0:42 – 0:50 | OAuth 2.0 flows |
| 0:50 – 0:57 | **Activity:** decode a JWT and attack it |
| 0:57 – 1:00 | Homework |

---

## 1. Authentication vs authorization

| | **Authentication (AuthN)** | **Authorization (AuthZ)** |
|---|---|---|
| Question | *Who are you?* | *What are you allowed to do?* |
| Proof | Password, token, certificate, biometric | Roles, permissions, scopes, ownership |
| Failure | **401 Unauthorized** | **403 Forbidden** |
| Analogy | Showing ID at the building entrance | Your badge opens the 3rd floor but not the server room |

**Accounting/auditing** is the third A: recording who did what, and when. Testers should check
that security-relevant actions (login, failed login, permission change, data export, deletion)
are logged — and that the log doesn't contain the password.

**The single most important idea in this session:** authentication is usually implemented once
and works. **Authorization is implemented per endpoint, per field, and is therefore forgotten
somewhere.** That is where the serious bugs are, and where you should spend your testing time.

---

## 2. The authentication types

### a) HTTP Basic Authentication

Username and password, base64-encoded, in a header, on **every** request.

```http
Authorization: Basic cWFAZXhhbXBsZS5jb206UGFzczEyMyE=
```

```bash
curl -u qa@example.com:Pass123! https://api.example.com/v2/orders
```

**Base64 is encoding, not encryption** — anyone can decode it instantly:

```bash
echo 'cWFAZXhhbXBsZS5jb206UGFzczEyMyE=' | base64 -d
```

**Use:** internal tools, quick integrations, legacy systems.
**Testing:** credentials must never travel over plain HTTP (that's a critical finding); check
they aren't logged or cached; check lockout after repeated failures; confirm nothing puts the
header into a URL or an error message.

### b) API keys

A long opaque string identifying the *calling application* (not usually a user).

```http
X-API-Key: sk_live_a1b2c3d4e5f6g7h8i9j0
```

Sometimes passed as a query parameter — `?api_key=…` — which is **a defect worth logging**,
because query strings land in logs, browser history and `Referer` headers (Day 11).

**Testing:** no key → 401. Invalid key → 401. **Revoked key → 401** (test that revocation
actually takes effect immediately, not after a cache expiry). A key from a different
environment or tenant → rejected. Check whether the key is scoped (read-only vs read-write) and
whether that scope is enforced. Check rate limiting is per key. Check keys aren't committed to
the repository or exposed in frontend JavaScript — an API key visible in browser source is a
real, common, reportable finding.

### c) Bearer tokens (usually JWT)

The most common modern pattern. You log in once, receive a token, and send it on every request.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MTAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

"Bearer" means exactly what it says: **whoever holds the token can use it.** There is no further
proof of identity. That is why token leakage is so serious, and why expiry matters.

### d) Session cookies

The classic web pattern. Login creates a server-side session; the browser holds a session ID
cookie and sends it automatically.

```http
Set-Cookie: session_id=a1b2c3; Secure; HttpOnly; SameSite=Lax; Max-Age=1800
```

**Tokens vs sessions, the trade-off you should be able to state:** sessions are stored
server-side so they can be **revoked instantly** (logout genuinely works), but they require
shared session storage across servers. JWTs are stateless and scale easily, but **cannot be
revoked before they expire** unless you add a denylist — so "log out everywhere" is a feature
that has to be built deliberately. Test it: log in, copy the token, log out, replay a request
with the old token. If it still works, find out whether that is a known design trade-off or an
oversight — either way, document it.

### e) OAuth 2.0 / OpenID Connect

Delegated authorization — "Sign in with Google". Covered in §4.

### f) HMAC request signing

Used where the request itself must be proven unaltered — payment gateways, webhooks, banking.
The client signs the request (method + path + body + timestamp) with a shared secret; the server
recomputes the signature and compares.

```http
X-Signature: sha256=8f3d2b1a...
X-Timestamp: 1710000000
```

**Testing:** alter one byte of the body and confirm the request is rejected. Replay an old but
validly signed request — is there a timestamp window preventing **replay attacks**? Is the
timestamp window sensible (5 minutes, not 24 hours)? Is the signature checked *before* the
payload is processed? **This is how you test incoming webhooks** — an unsigned or unverified
webhook endpoint lets anyone tell your system that a payment succeeded.

### g) Mutual TLS (mTLS)

Both sides present certificates. The client proves its identity with a certificate, not a
password. Used in banking, healthcare and service-to-service traffic.

**Testing:** no client certificate → rejected. Expired certificate → rejected. Certificate from
the wrong CA → rejected. And know the operational risk: **certificate expiry causes outages**,
so check expiry dates as part of environment health.

### Summary table

| Type | Sent as | Identifies | Revocable? | Common use |
|---|---|---|---|---|
| Basic | `Authorization: Basic <b64>` | User | Change password | Internal, legacy |
| API key | Header (or query — bad) | Application | Yes | Public/partner APIs |
| Bearer / JWT | `Authorization: Bearer <token>` | User + claims | Only via denylist | Modern web & mobile |
| Session cookie | `Cookie:` (automatic) | User | **Yes, instantly** | Traditional web apps |
| OAuth 2.0 | Bearer access token | User, via a provider | Yes (refresh token revocation) | Third-party access |
| HMAC | Signature header | Application + integrity | Rotate the secret | Payments, webhooks |
| mTLS | TLS client certificate | Machine/service | Revoke the cert | Bank & service-to-service |

---

## 3. JWT in detail

A JWT is three base64url-encoded parts joined by dots: **header.payload.signature**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  .  eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MTAwMDAwMDB9  .  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
        header                                        payload                                              signature
```

**Header** — the algorithm:
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** — the claims:
```json
{
  "sub": "1",                       // subject: the user ID
  "role": "user",                   // custom claim
  "scope": "orders:read orders:write",
  "iss": "https://auth.example.com", // issuer
  "aud": "api.example.com",          // audience
  "iat": 1709996400,                 // issued at
  "exp": 1710000000                  // expires at  (Unix epoch seconds)
}
```

**Signature** — proves the token wasn't altered, computed with a secret the server holds.

### The one thing every tester must internalise

> **The payload is only encoded, not encrypted. Anyone holding the token can read it.**

Paste one into `jwt.io`, or decode it yourself:

```bash
echo 'eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MTAwMDAwMDB9' | base64 -d
```

So: **a JWT containing personal data, a password hash, an internal API key, or a full card
number is a data-exposure defect** — the token is stored in browsers, sent to logs, and often
pasted into support tickets. Check what's in every token your product issues. This is a
five-minute check that finds real problems.

### The JWT test suite

| Test | Expected |
|---|---|
| No token | 401 |
| Malformed token (`abc.def.ghi`) | 401, not 500 |
| **Expired token** (`exp` in the past) | 401 |
| **Modified payload**, original signature — e.g. change `"role":"user"` to `"role":"admin"` | 401. If it's accepted, the signature is not being verified: **critical** |
| **`"alg":"none"`** with the signature removed | 401. If accepted, that's the classic JWT vulnerability: **critical** |
| Token signed with the wrong key | 401 |
| Token from another environment (QA token on staging) | 401 — check `iss`/`aud` are validated |
| Token for user A used to fetch user B's data | 403/404 (this is the BOLA test again) |
| Token after logout | Should be rejected if a denylist exists; otherwise document the window |
| Very long expiry (`exp` a year out) | A design finding — access tokens should be short-lived (minutes to hours) |
| Token in a URL query string | A defect — it will be logged |

The "modified payload" and `alg: none` tests take two minutes each and are worth doing on every
product you ever test.

### Access tokens and refresh tokens

- **Access token** — short-lived (5–60 minutes), sent on every request.
- **Refresh token** — long-lived, stored securely, used only to obtain a new access token.

**Test:** does the app refresh silently when the access token expires mid-session, or does the
user get dumped to the login screen and lose their work? Is the refresh token rotated on use
(so a stolen one can only be used once)? Does logout invalidate the refresh token?

---

## 4. OAuth 2.0, enough to test it

**The problem it solves:** letting an application act on your behalf on another service, without
giving it your password.

**The four roles:**
- **Resource owner** — you.
- **Client** — the app requesting access.
- **Authorization server** — issues the tokens (Google, Auth0, your identity provider).
- **Resource server** — the API holding the data.

**Authorization Code flow with PKCE** — the correct flow for web and mobile apps today:

```
1. App redirects you to the authorization server, with a code_challenge
2. You log in and consent to the requested scopes
3. Auth server redirects back to the app with a one-time authorization CODE
4. App exchanges the code (+ code_verifier) for an access token, server-to-server
5. App calls the API with the access token
```

**Other flows and their status:**

| Flow | Use | Status |
|---|---|---|
| Authorization Code + PKCE | Web and mobile apps | ✅ The current standard |
| Client Credentials | Machine-to-machine, no user | ✅ Correct for service-to-service |
| Device Code | TVs, CLI tools, devices with no browser | ✅ |
| Implicit | Legacy single-page apps | ❌ Deprecated — token exposed in the URL |
| Resource Owner Password Credentials | Legacy | ❌ Deprecated — the app handles the password |

**OpenID Connect (OIDC)** is a thin layer on top of OAuth 2.0 that adds an **ID token**
(a JWT describing *who* the user is). Rule of thumb: **OAuth = authorization; OIDC =
authentication.** People constantly use "OAuth login" to mean OIDC.

**What to test in an OAuth flow:**
- [ ] Reuse an authorization code twice → must be rejected (codes are single-use)
- [ ] Use an expired code → rejected
- [ ] Tamper with the `redirect_uri` → rejected; only exact registered URIs allowed
      (an open redirect here is how tokens get stolen)
- [ ] Tamper with the `state` parameter, or omit it → rejected (CSRF protection)
- [ ] Request a **scope you shouldn't have** → denied, and check the API actually enforces the
      granted scopes rather than just recording them
- [ ] Deny consent → the app handles it gracefully rather than erroring
- [ ] Revoke access at the provider → the app loses access promptly
- [ ] The token never appears in a URL, a log, or the page source

---

## 5. The standard auth test suite

Run this against **every protected endpoint**. Make it a checklist in your collection.

```
1.  No credentials                          → 401
2.  Malformed credentials                   → 401 (never 500)
3.  Expired credentials                     → 401
4.  Tampered token / signature              → 401
5.  Valid credentials, correct role         → 200
6.  Valid credentials, insufficient role    → 403
7.  Valid credentials, another user's ID    → 403 or 404  ← BOLA
8.  Valid credentials, another tenant's data→ 403 or 404  ← multi-tenancy leak
9.  Read-only credentials, write operation  → 403
10. Credentials after logout                → 401
11. Credentials after password change       → 401 (sessions should be invalidated)
12. Credentials after the user is deactivated → 401
13. Repeated failed logins                  → lockout / rate limit / 429
14. Auth data in URL, logs, or page source  → must be absent
15. Error messages don't reveal whether the account exists → same message for
    "wrong password" and "no such user"
```

**Items 7 and 8 find the most serious bugs.** They take a minute each. Do them on every endpoint
that accepts an identifier.

**On item 15 — user enumeration:** "No account with that email" tells an attacker which
addresses are registered, which is useful for credential stuffing and phishing. The generic
"Invalid email or password" is correct. It's a small finding, but it's the kind that shows you
understand security beyond a checklist. Note that the same leak can appear through *timing* or
through the registration and password-reset flows even when the login message is generic.

---

## Live activity (7 minutes)

**Decode and attack a JWT.**

1. Go to `jwt.io` (or decode by hand with `base64 -d`) and paste this token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkVmZSBJcnVib3IiLCJyb2xlIjoidXNlciIsImVtYWlsIjoiZWZlQGV4YW1wbGUuY29tIiwiZXhwIjoxNzEwMDAwMDAwfQ.abc123signature
```

2. As a group, answer:
   - What is the user's ID, name, role and email?
   - When does it expire? Convert the epoch timestamp — is it in the past?
   - **What personal data is exposed to anyone who obtains this token?**
   - What would you change if you wanted to become an admin?
   - Why does changing it not (normally) work — and what would it mean if it did?

3. Then, in Postman against any API you have: take a valid token, change one character in the
   middle of the payload, and send it. Confirm you get a 401 and not a 500 or a 200.

<details>
<summary>Facilitator notes</summary>

The payload decodes to `{"sub":"1","name":"Efe Irubor","role":"user","email":"efe@example.com","exp":1710000000}`.
Draw out: the **name and email are readable by anyone holding the token**, which matters because
tokens end up in browser storage, server logs, analytics, and support tickets. Ask whether their
own product's tokens carry personal data — most interns have never looked.

Changing `role` to `admin` invalidates the signature, so a correctly implemented server returns
401. If it returns 200, the server is not verifying the signature — a critical vulnerability that
grants anyone full admin access. The `alg: none` variant is the same class of bug. Emphasise that
these are two-minute tests with enormous payoff.
</details>

---

## Common mistakes juniors make

- Testing only that login works, and never testing what happens with a bad or expired token.
- Never testing another user's ID — and so missing the most severe API defect class.
- Assuming a 403 in the UI means the API also enforces it. It very often doesn't.
- Pasting real tokens into bug reports, chat, or screenshots. Redact them; a bearer token is a password.
- Not testing session expiry because it's slow. Get a short-lived token from the developers, or
  change the account's expiry in the database (Day 15).

---

## Homework (about 45 minutes)

1. **Extend yesterday's Postman collection** with authentication: a login request that captures
   the token into an environment variable, and every subsequent request using `{{token}}`.
2. **Run the 15-point auth suite** against any API you have access to (or `reqres.in`, which will
   only support some of it). Record the actual result for each and note which are defects.
3. **Decode a real token** from an application you use — DevTools → Application → Local Storage
   or Cookies. What claims does it carry? Does it contain personal data? When does it expire?
   Write three sentences on what you found. (Don't share the token itself.)
4. **Write the auth section** of a test plan for the `/v2/transfers` endpoint from yesterday:
   which of the 15 checks apply, and what would each failure mean commercially?

---

## Check your understanding

<details>
<summary>1. What is the difference between 401 and 403 in terms of authentication and authorization?</summary>

401 is an **authentication** failure — the server cannot establish who you are, because
credentials are absent, malformed or expired. 403 is an **authorization** failure — identity is
established, and that identity is not permitted to perform this action on this resource. In
testing terms, a wrong-password test should yield 401, and a valid-login-wrong-role test should
yield 403. Getting 401 where you expect 403 (or vice versa) is itself a minor defect, and 200
where you expect either is a serious one.
</details>

<details>
<summary>2. Why is a JWT containing a user's full name and email a finding?</summary>

Because the payload is base64-encoded, not encrypted — anyone who obtains the token can read it
in seconds with no key. Tokens are stored in browser local storage, sent in headers that land in
server and proxy logs, included in HAR files attached to bug tickets, and pasted into support
conversations. Every one of those becomes a personal-data exposure. Tokens should carry the
minimum needed for authorization decisions — typically an opaque user ID, roles/scopes, and
expiry — and nothing identifying.
</details>

<details>
<summary>3. You change "role":"user" to "role":"admin" in a token, resend it, and get 200 with admin data. What have you found?</summary>

A critical authentication vulnerability: the server is not verifying the token signature, so any
user can grant themselves any role by editing their own token. This is complete authentication
bypass and privilege escalation. Stop testing further, report it immediately through the
security-sensitive channel rather than the ordinary bug queue, include the minimum reproduction
(the modified claim and the 200 response) with data redacted, and do not share the working token.
</details>

<details>
<summary>4. Why can't a JWT be revoked, and what does that mean for logout?</summary>

Because JWTs are stateless: the server validates them by checking the signature and expiry
alone, with no lookup against stored state, which is exactly what makes them scale. So a token
remains valid until `exp` even after the user logs out, changes their password, or is
deactivated. Teams that need instant revocation add a denylist, keep access-token lifetimes very
short (minutes) with rotating refresh tokens, or use server-side sessions instead. As a tester:
find out which approach your product uses, then verify it — replay a token after logout and
after a password change, and report the window if it's longer than intended.
</details>

<details>
<summary>5. Why should "no account with that email" not be shown at login?</summary>

It confirms to anyone who asks whether a given email address has an account — user enumeration.
That feeds credential stuffing (attackers focus only on addresses known to exist), targeted
phishing, and privacy harm (revealing that someone uses a particular service). The correct
behaviour is an identical message and comparable response time for both wrong-password and
no-such-user. Check the registration and password-reset flows too, since the same information
commonly leaks there even when login is done correctly.
</details>

---

## Glossary additions

`authentication` · `authorization` · `AuthN` · `AuthZ` · `Basic auth` · `base64` · `API key` ·
`bearer token` · `JWT` · `claim` · `exp` · `signature` · `alg:none` · `session cookie` ·
`access token` · `refresh token` · `token rotation` · `denylist` · `OAuth 2.0` ·
`authorization code flow` · `PKCE` · `scope` · `consent` · `state parameter` · `OpenID Connect` ·
`ID token` · `HMAC` · `replay attack` · `webhook` · `mTLS` · `privilege escalation` ·
`user enumeration` · `credential stuffing` · `multi-tenancy`
