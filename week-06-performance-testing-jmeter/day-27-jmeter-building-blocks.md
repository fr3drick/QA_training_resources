# Day 27 — JMeter Building Blocks: Test Plans, Elements and Scope

> **Week 6 · Day 27 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 6.1 (tool support for performance testing)
> Prerequisites: Day 26

---

## At a glance

JMeter's GUI looks like a filing cabinet that exploded. It isn't — every element belongs to one
of eight families, they run in a fixed order, and they apply according to one scoping rule.
Learn those three things and JMeter stops being mysterious.

By the end of this session you should be able to:

1. Name the eight element families and what each is for.
2. State JMeter's **execution order** and **scoping rule**, and predict what a plan will do.
3. Configure a **Thread Group** (threads, ramp-up, loops, duration).
4. Build a plan with HTTP Request Defaults, headers, samplers and assertions.
5. Read the **Aggregate Report**.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the performance test plan |
| 0:05 – 0:15 | The eight element families |
| 0:15 – 0:23 | Execution order and scope |
| 0:23 – 0:30 | Thread Groups |
| 0:30 – 0:38 | Config, samplers, assertions, listeners for an API |
| 0:38 – 0:57 | **Lab:** build the QA Shop browse plan from scratch |
| 0:57 – 1:00 | Homework |

---

## 1. The eight element families

A JMeter **test plan** is a tree. Everything you add is one of these:

| Family | What it is | Examples you'll use |
|---|---|---|
| **Thread Group** | A group of virtual users and how they start | Thread Group |
| **Sampler** | Sends one request and records the result — the only thing that produces a *sample* | HTTP Request |
| **Logic Controller** | Decides *which* samplers run and how often | Once Only, Transaction, Throughput, If, Loop |
| **Config Element** | Settings and data for samplers | HTTP Request Defaults, HTTP Header Manager, CSV Data Set Config, User Defined Variables |
| **Pre-Processor** | Runs just before a sampler | (rarely needed for REST) |
| **Timer** | Pauses before a sampler — think time | Constant Timer, Uniform Random Timer |
| **Post-Processor** | Runs after a sampler, usually to extract data | JSON Extractor, Regular Expression Extractor |
| **Assertion** | Checks the response; marks the sample failed if wrong | Response Assertion, JSON Assertion, Duration Assertion |
| **Listener** | Collects and displays results | View Results Tree, Summary Report, Aggregate Report |

