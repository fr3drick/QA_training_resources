# Day 37 — API Tests in the Pipeline: Newman, Reports, Secrets and Merge Requests

> **Week 8 · Day 37 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.1.4 (DevOps), Chapter 5.3 (test reporting), Chapter 6 (tool support)
> Prerequisites: Day 36; your Week 5 Postman suite

---

## At a glance

Yesterday the pipeline proved QA Shop *starts*. Today it proves QA Shop *works*: your Postman
suite runs on every push and every merge request, results appear as test reports in GitLab, and a
failing test blocks a merge.

By the end of this session you should be able to:

1. Remove duplication with **`default`**, global **`variables`**, hidden jobs and **`extends`**.
2. Run Newman **smoke** and **regression** jobs in separate stages.
3. Publish **JUnit** results so GitLab shows them on the pipeline and the MR, and keep HTML
   reports as **artifacts**.
4. Store secrets as **masked CI/CD variables** — and know the *protected* variable trap.
5. Use **merge requests** with "pipelines must succeed" as a quality gate.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review: predefined variables, your first MR |
| 0:04 – 0:12 | Don't repeat yourself: `default`, `variables`, `extends` |
| 0:12 – 0:22 | Smoke and regression jobs, JUnit reports, artifacts |
| 0:22 – 0:30 | Secrets: CI/CD variables, masking, protection |
| 0:30 – 0:35 | Merge requests as a quality gate |
| 0:35 – 0:57 | **Lab:** your suite in the pipeline, then break it on a branch |
| 0:57 – 1:00 | Homework |

---

## 1. Don't repeat yourself

Every API job needs the same image, the same PostgreSQL service, the same variables and the same
"start the API and wait" steps. Copying them into each job means fixing every bug four times.
GitLab gives you three tools:

```yaml
variables:                 # global: available to every job (and its services)
  POSTGRES_DB: qa_shop
  POSTGRES_USER: qa
  POSTGRES_PASSWORD: qa
  DATABASE_URL: "postgres://qa:qa@postgres:5432/qa_shop"
  BASE_URL: "http://localhost:3000"
  COLLECTION: "postman/qa-shop.postman_collection.json"
  ENVIRONMENT: "postman/local.postman_environment.json"

default:                   # defaults for every job unless the job overrides them
  image: node:24-bookworm
  services:
    - name: postgres:17-alpine
      alias: postgres

.with-api:                 # a HIDDEN job (leading dot): never runs itself, only reused
  before_script:
    - npm ci --prefix app --no-audit --no-fund
    - npm install -g newman newman-reporter-htmlextra --no-audit --no-fund
    - mkdir -p reports
    - node app/src/server.js > reports/api.log 2>&1 &
    - |
      for i in $(seq 1 60); do
        curl -fs "$BASE_URL/health" && echo && break
        echo "Waiting for the API ($i/60)..."; sleep 2
      done
    - curl -fsS "$BASE_URL/health"
```

Then a job **`extends: .with-api`** to inherit its `before_script`. `before_script` runs before
`script`, in the same shell — so the API started there is still running when your tests start.

