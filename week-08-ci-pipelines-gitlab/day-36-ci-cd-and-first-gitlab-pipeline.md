# Day 36 — CI/CD, Git for Testers, and Your First GitLab Pipeline

> **Week 8 · Day 36 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.1.4 (DevOps and testing), Chapter 2.1.5 (shift left), Chapter 6 (tool support)
> Prerequisites: Weeks 5–7; a verified GitLab.com account and Git installed (Day 35 homework)

---

## At a glance

You have three suites — Postman, JMeter, SQL — that each answer "is QA Shop OK?" with an exit code.
Right now they only run when someone remembers to run them. This week they run **automatically on
every change**, in a pipeline, and a red result blocks a bad change from being merged. That's the
point where a tester's work stops being a report and becomes a safety net.

By the end of this session you should be able to:

1. Explain **CI, continuous delivery and continuous deployment**, and where testing sits in each.
2. Use the Git commands a tester needs: clone, branch, commit, push, merge request.
3. Explain **pipeline, stage, job, runner, image, service** and how they relate.
4. Write a `.gitlab-ci.yml` that runs a job, and one that starts QA Shop and checks its health.
5. Read a job log and know why a job passed or failed.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework check: GitLab accounts verified? |
| 0:05 – 0:13 | CI/CD and the tester's place in it |
| 0:13 – 0:21 | Git in ten minutes |
| 0:21 – 0:32 | GitLab CI concepts and `.gitlab-ci.yml` anatomy |
| 0:32 – 0:57 | **Lab:** push QA Shop, first pipeline, then a pipeline that runs the API |
| 0:57 – 1:00 | Homework |

---

## 1. CI/CD, and where testing sits

| Practice | Means | Testing's role |
|---|---|---|
| **Continuous Integration (CI)** | Everyone merges small changes into the main branch often; **every change is automatically built and tested** | Fast automated tests run on every push and merge request. A red pipeline stops the merge |
| **Continuous Delivery** | Every change that passes the pipeline is *releasable* — deploying is one button | Tests must be trustworthy enough that "green" means "safe to release" |
| **Continuous Deployment** | Every change that passes is released to production **automatically** — no button | There is no manual test phase. The pipeline *is* the release decision |

```
 developer pushes ──► pipeline ──────────────────────────────────────────► merge allowed?
                      build ─► smoke ─► API regression ─► data checks ─► (perf, nightly)
                                 │            │                │
                                 └─ any red ──┴────────────────┴──► merge blocked, author notified
```

