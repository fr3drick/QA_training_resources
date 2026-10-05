# Day 40 — Capstone: The Full Quality Pipeline, and a Defect From Report to Regression Test

> **Week 8 · Day 40 · 60 minutes**
> ISTQB CTFL v4.0 mapping: all chapters; especially 2.1 (testing in the SDLC), 5.5 (defect management), 6 (tools)
> Prerequisites: everything
> This session is mostly the interns working. Keep your own talking to about 12 minutes.

---

## At a glance

Eight weeks ago you were learning what a defect is. Today you take one — a real, critical security
defect you found yourself in Week 5 — through its entire life: reported, quarantined, fixed in a
merge request, proven fixed by the pipeline, and promoted into the regression suite so it can never
silently come back. Along the way you assemble and defend the complete pipeline.

By the end of this session you should have:

1. A complete pipeline: **smoke → API regression + quarantine → data integrity → performance**.
2. Taken one defect through the **full quality loop** in a single merge request.
3. A five-minute presentation of what your pipeline guarantees — and what it doesn't.
4. A plan for what to learn next.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:07 | The whole picture: eight weeks in one pipeline |
| 0:07 – 0:42 | **Capstone** (pairs) |
| 0:42 – 0:54 | Presentations |
| 0:54 – 1:00 | What comes next |

---

## 1. The whole picture

```
                                   merge request opened / pushed
                                               │
  ┌──────────── smoke ────────────┐            ▼
  │ api-smoke                      │  Newman, folder 01, --bail            (Days 21–24, 37)
  │   API starts, DB seeds, login  │  "is this build worth testing?"
  └───────────────┬────────────────┘
                  │
  ┌──────────── test ─────────────────────────────────────────────┐
  │ api-regression                 │ api-known-defects  (orange)  │  (Days 22–25, 37–38)
  │   rules R1–R22, data-driven    │   quarantined, linked bugs   │
  │   BLOCKS the merge             │   informs, never blocks      │
  └───────────────┬───────────────────────────────────────────────┘
                  │
  ┌──────────── data ─────────────┐
  │ data-integrity                 │  exercise the API, then SQL checks    (Days 31–35, 38)
  │   critical checks → exit code  │  "did the system corrupt its data?"
  └───────────────┬────────────────┘
                  │
  ┌──────────── performance (main, nightly, manual) ──────────────┐
  │ perf-load                      │ perf-race                    │  (Days 26–30, 39)
  │   NFR thresholds → exit code   │   concurrency → stock ≥ 0    │
  └───────────────────────────────────────────────────────────────┘
                  │
           green + reviewed ──► merge ──► the same pipeline runs on main
```

Every box is something you built: the collection, the JMeter plan, the threshold script's inputs,
the SQL suite, the jobs. Every arrow is an exit code. And the boxes map onto the course:

| Question the pipeline answers | Built in |
|---|---|
| Does each documented rule still hold? | Week 5 — Postman/Newman, traceability tags |
| Which known bugs are still open? | Week 5 quarantine → Week 8 `allow_failure` |
| Does it stay fast under expected load? | Week 6 — JMeter, NFR thresholds |
| Does it stay *correct* under concurrency? | Week 6 race → Week 7 locking → Week 8 `perf-race` |
| Is the stored data consistent? | Week 7 — data-quality suite |
| Can anyone run all of this, any time, identically? | Week 8 — fresh containers, seeded DB, one YAML file |

**What it still can't tell you** — say this in your presentation: whether the product is *usable*,
whether the requirements were *right*, anything the spec doesn't say, behaviour in the browser or
mobile app, security beyond the cases you encoded, and anything that only happens in production.
Exploratory testing, refinement questions and judgement are still your job. The pipeline gives you
the time to do them.

---

## 2. The capstone (35 minutes, in pairs)

### Part 1 — assemble and compare (10 min)

Make sure your project's `.gitlab-ci.yml` has all four stages working (Days 36–39). Then compare it
with `reference/.gitlab-ci.yml`:

```bash
git diff --no-index reference/.gitlab-ci.yml .gitlab-ci.yml
```

For every difference, decide: is yours better, is the reference better, or is it a deliberate
choice? Write down three.

### Part 2 — the full quality loop for one defect (20 min)

The defect: **BOLA on `GET /orders/{id}`** (R17) — logged in as Efe, you can read Ada's order 1004.
You found it in Week 5; it's in your `99 Known defects` folder, failing every pipeline in the
quarantined job.

Today you play **both** roles — developer and tester — so you can see the whole loop. On a real team
the developer fixes the code; you'd review the MR and own the test changes.

**Step 1 — branch.**

```bash
git switch main && git pull
git switch -c fix-bola-get-order
```

**Step 2 — fix the code.** In `app/src/app.js`, find the `GET /orders/:id` handler. Compare it with
the `pay` and `cancel` handlers just below it — they already do what `GET` forgets. Make `GET` return
`404` when the order doesn't belong to the logged-in customer. (It's a three-line change. Ask the
instructor if you're stuck after five minutes.)

**Step 3 — prove it locally.** Rebuild and restart QA Shop (`docker compose up -d --build`), then run
**only** the BOLA request from your known-defects folder with Newman. It should now pass.

