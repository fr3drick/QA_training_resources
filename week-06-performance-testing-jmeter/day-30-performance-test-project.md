# Day 30 — Performance Test Project: Load, Stress, Spike, and the Race Condition

> **Week 6 · Day 30 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.2.2 (non-functional testing), Chapter 5.3 (test reporting)
> Prerequisites: Days 26–29
> This session is mostly the interns working. Keep your own talking to about 12 minutes.

---

## At a glance

Today you run a complete, small performance test campaign against QA Shop and report it the way
a stakeholder needs to read it. You'll also find a defect that **no functional test in Week 5
could find**.

By the end of this session you should have:

1. Run a **baseline, load, stress** and **spike** test against QA Shop.
2. Proved or disproved **R13 / NFR3** — stock integrity under concurrency.
3. Turned the NFRs into an automated **pass/fail** check.
4. Written a **performance test report** with a clear verdict.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: capacity summaries — where was everyone's knee? |
| 0:05 – 0:12 | Spike tests, race conditions, and automated pass/fail |
| 0:12 – 0:17 | What a performance report must say |
| 0:17 – 0:52 | **Project:** the test campaign (pairs) |
| 0:52 – 0:57 | Findings round-robin |
| 0:57 – 1:00 | Week 6 wrap-up |

---

## 1. Three more techniques

### Spike tests in JMeter

Use **two Thread Groups** in one plan, running at the same time:

| Thread Group | Threads | Startup delay | Ramp-up | Duration |
|---|---|---|---|---|
| "Steady shoppers" | 20 | 0 s | 20 s | 180 s |
| "Spike" | 150 | **60 s** | **5 s** | 30 s |

(*Startup delay* is in the Thread Group's *Specify Thread lifetime* section. Copy the shopper
steps into the second group, or put them in a *Test Fragment* and call it from both with *Module
Controllers*.)

In the dashboard, the *Active Threads Over Time* chart shows a plateau with a tower on it. Look at
three periods in *Response Times Over Time*:

1. **Before** the spike — the baseline.
2. **During** — how bad does it get? Errors? Timeouts?
3. **After** — does it return to baseline within a minute, or stay slow? **Recovery** is often the
   real finding: a system that stays degraded after the surge has gone (stuck connections, a
   backlog it can't clear) will fail on salary day even if it survived the first spike.

(The **Ultimate Thread Group** from the JMeter Plugins Manager, and the built-in **Open Model
Thread Group**, let you draw any load shape in one group. Useful later; not needed today.)

### Race conditions: R13 and NFR3

R13 says *stock must never go below zero, including when many customers order the same product
at the same time.* Product 7, the Limited Edition Jollof Pot, starts with **25** in stock.

Postman can't test this (Day 25). JMeter can: send every shopper after product 7, at once.

The reference plan takes two properties for this:

```bash
mkdir -p results && rm -f results/race.jtl
jmeter -n -t qa-shop-load.jmx \
  -Jthreads=50 -Jrampup=5 -Jduration=20 \
  -Jthink_min=0 -Jthink_range=50 \
  -Jproduct_id=7 -Jorder_percent=100 \
  -l results/race.jtl
```

Then look at the data:

```bash
curl http://localhost:3000/products/7
```

```json
{"id":7,"sku":"HOME-002","name":"Limited Edition Jollof Pot", ... ,"stock":-2}
```

And count the successful orders in the results file:

```bash
grep -c ',POST /orders,201,' results/race.jtl
```

If more than 25 orders succeeded and stock is negative, you've found an **oversell**: two orders
both read "1 left", both pass the stock check, both decrement. It's a check-then-act race — the
check and the update aren't atomic. Every response was a perfectly valid `201`. **The response
times looked fine. The functional tests all passed. The business sold goods it doesn't have.**

That's why the rule is: **after every load test, verify the data**, not just the timings. Week 7
gives you SQL to do it properly; Week 8 automates it.

### Automated pass/fail

A dashboard needs a human. A pipeline needs a yes or no. The reference suite includes
`check-thresholds.js`, which reads the dashboard's `statistics.json` and applies the NFRs:

```bash
node ../reference/jmeter/check-thresholds.js results/report-20 \
  --p95=1000 --error-pct=1 --label="GET /products/search:2000"
```

```
┌─────────┬─────────────────────────┬─────────┬─────────┬────────┬────────┬──────────┬────────┐
│ (index) │ label                   │ samples │ error % │ avg ms │ p95 ms │ limit ms │ result │
├─────────┼─────────────────────────┼─────────┼─────────┼────────┼────────┼──────────┼────────┤
│ 0       │ 'POST /orders'          │ 202     │ '0.00'  │ '67'   │ '88'   │ 1000     │ 'PASS' │
│ 1       │ 'GET /products/search'  │ 680     │ '0.00'  │ '87'   │ '154'  │ 2000     │ 'PASS' │
│ ...                                                                                          │
└─────────┴─────────────────────────┴─────────┴─────────┴────────┴────────┴──────────┴────────┘
Overall: 2483 samples, 0.00% errors (limit 1%), 62.6 req/s

All performance thresholds passed.
```

It exits **0** when every threshold passes and **1** when any fails — the same contract as Newman
(Day 24). On Day 39 this is what decides whether the performance stage of the pipeline goes red.

---

## 2. The performance test report

A performance report is read by people who will make a decision from its first paragraph. Put
the verdict first.

```
1. SUMMARY (5 lines)
   Verdict against each NFR: met / not met. The single most important finding.
   Recommendation.

2. SCOPE AND OBJECTIVES
   What questions this campaign answered. What it did not cover.

3. ENVIRONMENT AND LIMITATIONS
   Hardware, versions, data volume. Why results are/aren't representative of production.

4. WORKLOAD MODEL
   Journeys, mix, think time, data. Where the numbers came from.

5. TESTS RUN
   Type | load shape | duration | date | result folder

6. RESULTS AGAINST NFRs
   Table: NFR | target | measured | met?

7. FINDINGS
   Each with: what was observed, evidence (chart, numbers), impact, severity.
   Includes functional defects found under load.

8. BOTTLENECK ANALYSIS
   What saturated first, and the evidence (server metrics).

9. RECOMMENDATIONS
   Specific, testable: "add a trigram index to products.name/description and re-test search at
   200 users", not "improve performance".

10. APPENDIX: links to dashboards, JTL files, test plan version.
```

**Say what you didn't test.** "No soak test was run; memory leaks over hours are untested" is the
sentence that protects you and the team in six months.

---

## 3. The project (35 minutes, in pairs)

Reset the database before **every** run. Use your own plan if it's complete, otherwise the
reference `labs/qa-shop/reference/jmeter/qa-shop-load.jmx`. Keep every results folder.

| # | Test | Settings | Question |
|---|---|---|---|
| 1 | **Baseline** | 1 thread, 60 s | What's each endpoint's best-case time? Is anything slow with *one* user? |
| 2 | **Load** | 20 threads, 30 s ramp, 180 s | Does QA Shop meet NFR1 and NFR2? Run `check-thresholds.js` |
| 3 | **Stress** | Step up: 50, 100, 200, 300, 400… (Day 29 loop) until NFR1 breaks or errors appear | Where's the knee? How does it fail? |
| 4 | **Spike** | Two thread groups as in section 1 | Does it survive and recover? |
| 5 | **Race** | The R13 command in section 1 | Does stock go negative? |
| 6 | **Data check** | After test 5 | Use `curl` (or SQL, if you remember Day 15) to count the damage |

**Bonus (if time):** `GET /products?limit=100000` once with `curl -w "%{time_total} %{size_download}\n"`.
How long, how big? What would 20 users doing that at once do? Which rule does it break?

### Deliverable: `labs/qa-shop/jmeter/PERFORMANCE_REPORT.md`

Using the structure in section 2. Maximum two pages. It must include:

- The NFR table with measured values and met/not met.
- Your capacity estimate and knee, with the *Time vs Threads* chart or your table.
- The race-condition finding written as a **bug report** (rule, steps to reproduce with the exact
  command, expected vs actual, evidence, severity and priority with justification).
- At least two specific recommendations.
- A "not tested" section.

---

## Findings round-robin (5 min)

Each pair gives one finding in one sentence, with the evidence. No repeats.

<details>
<summary>Facilitator: findings a strong campaign produces</summary>

- **Critical — overselling under concurrency (R13, NFR3).** Product 7 oversold: more than 25
  successful orders, stock negative. Silent: every response was `201`. Root cause class:
  check-then-act without a transaction or row lock, made wider by the 50 ms "risk check" between
  the check and the update. Business impact: orders accepted for goods that don't exist — refunds,
  cancellations, reputational damage on exactly the high-demand products where it matters most.
- **NFR1/NFR2 met at 20 users** on a laptop, with large headroom. Caveat: laptop, shared CPU,
  not production-like.
- **Knee somewhere around 200–400 users** (varies by machine). `GET /products` and search
  degrade first — both hit the database hard (a `count(*)` over 200,000 rows on every list; an
  un-indexed `ILIKE '%term%'` on search).
- **`limit` is uncapped (R7).** One request returns ~100,000 products (~20 MB) in under a second
  on an idle laptop; a handful of concurrent ones is a cheap denial-of-service.
- **Spike recovery**: good answers report whether response times returned to baseline after the
  spike, and how long it took.
- **The strongest reports** recommend re-testing after specific fixes (trigram index; cap
  `limit`; atomic conditional stock update + `CHECK (stock >= 0)`), and say what wasn't tested
  (soak, production-like hardware, realistic network latency).
</details>

---

## Week 6 wrap-up

You can now design a workload, script it with realistic data and correlation, run it properly,
read the curve, find the knee, and report it — and you've seen a defect that hides behind fast,
successful responses until real concurrency arrives.

Next week you go underneath the API into the database: setting it up yourself, designing tables
and constraints, querying it seriously — and discovering why `count(*)` and `ILIKE '%term%'`
were slow, and which missing constraint would have stopped the oversell.

---

## Weekend homework (about 90 minutes)

1. **Finish the report** to the standard above.
2. **Read the code.** Open `labs/qa-shop/app/src/app.js` and find the `POST /orders` handler.
   Without changing anything, explain in plain English (a) where the race condition is, and
   (b) why the 50 ms "risk check" makes it more likely. You're not expected to fix it — but a
   tester who can point at the line gets listened to.
3. **Install for Monday:** DBeaver Community Edition (free, `dbeaver.io`). Confirm Docker still
   works: `docker run --rm hello-world`.

---

## Check your understanding

<details>
<summary>1. Every request in the race test returned 201 in under 200 ms. Why is the test still a failure?</summary>

Because it broke a functional rule (R13) and an integrity NFR (NFR3): more orders were accepted
than there was stock. Response codes and times only describe what each request *said*; the
damage is in the data. Performance tests must end with data verification, or they can pass while
the business loses money.
</details>

<details>
<summary>2. Why is recovery after a spike sometimes more important than performance during it?</summary>

Spikes are short; their after-effects may not be. If the system can't clear its backlog — stuck
connections, saturated queues, exhausted pools — it stays degraded for every user long after the
surge has ended, and a second spike lands on an already-sick system. A system that slows during a
spike but recovers in a minute is usually acceptable; one that never recovers is an outage.
</details>

<details>
<summary>3. Your report says "The system handles 400 users." What's wrong with that sentence?</summary>

It doesn't say *within what NFR*, *doing what workload*, *on what environment*. At 400 users on
the laptop, p95 was over 2 seconds — it "handled" them only in the sense of not crashing. Write
instead: "On a single laptop, QA Shop met NFR1 (p95 < 1 s) up to about N users following the
standard shopper workload; beyond that, response times rose sharply. Results are not
representative of production hardware."
</details>

<details>
<summary>4. How does turning the NFRs into an exit code change who can use your performance test?</summary>

A dashboard needs a person to read and judge it. An exit code lets a pipeline, a scheduler or a
release gate act on the result automatically — run the load test every night and go red when a
change pushes p95 over the threshold. It turns a one-off investigation into a continuous
regression check, which is what Day 39 builds.
</details>

---

## Glossary additions

`test campaign` · `baseline test` · `spike recovery` · `startup delay` · `Test Fragment` ·
`Module Controller` · `Ultimate Thread Group` · `Open Model Thread Group` · `race condition` ·
`check-then-act` · `oversell` · `data verification` · `performance threshold` ·
`performance test report`