This is **shift left** (ISTQB 2.1.5) made mechanical: defects are found minutes after they're
written, by the person who wrote them, while the change is still in their head — the cheapest
possible moment (Day 1's cost-of-defects curve).

What the pipeline **doesn't** replace: exploratory testing, usability, judgement about risk, and
asking questions in refinement. It frees time *for* those, by making regression checking automatic.

### What makes a test pipeline-ready

Everything you built in Weeks 5–7 was designed for this moment:

- **Runs from one command, with no human** — Newman, JMeter non-GUI, `psql -f`.
- **Signals with an exit code** — 0 pass, non-zero fail (Days 24, 30, 35).
- **Needs nothing from your laptop** — no current values, no hand-pasted tokens (auto-login,
  Day 23).
- **Creates or resets its own data** — a fresh database per job, seeded automatically.
- **Produces machine-readable results** — JUnit XML, `statistics.json`.

---

## 2. Git in ten minutes

Git is version control: a history of every change, who made it and why. In CI, **the pipeline
runs whenever the repository changes**, so Git is how you trigger it.

| Concept | Meaning |
|---|---|
| **Repository (repo)** | A project folder with its full history |
| **Commit** | A saved snapshot with a message explaining *why* |
| **Branch** | A parallel line of work. `main` is the shared, protected one |
| **Remote** | The copy on GitLab (`origin`) |
| **Push / pull** | Send your commits to / fetch others' commits from the remote |
| **Merge request (MR)** | A request to merge your branch into `main`, where it's reviewed **and the pipeline runs** (GitHub calls these pull requests) |

The commands you need this week:

```bash
git clone git@gitlab.com:<you>/qa-shop.git    # get a copy
git switch -c add-smoke-job                   # create and move to a new branch
git status                                     # what's changed?
git diff                                       # exactly what's changed?
git add .gitlab-ci.yml                         # stage a file for the next commit
git commit -m "Run Newman smoke tests in CI"   # save a snapshot
git push -u origin add-smoke-job               # send the branch to GitLab
git switch main && git pull                    # back to main, up to date
```

**Commit messages say why**, not what — the diff already shows what. "Quarantine BOLA test until
#42 is fixed" helps the next person; "update collection" doesn't.

**Never commit:** `node_modules/`, test reports, JMeter results, `.env` files, anything with a real
secret. A `.gitignore` file lists what Git should ignore — QA Shop's ignores `node_modules/`,
Newman's `reports/` and JMeter's `results/`.

---

## 3. GitLab CI concepts

| Term | Meaning |
|---|---|
| **`.gitlab-ci.yml`** | The pipeline definition, in YAML, at the **root** of the repository |
| **Pipeline** | One run of everything defined, triggered by a push, an MR, a schedule, or by hand |
| **Stage** | A group of jobs. Stages run **in order**; jobs in the same stage run **in parallel** |
| **Job** | A list of shell commands (`script`) run in a fresh, isolated environment. **Exit code non-zero → job fails** |
| **Runner** | The machine (agent) that picks up and executes jobs. GitLab.com provides shared Linux runners |
| **Image** | The Docker image the job runs inside — decides which tools are available (`node:24-bookworm` has Node, npm, curl, git) |
| **Service** | An extra container started alongside the job — e.g. a PostgreSQL database — reachable by its alias as a hostname |
| **Artifact** | Files a job saves for download or for later jobs (reports, logs) |
| **Variable** | A value available to scripts as an environment variable; GitLab predefines many (`$CI_COMMIT_SHA`, `$CI_COMMIT_BRANCH`…) |

**Every job starts from nothing.** A fresh container, a fresh checkout of the repository, fresh
services. Nothing carries over from the previous job unless you pass it as an artifact or cache.
This is wonderful for testing — every run starts from a clean, seeded database — and it's why your
suites had to be self-sufficient.

### Anatomy of a `.gitlab-ci.yml`

```yaml
stages:            # the order stages run in
  - check

hello:             # a job (any name except reserved keywords)
  stage: check     # which stage it belongs to
  image: node:24-bookworm
  script:          # shell commands, run in order; the first failure stops the job
    - echo "Hello from commit $CI_COMMIT_SHORT_SHA on branch $CI_COMMIT_BRANCH"
    - node --version
    - ls -la
```

YAML rules that bite: **indentation is spaces, never tabs**, and it's meaningful; lists use `- `;
strings with `:` or `#` need quotes. GitLab's **pipeline editor** (*Build → Pipeline editor*)
validates as you type, and its *Validate* tab simulates a pipeline. Use it before pushing.

### Runners and compute minutes

GitLab.com's shared runners are free within a monthly **compute-minute quota**, and new accounts
must complete **identity verification** before they can use them. A job waiting forever with
*"This job is stuck because the project doesn't have any runners online"* almost always means
verification isn't done. Companies often run their own (*self-managed*) runners instead.

Be considerate with minutes: don't push 30 tiny commits in a row, and don't run long performance
tests on every push (Day 39).

---

## 4. A pipeline that runs QA Shop

Every API test job needs the same setup: a database, the API running, and proof that it's healthy
before tests start.

```yaml
stages:
  - check

api-health:
  stage: check
  image: node:24-bookworm
  services:
    - name: postgres:17-alpine
      alias: postgres                 # the hostname the job uses to reach it
  variables:
    POSTGRES_DB: qa_shop              # read by the postgres image to create the database
    POSTGRES_USER: qa
    POSTGRES_PASSWORD: qa
    DATABASE_URL: "postgres://qa:qa@postgres:5432/qa_shop"   # read by the API
  script:
    - npm ci --prefix app                                    # install the API's dependencies
    - node app/src/server.js > api.log 2>&1 &                # start the API in the background
    - |
      for i in $(seq 1 60); do
        curl -fs http://localhost:3000/health && break
        echo "Waiting for the API ($i/60)..."; sleep 2
      done
    - curl -fsS http://localhost:3000/health                 # fails the job if still not healthy
    - cat api.log
```

Line by line, the new ideas:

- **`services`** starts PostgreSQL next to the job. Inside the job, it's at host `postgres`
  (the alias) — the same idea as `db` in Docker Compose (Day 31).
- **Variables** configure both the database container (`POSTGRES_*`) and the API (`DATABASE_URL`).
  Job variables are passed to services too.
- **`npm ci`** installs exactly the versions in `package-lock.json` — repeatable, unlike
  `npm install`.
- **`&`** runs the API in the background so the script can continue. Its output goes to `api.log`
  so you can read it later.
- **The wait loop** gives the API (which creates and seeds the database on first start) up to two
  minutes. `curl -f` returns non-zero for HTTP errors, so the loop exits as soon as `/health`
  returns 200.
- **The final `curl -fsS`** is the actual check. If the API never became healthy, curl exits
  non-zero, and **the job fails**. That's the whole mechanism.

---

## Lab (25 minutes)

### Part A — push QA Shop to GitLab (8 min)

1. On GitLab.com: *New project → Create blank project*, name `qa-shop`, visibility **Private**,
   **untick** "Initialize repository with a README".
2. Copy the contents of `labs/qa-shop/` into a new folder **outside** this training repository, and
   make it a repository of its own:

   ```bash
   cp -r labs/qa-shop ~/qa-shop          # PowerShell: Copy-Item -Recurse labs\qa-shop $HOME\qa-shop
   cd ~/qa-shop
   cat .gitignore                         # node_modules/, reports/ and results/ are already ignored
   git init -b main
   git add .
   git status                             # check: no node_modules, no reports, no results
   git commit -m "QA Shop practice system with Postman, JMeter and SQL test assets"
   git remote add origin git@gitlab.com:<your-username>/qa-shop.git
   git push -u origin main
   ```

3. Refresh the project page. Your files — and your Week 5–7 work in `postman/`, `jmeter/`, `sql/` —
   are there.

### Part B — hello pipeline (5 min)

1. Open *Build → Pipeline editor*. Paste the `hello` pipeline from section 3. Check the *Validate*
   tab. Commit it to `main` from the editor.
2. *Build → Pipelines*: watch it go from *pending* to *running* to *passed*. Open the job and read
   the log: find the commit SHA, the Node version and the file listing.
3. Add a line `- exit 1` to the script. Commit. What happens to the job and the pipeline? Remove it
   again.

### Part C — run the API (12 min)

1. Replace the pipeline with `api-health` from section 4. Commit and watch it.
2. In the job log, find: the PostgreSQL service starting, `npm ci`, the "Waiting for the API" lines,
   the health JSON, and the API log showing `Applied 02-seed.sql`.
3. Break it on purpose: change `DATABASE_URL` to use host `db` instead of `postgres`. What does the
   log show? How long did the job take to fail, and why? Fix it.
4. `git pull` on your laptop so your local copy has the `.gitlab-ci.yml` the editor created.

**Debrief questions**
- Part B step 3: which line in the log tells you *why* the job failed?
- Part C step 3: the API's log said it was waiting for the database. Which Week 3 lesson does this
  failure resemble?
- The API seeded 200,000 products in this job. What happens to that database when the job ends?
  Why is that good for testing?

---

## Common mistakes juniors make

- Tabs in YAML, or two-space vs four-space indentation mixed — the pipeline won't even start.
- Putting `.gitlab-ci.yml` in a subfolder. It must be at the repository root.
- Using `localhost` for the database inside CI (it's the service alias) — or the alias for the API
  (the API runs *in* the job, so it *is* `localhost`).
- Starting the API and running tests immediately, before it's ready — flaky failures on cold starts.
- Committing `node_modules/` or reports.
- Waiting on a "stuck" job without checking runner availability and account verification.
- Commit messages like "fix" and "wip" — useless when you're trying to find which change broke the
  pipeline.

---

## Homework (about 40 minutes)

1. **Finish the lab.** Make sure `api-health` passes on `main`.
2. **Explore predefined variables.** Add a job that prints `$CI_PIPELINE_SOURCE`,
   `$CI_COMMIT_BRANCH`, `$CI_DEFAULT_BRANCH`, `$CI_PROJECT_DIR` and `$CI_JOB_ID`. Look up three
   more in GitLab's documentation (*Predefined CI/CD variables*) and print those too.
3. **Branch and MR.** Create a branch, change the `echo` text, push it, and open a merge request.
   Where does the pipeline result appear on the MR page?
4. **Read the reference pipeline**, `reference/.gitlab-ci.yml`, top to bottom. Don't use it yet.
   Write down every keyword you don't recognise — the next three days cover them.

---

## Check your understanding

<details>
<summary>1. What's the difference between continuous delivery and continuous deployment, and how does it change the tester's job?</summary>

With continuous delivery, every change that passes the pipeline *could* be released, but a person
decides when. With continuous deployment, every passing change *is* released automatically. Under
continuous deployment there's no manual test gate: the automated tests in the pipeline are the
release decision, so their coverage, reliability and speed directly determine what reaches
customers. Exploratory testing moves earlier (on branches, behind feature flags) or later (in
production monitoring).
</details>

<details>
<summary>2. Inside the CI job, why is the database at <code>postgres:5432</code> but the API at <code>localhost:3000</code>?</summary>

PostgreSQL runs as a *service*: a separate container reachable through the alias `postgres`. The
API is started by the job's own script, so it runs *inside the job container* — from the job's
point of view, that's `localhost`.
</details>

<details>
<summary>3. A job's script has five commands. The third fails with exit code 1. What happens?</summary>

The job stops at the third command — the fourth and fifth never run — and the job is marked
failed. With default settings, the pipeline then fails, later stages don't run, and an MR with
"pipelines must succeed" enabled can't be merged.
</details>

<details>
<summary>4. Why is "every job starts from a fresh container with fresh services" good for testing, and what does it demand of your tests?</summary>

It guarantees a known starting state: no leftovers from earlier runs, no data changed by someone
else, no "works on my machine". Tests become repeatable by construction. In return, tests must be
completely self-sufficient: set up their own data or rely only on the seed, obtain their own tokens,
and not depend on anything from a previous job unless it's explicitly passed as an artifact.
</details>

---

## Glossary additions

`CI` · `continuous delivery` · `continuous deployment` · `pipeline` · `stage` · `job` ·
`runner` · `shared runner` · `compute minutes` · `image` · `service` · `alias` · `artifact` ·
`predefined variable` · `.gitlab-ci.yml` · `pipeline editor` · `repository` · `commit` ·
`branch` · `remote` · `push` · `merge request` · `.gitignore` · `npm ci`
