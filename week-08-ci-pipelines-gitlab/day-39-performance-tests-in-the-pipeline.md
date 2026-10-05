# Day 39 — Performance Tests in the Pipeline: Schedules, Thresholds and Noise

> **Week 8 · Day 39 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.2.2 (non-functional testing), Chapter 5.3 (test monitoring)
> Prerequisites: Days 29–30 (JMeter non-GUI, thresholds), Day 38

---

## At a glance

Functional regressions get caught on every merge request now. Performance regressions — a missing
index, an accidental query in a loop — still slip through, because nobody runs JMeter by hand every
day. Today JMeter joins the pipeline. But performance tests are slow, expensive and noisy, so the
real skill is deciding **when** they run and **how much** to trust a result from a shared machine.

By the end of this session you should be able to:

1. Choose a **tiered strategy**: what performance testing runs per MR, per merge, nightly, per release.
2. Run JMeter in a GitLab job with **properties from CI variables** and an automated **threshold
   gate**.
3. Trigger it **manually with custom variables** and on a **schedule**.
4. Add a **concurrency + data-integrity** job that catches the oversell automatically.
5. Explain why CI performance numbers are **indicative**, and how to make them more trustworthy.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: your exit criteria |
| 0:04 – 0:12 | Should performance tests run in CI? A tiered strategy |
| 0:12 – 0:24 | The `perf-load` job, line by line |
| 0:24 – 0:30 | Manual runs, schedules, matrices |
| 0:30 – 0:36 | The race job, and the noise problem |
| 0:36 – 0:57 | **Lab:** add, run, schedule, compare |
| 0:57 – 1:00 | Homework |

---

## 1. A tiered strategy

| When | What | Load | Gate? |
|---|---|---|---|
| Every MR | Nothing — or a tiny "perf smoke" | 1–5 users, 30 s | Only for order-of-magnitude regressions (e.g. p95 > 5× normal) |
| Merge to `main` | Short load test | Expected load, 2 min | Yes, with generous thresholds |
| **Nightly schedule** | Full load + race/integrity + data checks | Expected peak, 10+ min | Yes — failures raise a ticket the next morning |
| Before a release | Load, stress, spike, soak on a **dedicated, production-like environment** | Whatever the NFRs say | Yes, reviewed by a person |

Why not run a full load test on every MR? It takes minutes, burns compute quota, and — on shared
runners — its numbers are too noisy to compare MR against MR (section 4). A nightly run on `main`
catches the regression within a day, and narrows the culprit to one day's merges.

---

## 2. The `perf-load` job

From the reference pipeline (`reference/.gitlab-ci.yml`), with `JMETER_DIR` pointing at your plan:

```yaml
variables:
  JMETER_VERSION: "5.6.3"
  JMETER_DIR: jmeter
  PERF_THREADS: "20"
  PERF_RAMPUP: "30"
  PERF_DURATION: "120"
  PERF_P95_MS: "1000"
  PERF_ERROR_PCT: "1"

perf-load:
  stage: performance
  extends: .with-api
  needs: ["api-regression"]
  timeout: 30 minutes
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - when: manual
      allow_failure: true
  script:
    - apt-get update -qq && apt-get install -y -qq openjdk-17-jre-headless > /dev/null
    - |
      curl -fsSL -o /tmp/jmeter.tgz "https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz" \
        || curl -fsSL -o /tmp/jmeter.tgz "https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz"
    - tar -xzf /tmp/jmeter.tgz -C /opt
    - export PATH="/opt/apache-jmeter-${JMETER_VERSION}/bin:$PATH"
    - >-
      jmeter -n -t "$JMETER_DIR/qa-shop-load.jmx"
      -Jhost=localhost -Jport=3000
      -Jthreads="$PERF_THREADS" -Jrampup="$PERF_RAMPUP" -Jduration="$PERF_DURATION"
      -l reports/perf-results.jtl -e -o reports/perf-report
      -j reports/jmeter.log
    - >-
      node "$JMETER_DIR/check-thresholds.js" reports/perf-report
      --p95="$PERF_P95_MS" --error-pct="$PERF_ERROR_PCT"
      --label="GET /products/search:2000"
  artifacts:
    when: always
    expire_in: 2 weeks
    expose_as: "Performance report"
    paths:
      - reports/
```