Point `COLLECTION` and `ENVIRONMENT` at **your** files from Week 5. (The reference pipeline points
at `reference/postman/`; you'll compare on Day 40.)

---

## 2. Smoke and regression jobs

```yaml
stages:
  - smoke
  - test

api-smoke:
  stage: smoke
  extends: .with-api
  script:
    - >-
      newman run "$COLLECTION" -e "$ENVIRONMENT" --env-var "base_url=$BASE_URL"
      --folder "01 Smoke" --bail
      -r cli,junit --reporter-junit-export reports/smoke-junit.xml
  artifacts:
    when: always
    expire_in: 1 week
    paths:
      - reports/
    reports:
      junit: reports/smoke-junit.xml

api-regression:
  stage: test
  extends: .with-api
  script:
    - >-
      newman run "$COLLECTION" -e "$ENVIRONMENT" --env-var "base_url=$BASE_URL"
      --folder "02 Auth" --folder "03 Products"
      --folder "04 Order workflow" --folder "05 Order validation"
      -r cli,junit,htmlextra
      --reporter-junit-export reports/regression-junit.xml
      --reporter-htmlextra-export reports/regression.html
  artifacts:
    when: always
    expire_in: 1 week
    expose_as: "API regression report"
    paths:
      - reports/
    reports:
      junit: reports/regression-junit.xml
```

The new keywords:

| Keyword | Does |
|---|---|
| `>-` | YAML "folded" block: the indented lines are joined into **one** command with spaces. Lets a long Newman command span lines readably |
| `--env-var "base_url=$BASE_URL"` | Day 24's override — the pipeline decides the target, not the file |
| `artifacts: paths` | Save these files with the job, downloadable from the job page |
| `artifacts: when: always` | Save them **even when the job fails** — which is exactly when you need them. The default is only on success |
| `expire_in` | Delete after this long, to save storage |
| `artifacts: reports: junit` | Parse this JUnit XML: GitLab shows the results in the pipeline's **Tests** tab and in the MR's test summary widget |
| `expose_as` | Adds a direct link to the artifact on the merge request page |

**Why smoke first, in its own stage?** If smoke fails (`--bail` stops at the first failure), the
`test` stage never starts — no point running 130 assertions against an API that can't log anyone
in. Fast feedback, and compute minutes saved.

### Reading the results

- **Pipeline → Tests tab**: every assertion as a test case, grouped by suite, with failures first
  and the failure message.
- **Merge request → Test summary**: "2 failed, 128 passed", with *new* failures (compared with
  `main`) highlighted. That "new failures" view is what turns a test report into a review tool.
- **Job → Browse artifacts → `reports/regression.html`**: the full Newman HTML report with every
  request and response — the evidence for a bug report.
- **Job → Browse artifacts → `reports/api.log`**: what the API logged during the run. A `500` in
  the test report + a stack trace in the API log = a diagnosed defect.

---

## 3. Secrets: CI/CD variables

A pipeline often needs secrets: passwords for a shared QA server, API keys, signing keys. **They
never go in `.gitlab-ci.yml` or any file in the repository** — anyone who can read the repo, now or
in its entire future history, could read them.

Instead: *Settings → CI/CD → Variables → Add variable*. Each variable becomes an environment
variable in every job.

| Option | Effect |
|---|---|
| **Masked** | The value is replaced by `[MASKED]` in job logs. GitLab only allows masking values it can reliably detect — at least 8 characters, no spaces, and a restricted character set; it will tell you if a value can't be masked |
| **Protected** | Only available to pipelines on **protected branches and tags** (like `main`) |
| **Expand variable reference** | Whether `$OTHER` inside the value is expanded. Untick for values containing `$` |

QA Shop has a real secret: the key that signs its access tokens. The API reads it from the
`JWT_SECRET` environment variable. Add a project variable:

| Key | Value | Masked | Protected |
|---|---|---|---|
| `JWT_SECRET` | something long and random, e.g. `kQ7vN2pX9sLm4Rt8Wz` | ✅ | ❌ |

Push any change. The API in every job now signs tokens with your secret instead of the guessable
default — with no change to the pipeline file. Try `echo "$JWT_SECRET"` in a job: the log shows
`[MASKED]`.

### The protected-variable trap

If you tick **Protected**, the variable is **empty** in pipelines for unprotected branches —
including every merge request branch. Tests that pass on `main` then fail mysteriously on every
MR. Use *protected* for secrets that only deployment jobs on `main` should ever see (production
credentials); leave it off for secrets the test jobs need on every branch.

### Don't leak what you've masked

- Masking only covers the **exact** value. `echo $SECRET | base64` prints a different string, which
  isn't masked.
- **`CI_DEBUG_TRACE`** (a debugging switch that prints every command and variable) can expose
  secrets in logs. Don't enable it in projects with real secrets.
- Artifacts aren't masked. Don't write secrets into report files — e.g., avoid Newman's
  `--export-environment` in CI when the environment holds a real password.

---

## 4. Merge requests as a quality gate

The workflow you're building towards:

```
git switch -c fix-coupon-test ──► commit ──► push ──► open MR ──► pipeline runs
                                                                       │
                     reviewer reads the diff AND the test report ◄─────┘
                                                                       │
                              green + approved ──► merge ──► pipeline runs again on main
```

Turn on the gate: *Settings → Merge requests → Merge checks → **Pipelines must succeed***. Now a
red pipeline physically blocks the Merge button.

When **you** review an MR — including one that changes tests — check:

- Did the pipeline run the tests the change affects? (A change to `app/` with no test changes is a
  question.)
- Are any tests newly failing, newly skipped, or deleted? **A deleted failing test is not a fix.**
- Did someone add `--suppress-exit-code`, `allow_failure` or `|| true` to make it green?

---

## Lab (22 minutes)

Work in your `qa-shop` GitLab project.

**Part A — smoke and regression (10 min)**
1. Replace `.gitlab-ci.yml` with sections 1 and 2 combined (`variables`, `default`, `.with-api`,
   `stages`, `api-smoke`, `api-regression`), pointing at **your** collection and environment.
2. Commit and push to `main`. Watch both stages.
3. Open the pipeline's **Tests** tab. How many tests? Any failures? If your suite was green
   locally but fails here, find out why from the log and the artifacts. (Common causes: tests that
   depended on leftover data, or on values only in your Postman app's current values.)
4. Download `reports/regression.html` from the job's artifacts and open it.

**Part B — the gate (7 min)**
1. Enable *Pipelines must succeed*.
2. `git switch -c break-a-test`. In your collection JSON, change one expected value so a regression
   test fails (e.g. the expected discount `700` → `701`). Commit, push, open an MR.
3. Look at the MR: the pipeline status, the test summary widget, the exposed report link. Can you
   merge?
4. Fix the test on the branch, push again, and watch the MR turn green. Merge it.

**Part C — a secret (5 min)**
Add `JWT_SECRET` as a masked variable. Push a commit that adds `- echo "secret is $JWT_SECRET"` to
the smoke job. Check the log. Then remove that line — even masked, don't print secrets.

**Debrief questions**
- What made a locally-green suite fail in CI for anyone in the room? What does that say about the
  suite?
- In Part B, which view told you *fastest* what had broken — the job log, the Tests tab or the MR
  widget?
- What would happen to the MR in Part B if `JWT_SECRET` had been marked *Protected*?

---

## Common mistakes juniors make

- Artifacts without `when: always` — the report disappears exactly when the job fails.
- A long Newman command split over lines with `-` list items instead of `>-`, so each fragment runs
  as a separate (broken) command.
- Secrets in `.gitlab-ci.yml` "temporarily". Git history is forever; rotate any secret that's ever
  been committed.
- Marking test-job secrets *Protected*, then debugging empty variables on every MR.
- "Fixing" a red MR by deleting or skipping the failing test without saying why.
- Running known-defect tests in the regression job, so the gate is permanently red and gets
  switched off (tomorrow's topic).

---

## Homework (about 45 minutes)

1. **Data-driven in CI.** Add a second Newman command to `api-regression` that runs your
   data-driven folder with its data file, writing a separate JUnit file. Make
   `artifacts:reports:junit` pick up both (`reports/*-junit.xml`).
2. **Cache.** Add a `cache` to `default` keyed on `app/package-lock.json` with path `.npm/`, and
   use `npm ci --cache .npm --prefer-offline`. Compare job durations before and after. What's the
   difference between a cache and an artifact? (Tomorrow's opening question.)
3. **Review practice.** Find a classmate's MR (or create one for each other) and review it using the
   checklist in section 4. Leave at least two comments on the MR.

---

## Check your understanding

<details>
<summary>1. Why should test-report artifacts use <code>when: always</code>?</summary>

The default saves artifacts only when the job succeeds — but reports are most needed when tests
fail, to see which ones and why. `when: always` keeps the JUnit XML, HTML report and API log
whatever the outcome, so a failed pipeline still has its evidence attached.
</details>

<details>
<summary>2. What does <code>artifacts:reports:junit</code> give you that a downloadable XML file doesn't?</summary>

GitLab parses it and presents it: a Tests tab on the pipeline listing every test case with failures
first, and a test summary on the merge request that highlights failures *new* compared with the
target branch. Reviewers see test results without downloading anything, and can tell a newly
broken test from an already-known failure.
</details>

<details>
<summary>3. A test job passes on <code>main</code> but fails on every merge request with an authentication error. The pipeline file is identical. What do you check first?</summary>

Whether a CI/CD variable the job needs is marked **Protected**. Protected variables are only
injected on protected branches like `main`; on MR branches they're empty, so a password or key is
missing and authentication fails. Untick Protected for secrets the test jobs need everywhere (or
keep it, and don't run those jobs on unprotected branches).
</details>

<details>
<summary>4. A teammate's MR makes the pipeline green by adding <code>|| true</code> after the Newman command. What do you say in review?</summary>

That `|| true` discards Newman's exit code, so the job passes whatever happens — the tests still
run, but no failure can ever block a merge again. If specific tests are failing for a known,
reported reason, quarantine those tests in a separate job that's allowed to fail, link the bug,
and keep the regression job strict.
</details>

---

## Glossary additions

`default` · `global variables` · `hidden job` · `extends` · `before_script` · `folded block (>-)` ·
`artifacts:when` · `expire_in` · `artifacts:reports:junit` · `Tests tab` · `test summary widget` ·
`expose_as` · `CI/CD variable` · `masked variable` · `protected variable` · `protected branch` ·
`CI_DEBUG_TRACE` · `pipelines must succeed` · `quality gate`
