# Day 11 — Client, Server, Host, IP, Port, Protocol, DNS

> **Week 3 · Day 11 · 60 minutes**
> ISTQB CTFL v4.0 mapping: supports Chapter 2 (test environments) and Chapter 5; primarily
> practical QA knowledge beyond the syllabus
> Prerequisites: Weeks 1–2. No prior networking knowledge assumed.

---

## At a glance

By the end of this session you should be able to:

1. Define **client**, **server**, **host**, **IP address**, **port**, **protocol**, **DNS** and
   **URL** — precisely, in one sentence each.
2. Trace what happens, step by step, between typing a URL and seeing a page.
3. Read a URL and name every component.
4. Explain why these terms appear in bug reports and why a tester who knows them is worth more.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Weekend homework review: bug reports |
| 0:05 – 0:20 | The terms, defined with the restaurant analogy |
| 0:20 – 0:30 | Anatomy of a URL |
| 0:30 – 0:45 | "What happens when you type a URL and press Enter" — the whole journey |
| 0:45 – 0:56 | **Activity:** trace a real request in DevTools |
| 0:56 – 1:00 | Homework |

---

## 1. Why a tester needs this

Every bug you find lives somewhere in a chain of machines talking to each other. Without this
vocabulary you can only report *"the page didn't load"*. With it you can report:

> *"The browser resolved api.example.com to 10.0.4.12 but the connection to port 443 was refused
> — the service is down, not the network."*

The first sentence gets a shrug. The second gets fixed in ten minutes. This is also the
difference between a tester who is handed only the UI and one who is trusted with the whole
system.

---

## 2. The core terms

### Client

**A client is the software that requests something.** Your browser, the mobile app, Postman,
`curl`, or one backend service calling another.

Note: "client" describes a *role in a conversation*, not a type of machine. A server can be a
client — when your web server calls the payment gateway, your server is the client in that
exchange.

### Server

**A server is software that listens for requests and responds to them.**

"Server" is used for two things, and confusing them causes real misunderstandings:
- **The software** — nginx, Apache, a Node.js process, PostgreSQL.
- **The machine** — the physical or virtual computer it runs on.

One machine can run many servers (a web server on port 443, a database server on port 5432).
When someone says "the server is down", **always ask which**: the machine, the web application,
or the database?

### Host

**A host is any device on a network that has an IP address.** Your laptop is a host. The server
is a host. Your phone is a host. The printer is a host.

**Hostname** = the human-readable name for a host: `api.example.com`, `db-prod-01`, `localhost`.

`localhost` is a special hostname meaning "this machine" — it always resolves to `127.0.0.1`
(IPv4) or `::1` (IPv6). "Works on localhost" means it works on the developer's own machine and
proves almost nothing about the test environment.

### IP address

**The numeric address of a host on a network.** Like a street address for a computer.

**IPv4** — four numbers 0–255 separated by dots: `192.168.1.10`, `8.8.8.8`. About 4.3 billion
possible addresses, which ran out.

