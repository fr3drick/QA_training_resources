# Day 38 — Quality Gates: Quarantine, Data Checks, Pipeline Flow and Debugging

> **Week 8 · Day 38 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 5.1.3 (entry and exit criteria), Chapter 5.3 (test monitoring), Chapter 5.5 (defect management)
> Prerequisites: Day 37; your Week 7 data-quality suite

---

## At a glance

A pipeline is a set of **exit criteria** (Day 4) that a machine enforces. Today you decide which
checks **block** a change, which only **inform**, and how to keep the gate trustworthy when there
are known bugs nobody has fixed yet. Then you add the database checks from Week 7 — and learn to
debug a pipeline when it goes red for reasons that aren't obvious.

By the end of this session you should be able to:

1. Quarantine known defects with **`allow_failure`** without hiding them.
2. Run the **SQL data-quality suite** in a job, after exercising the API.
3. Control flow with **`needs`** and **`rules`**.
4. Explain **cache vs artifacts**.
5. Debug a failed job methodically, and reproduce it locally.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: cache vs artifacts — what did you notice? |
| 0:04 – 0:12 | Blocking vs informing: quality gates and quarantine |
| 0:12 – 0:20 | The data-integrity job |
| 0:20 – 0:28 | `needs`, `rules`, cache vs artifacts |
| 0:28 – 0:36 | Debugging a red pipeline |
| 0:36 – 0:57 | **Lab:** quarantine, data checks, then a debugging drill |
| 0:57 – 1:00 | Homework |

---

## 1. Blocking vs informing

Not every check should stop a merge. Decide deliberately:

| Check | Blocks the merge? | Why |
|---|---|---|
| Smoke | **Yes** | If the API can't start or log in, nothing else matters |
| API regression | **Yes** | These describe behaviour that works today; a failure is a new regression |
| Known defects (quarantine) | **No — but visible** | They fail *by design* until the bug is fixed |
| Data integrity — critical checks on clean data | **Yes** | Money and stock corruption must never merge |
| Data integrity — while historical bad data exists | **No — but visible** | Otherwise every pipeline is red forever |
| Performance | Depends (Day 39) | Noisy environments make strict gates flaky |

The danger in both directions:

- **Too strict**: a gate that fails for known reasons is red every day. People stop reading it,
  then someone disables it "temporarily". You've lost the gate entirely.
- **Too lax**: a gate that can't fail (`|| true`, `-x`, everything `allow_failure`) is decoration.

### Quarantine with `allow_failure`

```yaml
api-known-defects:
  stage: test
  extends: .with-api
  allow_failure: true          # a failure shows as an orange warning, not a red failure
  script:
    - >-
      newman run "$COLLECTION" -e "$ENVIRONMENT" --env-var "base_url=$BASE_URL"
      --folder "99 Known defects"
      -r cli,junit --reporter-junit-export reports/known-defects-junit.xml
  artifacts:
    when: always
    paths: [reports/]
    reports:
      junit: reports/known-defects-junit.xml
```

The job still runs, its results still appear in the Tests tab, and the pipeline shows **passed with
warnings** (an orange "!" on the job). It doesn't block the merge.

**Quarantine rules** — without these, quarantine becomes a graveyard:

1. Every quarantined test **links to a bug report** (put the ticket number in the request name or
   description).
2. **When a quarantined test starts passing, investigate immediately**: either the bug was fixed —
   move the test to regression so it stays fixed — or the test is broken.
3. **Review the quarantine regularly.** A test that's been there for six months is a decision
   nobody made.
4. **Never quarantine a new failure** to get a merge through. That's the opposite of a gate.

---

## 2. The data-integrity job

Week 7's `data-checks.sql` exits non-zero when a critical check fails (Day 35). In a pipeline:

```yaml
data-integrity:
  stage: data
  extends: .with-api
  needs: ["api-smoke"]
  allow_failure: true    # the seed contains known historical defects — see below
  script:
    - apt-get update -qq && apt-get install -y -qq postgresql-client > /dev/null
    # 1. exercise the system, so the checks also catch damage done by the API itself
    - >-
      newman run "$COLLECTION" -e "$ENVIRONMENT" --env-var "base_url=$BASE_URL"
      --folder "04 Order workflow" --folder "05 Order validation" --folder "99 Known defects"
      -r cli > reports/exercise.log || true
    # 2. check the data; psql exits non-zero on a critical violation — print the report either way
    - psql "$DATABASE_URL" -f sql/data-checks.sql > reports/data-checks.txt 2>&1 || { cat reports/data-checks.txt; exit 1; }
    - cat reports/data-checks.txt
  artifacts:
    when: always
    paths: [reports/]
```

Three things to notice:

1. **`psql` isn't in the Node image**, so the job installs it. (`apt-get` works because the
   `node:24-bookworm` image is Debian-based and jobs run as root. It installs PostgreSQL 15's
   client, which works fine against a 17 server for queries like these.)