Line by line:

| Part | Why |
|---|---|
| `extends: .with-api` | Same as the API jobs: fresh database, API started and healthy |
| `needs: ["api-regression"]` | No point load-testing a build that fails functionally |
| `timeout: 30 minutes` | A hung load test shouldn't burn quota for the default hour |
| `rules` | Run on schedules and on `main`; on any other pipeline, offer a manual ▶ button |
| `when: manual` + `allow_failure: true` | A manual job that isn't `allow_failure` makes the pipeline show **blocked** until someone runs it |
| `openjdk-17-jre-headless` | JMeter needs Java; the Node image has none. *Headless* = no GUI libraries |
| Two download URLs | `archive.apache.org` keeps every version permanently but can be slow or unreachable; `dlcdn.apache.org` is fast but only hosts current releases. Try one, fall back to the other |
| `export PATH=…` | Lines in `script` share one shell, so later lines find `jmeter` |
| `-J…="$PERF_…"` | Day 29's properties, now fed from CI variables. **The same plan file** serves every load profile |
| `-l` / `-e -o` into `reports/` | `reports/` was created empty in `before_script`, so there's no old JTL to append to and the report folder is new (Day 29's gotchas) |
| `check-thresholds.js` | Day 30's script: reads `statistics.json`, applies the NFRs, exits 1 on a breach → **the job fails** |
| `expose_as` | The dashboard is one click away on the MR |

The JMeter and the API run in the **same container** here — the Day 29 "load generator competes
with the system" problem, in a container with a couple of CPUs. Keep that in mind when reading the
numbers.

---

## 3. Manual runs, schedules and matrices

### Run with different load, without editing YAML

*Build → Pipelines → Run pipeline*: choose a branch and add variables — e.g. `PERF_THREADS` = `50`,
`PERF_DURATION` = `300`. Variables entered here override the defaults in the file for that one
pipeline. That's a stress step on demand.

### Nightly schedule

*Build → Pipeline schedules → New schedule*:

| Field | Value |
|---|---|
| Description | `Nightly load test` |
| Interval pattern | `0 2 * * *` — 02:00 every day (cron syntax: minute hour day month weekday) |
| Cron timezone | `Africa/Lagos` |
| Target branch | `main` |
| Variables | `PERF_DURATION` = `600` |

Scheduled pipelines have `$CI_PIPELINE_SOURCE == "schedule"`, which is what the first rule matches.
**Someone must look at the result.** Set up notifications (*Settings → Integrations*, or email on
failed pipelines) and agree who triages a red nightly run. An unwatched nightly job is a log file,
not a test.

### Several load profiles at once: `parallel:matrix`

```yaml
perf-load:
  parallel:
    matrix:
      - PERF_THREADS: ["10", "50"]
```

GitLab creates **two** jobs, `perf-load: [10]` and `perf-load: [50]`, each with its own variable
value and its own artifacts. A two-point capacity curve every night — though on shared runners the
two may land on different machines, which brings us to noise.

---

## 4. The race job, and the noise problem

### Catching the oversell automatically

Day 30 found it by hand. Make it a nightly check:

```yaml
perf-race:
  stage: performance
  extends: .with-api
  needs: ["api-smoke"]
  allow_failure: true     # known defect: overselling under concurrency (R13) — remove when fixed
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - when: manual
      allow_failure: true
  script:
    - apt-get update -qq && apt-get install -y -qq openjdk-17-jre-headless postgresql-client > /dev/null
    - |
      curl -fsSL -o /tmp/jmeter.tgz "https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz" \
        || curl -fsSL -o /tmp/jmeter.tgz "https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz"
    - tar -xzf /tmp/jmeter.tgz -C /opt
    - export PATH="/opt/apache-jmeter-${JMETER_VERSION}/bin:$PATH"
    - >-
      jmeter -n -t "$JMETER_DIR/qa-shop-load.jmx"
      -Jthreads=50 -Jrampup=5 -Jduration=20 -Jthink_min=0 -Jthink_range=50
      -Jproduct_id=7 -Jorder_percent=100
      -l reports/race.jtl -j reports/jmeter-race.log
    - echo "Orders accepted for product 7 (stock was 25): $(grep -c ',POST /orders,201,' reports/race.jtl)"
    - STOCK=$(psql "$DATABASE_URL" -tAc "SELECT stock FROM products WHERE id = 7")
    - echo "Product 7 stock after the race: $STOCK"
    - test "$STOCK" -ge 0
  artifacts:
    when: always
    paths: [reports/]
```

The last line is the gate: `test "$STOCK" -ge 0` exits 1 if stock is negative, failing the job.
`psql -tAc` prints just the value — no headers, no alignment — so the shell can use it. This job
asserts **data**, not response times: it's the Week 6 lesson that performance tests must verify
integrity, running every night. And since it's a known defect, it's quarantined with
`allow_failure` and a comment saying which rule — exactly as Day 38 prescribes.

(Concurrency bugs are probabilistic. Fifty threads for twenty seconds reproduces QA Shop's reliably,
but a race that only shows up one run in ten needs more load, longer runs, or repetition. A pass
here means "not reproduced", not "impossible".)

### Noise: how much can you trust CI numbers?