**Step 4 — promote the test.** In Postman, **move** the BOLA request from `99 Known defects` into
`04 Order workflow` (or a security folder that regression runs). Update its name if it described the
bug ("customer can read another customer's order") rather than the rule ("another customer's order
is not visible (R17)"). Also add matching requests for `pay` and `cancel` on order 1004 if you don't
have them — they pass already, and now they'll *stay* passing. Export the collection.

**Step 5 — commit and push both changes together.**

```bash
git add app/src/app.js postman/qa-shop.postman_collection.json
git commit -m "Enforce order ownership on GET /orders/:id (R17); move BOLA test into regression"
git push -u origin fix-bola-get-order
```

Open a merge request. In the description, link the bug report and say what you changed and how it's
tested.

**Step 6 — read the pipeline like a reviewer.**
- `api-regression`: green — and the Tests tab now **includes** the BOLA test, passing.
- `api-known-defects`: still orange (other defects remain), but with **one fewer** failure.
- `data-integrity`: unchanged — BOLA doesn't touch data.

**Step 7 — merge**, then confirm the pipeline on `main` is green and update the bug report: fixed in
MR !*n*, verified by pipeline #*m*, regression test added.

That is the complete life of a defect in a modern team: **found by a test, reported with evidence,
quarantined so the gate stays honest, fixed with a review, proven by the same test, and protected
forever by moving the test into regression.**

### Part 3 — prepare the presentation (5 min)

Five minutes, as if to your future team lead:

1. Your pipeline graph — what each stage guards.
2. The defect loop from Part 2, with links: bug report → MR → pipeline → regression test.
3. What's in quarantine and why; what `allow_failure` is still set, and what would let you remove it.
4. One thing the pipeline **cannot** tell you, and how you'd cover it.
5. The one change you'd make next.

---

## 3. Presentations (12 minutes)

Keep strictly to time. The audience asks one question per pair.

<details>
<summary>Facilitator: what strong capstones show</summary>

- **The fix is minimal and mirrors existing code** — the same ownership check that `pay` and
  `cancel` use, returning `404` (not `403`, which would confirm the order exists — R17 says `404`):
  ```js
  if (!order || order.customer_id !== req.customerId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  ```
- **The test moved in the same MR as the fix.** Strong pairs explain why: if the test moves later,
  there's a window where the bug could return unnoticed; if it moves earlier, the regression job
  goes red.
- **They checked the other two endpoints** that take an order ID, and added regression tests for
  them even though they already passed — "they work today" is exactly when to lock them in.
- **They can explain every `allow_failure`** in their pipeline, with a linked reason and an exit
  plan.
- **They're honest about limits**: CI performance numbers are indicative; the race job passing isn't
  proof of no race; the pipeline knows nothing about UI or usability.
- **Their commit message and MR description** would make sense to someone reading them in a year.
- **Bonus**: pairs who also fixed D2 (`qty: 0` — one character) and showed the "Order lines with
  qty <= 0" data check disappearing from the report after the known-defects exercise.
</details>

---

## 4. What comes next

### What you can do now that you couldn't eight weeks ago

- Turn a specification into designed, traceable tests — and find the gaps in it.
- Automate API checks into a suite that runs from one command and reports in standard formats.
- Model a workload, load-test it, find the knee and explain the bottleneck.
- Stand up databases, review schemas, create any test data you need, and prove data defects with SQL.
- Build a CI pipeline that enforces all of it on every change — and keep its gates honest.

### Where to go from here

| Area | Next step | Why |
|---|---|---|
| UI automation | **Playwright** (or Cypress): locators, page objects, running in CI | The layer this course deliberately skipped — now you know where it fits: a thin top of the pyramid |
| API automation in code | Playwright's API testing, **pytest + requests**, or REST Assured | Postman scales to a point; code-based suites scale further and live with the app |
| Contract testing | **Pact**, OpenAPI schema validation in CI | Catch breaking API changes between teams before integration |
| Performance | **k6** (scriptable in JavaScript, CI-friendly); JMeter distributed mode | Different tool, same concepts — you already know the hard part |
| Security | **OWASP ZAP** baseline scan in CI; OWASP API Security Top 10 | You've found BOLA and user enumeration by hand; automate the scans |
| Databases | Migration tools (Flyway, Liquibase); query plans in depth | Test schema changes before they reach production |
| Observability | Logs, metrics and traces (Grafana, Prometheus, OpenTelemetry) | Testing in production is real — learn to read what the system says about itself |
| Certification | ISTQB **CTFL** first; then *Test Automation Engineering*, *Performance Testing* | Structured vocabulary, and a CV signal |

### Habits that compound

- **Keep your QA Shop project.** It's a portfolio piece: a pipeline, three kinds of testware, bug
  reports, a performance report, a database test report. Show it in interviews.
- **Every bug you find, ask: which automated check would have caught it?** Then write it.
- **Read the pipeline's red before you read your messages** in the morning.
- **Keep gates honest.** Quarantine with a reason and an exit plan; never `|| true` a verdict.
- **Never say "it works".** Say what you tested, how, and what you didn't.

---

## Final exercise — for after the course

Take a real application you have access to (your team's, or an open-source project with an API).
Write a one-page **pipeline test strategy** for it, using today's diagram as a template:

1. What runs on every MR, and what does each job guard?
2. What runs nightly? What runs before a release, and where?
3. What blocks a merge, what only informs, and why?
4. What test data does each job need, and where does it come from?
5. What can the pipeline never tell you about this product?

Bring it to your next interview. A candidate who can draw the pipeline for the interviewer's own
product — and say what it can't catch — is having a different conversation from everyone else.

---

## Course glossary

Every term from all 40 days is in [GLOSSARY.md](../GLOSSARY.md).

---

## Closing note for the instructor

Things worth saying out loud on the last day:

- Weeks 1–4 gave them vocabulary and judgement; Weeks 5–8 gave them tools. Neither half works
  without the other — a pipeline full of tests designed without judgement is a fast way to be
  confidently wrong.
- Show them their own Week 5 collection next to today's pipeline. Most can't believe they built it.
- The defect loop in Part 2 is the single most important thing in Weeks 5–8. If you have extra time,
  have every pair do it for a second defect.