2. **`|| true` is used deliberately here, and only here.** The Newman run's purpose in this job is
   to *exercise* the API, not to judge it — the regression job does the judging. Its result is
   kept in `exercise.log`. Compare that with the `|| true` you'd reject in review (Day 37): the
   difference is that this one is intentional, commented, and the real verdict comes from the
   next command.
3. **Why `allow_failure: true`?** QA Shop's seed already contains critical data defects (orders
   1005, 2222 and 2750 — Day 35), so this job fails on a perfectly clean run. The honest
   configuration is: report every run, block nothing — until the data is cleaned up. Then remove
   `allow_failure` and the job becomes a hard gate that stops any change that corrupts data.

### What it catches that API tests don't

Run it after the known-defects folder and the report gains **"Order lines with qty <= 0"** — the
`qty: 0` order created by the known-defects test. Every API response in that run was a plausible
`201`. Only the database check saw that an impossible order now exists. That's the Week 7 lesson,
now running on every push.

---

## 3. Flow: `needs`, `rules`, cache vs artifacts

### `needs`: don't wait for the whole stage

By default, a job waits for **every job in all earlier stages**. `needs` says "start as soon as
*these* jobs succeed":

```yaml
data-integrity:
  stage: data
  needs: ["api-smoke"]     # don't wait for api-regression and api-known-defects
```

The pipeline becomes a graph (GitLab calls it a DAG) instead of a staircase, and finishes sooner.
`needs: []` means "start immediately, depend on nothing".

### `rules`: when should a job run?

```yaml
workflow:                  # rules for whether a PIPELINE is created at all
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"   # MR pipelines
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS   # a branch push that has an open MR…
      when: never                                        # …don't run a duplicate branch pipeline
    - if: $CI_COMMIT_BRANCH                              # other branch pushes

data-integrity:
  rules:
    - changes:             # only when something that affects data changed
        - app/**/*
        - db/**/*
        - sql/**/*
```

Rules are checked top to bottom; the first match decides. `when: never` excludes; `when: manual`
adds a ▶ button; `allow_failure` can be set per rule. The `workflow` block above avoids a common
waste: a push to a branch with an open MR would otherwise start **two** identical pipelines.

Be careful with `changes`-based rules on quality gates: skipping the data checks because "only the
Postman collection changed" is fine; skipping the regression suite because "only `app/` changed"
would be absurd. Skipping is a risk decision — make it consciously.

### Cache vs artifacts

| | Cache | Artifacts |
|---|---|---|
| Purpose | **Speed**: reuse downloads between pipelines | **Results**: keep and pass outputs |
| Typical content | `.npm/`, a downloaded JMeter | Reports, logs, JTL files |
| Guaranteed to be there? | **No** — best effort; jobs must work without it | Yes, until they expire |
| Visible in the UI? | No | Yes — browse and download |
| Passed to later jobs? | Not as a contract | Yes, to jobs in later stages (or via `needs`) |

Rule of thumb: if losing it only makes the job slower → cache. If losing it loses information →
artifact.

---

## 4. Debugging a red pipeline

Work through this in order. Most failures are found by step 3.

1. **Which job, which stage?** Smoke failing means "the system is broken or didn't start"; one
   regression test failing means "one behaviour changed".
2. **Read the job log from the top of the failure, not the bottom.** The last line is usually
   `ERROR: Job failed: exit code 1` — useless. Scroll up to the **first** error. Is it in
   `before_script` (environment) or `script` (tests)?
3. **Check the artifacts.** The Newman HTML report shows the failing request and response;
   `api.log` shows what the server did; `data-checks.txt` shows which check failed.
4. **What changed?** Compare with the last green pipeline: the commit diff, but also **image
   versions** (`node:24-bookworm` gets updated), **dependency versions** (did `npm install -g
   newman` pull a new major?) and **external services**. Pin versions to make this list shorter.
5. **Is it flaky?** Retry the job **once**, to learn — not to fix. If it passes on retry, you have
   a flaky test or an intermittent defect, and that's now a ticket (Day 25's table).
6. **Reproduce locally** in the same image:

   ```bash
   docker run --rm -it -v "$PWD":/work -w /work node:24-bookworm bash
   # now inside the same OS and tools the runner used; run the job's commands one by one
   ```

   (For jobs that need the database service, run `docker compose up -d db` first and point
   `DATABASE_URL` at it.)

| Symptom in the log | Usual cause |
|---|---|
| `connect ECONNREFUSED 127.0.0.1:3000` | API not started, or crashed — read `api.log` |
| `getaddrinfo ENOTFOUND db` | Wrong host: in CI the database is the service alias (`postgres`) |
| `newman: command not found` | Install step missing or failed earlier |
| `Waiting for the API (60/60)` then fail | API never became healthy — usually the database URL |
| All protected requests `401` | Auto-login failed: wrong password variable, or a protected variable on an MR branch |
| Passes locally, fails in CI | State: your local run relied on data or values CI doesn't have |
| `yaml invalid` before any job starts | Indentation, tabs, or a `:` in an unquoted string — use the pipeline editor |

