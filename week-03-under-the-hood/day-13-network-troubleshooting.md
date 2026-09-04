# Day 13 — Network Troubleshooting for QA

> **Week 3 · Day 13 · 60 minutes**
> Prerequisites: Days 11–12

---

## At a glance

By the end of this session you should be able to:

1. Run `ping`, `traceroute`, `nslookup`/`dig`, `curl`, `telnet`/`nc` and read the output.
2. Use browser DevTools' Network tab as a diagnostic instrument, not a curiosity.
3. Capture and share a **HAR file** safely.
4. Follow a repeatable triage sequence to decide **whether a failure is even a product bug**.
5. Write a network-related bug report that a backend engineer respects.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the port quiz |
| 0:05 – 0:22 | The command-line toolkit, with live demos |
| 0:22 – 0:36 | DevTools Network tab in depth |
| 0:36 – 0:44 | The triage ladder |
| 0:44 – 0:56 | **Activity:** diagnose four broken things |
| 0:56 – 1:00 | Homework |

---

## 1. The command-line toolkit

Everything here runs on macOS/Linux terminals and Windows PowerShell (with the noted variations).
Type them along with the session.

### `ping` — is the host reachable, and how far away is it?

```bash
ping -c 4 google.com
```

```
PING google.com (142.250.200.46): 56 data bytes
64 bytes from 142.250.200.46: icmp_seq=0 ttl=116 time=14.2 ms
64 bytes from 142.250.200.46: icmp_seq=1 ttl=116 time=13.9 ms
--- google.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 13.9/14.4/15.1/0.4 ms
```

**How to read it:**
- **It resolved the name** → DNS works. That's two checks in one command.
- **`time=14.2 ms`** → latency. Under 50ms is good; over 300ms will feel sluggish in the UI.
- **`0.0% packet loss`** → the path is stable. Any loss above 0% is worth reporting.
- **"Request timeout"** → no reply. This does *not* prove the host is down: many servers and
  cloud load balancers block ICMP by design. Never conclude "the server is down" from ping alone.

Windows: `ping google.com` (sends 4 by default; use `-t` for continuous).

### `traceroute` / `tracert` — where does it stop?

```bash
traceroute api.example.com      # macOS/Linux
tracert api.example.com         # Windows
```

Lists every router (hop) between you and the destination, with the time at each. Useful when
something is slow or unreachable: if latency jumps from 20ms to 300ms at hop 6, or the trace
stops entirely at hop 4, that's where to point. `* * *` at a hop is often just a router that
doesn't reply — only meaningful if it continues to the end.

### `nslookup` / `dig` — what does this name resolve to?

```bash
nslookup api.example.com
dig api.example.com            # richer output, macOS/Linux
dig api.example.com +short     # just the answer
dig @8.8.8.8 api.example.com   # ask Google's resolver instead of yours
```

**Uses for a tester:**
- Confirm a QA hostname resolves at all.
- Compare what *you* resolve versus a colleague — different answers explain "works for me".
- Check whether a deployment's DNS change has propagated (`dig @8.8.8.8` vs your local resolver).
- See if a hostname is a `CNAME` pointing at a cloud load balancer.

### `curl` — make a request without a browser

The single most useful command in this list. It removes the browser, the cache, the cookies and
the JavaScript from the equation.

```bash
curl -I https://example.com                  # headers only (HEAD request)
curl -v https://example.com                  # verbose: DNS, TLS, headers, everything
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://example.com   # status + timing
curl -X POST https://api.example.com/orders \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"sku":"BK-1099","qty":2}'
```

**Why it's a superpower for a tester:** if `curl` works and the browser doesn't, the problem is
in the browser — cache, cookies, an extension, JavaScript. If `curl` fails too, the problem is
server-side, and you've just eliminated an entire class of false leads before logging anything.

**Windows note:** in PowerShell `curl` is an alias for `Invoke-WebRequest`, which takes different
arguments. Use `curl.exe` explicitly to get real curl (it ships with Windows 10+).

### `telnet` / `nc` — is that port actually open?

```bash
nc -zv api.example.com 443        # macOS/Linux
telnet api.example.com 443        # anywhere telnet client is installed
Test-NetConnection api.example.com -Port 443   # PowerShell
```