**IPv6** — eight groups of four hex digits: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`, often
shortened to `2001:db8:85a3::8a2e:370:7334`. Effectively unlimited.

**Public vs private addresses — the distinction that explains half of QA's environment problems:**

| Range | Type | Where you see it |
|---|---|---|
| `10.0.0.0 – 10.255.255.255` | Private | Corporate networks, cloud VPCs |
| `172.16.0.0 – 172.31.255.255` | Private | Docker default networks |
| `192.168.0.0 – 192.168.255.255` | Private | Home and office wifi |
| `127.0.0.1` | Loopback | This machine only |
| Everything else routable | Public | The internet |

**Private addresses are not reachable from the internet.** So if your test environment is at
`10.0.4.12`, you can only reach it from inside the company network or over a VPN. That is why
"the QA site doesn't load from home" is usually not a bug — it's a missing VPN connection.
Knowing this saves you from logging it.

Related terms you'll meet: **subnet** (a slice of a network, written as `10.0.4.0/24` — 256
addresses), **gateway** (the router that forwards traffic out of your subnet), **NAT**
(the translation that lets many private addresses share one public address), and **DHCP** (the
service that hands out IP addresses automatically — which is why your laptop's IP changes).

### Port

**A port is a numbered door on a host, identifying which program the traffic is for.**

An IP address gets traffic to the right *machine*; a port gets it to the right *program on that
machine*. Written together as `192.168.1.10:8080` — read as "port 8080 on that host".

Range: 0–65535.
- **0–1023** — well-known ports (HTTP 80, HTTPS 443, SSH 22). Require admin rights to bind.
- **1024–49151** — registered ports (PostgreSQL 5432, MySQL 3306).
- **49152–65535** — ephemeral/dynamic ports; your browser uses one of these as the *source*
  port for each outgoing connection.

Two common errors you will meet, and their exact meaning:
- **"Connection refused"** — you reached the host, but **nothing is listening** on that port.
  The service is down, or it's on a different port.
- **"Connection timed out"** — nothing answered at all. Usually a **firewall** silently dropping
  packets, or the host is unreachable.

That distinction alone will make you look competent in your first week on the job.

### Protocol

**A protocol is an agreed set of rules for how two programs talk** — the format of the messages,
the order they come in, and what the responses mean.

Both sides must speak the same protocol. HTTP, HTTPS, FTP, SMTP, SSH, DNS, TCP, UDP are all
protocols. Day 12 covers them properly.

### DNS — the Domain Name System

**DNS translates hostnames into IP addresses.** It is the internet's phone book: you know the
name, DNS gives you the number.

You type `www.example.com`; your computer asks DNS; DNS answers `93.184.216.34`; your computer
connects to that address. Without DNS, nothing you know how to type would work.

**Why testers care:**
- DNS is cached at many levels (browser, OS, router, ISP). After a deployment changes an IP,
  you may still be hitting the *old* server while a colleague hits the new one. Two people
  seeing different behaviour on the same URL is very often a DNS caching difference.
- **TTL** (time to live) is how long a DNS answer may be cached. A record with a 24-hour TTL
  takes up to a day to propagate globally.
- Common DNS record types: **A** (hostname → IPv4), **AAAA** (→ IPv6), **CNAME** (alias for
  another name), **MX** (mail server), **TXT** (arbitrary text; used for domain verification).
- Your machine's **hosts file** (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts`
  on Windows) overrides DNS locally. Testers use it to point a production hostname at a test
  server — very useful, and a classic cause of "it only breaks on my machine" when you forget
  to remove the entry.

---

## 3. The restaurant analogy

Put it all together in one picture:

| Concept | Restaurant equivalent |
|---|---|
| **Client** | You, the diner, placing an order |
| **Server** | The kitchen that prepares what you asked for |
| **Host** | The building the restaurant is in |
| **IP address** | The building's street address |
| **Port** | Which counter you go to inside the building — pizza counter 80, drinks counter 443 |
| **Protocol** | The language and etiquette of ordering — you say "I'd like…", they say "coming up" |
| **DNS** | Asking a directory for the restaurant's address because you only know its name |
| **Request** | Your order |
| **Response** | The food, or "sorry, we're out of that" |
| **Status code** | "Here you go" (200) vs "we don't have that" (404) vs "the kitchen is on fire" (500) |
| **Timeout** | You waited 40 minutes and left |
| **Connection refused** | You arrived and the restaurant is closed and locked |
| **Firewall** | A bouncer who turns you away without explanation |
| **Load balancer** | A host who directs you to whichever of five identical kitchens is least busy |
| **Cache** | Yesterday's takeaway in your fridge — fast, but possibly stale |

---

## 4. Anatomy of a URL

```
 https://api.example.com:8443/v2/orders/1099?status=paid&sort=date#summary
 └─┬─┘   └──────┬──────┘└─┬─┘└─────┬──────┘└──────────┬──────────┘└──┬──┘
scheme       host       port      path             query string   fragment
```

