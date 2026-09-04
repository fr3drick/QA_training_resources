# Day 12 — Networking Essentials, Ports and Protocols

> **Week 3 · Day 12 · 60 minutes**
> Prerequisites: Day 11

---

## At a glance

By the end of this session you should be able to:

1. Use the network layers as a diagnostic ladder ("which layer is broken?").
2. Explain **TCP vs UDP** and why it matters for what you're testing.
3. Recognise the **common ports and protocols** on sight.
4. Explain **HTTPS/TLS** and what a certificate error actually means.
5. Name the pieces between the user and the application: proxy, load balancer, CDN, firewall,
   API gateway — and what each can break.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: URL dissection |
| 0:05 – 0:15 | The layers, as a troubleshooting ladder |
| 0:15 – 0:23 | TCP vs UDP |
| 0:23 – 0:35 | The port and protocol table |
| 0:35 – 0:43 | HTTPS, TLS and certificates |
| 0:43 – 0:52 | What sits between the user and the app |
| 0:52 – 0:58 | **Activity:** which layer is broken? |
| 0:58 – 1:00 | Homework |

---

## 1. The layers — a ladder for diagnosis

You don't need to memorise the OSI model for its own sake. You need it because it gives you an
**order to check things in**. Start at the bottom; if the bottom is broken, nothing above it can
work.

| # | OSI layer | TCP/IP | What lives here | What "broken" looks like | Tester's check |
|---|---|---|---|---|---|
| 7 | Application | Application | HTTP, DNS, SMTP, FTP, SSH | 404, 500, wrong JSON, bad business logic | Browser, Postman, `curl` |
| 6 | Presentation | Application | TLS/SSL, encoding, compression | Certificate errors, garbled/mojibake text | Check the padlock, check `Content-Type` and charset |
| 5 | Session | Application | Sessions, cookies, tokens | Logged out unexpectedly, session fixation | DevTools → Application → Cookies |
| 4 | Transport | Transport | **TCP**, **UDP**, ports | Connection refused, timeout, port closed | `telnet host port`, `nc -zv host port` |
| 3 | Network | Internet | IP, routing, ICMP | Host unreachable, packets take a wrong path | `ping`, `traceroute` |
| 2 | Data link | Link | Ethernet, wifi, MAC addresses | No link, wifi dropped | Is the cable in? Is wifi connected? |
| 1 | Physical | Link | Cables, radio, hardware | Nothing at all | Look at the lights |

**Mnemonic (top down):** *All People Seem To Need Data Processing.*

**How you actually use it:** when something fails, walk up the ladder.
Is the machine on the network (1–2)? Can I reach the host (3, `ping`)? Is the port open
(4, `nc`)? Is TLS valid (6)? Does the app respond (7)? The first "no" is your answer, and it
tells you who owns the problem.

---

## 2. TCP vs UDP

Both are transport-layer protocols; they make opposite trade-offs.

| | **TCP** | **UDP** |
|---|---|---|
| Connection | Connection-oriented (handshake first) | Connectionless (just send) |
| Reliability | Guaranteed delivery; retransmits lost packets | No guarantee; lost packets stay lost |
| Ordering | Packets reassembled in order | Arrive in any order |
| Speed | Slower — more overhead | Faster — minimal overhead |
| Error handling | Acknowledgements, retries, flow control | Checksum only |
| Analogy | A phone call: you confirm the other person heard you | A postcard: you send it and hope |
| Used by | HTTP/HTTPS, SSH, FTP, SMTP, database connections | DNS, DHCP, VoIP, video streaming, online games, NTP |

**The TCP three-way handshake:** SYN → SYN-ACK → ACK. You'll see these words in network traces
and error logs; it's just "hello / hello back / got it, let's talk".

**Why a tester cares:**
- Testing a **video call or live-streaming** feature? It's UDP — packet loss shows up as
  stutter and artefacts, not as an error message. Testing it over a poor connection is a
  legitimate and often-skipped test.
- Testing an **API or web app**? It's TCP — lost packets are retried invisibly, so poor networks
  show up as *slowness and timeouts* rather than corruption.
