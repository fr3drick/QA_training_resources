# Day 26 — Performance Testing Fundamentals

> **Week 6 · Day 26 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.2.2 (non-functional testing — performance efficiency, ISO/IEC 25010)
> Prerequisites: Week 5; JMeter installed (Day 25 homework)

---

## At a glance

Functional testing asks *does it work?* Performance testing asks *does it still work when
everyone uses it at once — and how fast?* Most production outages that make the news are
performance failures, not functional ones.

By the end of this session you should be able to:

1. Distinguish **load, stress, spike, soak, capacity** and **scalability** testing.
2. Explain **response time, latency, throughput, error rate** and **concurrency** — and why
   **percentiles** beat averages.
3. Use **Little's Law** to size a test.
4. Turn a vague performance wish into a **testable NFR**, and build a **workload model**.
5. Run your first JMeter request.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: response time, latency, throughput in your own words |
| 0:05 – 0:12 | Why performance testing, and the rules of engagement |
| 0:12 – 0:22 | Types of performance test |
| 0:22 – 0:34 | The metrics, percentiles, and Little's Law |
| 0:34 – 0:42 | NFRs and workload models |
| 0:42 – 0:57 | **Lab:** workload model on paper, then JMeter "hello world" |
| 0:57 – 1:00 | Homework |

---

## 1. Why performance testing

The pattern is always the same: it worked in testing, then real users arrived all at once.

- A bank's mobile app that's fine all month and falls over on **salary day**, when a large share
  of customers log in within the same few hours.
- An exam-registration or visa portal that collapses in the **first hour** the window opens.
- A flash sale where the site stays up — but **sells more stock than exists**, because two
  orders read the same stock count at the same moment.

That last one isn't slowness. It's a **functional defect that only appears under concurrency**,
and only a load test will find it. Keep it in mind: QA Shop has one.

### Rules of engagement

Repeat from Day 21, because it matters most this week:

1. **Only test systems you own or have written permission to test.** Load testing someone
   else's service is a denial-of-service attack in all but intent.
2. **Never load-test production** without explicit approval, a schedule, and the operations
   team watching.
3. **Tell people.** A load test on a shared QA environment ruins everyone else's afternoon if
   they don't know it's coming.

---

## 2. Types of performance test

Each type is a different **shape of load over time**, chosen to answer a different question.

| Type | Load shape | The question it answers |
|---|---|---|
| **Load test** | Ramp to the *expected* peak, hold | Does it meet the NFRs at the load we expect? |
| **Stress test** | Keep increasing past the expected peak | Where does it break, and **how** does it break? |
| **Spike test** | Sudden jump from low to very high, then back | Does it survive a sudden surge, and recover afterwards? |
| **Soak / endurance test** | Moderate load for hours | Does it degrade over time — memory leaks, connection leaks, full disks? |
| **Capacity test** | Step up until an NFR is breached | How many users can we support *within* the NFRs? |
| **Scalability test** | Repeat at 1×, 2×, 4× resources | Does adding servers add capacity proportionally? |
| **Volume test** | Normal load, very large data | Does it cope with 200,000 products? 10 million orders? |

```
Load                Stress               Spike                Soak
users               users                users                users
  │   ┌────────┐      │          ╱          │    ┌┐              │ ┌──────────────────┐
  │  ╱          ╲     │        ╱            │    ││              │╱                    ╲
  │ ╱            ╲    │      ╱              │    ││              │
  │╱              ╲   │    ╱                │────┘└─────         │
  └──────────────► t  └──────────────► t    └──────────────► t   └──────────────────────► t
                                                                  (hours)
```

**A stress test's most valuable output is the failure mode**, not the number. Good systems
degrade gracefully: they slow down, then reject excess requests cleanly with `503` or `429`, then
recover when load drops. Bad systems fall off a cliff — timeouts everywhere, corrupt data, and
they stay broken after the load goes away.

---

## 3. The metrics

