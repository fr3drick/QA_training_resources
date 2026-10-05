# Day 24 — Newman: Running Collections From the Command Line

> **Week 5 · Day 24 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 6.1 (tool support — test execution), Chapter 5.3 (test monitoring and reporting)
> Prerequisites: Days 21–23

---

## At a glance

A collection that only runs when you click *Run* in the Postman app is still a manual test — just
a faster one. **Newman** runs the same collection from a terminal, which means a script can run
it, a scheduler can run it, and on Day 37 a CI pipeline will run it on every change.

By the end of this session you should be able to:

1. Export a collection and environment and run them with Newman.
2. Choose what runs with `--folder`, `-d`, `-n` and `--env-var`.
3. Read Newman's output and explain its **exit code** — the contract with CI.
4. Produce **JUnit** and **HTML** reports.
5. Wrap your runs in a script that anyone on the team can use.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: data-driven runs |
| 0:04 – 0:10 | Why the command line matters |
| 0:10 – 0:20 | First run, reading the output, exit codes |
| 0:20 – 0:30 | The options that matter |
| 0:30 – 0:36 | Reporters: CLI, JUnit, HTML |
| 0:36 – 0:57 | **Lab:** run, filter, report, script |
| 0:57 – 1:00 | Homework |

---

## 1. Why the command line matters

| In the Postman app | With Newman |
|---|---|
| A person clicks *Run* | Anything can run it: a script, a scheduler, a pipeline |
| Results live in the app | Results are files: JUnit XML, HTML, JSON |
| Uses whatever is in *your* environment's current values | Uses exactly the files you pass it — the same for everyone |
| Pass/fail is something you look at | Pass/fail is an **exit code** a machine can act on |

**Newman** is Postman's open-source command-line runner, a Node.js package. Postman also ships a
newer official **Postman CLI** (`postman collection run …`) that ties runs to your Postman cloud
workspace. Both run the same collections. We use Newman because it's free, works offline, needs
no account, and is what you'll find in most existing pipelines.

```bash
npm install -g newman newman-reporter-htmlextra
newman --version          # 6.x
```

---

## 2. First run

### Export

In Postman: *Collection → ⋯ → Export → Collection v2.1* → save as
`labs/qa-shop/postman/qa-shop.postman_collection.json`. *Environments → ⋯ → Export* → save as
`labs/qa-shop/postman/local.postman_environment.json`.

These two JSON files **are** your test suite now. They go into Git (Week 8) and get reviewed like
code.

> Check the exported environment before you commit it. If it contains a real password or
> token as a shared/initial value, fix that first (Day 21).

### Run

```bash
cd labs/qa-shop/postman
newman run qa-shop.postman_collection.json -e local.postman_environment.json
```

### Read the output

Newman prints each request, then a ✓ or a numbered failure for every test, then a summary:

```
→ Create order - 2 x Ceramic Mug
  POST http://localhost:3000/orders [201 Created, 557B, 71ms]
  ✓  [all] Responds in under 2000 ms
  ✓  [all] Responds with JSON
  ✓  Status is 201
  ✓  Totals are correct: 2 x 3500

┌─────────────────────────┬──────────────────┬──────────────────┐
│                         │         executed │           failed │
├─────────────────────────┼──────────────────┼──────────────────┤
│              iterations │                1 │                0 │
│                requests │               36 │                0 │
│            test-scripts │               70 │                0 │
│      prerequest-scripts │               40 │                0 │
│              assertions │              130 │                3 │
├─────────────────────────┴──────────────────┴──────────────────┤
│ total run duration: 3.9s                                      │
│ average response time: 21ms [min: 2ms, max: 90ms, s.d.: 29ms] │
└───────────────────────────────────────────────────────────────┘

  #  failure         detail
 1.  AssertionError  Status is 400
                     expected response to have status code 400 but got 201
                     at assertion:0 in test-script
                     inside "05 Order validation / Create order - qty 0"
```

The bottom table is what you read first: **how many assertions failed**, then the numbered list
tells you which test, which request, and what it expected versus what it got. The
`inside "<folder> / <request>"` line is why naming matters (Day 21).

### Exit codes — the contract with CI

When Newman finishes it returns an **exit code** to whatever started it:

| Exit code | Meaning |
|---|---|
| `0` | Every assertion passed |
| `1` | At least one assertion failed, or the run itself broke (bad file, unreachable host) |

```bash
newman run qa-shop.postman_collection.json -e local.postman_environment.json
echo $?               # bash / Git Bash
echo $LASTEXITCODE    # PowerShell
```

This single number is how a pipeline decides whether to go red. Every CI system in the world
works this way: **non-zero means stop**. Remember it — on Day 37 it's the whole mechanism.

---

## 3. The options that matter