(That's nine with Thread Group — Thread Groups are the containers; the other eight go inside.)

The equivalent in Postman terms: a **sampler** is a request; **assertions** are `pm.test`; a
**post-processor** is `pm.environment.set(...)` from the response; **config elements** are your
environment and collection-level settings. What Postman doesn't have is the **thread group**:
many copies of the script running *at the same time*.

---

## 2. Execution order and scope

### Order

For **each sampler**, JMeter applies the elements in scope in this order:

```
1. Config elements      (defaults, headers, CSV data)
2. Pre-processors
3. Timers               ← the pause happens here, BEFORE the request
4. ►►  SAMPLER  ◄◄      (the request is sent)
5. Post-processors      (extract token, order id…)
6. Assertions           (pass/fail)
7. Listeners            (record the result)
```

The order is fixed by *type*, **not** by where the element sits in the tree. An assertion placed
above a sampler still runs after it.

### The scoping rule

> An element applies to **every sampler at its own level and below it** in the tree.

```
Test Plan
├── HTTP Request Defaults          ← applies to ALL samplers in the plan
├── HTTP Header Manager (JSON)     ← applies to ALL samplers
└── Thread Group
    ├── Uniform Random Timer       ← runs before EVERY sampler in the group (3 pauses per loop)
    ├── GET /products
    │   └── Response Assertion     ← child of the sampler: applies to this sampler only
    ├── GET /products/{id}
    │   └── Response Assertion
    └── Transaction Controller "Checkout"
        ├── HTTP Header Manager (Authorization) ← only samplers inside "Checkout"
        └── POST /orders
```

Three consequences that catch everyone:

1. **A timer at Thread Group level runs before *every* sampler** in the group, not once per
   loop. Three samplers + a 1-second timer = 3 seconds of think time per iteration.
2. **An assertion at Thread Group level checks *every* sampler.** A "status is 201" assertion
   placed there fails every GET.
3. **Header Managers merge.** The plan-level JSON headers and the checkout-level `Authorization`
   header are both sent on `POST /orders`. If both define the same header, the one closer to the
   sampler wins.

Rule of thumb: put **assertions and extractors as children of the sampler** they belong to, and
put shared config at the highest level it applies to.

---

## 3. Thread Groups

| Setting | Meaning | QA Shop example |
|---|---|---|
| **Number of Threads (users)** | How many virtual users | 20 |
| **Ramp-up period (seconds)** | Time to start them all — users start evenly spread across it | 60 → one new user every 3 s |
| **Loop Count** | Iterations per user; tick *Infinite* to loop until the duration ends | Infinite |
| **Specify Thread lifetime → Duration** | Stop after this many seconds | 300 |
| **Same user on each iteration** | Keep cookies/variables between iterations | Ticked |
| **Action after a Sampler error** | Continue / start next iteration / stop thread / stop test | Continue |

**Ramp-up matters.** Starting 100 users in 0 seconds is a spike test, whether you meant one or
not. A gradual ramp lets you watch response times as load rises — the shape of that curve is
usually the most informative thing in the whole report.

**Loop count vs duration.** "10 users × 50 loops" ends whenever the loops finish, so faster
responses mean a shorter test — awkward to compare. "10 users for 5 minutes" holds load for a
fixed time. **Prefer duration** for load tests.

---

## 4. The elements for an API test

### HTTP Request Defaults (config)

Set protocol, server, port and timeouts **once**. Every HTTP Request in scope inherits anything it
leaves blank — the JMeter version of `{{base_url}}`.

| Field | Value |
|---|---|
| Protocol | `http` |
| Server Name or IP | `localhost` |
| Port Number | `3000` |
| Timeouts: Connect / Response | `5000` / `15000` ms |

**Always set timeouts.** Without one, a hung request waits forever and your test measures nothing.

### HTTP Header Manager (config)

Add at plan level:

| Name | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

### HTTP Request (sampler)

- **GET with query parameters:** put them in the *Parameters* table (`page` = `1`, `limit` =
  `20`) and JMeter builds and encodes the query string. Path: `/products`.
- **POST with a JSON body:** open the *Body Data* tab and paste the JSON:
  ```json
  {"email": "${email}", "password": "${password}"}
  ```
- **Name** every sampler `METHOD path` — `GET /products/{id}`, not `HTTP Request 3`. The name is
  the row label in every report, and samplers with the same name are aggregated together. Name
  `GET /products/1` and `GET /products/2` the same (`GET /products/{id}`) if you want them
  measured as one endpoint.

### Assertions

| Assertion | Use for | Settings |
|---|---|---|
| **Response Assertion** | Status codes, text in the body | *Field to test*: Response Code; *Pattern matching*: Equals; pattern `200` |
| **JSON Assertion** | A value at a JSON path | Path `$.category`, expected value `electronics` |
| **Duration Assertion** | Fail any sample slower than N ms | `2000` |

**The "Ignore Status" trap.** JMeter marks **every 4xx and 5xx response as a failure**, *before*
assertions run. A Response Assertion can mark a sample failed, but can't mark it passed — unless
you tick **Ignore Status**. So if `409 Insufficient stock` is a legitimate, expected answer, you
need *Ignore Status* plus an assertion that accepts `201|409`. Otherwise every sold-out order
counts as an error and your error rate is fiction.

**Keep assertions light under load.** Every assertion costs CPU on the load generator. Check
status codes and one or two key values — save deep validation for your Postman suite.

### Listeners

| Listener | Use | Under load? |
|---|---|---|
| **View Results Tree** | See every request and response in full — debugging | **Never.** Disable it for load runs; it keeps every response in memory |
| **Summary Report** | One row per sampler: count, average, min, max, error %, throughput | OK in the GUI for small runs |
| **Aggregate Report** | Summary plus **median, 90%, 95%, 99% lines** | OK in the GUI for small runs |

Day 29 replaces all GUI listeners with a results file and an HTML dashboard.

### Variables and properties

- `${name}` reads a **variable**. Define fixed ones in a *User Defined Variables* config element.
- `${__P(threads,10)}` reads a **property** called `threads`, defaulting to `10`. Properties can
  be set from the command line with `-Jthreads=50`.

Put every load setting behind a property — threads, ramp-up, duration, host — and one `.jmx`
file becomes a smoke test, a load test and a stress test depending on the command you run it
with. That's how the reference plan works (Day 29).

---

## Lab (19 minutes)

Reset the database. Open JMeter and build a new plan; save it as
`labs/qa-shop/jmeter/browse.jmx`.

1. **Test Plan** → Add → Config Element → **User Defined Variables**: `HOST` =
   `${__P(host,localhost)}`, `PORT` = `${__P(port,3000)}`.
2. **HTTP Request Defaults**: protocol `http`, server `${HOST}`, port `${PORT}`, timeouts 5000 /
   15000.
3. **HTTP Header Manager**: `Content-Type` and `Accept` = `application/json`.
4. **Thread Group "Browsers"**: threads `${__P(threads,5)}`, ramp-up `${__P(rampup,10)}`, loop
   count **10**.
5. Inside it, three **HTTP Requests**, each with a **Response Assertion** child (Response Code
   Equals `200`):
   - `GET /products` with parameters `page` = `${__Random(1,50)}` and `limit` = `20`
   - `GET /products/{id}` with path `/products/${__Random(1,19)}`
   - `GET /products/search` with parameter `q` = `mug`
6. Add a **JSON Assertion** to `GET /products/{id}`: path `$.price`, *Additionally assert value*
   unticked — just that the field exists.
7. Add a **Uniform Random Timer** to the Thread Group: constant delay 500 ms, random range
   1000 ms.
8. Add **View Results Tree** and **Aggregate Report** listeners to the Thread Group.
9. Run. Check a few samples in View Results Tree. Then **disable** View Results Tree (right-click
   → Disable), clear all results, and run again.

**Read the Aggregate Report** and answer:

- Which sampler has the highest **95% line**? By how much compared with the fastest?
- What is the total **throughput**? Does it roughly match Little's Law? (5 users, think time
  averaging 1 s, plus response time.)