Three possible outcomes, each meaning something different:

| Result | Meaning |
|---|---|
| `Connection to ... succeeded` | The port is open and something is listening |
| `Connection refused` | You reached the host; **nothing is listening** on that port |
| Hangs, then times out | A firewall is dropping the traffic, or the host is unreachable |

This is the fastest way to distinguish "the service is down" from "the network is blocked" —
which is exactly the distinction that decides whether you log a bug or call IT.

### A few more worth knowing

```bash
ifconfig       # or `ip addr` on Linux, `ipconfig` on Windows — your own IP
netstat -tuln  # or `ss -tuln` on Linux — what's listening on this machine
lsof -i :8080  # macOS/Linux — which process is using port 8080
ipconfig /flushdns          # Windows: clear the DNS cache
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder   # macOS
```

`ipconfig /flushdns` is genuinely useful the day after a deployment changes an IP.

---

## 2. DevTools Network tab, properly

Open with **F12** (or Cmd+Opt+I on Mac) → **Network**. Set it up once:

- ☑ **Preserve log** — survives page navigations and redirects. Without it, you lose the
  evidence the instant the page reloads.
- ☑ **Disable cache** (while DevTools is open) — forces fresh requests.
- **Throttling** dropdown — simulate Slow 3G or Offline. This is a *testing technique*, not just
  a debugging aid.

### The columns, and what each tells you

| Column | What to look for |
|---|---|
| **Name** | The resource. Click for full detail |
| **Status** | 200 fine · 3xx redirect · 4xx client error · 5xx server error · `(failed)` · `(canceled)` |
| **Type** | `document`, `xhr`/`fetch` (the API calls — usually what you care about), `script`, `stylesheet`, `img` |
| **Initiator** | What triggered it — traces a mystery request back to its source |
| **Size** | Transferred size, or "(disk cache)" / "(memory cache)" — proof it was cached |
| **Time** | Total duration. Sort by it to find the slow one |
| **Waterfall** | Where the time went — DNS, connecting, TLS, **waiting (TTFB)**, downloading |

**TTFB (Time To First Byte)** is the "Waiting" segment: how long the server took to think. A
long TTFB is a **backend** problem (slow query, slow dependency). A long download with a short
TTFB is a **size or bandwidth** problem. Being able to say which one changes who fixes it.

### The per-request panels

- **Headers** — request method and URL, status, `Remote Address` (the actual IP:port),
  request headers (including `Authorization`, `Cookie`, `Content-Type`) and response headers
  (including `Set-Cookie`, `Cache-Control`, `Content-Type`).
- **Payload / Request** — exactly what was sent. Essential for API bugs.
- **Preview / Response** — the response body, formatted. Where you find the real error message
  that the UI reduced to "Something went wrong".
- **Timing** — the waterfall breakdown for that one request.

### Two habits worth forming today

1. **When the UI shows a generic error, open the Network tab and read the real response.**
   The UI says "Something went wrong"; the response body says
   `{"error":"validation_failed","field":"phone","message":"must be E.164 format"}`. Put *that*
   in the bug report.
2. **Right-click a request → Copy → Copy as cURL.** You now have a runnable command that
   reproduces the exact request, headers and all. Paste it in the bug report (after redacting
   tokens) and the developer can reproduce it in one second. This is the highest
   effort-to-credibility ratio move in this entire course.

### HAR files

**Network tab → right-click → "Save all as HAR with content"** produces a single file containing
every request and response of the session. Attach it to bug reports for anything data-related.

⚠️ **A HAR contains everything** — auth tokens, cookies, session IDs, and any personal data in
requests or responses. Before attaching one: use a test account only, and redact or scrub the
`Authorization` and `Cookie` values. Treat a HAR like a password.

---

## 3. The triage ladder

When something fails, work through this in order. Stop at the first "no" — that's your answer.

