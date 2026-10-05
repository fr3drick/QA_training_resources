# Day 25 — Building a Maintainable API Regression Suite (Week 5 Project)

> **Week 5 · Day 25 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 1.4.4 (traceability), Chapter 5.3 (test monitoring and reporting), Chapter 6.2 (risks of test automation)
> Prerequisites: Days 21–24
> This session is mostly the interns working. Keep your own talking to about 15 minutes.

---

## At a glance

Anyone can write fifty Postman tests. The hard part is a suite that is still trustworthy and
cheap to run six months later, after the API has changed and the person who wrote it has moved
team. Today is about that — and then you finish your Week 5 suite.

By the end of this session you should be able to:

1. Name the properties of a **maintainable** automated suite, and spot their absence.
2. Measure **coverage** against the specification using traceability tags.
3. Diagnose and fix **flaky** tests rather than retrying them.
4. Review a teammate's collection like code.
5. Hand over a complete, documented API suite with a test summary report.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the known-defects folder |
| 0:05 – 0:15 | What makes a suite maintainable |
| 0:15 – 0:22 | Coverage and traceability |
| 0:22 – 0:27 | Flaky tests |
| 0:27 – 0:50 | **Project sprint** |
| 0:50 – 0:57 | Peer review in pairs |
| 0:57 – 1:00 | Week 5 wrap-up |

---

## 1. What makes a suite maintainable

ISTQB lists the risks of test automation (CTFL 6.2): unrealistic expectations, underestimating
maintenance, over-reliance on the tool. The practical version: **an automated suite is software,
and it rots like software**. These properties slow the rot.