---

## Lab (21 minutes)

**Part A — quarantine (6 min).** Add `api-known-defects` from section 1. Push. Confirm the pipeline
is **passed with warnings**, the job is orange, and the failing known defects appear in the Tests
tab. Add the bug-ticket numbers from your Week 5 reports to the request names if you haven't.

**Part B — data checks (8 min).** Add a `data` stage and the `data-integrity` job from section 2,
using **your** `sql/data-checks.sql` (Week 7). Push. Download `data-checks.txt`. Which checks fail
on a clean seed, and which fail only because of what the known-defects run did?

**Part C — debugging drill (7 min).** Your partner secretly breaks one thing in your pipeline on a
branch and opens an MR. You have five minutes to find and explain the cause using only the GitLab
UI (logs, artifacts, Tests tab, diff). Suggestions for the breaker: a wrong `DATABASE_URL` host; a
misspelled folder name in `--folder`; removing `when: always`; an `ENVIRONMENT` path typo; a tab
character in the YAML.

**Debrief questions**
- In Part B, which data defect was caused *by the test run itself*? Would any API test have
  flagged it?
- In Part C, how long did each cause take to find? Which was hardest, and what would have made it
  faster?
- Your pipeline now has two `allow_failure` jobs. What process stops them from becoming
  permanent?

---

## Common mistakes juniors make

- `allow_failure: true` on the regression job "until it's stable". It never becomes stable.
- Quarantined tests with no linked bug — nobody knows why they're there or when they can leave.
- Reading the last line of a failed log instead of the first error.
- Retrying a failed job until it's green and moving on.
- Using cache to pass reports between jobs, then losing them when the cache misses.
- Unpinned tool versions (`npm install -g newman`) — a new major release breaks the pipeline
  overnight with no change in your repository. Pin `newman@6` (the reference pipeline does).
- `rules:changes` that skip a gate for changes that can absolutely break it.

---

## Homework (about 45 minutes)

1. **Finish Parts A and B.** Draw your pipeline graph (stages, jobs, `needs` arrows) on paper.
   Then open *Build → Pipelines → (a pipeline) → Job dependencies* and compare.
2. **Make data integrity a real gate.** On a branch: write `sql/fix-seed-defects.sql` that corrects
   the three critical seed defects (orders 1005, 2222, 2750) — deciding sensibly what "correct"
   means for each and writing your reasoning as comments. Run it in the `data-integrity` job
   *before* the exercise step. Does the job pass now (ignore the known defects' damage for a moment)?
   What would it take to remove `allow_failure`?
3. **Write exit criteria.** In half a page, write the exit criteria your pipeline now enforces for
   "a change may be merged", in Day 4 style. Then list two exit criteria a human must still judge.

---

## Check your understanding

<details>
<summary>1. What's the difference between a job that fails with <code>allow_failure: true</code> and a job that can't fail because of <code>|| true</code>?</summary>

With `allow_failure`, the job still evaluates the tests, still reports a failure (orange warning,
failures in the Tests tab), and simply doesn't block the pipeline — the signal is preserved and
visible. With `|| true`, the failing command's exit code is thrown away; the job is green and
nothing anywhere says a test failed. One is a deliberate, visible quarantine; the other hides the
result.
</details>

<details>
<summary>2. Why does the data-integrity job run Newman before running the SQL checks?</summary>

Because the checks should catch data damage caused by the *application*, not only data that was
already bad. Each job starts from a freshly seeded database; without exercising the API, the checks
would only ever see the seed. Running the workflow, validation and known-defect requests first
means a change that writes corrupt data — a zero-quantity line, negative stock, a wrong total —
shows up in the checks even if every API response looked fine.
</details>

<details>
<summary>3. A job uses <code>needs: ["api-smoke"]</code> and is in the <code>data</code> stage. When does it start?</summary>

As soon as `api-smoke` succeeds — it doesn't wait for the other jobs in the `test` stage
(`api-regression`, `api-known-defects`). `needs` overrides the default "wait for all earlier
stages" ordering, making the pipeline a dependency graph and shortening total run time.
</details>

<details>
<summary>4. A pipeline that has been green for weeks fails overnight. Nobody pushed anything. Where do you look?</summary>

At what can change without a commit: the Docker image (`node:24-bookworm` is updated regularly),
unpinned tools or dependencies installed during the job (`npm install -g newman` picking up a new
major version), external services the tests touch, expired certificates or credentials, and the
runner environment. Compare the logs of the last green and first red runs for version numbers. Then
pin what can be pinned.
</details>

---

## Glossary additions

`exit criteria` · `blocking check` · `informational check` · `allow_failure` ·
`passed with warnings` · `quarantine` · `data-integrity job` · `needs` · `DAG` · `rules` ·
`workflow:rules` · `rules:changes` · `when: never` · `when: manual` · `cache` · `cache key` ·
`version pinning` · `pipeline debugging` · `reproduce locally`