| Option | Does | Example |
|---|---|---|
| `-e <file>` | Environment file | `-e local.postman_environment.json` |
| `--folder "<name>"` | Run only this folder. **Repeatable** | `--folder "01 Smoke" --folder "02 Auth"` |
| `-d <file>` | Data file (CSV/JSON) — one iteration per row | `-d data/login-cases.csv` |
| `-n <count>` | Number of iterations | `-n 3` |
| `--env-var "k=v"` | Override one environment variable | `--env-var "base_url=http://qa2.internal:3000"` |
| `--bail` | Stop at the first failure | Good for smoke runs |
| `--delay-request <ms>` | Pause between requests | `--delay-request 200` |
| `--timeout-request <ms>` | Fail any request slower than this | `--timeout-request 5000` |
| `--export-environment <file>` | Save the environment as it was at the end | For debugging chains |
| `--verbose` | Show full request/response details | When you can't see why |
| `-k` / `--insecure` | Accept self-signed TLS certificates | Internal test servers only |
| `-x` / `--suppress-exit-code` | Always exit 0 | Almost never — it hides failures |

### Running suites, not just collections

`--folder` is how folders become suites:

```bash
# Smoke: fast, stop at the first failure
newman run qa-shop.postman_collection.json -e local.postman_environment.json \
  --folder "01 Smoke" --bail

# Regression: everything except the known defects
newman run qa-shop.postman_collection.json -e local.postman_environment.json \
  --folder "02 Auth" --folder "03 Products" \
  --folder "04 Order workflow" --folder "05 Order validation"

# Data-driven: one folder, one data file
newman run qa-shop.postman_collection.json -e local.postman_environment.json \
  --folder "06 Data-driven login" -d data/login-cases.csv
```

On PowerShell, replace the trailing `\` with a backtick `` ` `` — or put the whole command on one line.

### Same suite, different target, no secrets in files

`--env-var` overrides one variable without editing the file. That's how the same collection
runs against your laptop, the QA server and staging — and how secrets get in without being
committed:

```bash
newman run qa-shop.postman_collection.json -e local.postman_environment.json \
  --env-var "base_url=https://qa.example.internal" \
  --env-var "customer_password=$QA_SHOP_PASSWORD"
```

The password comes from an environment variable on the machine (in CI, a masked secret — Day 37),
never from the file in Git.

---

## 4. Reporters

A **reporter** turns the run into output. Newman ships `cli` (the default), `json` and `junit`;
others are npm packages.

```bash
newman run qa-shop.postman_collection.json -e local.postman_environment.json \
  -r cli,junit,htmlextra \
  --reporter-junit-export reports/regression-junit.xml \
  --reporter-htmlextra-export reports/regression.html
```

| Reporter | Output | Who reads it |
|---|---|---|
| `cli` | The terminal output above | You, now |
| `junit` | **JUnit XML** — the industry-standard test-result format | CI servers: GitLab shows it as a test report on the pipeline and merge request (Day 37) |
| `htmlextra` | A single self-contained HTML page with every request, response and assertion | Humans: developers, PMs, you next week |
| `json` | Everything, machine-readable | Your own scripts and dashboards |

Open `reports/regression.html` in a browser. Click a failed request — the full request and
response are there. **Attach this file to bug reports.** "Here's the exact request and response
from the run" ends arguments.

---

## 5. Make it one command

If running your tests needs a paragraph of instructions, people won't run them. Put the commands
in a script.

**`labs/qa-shop/postman/run-tests.sh`** (bash / Git Bash / macOS / Linux):

```bash
#!/usr/bin/env bash
# Usage: ./run-tests.sh [smoke|regression|known-defects|all]
set -euo pipefail
cd "$(dirname "$0")"

SUITE="${1:-regression}"
COLLECTION="qa-shop.postman_collection.json"
ENVIRONMENT="local.postman_environment.json"
mkdir -p reports

run() {
  local name="$1"; shift
  newman run "$COLLECTION" -e "$ENVIRONMENT" "$@" \
    -r cli,junit,htmlextra \
    --reporter-junit-export "reports/${name}-junit.xml" \
    --reporter-htmlextra-export "reports/${name}.html"
}

case "$SUITE" in
  smoke)         run smoke --folder "01 Smoke" --bail ;;
  regression)    run regression --folder "02 Auth" --folder "03 Products" \
                                --folder "04 Order workflow" --folder "05 Order validation" ;;
  known-defects) run known-defects --folder "99 Known defects" ;;
  all)           "$0" smoke && "$0" regression ;;
  *)             echo "Unknown suite: $SUITE"; exit 2 ;;
esac
```

`set -euo pipefail` makes the script stop and fail as soon as any command fails — so the exit
code still reaches whoever called it.

### Newman as a library

Newman is also a Node.js module, for when you need logic around a run (retry, custom
notifications, merging reports):

```javascript
const newman = require("newman");

newman.run({
    collection: require("./qa-shop.postman_collection.json"),
    environment: require("./local.postman_environment.json"),
    folder: ["01 Smoke"],
    reporters: ["cli"]
}, (err, summary) => {
    if (err) throw err;
    const failures = summary.run.failures.length;
    console.log(`${failures} failure(s)`);
    process.exitCode = failures ? 1 : 0;
});
```