- **QUIC / HTTP/3** runs over UDP while providing reliability itself. If you see UDP traffic on
  port 443 in a capture, that's HTTP/3, not an anomaly.

---

## 3. Common ports and protocols

Learn the bolded ones by heart. Interviewers ask, and more importantly you will read them in
config files and error messages every week.

### The essentials

| Port | Protocol | TCP/UDP | What it's for | Tester's note |
|---|---|---|---|---|
| **20/21** | FTP | TCP | File transfer (unencrypted) | Credentials sent in clear text — flag its use |
| **22** | **SSH / SFTP / SCP** | TCP | Encrypted remote shell & file transfer | How you reach a server to read logs |
| 23 | Telnet | TCP | Unencrypted remote shell | Obsolete and insecure — but the `telnet` *client* is still handy for port checks |
| 25 | SMTP | TCP | Sending mail between servers | Often blocked by ISPs |
| 53 | **DNS** | **UDP** (TCP for large responses) | Name → IP resolution | If DNS is down, everything "is down" |
| 67/68 | DHCP | UDP | Automatic IP assignment | Why your laptop's IP changes |
| **80** | **HTTP** | TCP | Web, unencrypted | Should redirect to 443 — test that it does |
| 110 / 995 | POP3 / POP3S | TCP | Mail retrieval (download) | |
| 123 | NTP | UDP | Time synchronisation | Clock skew breaks tokens, TLS and log correlation |
| 143 / 993 | IMAP / IMAPS | TCP | Mail retrieval (server-side) | |
| **443** | **HTTPS** | TCP (UDP for HTTP/3) | Web, encrypted | The default for everything now |
| 465 / 587 | SMTPS / Submission | TCP | Sending mail with auth/TLS | 587 is the modern one |
| 3389 | RDP | TCP | Windows remote desktop | |
| 8080 / 8443 | HTTP / HTTPS alt | TCP | Dev servers, proxies, app servers behind a load balancer | Extremely common in test environments |

### Databases and infrastructure

| Port | Service | Note |
|---|---|---|
| **1433** | Microsoft SQL Server | |
| **1521** | Oracle | |
| **3306** | **MySQL / MariaDB** | |
| **5432** | **PostgreSQL** | |
| 27017 | MongoDB | |
| 6379 | Redis | Often left unauthenticated — a real security finding |
| 9200 / 9300 | Elasticsearch / OpenSearch | |
| 5672 / 15672 | RabbitMQ / its management UI | |
| 9092 | Apache Kafka | |
| 2375 / 2376 | Docker API (plain / TLS) | Exposed = full control of the host |
| 3000 | Common dev server default (Node, React, Grafana) | |
| 5000 / 8000 | Common dev server default (Flask, Django, Python) | |

**The tester's takeaway:** when a config file says `DB_HOST=10.0.4.55` and `DB_PORT=5432`, you
now know it's PostgreSQL on a private address. When an error says
`connect ECONNREFUSED 127.0.0.1:6379`, you know Redis isn't running locally. That's the whole
skill: reading an error and knowing which box in the diagram is broken.

---

## 4. HTTPS, TLS and certificates

**HTTPS = HTTP inside a TLS-encrypted tunnel.** (SSL is TLS's obsolete predecessor; people still
say "SSL certificate" out of habit.)

**What TLS provides:**
1. **Encryption** — nobody in between can read the traffic.
2. **Authentication** — you are talking to the real `example.com`, not an impostor.
3. **Integrity** — the data wasn't altered in transit.

**The certificate** is issued by a **Certificate Authority (CA)** and states: this public key
belongs to this hostname, valid between these dates. Your browser trusts a list of CAs; anything
signed outside that chain triggers a warning.

**Certificate errors you'll meet as a tester, and what each means:**

| Error | Meaning | Is it a bug? |
|---|---|---|
| `ERR_CERT_DATE_INVALID` | Expired (or the client clock is wrong) | On production: **major incident**. On QA: log it, it blocks testing and trains people to click through warnings |
| `ERR_CERT_COMMON_NAME_INVALID` | Certificate is for a different hostname | Yes — usually a misconfiguration |
| `ERR_CERT_AUTHORITY_INVALID` | Self-signed or unknown CA | Normal on internal test environments; **never** acceptable on production |
| `ERR_SSL_PROTOCOL_ERROR` | Version/cipher mismatch | Often an old client or a hardened server |
| Mixed content warning | An HTTPS page loading HTTP resources | Yes — the padlock is compromised, and browsers block it |