- How many samples in total? Explain the number from threads × loops × samplers.

**Then try:** move the timer *inside* the search sampler (as a child). Re-run. What changed in
total test duration and throughput, and why?

**Debrief questions**
- Why did `GET /products/{id}` with random ids appear as a single row?
- What would happen to the report if you'd named the samplers `HTTP Request`, `HTTP Request`,
  `HTTP Request`?
- Search is the slowest — with only 5 users. What would you check *before* blaming load?

---

## Common mistakes juniors make

- A timer at the wrong level, multiplying think time without realising.
- An assertion at Thread Group level that checks every sampler for the wrong status.
- Leaving View Results Tree enabled during a load run — JMeter runs out of memory and the
  "results" are the load generator dying.
- No timeouts in HTTP Request Defaults.
- Every sampler named `HTTP Request`, so the report is one useless row.
- Treating expected 4xx responses as errors because *Ignore Status* wasn't ticked — or ticking
  it with no assertion, so real errors pass.
- Hard-coding `localhost` and `3000` in every sampler.

---

## Homework (about 40 minutes)

1. **Finish the lab** and save `browse.jmx`.
2. **Predict, then verify.** Write down what will happen in each case, then run it and compare:
   (a) 1 thread, 10 loops, no timer; (b) 10 threads, 1 loop, ramp-up 0; (c) 10 threads, 1 loop,
   ramp-up 10. Which one is a spike? What did the API log show?
3. **Element families flash cards.** For each of the eight families, write one sentence on what it
   does and give an example element.
4. **Read** the JMeter user manual section *Elements of a Test Plan* (`jmeter.apache.org`).

---

## Check your understanding

<details>
<summary>1. A Constant Timer of 2,000 ms sits at Thread Group level above four HTTP samplers. How much think time does each iteration include?</summary>

8 seconds. A timer applies to every sampler in its scope and runs before each one, so four
samplers means four 2-second pauses. To pause once per iteration, put the timer as a child of a
single sampler (or use a Flow Control Action sampler with a timer).
</details>

<details>
<summary>2. In the tree, a Response Assertion sits <em>above</em> the HTTP Request it's meant to check, at the same level. Does it run before or after the request? Which samplers does it check?</summary>

After — execution order is by element type, and assertions always run after the sampler. But
because it's at the same level as the samplers (not a child of one), it applies to **every**
sampler at that level and below, not just the one you meant.
</details>

<details>
<summary>3. <code>POST /orders</code> returns 409 when stock runs out, which the spec says is correct. Your load test shows a 40% error rate. What's probably wrong with the test?</summary>

JMeter treats every 4xx as a failed sample by default. The 409s are legitimate business
responses being counted as errors. Tick **Ignore Status** on a Response Assertion for that
sampler, and make the assertion accept both `201` and `409` (pattern `201|409`, matching rule
*Matches*). Then genuine failures — 500s, timeouts, 401s — still count, and the error rate means
something.
</details>

<details>
<summary>4. Why prefer "20 threads for 300 seconds" over "20 threads × 100 loops" for a load test?</summary>

A duration holds a steady load for a known length of time, so runs are comparable — the
before-and-after of a fix both measure 5 minutes at 20 users. With a fixed loop count, the test
ends when the work is done: if the system is slower, the test runs longer, and the two runs
aren't measuring the same thing. Duration-based tests also give you a steady-state period to
analyse.
</details>

---

## Glossary additions

`test plan` · `thread group` · `sampler` · `logic controller` · `config element` ·
`pre-processor` · `timer` · `post-processor` · `listener` · `execution order` · `scoping rule` ·
`ramp-up` · `thread lifetime` · `HTTP Request Defaults` · `HTTP Header Manager` ·
`Response Assertion` · `Ignore Status` · `JSON Assertion` · `Duration Assertion` ·
`View Results Tree` · `Aggregate Report` · `JMeter property` · `__P` · `__Random`