| Part | Name | Notes |
|---|---|---|
| `https` | **Scheme / protocol** | How to talk. `http`, `https`, `ftp`, `mailto`, `ws` |
| `api` | **Subdomain** | Often identifies the service or environment (`qa.`, `staging.`) |
| `example.com` | **Domain** | `example` is the second-level domain, `com` the top-level domain |
| `api.example.com` | **Host / authority** | The full hostname DNS resolves |
| `8443` | **Port** | Optional. Defaults: 80 for http, 443 for https |
| `/v2/orders/1099` | **Path** | Which resource. Here: version 2, orders collection, order 1099 |
| `?status=paid&sort=date` | **Query string** | Key=value pairs separated by `&`. Filters, options, pagination |
| `#summary` | **Fragment / anchor** | **Never sent to the server.** Used by the browser only |

**Things testers must know about URLs:**

- The fragment (`#…`) never reaches the server. If a bug depends on it, it's a client-side bug.
- Query strings appear in browser history, server logs, proxy logs and analytics. **Never put
  passwords, tokens or personal data in a query string** — that's a genuine security finding
  worth logging when you see it.
- URLs are **case-sensitive in the path** on most servers (`/Orders` ≠ `/orders`) but the
  **host is case-insensitive**. A classic source of 404s.
- Special characters must be **percent-encoded**: a space is `%20`, `&` is `%26`, `'` is `%27`.
  The apostrophe search bug on Day 10 was an encoding bug.
- A **trailing slash** can matter: `/orders` and `/orders/` may be different routes.
- Test what happens when someone edits the URL by hand: `/orders/1099` → `/orders/1100`. If you
  can see another customer's order, you have found an **IDOR** — one of the most common real
  security defects, and Week 4 comes back to it.

---

## 5. What happens when you type a URL and press Enter

This is a famous interview question. Here is the version a tester needs.

1. **The browser parses the URL** into scheme, host, port, path, query.
2. **The browser checks its caches** — is there a fresh cached copy of this page? Is there a
   cached DNS answer?
3. **DNS resolution.** If the IP isn't cached: ask the OS, which asks the configured DNS
   resolver (your router, your ISP, or e.g. `8.8.8.8`), which walks root → TLD (`.com`) →
   authoritative nameserver for `example.com`, and returns an IP.
   *→ Failure here looks like: `DNS_PROBE_FINISHED_NXDOMAIN`, "server not found".*
4. **TCP connection.** The browser opens a TCP connection to that IP on port 443, using a
   three-way handshake (SYN → SYN-ACK → ACK).
   *→ Failure here: "connection refused" (nothing listening) or "timed out" (firewall/unreachable).*
5. **TLS handshake** (for HTTPS). The server presents its certificate; the browser checks it is
   valid, unexpired, and issued for this hostname by a trusted authority. Keys are agreed and
   everything after this is encrypted.
   *→ Failure here: `NET::ERR_CERT_DATE_INVALID`, "your connection is not private". Expired
   certificates on test environments are extremely common — and an expired cert on **production**
   is a major incident.*
6. **The HTTP request is sent** — method, path, headers, cookies, and possibly a body (Day 16).
7. **The server processes it** — possibly through a load balancer, a reverse proxy, a CDN, an
   application server, a cache, and a database. Any of these can be the thing that's broken.
8. **The HTTP response comes back** — status code, headers, body (HTML/JSON).
   *→ Failure here: 4xx (the client's fault) or 5xx (the server's fault).*
9. **The browser renders** — parses HTML, builds the DOM, then requests every referenced
   resource (CSS, JS, images, fonts) — each one repeating steps 3–8, often dozens of times.
10. **JavaScript runs**, which typically makes further API calls (fetch/XHR) for the actual data.
    *→ This is why a page can render but show no data: the HTML loaded fine and the API call
    behind it failed. Always check the Network tab before assuming the page is "broken".*

**Why this matters:** when a page fails, you can now say *which step failed*, and that single
sentence in a bug report changes who picks it up and how fast.

---

## Live activity (11 minutes)

**Trace a real request.**