**Testing checklist for HTTPS:**
- [ ] `http://` redirects to `https://` (301), including on the bare domain and `www`
- [ ] The certificate covers every hostname in use, including subdomains
- [ ] Expiry date is comfortably in the future — **check this on every environment, and put
      renewal dates somewhere visible**; expired certs are one of the most common causes of
      self-inflicted outages
- [ ] No mixed content (check the browser console)
- [ ] Security headers present: `Strict-Transport-Security`, `Content-Security-Policy`,
      `X-Content-Type-Options`
- [ ] Cookies carrying sessions are marked `Secure`, `HttpOnly` and an appropriate `SameSite`

---

## 5. What sits between the user and the application

Your request rarely goes straight to the app. Every box below can be the thing that's broken,
and each fails in a recognisable way.

```
Browser ─► DNS ─► CDN ─► Firewall/WAF ─► Load Balancer ─► API Gateway ─► App Server ─► Cache ─► Database
                                                                              │
                                                                              └─► Third-party APIs
```

| Component | What it does | How it breaks, and what you'd see |
|---|---|---|
| **CDN** (Cloudflare, Akamai, CloudFront) | Serves static content from a location near the user | Stale content after a deploy — you see the old JS/CSS while others see the new. Fix: hard refresh, cache purge |
| **Firewall** | Allows/blocks traffic by IP and port | Timeouts, especially from a new office IP or a VPN |
| **WAF** (web application firewall) | Blocks malicious-looking requests | **Blocks legitimate test input** — a form with SQL-like text (`O'Brien`, `1=1`) returns 403. Very common false alarm in testing |
| **Load balancer** | Spreads traffic across identical servers | Intermittent bugs: one instance has the old build or a broken config, so failures happen "sometimes" |
| **Reverse proxy** (nginx) | Front door: TLS termination, routing, rate limits | 502 Bad Gateway (the app behind it is down), 504 Gateway Timeout (the app was too slow) |
| **API gateway** | Auth, rate limiting, routing for APIs | 401/403 from the gateway rather than the app; 429 Too Many Requests |
| **Cache** (Redis, Memcached) | Stores frequent results | You update a record and the UI shows the old value for 5 minutes. **Test cache invalidation** |
| **Message queue** (Kafka, RabbitMQ, SQS) | Passes work asynchronously between services | The action "succeeds" but the effect appears later — or never, if a consumer is down |
| **Database** | Stores the data | Slow queries, locks, connection-pool exhaustion under load |

**The single most important consequence for a tester:** *"it worked on the second try"* is not
noise. It usually means a load balancer sent you to a different instance, or a cache expired, or
an async job finally ran. Investigate it — those are the bugs that reach production and are then
impossible to reproduce.

---

## Live activity (6 minutes)

**Which layer is broken?** Read each symptom; the group calls out the layer and the next
diagnostic step.

1. "I get `DNS_PROBE_FINISHED_NXDOMAIN`."
2. "The page hangs for 30 seconds, then says the connection timed out."
3. "I get `502 Bad Gateway`."
4. "The browser says 'Your connection is not private — certificate expired'."
5. "The page loads but every table is empty, and there's a red 401 in the Network tab."
6. "It works for me but not for my colleague, and we're both on the same build."
7. "The form fails with 403 only when the surname field contains an apostrophe."

<details>
<summary>Facilitator answer key</summary>

1. **Layer 7 / DNS.** The hostname doesn't resolve — typo, unregistered domain, VPN needed, or a
   DNS record deleted. Next: `nslookup`.
2. **Layer 3–4.** Nothing is answering: firewall dropping packets, wrong IP, host down, or you're
   off the VPN. Next: `ping` the host, then `nc -zv host port`.
3. **Layer 7, but downstream.** The reverse proxy is up and the application behind it is not.
   Next: check the app service status and its logs; the proxy is telling you it couldn't reach the app.