### Response time — and its parts

```
 JMeter                                       QA Shop API
   │── TCP connect ──────────────────────────────►│   ┐ connect time
   │── request sent ─────────────────────────────►│   │
   │                                              │   │ server works...
   │◄──────────────────────── first byte ─────────│   ┘ latency (≈ TTFB, Day 13)
   │◄──────────────────────── ...rest of body ────│
   │                                                    response time (elapsed) = all of it
```

| JMeter term | Meaning |
|---|---|
| **Elapsed / response time** | From just before sending to receiving the last byte |
| **Latency** | From just before sending to receiving the **first** byte |
| **Connect time** | Time to establish the TCP (and TLS) connection |

Large latency with a small body → the server is slow to think. Small latency, large response
time → the response is big or the network slow. (`GET /products?limit=100000` returns ~20 MB —
guess which kind that is.)

### Throughput

**Requests (or transactions) per second.** How much work the system completes per unit of time.
Under increasing load, throughput rises — until it plateaus. **The plateau is the system's
capacity**; adding more users past it only makes everyone wait longer.

### Error rate

The percentage of requests that failed: errors, timeouts, wrong responses. A system that
"handles 500 req/s" with a 30% error rate doesn't.

### Concurrency

- **Virtual users (threads)**: simulated users, each running a script in a loop.
- **Concurrent requests**: requests actually in flight at one instant — far fewer than users,
  because real users spend most of their time *thinking* (reading, typing), not waiting.

### Why the average lies

Ten requests, in milliseconds:

```
80  85  90  90  95  100  110  120  150  2,400
```

| Statistic | Value | What it says |
|---|---|---|
| Average | **332 ms** | Describes nobody: nine were far faster, one far slower |
| Median (p50) | 97.5 ms | Half of users waited less than this |
| p90 | 150 ms* | 90% waited this long or less |
| p99 / max | 2,400 ms | Someone waited 2.4 seconds |

\* Percentile calculation methods differ slightly between tools; the idea is what matters.

The average is dragged around by outliers and hides them at the same time. **Performance NFRs are
written as percentiles** — "p95 under 1 second" means *95% of requests* complete within a second,
and the remaining 5% are a known, bounded risk. At a million requests a day, that 5% is still
50,000 slow experiences, which is why critical paths often specify p99 as well.

### Resources

Response times say *that* it's slow; resource metrics say *why*:

- **CPU** — pinned at 100%? The code or database is doing too much work.
- **Memory** — climbing steadily during a soak test? A leak.
- **Database connections** — every connection in the pool busy, requests queuing for one?
  QA Shop's API has a pool of 10. Remember that number.
- **Disk and network I/O.**

On your laptop: `docker stats` shows CPU and memory per container, live.

### Little's Law

A relationship that holds for any stable system:

```
   concurrent users  =  throughput  ×  (response time + think time)
          N          =      X       ×          (R + Z)
```

Use it to sanity-check and size tests:

> Analytics say the shop peaks at **600 shoppers** online at once. Each one sends a request,
> waits about **1 s** for it, then reads for about **5 s** before the next.
> X = N / (R + Z) = 600 / (1 + 5) = **100 requests per second**.

So a load test of 600 users with 5 s think time should produce about 100 req/s. If yours produces
400 req/s, your think time is wrong — you're testing a different, much heavier workload than
reality. If it produces 30 req/s, response times have blown up.

---

## 4. Testable NFRs and workload models

### From wish to requirement

| Vague (untestable) | Testable |
|---|---|
| "The site should be fast" | "p95 response time under 1,000 ms for all endpoints except search" |
| "It must handle lots of users" | "…with 20 concurrent shoppers following the standard workload" |
| "Search should be quick" | "Search p95 under 2,000 ms under the same load" |
| "It shouldn't fall over" | "Error rate below 1%; recovers to baseline within 2 minutes after a spike" |
| "It should be reliable" | "No negative stock, no orphaned orders, totals consistent under load" |