| Property | Looks like | The smell when it's missing |
|---|---|---|
| **Readable** | `POST /orders - qty 11 rejected (R11)`; one behaviour per `pm.test` | `New Request (7)`; a failure nobody can interpret |
| **Independent** | Any folder runs alone; auto-login; tests arrange their own data | "You have to run folder 2 before folder 4" |
| **Repeatable** | Passes on the 1st run and the 50th; unique data via timestamps | Passes once, then 409 "already exists" forever |
| **Environment-agnostic** | `{{base_url}}`, secrets via `--env-var` | `localhost:3000` typed into 40 requests |
| **DRY** (don't repeat yourself) | Common checks and auto-login at collection level | The same 10-line login script pasted into 12 requests |
| **Honest** | Expected results from the spec; tests that can fail | Assertions copied from responses; `status is 2xx` |
| **Fast** | Regression in seconds, smoke in fewer | Fixed `setTimeout` waits; `--delay-request 2000` "to be safe" |
| **Partitioned** | Smoke / regression / known defects as separate folders | One giant run that's always red |

### Test data: the biggest maintenance cost

Most "the test broke" moments are really "the data changed". Pick a strategy per test:

| Strategy | Example | Use for |
|---|---|---|
| **Create your own, uniquely** | `qa.intern+{{$timestamp}}@example.com` | Anything that creates records |
| **Known seed data, read-only** | Product 1 is always `ELEC-001` | Lookups, schemas, BOLA (order 1004 is Ada's) |
| **Known seed data, consumed** | Cancel delivered order 1001 | Only when unavoidable — and reset between runs |
| **Arrange via API in the test** | `pm.sendRequest` to register first | Preconditions the test needs |
| **Arrange via SQL** | Insert a `shipped` order directly | States the API can't reach (Week 7) |

Write down which tests consume seed data. In CI (Week 8) every run starts from a fresh database,
so this matters less there — but on a shared QA server it matters a lot.

---

## 2. Coverage and traceability

"We have 130 assertions" says nothing about what's tested. **Coverage against the specification**
does: which rules have at least one test, and which have none?

If your request names carry rule tags — `(R11)`, `(R20, R21)` — coverage is a script away. The
reference suite includes one:

```bash
node labs/qa-shop/reference/postman/coverage.js labs/qa-shop/postman/qa-shop.postman_collection.json
```

```
R11  6 test(s)
       05 Order validation / Create order - qty 1 (lower boundary) (R11)
       05 Order validation / Create order - qty 10 (upper boundary) (R11)
       ...
R12  1 test(s)
R13  -- NOT COVERED --
...
R22  -- NOT COVERED --

20/22 rules covered (91%)
```

Run it against your own collection. Then **read the gaps**, because they are rarely random:

- **R13 — stock never negative under concurrent orders.** Postman runs requests one at a time.
  It *cannot* test concurrency. That's not a gap in your effort; it's a gap in the tool, and it's
  why Week 6 exists. Say so in your summary report.
- **R22 — every response is JSON.** Covered by a collection-level check that has no request name
  to tag. Coverage tools only see what you label — note it as covered "by the `[all]` checks".

**Coverage is a floor, not a ceiling.** One test per rule is 100% rule coverage and still weak
testing: R11 alone deserves eight. Report *both* "which rules" and "how deeply".

---

## 3. Flaky tests

A **flaky test** passes and fails on the same code without anything changing. Flaky tests are
worse than no tests: they teach the team to ignore red.

| Cause | QA Shop example | Fix |
|---|---|---|
| Order dependence | `Pay order` uses `{{order_id}}` from a request that didn't run | Make it self-contained, or keep it in a workflow folder that always runs whole |
| Shared, consumed data | "Cancel order 1001" passes the first time, then fails | Reset between runs; or create the order you consume |
| Leftover state | Duplicate-email test fails because yesterday's run registered the address | Unique data per run |
| Timing | A tight `responseTime < 200` assertion on a busy laptop | Assert response time against the NFR, not a guess; keep perf for Week 6 |
| Expired credentials | A token pasted in an hour ago | Auto-login with expiry check |
| Environment | Passes locally, fails on the QA server with older data | Don't depend on data you don't control |

**Never "fix" flakiness by re-running until it's green.** Find which row of the table you're in.
The cause is almost always state.

---

## 4. Reviewing a collection like code

From Week 8, collections go through merge requests. A reviewer should check:

- [ ] Names follow the convention and carry rule tags
- [ ] No hard-coded hosts, ports, tokens or passwords — and no secrets in exported shared values
- [ ] Each test checks values, not just status; expected values trace to the spec
- [ ] Negative and boundary tests exist for every new rule
- [ ] New tests run alone and repeatedly
- [ ] Known defects are in `99 Known defects`, not in regression
- [ ] Nothing commented out "temporarily"

**About JSON diffs:** an exported collection is one big JSON file, and changing one assertion
can produce a large diff if the export reorders things. Keep diffs readable by always exporting
the same way (v2.1, same tool version) and committing small, focused changes.

---

## 5. The Week 5 project

Finish your QA Shop API suite. Use the rest of the session, then complete it as weekend homework.

### Deliverables

All in `labs/qa-shop/postman/`:

1. **`qa-shop.postman_collection.json`** with at least these folders:

   | Folder | Contents |
   |---|---|
   | `01 Smoke` | 3–5 requests that prove the build is worth testing. Runs in under 5 seconds |
   | `02 Auth` | R1–R6 |
   | `03 Products` | R7–R10, including schema validation |
   | `04 Order workflow` | The full chain from Day 23, with side-effect checks on stock |
   | `05 Order validation` | R11–R16 negative and boundary tests |
   | `06 Data-driven …` | At least one data-driven request with a JSON data file |
   | `99 Known defects` | One request per defect found, asserting the **correct** behaviour |

2. **`local.postman_environment.json`** — no secrets in shared values.
3. **`data/`** — your CSV/JSON data files.
4. **`run-tests.sh`** (or `.ps1`) — runs smoke, regression and known-defects separately, with
   JUnit and HTML reports.
5. **`README.md`** — how to run each suite, in a few lines.
6. **Coverage output** from `coverage.js`, with a sentence explaining every uncovered rule.
7. **Bug reports** — one per defect in `99 Known defects`, using the course template.
8. **A test summary report** (half a page), as from Day 20:
   - What was tested (rules, endpoints) and **what was not** — and why (R13!)
   - Results: assertions run, passed, failed; defects by severity
   - Residual risk in one sentence
   - Recommendation: ship / ship with known issues / don't ship

### Definition of done

- `./run-tests.sh smoke` and `./run-tests.sh regression` both exit **0** on a freshly reset
  database, and again on a second run without a reset.
- `./run-tests.sh known-defects` exits **1**, and every failure maps to a bug report.
- A classmate can run all three from your README without asking you anything.

### Peer review (7 min, in pairs)

Swap repositories. Run your partner's suites from their README. Review their collection against
the checklist in section 4. Give them three findings — at least one positive.

---

## Week 5 wrap-up

You started the week clicking *Send*. You end it with a regression suite that runs in seconds
from one command, produces machine- and human-readable reports, and tells you — by exit code —
whether the API still meets its specification. That's the single most valuable piece of
automation a QA engineer typically owns.

You've also found where it stops: Postman sends one request at a time, so it can't tell you what
happens when 100 customers want the last 25 Jollof pots at once. Next week, JMeter.

---

## Weekend homework (about 90 minutes)

1. **Complete the project** to the definition of done.
2. **Compare with the reference** in `labs/qa-shop/reference/postman/` — run it, read it. Write
   down two things it does better than yours and one thing yours does better.
3. **Install JMeter** for Monday: install a Java JDK/JRE (17 or later), then download the Apache
   JMeter **binary** zip from `jmeter.apache.org`, unzip it, and run `bin/jmeter` (macOS/Linux) or
   `bin\jmeter.bat` (Windows). The GUI should open.
4. **Read ahead:** what's the difference between *response time*, *latency* and *throughput*?
   Write one sentence each in your own words.

---

## Check your understanding

<details>
<summary>1. Your suite has 100% rule coverage according to the coverage script. Your lead says that's not good enough. Why might they be right?</summary>

Rule coverage only says each rule has *at least one* test. A rule like R11 (`qty` is an integer
from 1 to 10) needs boundary tests at 0, 1, 10 and 11 plus invalid types and missing values;
one test "covers" it and misses most of the defects. Coverage also can't judge assertion
quality — a test that only checks status still counts. Report coverage alongside depth (tests
per rule, boundary and negative tests included) and remember what the tool can't test at all.
</details>

<details>
<summary>2. A test passes when you run the whole collection but fails when run alone. What's the likely cause, and what are your two options?</summary>

Order dependence: it relies on a variable (a token, an order ID) or on data that an earlier
request produced. Either make it self-contained — auto-login, `pm.sendRequest` to arrange its own
preconditions — or accept the dependency deliberately by keeping it inside a workflow folder that
always runs top to bottom, and say so in the folder description.
</details>

<details>
<summary>3. Why can't Postman/Newman test R13 ("stock must never go below zero, including when many customers order at the same time")?</summary>

Newman sends requests sequentially, one after another. A race condition needs requests that
overlap in time so that two of them read the same stock value before either writes. Even with
many iterations, sequential requests never overlap. You need a tool that runs many concurrent
virtual users — JMeter, k6, Gatling — which is Week 6.
</details>

<details>
<summary>4. The team proposes adding automatic retries — any failed test re-runs up to three times. What's your response?</summary>

Retries hide the problem rather than fixing it. A test that passes on retry is telling you about
shared state, order dependence, timing assumptions or real intermittent defects — and a real
intermittent defect (like a race condition) is exactly what you'd be hiding. Find the cause from
the flakiness table and fix it. If the flakiness is in the product, that's a bug report, not a
retry setting.
</details>

---

## Glossary additions

`maintainability` · `DRY` · `test data strategy` · `seed data` · `consumed data` ·
`traceability tag` · `rule coverage` · `coverage depth` · `flaky test` · `test review` ·
`definition of done` · `test summary report`