Shared runners are **noisy neighbours**: your job shares physical hardware with other people's jobs,
CPU speed varies between machines, and JMeter, the API and PostgreSQL all compete inside one
container. Two identical runs can differ by 30% or more (Day 29's repeatability exercise, but worse).

What that means in practice:

- **Use generous thresholds in CI** — catch "search got 10× slower", not "search got 8% slower".
  The NFR thresholds are a fair start; tightening them on shared runners produces flaky failures,
  and flaky gates get switched off.
- **Watch the trend, not one number.** Keep the artifacts (`expire_in: 2 weeks`) and compare
  `statistics.json` across nights. A steady climb over a week is a real signal even if no single
  night failed.
- **For real performance gating**, use a **dedicated runner** — a self-managed runner on a fixed
  machine that only runs performance jobs (selected with `tags:`) — and test against a
  **production-like environment**, with the load generator on a separate machine.
- **Never compare a CI number with a laptop number.** Different hardware, different test.

---

## Lab (21 minutes)

**Part A — perf-load (8 min).** Add the `performance` stage, the perf variables and `perf-load`.
Point `JMETER_DIR` at your Week 6 folder and change `qa-shop-load.jmx` in the job to your plan's
filename (e.g. `shopper.jmx`). Your plan must use `__P` for `threads`, `rampup`, `duration`, `host`
and `port`, and its sampler names must match the `--label` override; copy `check-thresholds.js`
from `reference/jmeter/` into the same folder. Push to a branch:
the job appears with a ▶ button. Run it. Then open the exposed *Performance report* link.

**Part B — custom load (4 min).** From *Run pipeline* on your branch, run with `PERF_THREADS` = `60`
and `PERF_DURATION` = `60`. Compare the Statistics table with Part A's.

**Part C — the race (5 min).** Add `perf-race` and run it manually. How many orders were accepted?
What stock is left? Is the job orange or red, and why?

**Part D — schedule (4 min).** Create a nightly schedule on `main` (pick a time you'll actually
check). Use *Run* on the schedules page to trigger it now. Which jobs run in a scheduled pipeline
that didn't run on your branch push?

**Debrief questions**
- Compare Part A results across the room: same plan, same load, different runners. How different
  were the p95s? What does that tell you about thresholds?
- Did `perf-race` reproduce the oversell for everyone? If not, why might it not?
- If the nightly run fails at 02:00, who should see it, and what should they do first?

---

## Common mistakes juniors make

- Full load tests on every push, burning the quota and slowing every MR.
- Tight thresholds on shared runners, producing random red pipelines.
- A manual job without `allow_failure: true`, leaving every pipeline "blocked".
- An unwatched nightly schedule.
- Forgetting that the CI container runs JMeter *and* the system — and reporting the numbers as
  capacity.
- Treating "the race job passed" as proof there's no race.
- Hard-coding thread counts in the JMX instead of using properties, so CI can't vary the load.

---

## Homework (about 45 minutes)

1. **Cache JMeter.** The job downloads ~90 MB of JMeter every run. Use a cache (key
   `jmeter-$JMETER_VERSION`, path `.cache/jmeter/`) and only download when
   `.cache/jmeter/apache-jmeter-$JMETER_VERSION` doesn't exist; then add *that* folder's `bin` to
   `PATH`. Compare durations. (Remember: the job must still work when the cache is empty.)
2. **Perf smoke for MRs.** Design a 1-user, 30-second `perf-smoke` job for merge requests with a
   threshold of 5× the normal p95. Write it, run it, and argue in two sentences whether it's worth
   its compute minutes.
3. **Trend.** Run `perf-load` three times on `main`. Download the three `statistics.json` files and
   tabulate the p95 per sampler. Calculate the spread. Would a 20% regression be visible?
4. **Prepare for Day 40:** make sure your pipeline has all stages (smoke, test, data, performance)
   working, and bring a list of anything that's still red.

---

## Check your understanding

<details>
<summary>1. Why is a nightly scheduled load test usually better than a load test on every merge request?</summary>

Load tests take minutes and use significant compute, so running them on every MR slows feedback and
burns quota — and on shared runners their numbers are too noisy to compare one MR with the next. A
nightly run on `main` catches performance regressions within a day, narrows the cause to that day's
merges, and can run longer and heavier. Per-MR checks, if any, should be tiny and only catch
dramatic regressions.
</details>

<details>
<summary>2. A manual job is added without <code>allow_failure: true</code>. What happens to pipelines?</summary>

GitLab treats it as a required step: the pipeline shows as **blocked** (waiting for manual action)
instead of passed, and later stages that depend on it don't run. MRs with "pipelines must succeed"
can't merge until someone clicks ▶. Optional manual jobs need `allow_failure: true`.
</details>

<details>
<summary>3. The <code>perf-race</code> job ends with <code>test "$STOCK" -ge 0</code>. Why is that a better gate than a response-time threshold for this test?</summary>

Because the defect being tested is about **correctness under concurrency**, not speed. Every order
request can succeed quickly while the system sells stock it doesn't have. The only reliable signal
is in the data afterwards — negative stock — so the gate checks the data. Response-time thresholds
would pass happily while the business oversold.
</details>

<details>
<summary>4. A colleague wants to fail the nightly pipeline if search p95 rises above 160 ms, because "last night it was 150". What do you advise?</summary>

That a threshold 7% above one run on a shared runner will fail randomly — run-to-run noise there is
often far larger than 7% — and a gate that cries wolf gets ignored or disabled. Base thresholds on
the NFR (2,000 ms for search) or on a large multiple of the observed baseline, track the trend
across many nights to spot gradual regressions, and move to a dedicated runner and a production-like
environment if fine-grained performance gating is genuinely required.
</details>

---

## Glossary additions

`tiered test strategy` · `perf smoke` · `timeout` · `manual job` · `blocked pipeline` ·
`run pipeline with variables` · `pipeline schedule` · `cron expression` · `parallel:matrix` ·
`noisy neighbour` · `dedicated runner` · `runner tags` · `trend analysis` · `psql -tAc`