```
1. Can I reproduce it?                     → No: note the frequency, gather more, don't discard
2. Is it just me?                          → Ask a colleague. Try incognito, another browser,
                                             another network (phone hotspot), another account
3. Am I on the right environment & build?  → Check the URL and the build/version number
4. Is the environment even up?             → ping / nc / open the health endpoint
5. Does DNS resolve correctly?             → nslookup; compare with a colleague
6. Is it a browser-side problem?           → Hard refresh (Ctrl+Shift+R), clear cache,
                                             incognito, disable extensions, try curl
7. What does the Network tab say?          → Which request failed, what status, what body?
8. Is it a 4xx or a 5xx?                   → 4xx: our request is wrong (or auth/permissions)
                                             5xx: the server broke — get the logs
9. What do the server logs say?            → Search by timestamp or correlation ID
10. Is it a regression?                    → Does it happen on the previous build / production?
```

**Steps 1–6 are what separates a bug report from a wasted afternoon.** Half of the "bugs" a
junior tester logs are answered somewhere in steps 2–6: wrong environment, stale cache, expired
session, VPN off, old build.

### Reading status codes as a signal of ownership

| Range | Meaning | Usually whose problem |
|---|---|---|
| **2xx** | Success | — |
| **3xx** | Redirect | Check the redirect chain; loops are a real bug |
| **4xx** | The **client** sent something wrong | The frontend, the API contract, permissions, or your test data |
| **5xx** | The **server** failed | The backend team. Always get the logs |

Day 16 goes through the individual codes.

---

## 4. Writing the network bug report

Bad:
> The page doesn't load sometimes.

Good:
```
Title: Orders page: /api/v2/orders returns 504 Gateway Timeout for accounts with >500 orders

Steps to reproduce:
  1. Log in as qa.efe+bulk01@example.com (this account has 1,240 orders)
  2. Navigate to https://qa2.example.com/orders
  3. Observe the page renders the header and an infinite loading spinner   ← FAILS HERE

Expected: the orders list renders within 2 seconds (NFR-12)
Actual:   the request to GET /api/v2/orders?page=1&limit=50 hangs for 60s
          and returns 504 Gateway Timeout. The UI shows a spinner indefinitely
          with no error message shown to the user (a second defect — logged as PAY-4418).

Network evidence:
  Request:  GET https://api.qa2.example.com/v2/orders?page=1&limit=50
  Remote:   10.0.4.12:443
  Status:   504 Gateway Timeout
  TTFB:     60.01s  (the nginx proxy_read_timeout is 60s)
  Repro as cURL (token redacted):
    curl -v 'https://api.qa2.example.com/v2/orders?page=1&limit=50' \
      -H 'Authorization: Bearer <REDACTED>'

Scope:
  - Accounts with <100 orders: responds in 240ms  ✓
  - Account with 1,240 orders: 504 every time (5/5)
  - Also reproduces on staging (4.3.0). NOT on production (4.2.9) → regression in 4.3.0
  - Suspected: the orders query has no index on the new customer_id column, or is
    fetching all rows before paginating.

Attachments: orders-504.har (scrubbed), screenshot, app log extract 14:32:10–14:33:20
Severity: Critical (page unusable for high-volume customers — ~6% of accounts)
Priority: P1 (proposed)
```

Notice what makes it strong: **the numbers**, **the scope experiment** (small account vs large
account), **the regression check**, and **a reproducible cURL command**. You have not diagnosed
the code — you have narrowed it so precisely that the developer's first hour is already done.

---

## Live activity (12 minutes)

**Diagnose four broken things.** For each symptom the group names (a) the most likely cause,
(b) the exact command or DevTools step to confirm it, (c) whether it is a product bug.

1. "The QA site loads at the office but not from home."
2. "The dashboard shows all zeros. No error message anywhere on screen."
3. "One of our five API endpoints returns 404, but only in staging."
4. "The site takes 12 seconds to load, but only the first time each morning."

<details>
<summary>Facilitator answer key</summary>

1. **Cause:** the environment is on a private IP and needs the VPN; or an IP allowlist on the
   firewall. **Confirm:** `nslookup` the hostname — a `10.x` or `192.168.x` answer proves it's
   private; then `nc -zv host 443` on and off the VPN. **Bug?** No — it's an access/config issue,
   unless the environment is *supposed* to be publicly reachable.