4. **Layer 6 (TLS).** Expired certificate — or your machine's clock is wrong. Check both. On
   production this is an incident.
5. **Layer 7, authentication.** The page rendered but the API rejected the request — expired
   token, wrong scope, not logged in. This is a backend/auth bug, not a UI bug. Next: inspect the
   request headers and the 401 response body.
6. **Load balancer, cache, or session.** Likely different instances, a stale CDN/browser cache,
   or different cookies/roles/feature flags. Next: hard refresh, compare the build number each of
   you is served, and compare roles.
7. **WAF.** The apostrophe looks like SQL injection to the firewall, which blocks it before the
   app ever sees it. Real users called O'Brien cannot register. Log it — this is a genuine defect
   even though the "fault" is in a security appliance.
</details>

---

## Common mistakes juniors make

- Treating every failure as an application bug. Half of them are environment, network or config.
- Not noticing 502/504 vs 500 — they point at completely different owners.
- Ignoring "it worked the second time".
- Not checking whether a certificate warning is on a test environment (normal-ish) or production (incident).
- Forgetting that a WAF may be silently mangling test input.

---

## Homework (about 35 minutes)

1. **Memorise and self-test** on these ports: 21, 22, 25, 53, 80, 123, 443, 1433, 3306, 5432,
   6379, 8080, 27017. Write the list from memory tomorrow.
2. **Certificate check:** open three sites you use, click the padlock, and record the issuer, the
   expiry date and the hostnames the certificate covers.
3. **TCP vs UDP:** for each of these, say which is used and why — a video call, loading a web
   page, a DNS lookup, downloading a file, an online multiplayer game, sending an email.
4. Draw the "browser → database" diagram from §5 from memory and write one failure mode for each box.

---

## Check your understanding

<details>
<summary>1. Why is DNS mostly UDP when reliability matters so much?</summary>

Because a DNS query and its answer are tiny and the interaction is a single request/response.
Setting up a TCP connection (three-way handshake) would cost more round trips than just sending
the query again if it's lost — the client simply retries. DNS switches to TCP when the response
is too large for a single UDP datagram (large record sets, DNSSEC) or for zone transfers.
</details>

<details>
<summary>2. You get a 502 on staging. Whose problem is it and what do you check first?</summary>

502 Bad Gateway means the reverse proxy or load balancer is running but got no valid response
from the application behind it — so the front door is fine and the app is down, crashed,
still starting, or listening on the wrong port. Check the application service status and its
logs first, and confirm the deployment finished. It's a backend/infrastructure problem, not a
client-side one, and it is not something the tester can fix by retrying.
</details>

<details>
<summary>3. A registration form rejects the surname "O'Brien" with a 403 and no error message. Is this a bug, and whose?</summary>

Yes — real users cannot register, which is a functional defect regardless of where the fault
lies. The 403 with no application error suggests a WAF is blocking the apostrophe as suspected
SQL injection before the request reaches the app. Log it with the evidence (the request, the
403, and the fact that "OBrien" succeeds), route it to whoever owns the WAF rules, and note that
the correct fix is a tuned rule plus proper parameterised queries in the app — not stripping
apostrophes from people's names.
</details>

<details>
<summary>4. What does it tell you when a bug only reproduces "sometimes" on a load-balanced system?</summary>

Most likely the instances are not identical — one is running an older build, has a different
config or feature flag, has a stale cache, or has lost its connection to a dependency. It can
also be a caching layer expiring, an async job that sometimes hasn't run yet, or a race
condition. The investigative move is to identify which instance served each request (many
systems return a server or build header) and check whether failures correlate with one of them.
</details>

---

## Glossary additions

`OSI model` · `TCP/IP` · `TCP` · `UDP` · `three-way handshake` · `QUIC` · `HTTP/3` · `SSH` ·
`FTP` · `SFTP` · `SMTP` · `IMAP` · `NTP` · `DHCP` · `TLS` · `SSL` · `certificate authority` ·
`mixed content` · `HSTS` · `CDN` · `firewall` · `WAF` · `load balancer` · `reverse proxy` ·
`API gateway` · `cache invalidation` · `message queue` · `502` · `504`