You won't need this often. Know it exists.

---

## Lab (21 minutes)

Reset the database first. Work in `labs/qa-shop/postman/`.

1. **Export** your collection and environment from Postman (v2.1). Open the environment JSON in
   an editor — is there anything in it you wouldn't want in Git?
2. **Run everything.** How many assertions? How many failed? What was the exit code?
3. **Smoke only** with `--bail`. Then break it deliberately: stop the API (`docker compose stop
   api`) and run smoke again. Read the error, check the exit code, start the API again.
4. **Regression only** — every folder except known defects. Note the run time.
5. **Data-driven:** your login CSV with `-d`. Confirm one iteration per row.
6. **Override:** run smoke with `--env-var "customer_password=wrong"`. What fails, and does the
   output make the cause obvious?
7. **Reports:** produce JUnit and htmlextra reports for the regression run. Open the HTML report
   and find a failed assertion's full request and response.
8. **Script it:** create `run-tests.sh` (or a PowerShell `run-tests.ps1`) and run
   `./run-tests.sh smoke` and `./run-tests.sh regression`.

**Compare with the reference.** The instructor's collection is in
`labs/qa-shop/reference/postman/`. Run it the same way. What does it test that yours doesn't —
and does yours test anything it misses?

**Debrief questions**
- Step 3: the API was down. Was that a test *failure* or a run *error* in Newman's eyes? Does the
  difference matter to a pipeline?
- Step 6: was the failure message good enough to diagnose in 30 seconds? If not, how would you
  improve the test names or assertions?
- Why might your full run pass in Postman but fail in Newman?

---

## Common mistakes juniors make

- Exporting the collection but forgetting the environment — or committing an environment full of
  real secrets.
- Collections that pass in the app only because of leftover current values (tokens, IDs) that
  Newman never sees.
- Using `-x` / `--suppress-exit-code` to "make the build green". You've switched off the alarm,
  not fixed the fire.
- Treating `--bail` as a default for all suites — it hides every failure after the first in a
  regression run.
- Running the "known defects" tests in the same command as the regression suite, so the build
  is permanently red and everyone stops looking at it.
- Mixing up `\` (bash) and `` ` `` (PowerShell) line continuations and running half a command.

---

## Homework (about 40 minutes)

1. **Finish the lab**, including the run script.
2. **Separate the known defects.** Create `99 Known defects`: one request per defect you've found
   so far, each asserting the **correct** behaviour from the spec (so each fails today). Name
   each with its rule number.
3. **Timing.** Add `--timeout-request 2000` to a regression run. Does anything time out? Try
   `GET /products?limit=100000` — what happens, and which rule is involved?
4. **Write a README** in `labs/qa-shop/postman/` explaining how to run each suite in three
   lines or fewer. Ask a classmate to follow it without help.

---

## Check your understanding

<details>
<summary>1. Why is Newman's exit code more important than its pretty output?</summary>

Because machines can't read tables. A CI pipeline, a scheduler or a deploy script only knows
whether the command returned 0 or not. Exit code 1 is what turns a failed assertion into a red
pipeline and a blocked merge. If the exit code is wrong — suppressed with `-x`, or swallowed by a
wrapper script that doesn't propagate it — every failure becomes invisible to automation.
</details>

<details>
<summary>2. You need the same collection to run against your laptop and the shared QA server, which uses a different URL and password. How, without maintaining two collections?</summary>

Keep one collection that uses `{{base_url}}` and `{{customer_password}}` everywhere. Either keep
one environment file per target (`local`, `qa`) or override per run with
`--env-var "base_url=…"`. Secrets such as the password come from a machine environment variable
or CI secret via `--env-var`, never from a committed file.
</details>

<details>
<summary>3. What's the difference between the JUnit and htmlextra reporters, and when do you need each?</summary>

JUnit XML is a standard machine-readable format: CI tools parse it to show pass/fail counts,
list failing tests on the merge request, and track history. htmlextra is a human-readable page
with full request and response details for every test — the evidence you attach to a bug report
or show to a developer. A pipeline usually produces both.
</details>

<details>
<summary>4. Your teammate suggests running the known-defects folder as part of regression "so we don't forget about them". What's the problem, and what's the better approach?</summary>

The regression run would fail every time, for reasons everyone already knows. Within days people
stop looking at red builds, and the next *new* regression goes unnoticed — the alarm has been
ringing so long nobody hears it. Quarantine them: run known defects as a separate suite whose
failures are reported but don't block. When one starts passing, the bug's been fixed — move the
test into regression.
</details>

---

## Glossary additions

`Newman` · `Postman CLI` · `exit code` · `--folder` · `--env-var` · `--bail` · `reporter` ·
`JUnit XML` · `htmlextra` · `run script` · `quarantine` · `suite`