1. Open Chrome, press **F12**, go to the **Network** tab, tick **Preserve log**.
2. Navigate to any site the group knows.
3. Together, find and identify:
   - The **first** request (the document itself). Its status code, its method.
   - Click it → **Headers** → find the **Remote Address** (the IP and port you actually connected to).
   - Count how many total requests the page made, and the total size transferred.
   - Find one request that is **not** the same host — a CDN, an analytics service, a font.
   - Find an **XHR/Fetch** request (filter by "Fetch/XHR") and look at its JSON response.
   - Find something served from **cache** (Size column says "memory cache" or "disk cache").
4. Then run in a terminal:

```bash
nslookup www.google.com
```

Ask: how many IP addresses came back, and why would one hostname have several?
(Answer: load balancing and redundancy — DNS hands different clients different servers.)

---

## Common mistakes juniors make

- Saying "the server is down" without saying which server, or checking.
- Reporting "the site doesn't load from home" without checking whether the environment is on a
  private IP behind a VPN.
- Missing that the page rendered fine and only the API call failed — so reporting a UI bug when
  it's a backend bug.
- Not noticing an expired certificate warning and clicking through it habitually.
- Testing on a URL with a leftover `/etc/hosts` entry pointing somewhere unexpected.

---

## Homework (about 35 minutes)

1. **Define, in one sentence each, without notes:** client, server, host, IP address, port,
   protocol, DNS, URL, hostname, localhost.
2. **URL dissection:** take three real URLs from apps you use and label every component.
   Find at least one with a query string of three or more parameters and say what each does.
3. Run `nslookup` (or `dig`) on three sites you use and record the IP addresses returned.
   Run it twice for one of them, a minute apart — did the answer change? Why might it?
4. Open DevTools on a site you use daily, reload, and answer: how many requests, how much data,
   how long to load, and what was the slowest single request?

---

## Check your understanding

<details>
<summary>1. A colleague says "the server is down". What three questions do you ask?</summary>

(1) Which server — the machine, the web/application server, the database, or a third-party
service we depend on? (2) Which environment — dev, QA, staging, production? (3) What is the
actual evidence: connection refused, timeout, a 500 response, or a page that loads with no data?
Each points at a different cause and a different owner.
</details>

<details>
<summary>2. What is the difference between "connection refused" and "connection timed out"?</summary>

**Refused** means the packet reached the host and the host actively replied "nothing is
listening here" — the machine is up but the service is down or on a different port. **Timed
out** means nothing came back at all — usually a firewall silently dropping traffic, a wrong IP,
or an unreachable host. Refused is generally an application problem; timed out is generally a
network or firewall problem.
</details>

<details>
<summary>3. Why can two testers see different behaviour at the same URL at the same moment?</summary>

DNS caching resolving to different servers after a deployment; a load balancer sending them to
different instances (one of which has the old build); browser or CDN caching serving one of them
a stale copy; different cookies, sessions, roles or feature flags; different geography, language
or time zone; a leftover `/etc/hosts` entry on one machine; or one of them being on the VPN and
the other not.
</details>

<details>
<summary>4. Why should a password never appear in a query string?</summary>

Query strings are recorded everywhere: browser history, server access logs, proxy and load
balancer logs, analytics tools, and the `Referer` header sent to third-party sites linked from
the page. They are also visible on screen and in shared links. Credentials and personal data
belong in the request body of a POST over HTTPS, or in a header — never in the URL. Seeing one
in a URL is a legitimate security defect to log.
</details>

---

## Glossary additions

`client` · `server` · `host` · `hostname` · `localhost` · `IP address` · `IPv4` · `IPv6` ·
`private IP` · `public IP` · `subnet` · `gateway` · `NAT` · `DHCP` · `port` · `ephemeral port` ·
`protocol` · `DNS` · `A record` · `CNAME` · `TTL` · `hosts file` · `URL` · `scheme` · `domain` ·
`subdomain` · `path` · `query string` · `fragment` · `percent-encoding` · `TCP handshake` ·
`TLS` · `certificate` · `IDOR`