A performance requirement needs **four** things: a **metric** (p95), a **threshold** (1,000 ms),
a **load** (20 concurrent shoppers) and a **workload** (doing what). Missing any one makes it
untestable. Compare QA Shop's NFR1–NFR3 in the README: they have all four.

### The workload model

**Which journeys, in what mix, at what pace.** Twenty users all hammering `/health` tells you
nothing. Real users browse, search, sometimes buy.

The QA Shop shopper model you'll build this week:

| Step | Every iteration? | Think time before |
|---|---|---|
| Log in | Once per user | — |
| Browse a page of products | Yes | 0.5–2 s |
| View one product | Yes | 0.5–2 s |
| Search | Yes | 0.5–2 s |
| Place an order and pay | **30%** of iterations | 0.5–2 s |

Where the numbers come from, in a real project: production analytics and logs (which pages, how
often, the peak hour), business forecasts ("marketing expects 3× traffic on launch day"), and
the conversion rate (what fraction of sessions buy). **Without a workload model, a load test is a
random number generator.**

### The environment caveat

On your laptop, JMeter, the API and the database share one CPU. Your numbers are **relative**:
good for "search is 10× slower than browse" and "it gets worse past 50 users", useless for "the
production servers will handle 600 users". Real performance testing needs a production-like
environment and a separate machine (or several) generating the load.

### The process

```
 plan NFRs + workload ─► script ─► baseline (1 user) ─► load test ─► analyse
          ▲                                                           │
          └──────────── fix / tune ONE thing ◄── find bottleneck ◄────┘
```

Always run a **baseline** with one user first. If a single user gets 900 ms on search, it's not a
load problem, it's a slow query — and no amount of load testing will be needed to prove it.

---

## Lab (15 minutes)

### Part A — on paper (7 min)

1. **Little's Law.** QA Shop expects 120 concurrent shoppers at peak. Average response time is
   0.2 s and think time averages 1.25 s. What throughput should a realistic load test produce?
   Then: if you mistakenly set think time to zero, what throughput would 120 users try to
   generate?
2. **Rewrite** these as testable NFRs: (a) "checkout should be snappy", (b) "the system must
   cope with Black Friday", (c) "search must not time out".
3. **Choose the test type** for each question: (a) "Will it survive when the promo email goes
   out to 200,000 people at 9 a.m.?" (b) "Is there a memory leak?" (c) "How many shoppers can we
   take before p95 exceeds a second?" (d) "Does it meet the NFRs at expected peak?"

### Part B — JMeter "hello world" (8 min)

Start QA Shop. Open JMeter (`bin/jmeter.bat` or `bin/jmeter`).

1. Right-click **Test Plan → Add → Threads (Users) → Thread Group**. Leave it at 1 thread,
   1 loop.
2. Right-click the Thread Group → **Add → Sampler → HTTP Request**. Protocol `http`, server
   `localhost`, port `3000`, method `GET`, path `/health`.
3. Right-click the Thread Group → **Add → Listener → View Results Tree**.
4. Save the plan as `labs/qa-shop/jmeter/hello.jmx`.
5. Press the green ▶ **Start** button. In View Results Tree, click the sample: look at
   *Sampler result* (load time, latency, connect time), *Request* and *Response data*.
6. Change the Thread Group to **10 threads, 5 loops**, clear results (broom icon), run again.
   Watch the API log in your terminal.

**Debrief questions**
- Part A, question 1: what did your answers tell you about the danger of zero think time?
- In the Sampler result, which was larger — latency or load time? By how much, and why?
- 10 threads × 5 loops = how many requests? Did the API log agree?

<details>
<summary>Part A answers</summary>

1. X = 120 / (0.2 + 1.25) ≈ **83 requests/second**. With zero think time, each user fires its
   next request as soon as the last returns: X = 120 / 0.2 = **600 requests/second** — over seven
   times the real load. You'd be stress-testing while believing you were load-testing.