2. **Cause:** the page rendered but the data API call failed — expired token (401), permission
   (403), or a server error (500). **Confirm:** DevTools → Network → filter Fetch/XHR → find the
   red request and read the response body. **Bug?** Two bugs, probably: whatever caused the
   failure, *and* the UI showing zeros instead of an error — silently displaying wrong data is
   worse than showing an error.

3. **Cause:** the route isn't deployed on staging (partial or failed deployment), a
   configuration difference, or the API gateway routing rule is missing. **Confirm:** `curl -I`
   the endpoint on both environments; compare the build/version endpoints; check whether the
   404 body comes from the app or from the gateway (they look different). **Bug?** Yes — either
   a deployment defect or an environment-parity defect; both are worth logging.

4. **Cause:** cold start / cache warming — the first request after an idle period pays for
   container start-up, JIT compilation, empty caches, or a database connection pool being
   established. **Confirm:** curl with timing twice in a row (`-w "%{time_total}"`); compare
   TTFB in DevTools on the first vs second load. **Bug?** Yes, if real users hit it — the first
   customer each morning gets a 12-second page. Log it with the measurement; the fix is usually
   a keep-warm request or a smaller cold-start footprint.
</details>

---

## Common mistakes juniors make

- Concluding "the server is down" from a `ping` timeout. Many hosts block ICMP.
- Reporting "the page is broken" when the Network tab already contains the exact error message.
- Attaching a HAR file containing a real session token.
- Skipping the "is it just me?" check and logging a bug caused by their own stale cache.
- Not checking the build number and reporting a bug that was fixed two builds ago.
- Testing on a network that isn't representative — office fibre only, never a throttled connection.

---

## Homework (about 40 minutes)

1. **Toolkit drill.** Against any public site, run and record the output of: `ping`,
   `traceroute`, `nslookup`, `curl -I`, and `nc -zv <host> 443`. Write one sentence per command
   on what the output told you.
2. **Copy as cURL.** Find any XHR request on a site you use, copy it as cURL, run it in your
   terminal, and confirm you get the same response. Then change one parameter and see what happens.
3. **Throttle.** Pick a site, set DevTools to "Slow 3G", and use it for five minutes. Write down
   three problems you would log — loading states, timeouts, duplicate submissions, layout shifts.
4. **Rewrite** one bug report from Week 2 to include network evidence.

---

## Check your understanding

<details>
<summary>1. `ping api.example.com` times out. Can you conclude the API is down?</summary>

No. Many servers, cloud load balancers and firewalls block ICMP echo entirely, so a ping timeout
is routine on healthy hosts. Test the actual service instead: `nc -zv api.example.com 443` to
see whether the port is open, and `curl -I https://api.example.com/health` to see whether the
application responds. Conclude "down" only from evidence about the service you care about.
</details>

<details>
<summary>2. The UI says "Something went wrong." What do you do before writing anything?</summary>

Open DevTools → Network, find the failed request, and read the actual status code and response
body — it almost always contains a specific error, a field name, and often a correlation ID.
Also check the Console for JavaScript errors. Then reproduce it, and copy the request as cURL.
The generic UI message is the *least* informative thing available and should never be the whole
bug report; a separate defect is often worth logging for the unhelpful message itself.
</details>

<details>
<summary>3. Why does "Copy as cURL" make you a better tester overnight?</summary>

It converts a vague description into an exact, runnable reproduction that includes the method,
URL, headers, cookies and body — everything the developer would otherwise have to ask you for.
It also lets you isolate the browser from the equation: if the cURL fails too, it's server-side.
And it's the starting point for API testing (Week 4), because you can now modify the request and
see how the server reacts.
</details>

<details>
<summary>4. What is TTFB and what does a high TTFB tell you?</summary>

Time To First Byte — the "Waiting" phase in the DevTools waterfall, measuring how long the
server took to start responding after receiving the request. A high TTFB points at server-side
work: a slow database query, a slow third-party call, a cold start, or resource contention. It
rules out bandwidth and payload size, which would instead show as a long download phase with a
short wait.
</details>

---

## Glossary additions

`ping` · `ICMP` · `latency` · `packet loss` · `traceroute` · `hop` · `nslookup` · `dig` ·
`curl` · `netcat` · `TTFB` · `HAR file` · `throttling` · `hard refresh` · `cold start` ·
`health endpoint` · `correlation ID`