2. Examples: (a) "Checkout (`POST /orders` + `POST /orders/{id}/pay`) p95 under 1,500 ms at
   expected peak load"; (b) "At 5× normal peak concurrent users, following the Black Friday
   workload, p95 under 2 s and error rate under 1%"; (c) "Search p95 under 2 s and p99 under 4 s at
   expected peak; zero timeouts (client timeout 10 s)".
3. (a) spike; (b) soak; (c) capacity; (d) load.
</details>

---

## Common mistakes juniors make

- Reporting the **average** response time.
- "We tested with 1,000 users" — with zero think time, which is really a test of a far larger
  and unrealistic load.
- Load-testing a public API or a shared environment without asking.
- Skipping the single-user baseline, then blaming "load" for a query that's slow with one user.
- Treating laptop numbers as production capacity.
- Running JMeter's GUI with heavy listeners for a real load test (Day 29 explains why).
- Only measuring the client side: knowing *that* it's slow without the server metrics that say
  *why*.

---

## Homework (about 40 minutes)

1. **Write a one-page performance test plan** for QA Shop using
   [`templates/test-plan-lite-template.md`](../templates/test-plan-lite-template.md) as a
   starting point. Include: objectives, NFRs (use NFR1–NFR3), the workload model, the test types
   you'll run and their load shapes, the environment and its limitations, entry and exit
   criteria.
2. **Percentiles by hand.** Given 20 response times of your choice (include two outliers),
   calculate the average, median, p90 and max. Explain in one sentence why the average misleads.
3. **Find a real outage.** Look up a public post-incident report about a performance failure
   (many companies publish them). What type of test would have found it?

---

## Check your understanding

<details>
<summary>1. What's the difference between a load test and a stress test, and what is each one's main output?</summary>

A load test runs at the *expected* peak and answers "do we meet the NFRs?" — its output is
pass/fail against the requirements. A stress test pushes *past* expected load until something
breaks and answers "where is the limit, and how does it fail?" — its output is the breaking
point, the failure mode (graceful rejection or collapse), and whether the system recovers.
</details>

<details>
<summary>2. A report says "average response time 400 ms — well within the 1 s requirement". Why should you be suspicious?</summary>

Because the requirement should be a percentile, and an average can sit comfortably at 400 ms
while 10% of users wait 5 seconds. Ask for p90, p95 and p99 and the max, and for the error rate:
fast errors drag the average *down*, so a system failing quickly can look faster than a healthy
one.
</details>

<details>
<summary>3. Using Little's Law: a test with 50 users, 2 s think time and 0.5 s response time — what throughput do you expect? The test actually shows 10 req/s. What does that suggest?</summary>

Expected X = 50 / (0.5 + 2) = 20 req/s. Observing only 10 req/s means each iteration is taking
about 5 s instead of 2.5 s — response times have roughly doubled to around 3 s, or the load
generator itself is struggling, or users are stuck waiting on something (timeouts, a full
connection pool). Check the response-time graph and the server and JMeter-machine resources.
</details>

<details>
<summary>4. Why can a performance test find a functional defect that every functional test missed?</summary>

Some defects only exist when operations overlap in time — race conditions, lost updates,
deadlocks, connection-pool exhaustion. Functional tests run one request at a time, so two orders
never read the same stock value simultaneously. Under concurrent load they do, and a
check-then-update without locking oversells stock. Always verify data integrity after a load
test, not just response times.
</details>

---

## Glossary additions

`performance testing` · `load test` · `stress test` · `spike test` · `soak test` ·
`endurance test` · `capacity test` · `scalability test` · `volume test` · `response time` ·
`elapsed time` · `latency` · `connect time` · `throughput` · `error rate` · `virtual user` ·
`concurrency` · `think time` · `percentile` · `p95` · `Little's Law` · `workload model` ·
`baseline` · `failure mode` · `graceful degradation`
