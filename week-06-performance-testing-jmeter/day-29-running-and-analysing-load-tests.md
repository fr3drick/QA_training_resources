# Day 29 — Running Load Tests Properly and Reading the Results

> **Week 6 · Day 29 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.2.2 (performance efficiency), Chapter 5.3 (test monitoring, metrics and reporting)
> Prerequisites: Day 28

---

## At a glance

So far you've run JMeter in its GUI with a handful of users. That's for *building* scripts.
*Running* load tests happens on the command line, and the result is not a table but a picture of
how the system behaves as load grows. Today you learn to produce that picture and read it.

By the end of this session you should be able to:

1. Run a test in **non-GUI mode** with properties, and explain why the GUI is for scripting only.
2. Generate and navigate the **HTML dashboard report**.
3. Find the **knee**: the load at which response times climb and throughput stops rising.
4. Tell a **system bottleneck** from a **load-generator bottleneck**.
5. Run a **stepped capacity test** and compare runs fairly.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: what happens to the data after a nightly run? |
| 0:05 – 0:13 | Non-GUI mode, results files, properties |
| 0:13 – 0:25 | The HTML dashboard: what to look at first |
| 0:25 – 0:35 | Reading the curve: knee, saturation, failure |
| 0:35 – 0:40 | Is it the system or is it JMeter? Comparing runs fairly |
| 0:40 – 0:57 | **Lab:** a stepped capacity test of QA Shop |
| 0:57 – 1:00 | Homework |

---

## 1. Non-GUI mode

The GUI draws every result as it arrives. With hundreds of samples per second that drawing
competes with the load generation for CPU and memory, and **the load generator becomes the
bottleneck you're measuring**. JMeter's own startup message says it: *"Don't use GUI mode for load
testing!"*

```bash
mkdir -p results
rm -rf results/run-20.jtl results/report-20      # clear the previous run — see below
jmeter -n -t shopper.jmx \
  -Jthreads=20 -Jrampup=30 -Jduration=120 \
  -l results/run-20.jtl \
  -e -o results/report-20
```

(On Windows, `jmeter.bat`, and replace `\` with `` ` `` in PowerShell or put it on one line. The
PowerShell equivalent of the first two lines is
`New-Item -ItemType Directory -Force results | Out-Null` and
`Remove-Item -Recurse -Force results\run-20.jtl, results\report-20 -ErrorAction SilentlyContinue`.)

| Flag | Meaning |
|---|---|
| `-n` | Non-GUI mode |
| `-t <file>` | The test plan |
| `-J<name>=<value>` | Set a property — read in the plan with `${__P(name,default)}` |
| `-l <file>` | Write every sample to this results file (`.jtl`) |
| `-e -o <folder>` | After the run, generate the HTML dashboard into this folder |
| `-j <file>` | Write the JMeter log here |

**Clear old output before every run.** Two JMeter behaviours catch everyone:

- If the `.jtl` file already exists, JMeter **appends** to it. Your new report then silently
  mixes this run with the last one.
- The `-o` report folder must **not exist or be empty**, and its parent folder **must exist** —
  otherwise JMeter refuses to start (*"folder is not empty"* / *"parent folder is not
  writable"*).

JMeter has a `-f` flag that is meant to delete old results for you, but it's unreliable across
versions and platforms. Deleting the files yourself always works.

This is why Day 27 put every setting behind `__P`: the *same* plan runs a 1-user smoke check, a
20-user load test or a 400-user stress test, chosen at run time. On Day 39 a pipeline will pass
these properties in.

### What you see while it runs

```
summary +    340 in 00:00:08 =   44.3/s Avg:    46 Min:     1 Max:   190 Err:     0 (0.00%) Active: 20 Started: 20 Finished: 0
summary +   1979 in 00:00:30 =   66.0/s Avg:    46 Min:     1 Max:   210 Err:     0 (0.00%) Active: 20 Started: 20 Finished: 0
summary =   2319 in 00:00:38 =   61.6/s Avg:    46 Min:     1 Max:   210 Err:     0 (0.00%)
```

`summary +` lines are the last interval; `summary =` is the running total. Watch **Err** and
**Active**: if errors climb or active threads collapse while the test is running, stop it
(`Ctrl+C`) and investigate rather than waiting ten minutes for a useless report.

### The results file

The `.jtl` is a CSV with one row per sample: timestamp, elapsed, label, response code, success,
bytes, latency, connect time, active threads… It's the raw truth. **Keep it.** You can regenerate
the dashboard any time, or from someone else's results:

```bash
jmeter -g results/run-20.jtl -o results/report-20-again
```

### Memory for big runs

JMeter is a Java program with a fixed memory limit. For large tests, raise it before running:

```bash
HEAP="-Xms1g -Xmx2g" jmeter -n -t ...          # bash
$env:HEAP="-Xms1g -Xmx2g"; jmeter.bat -n -t ...  # PowerShell
```

---

## 2. The HTML dashboard

Open `results/report-20/index.html` in a browser. It's large; read it in this order.

### 1. Dashboard → Statistics table

One row per sampler and transaction: samples, **error %**, average, min, max, **median, 90th,
95th, 99th percentile**, throughput, KB/s. Check the NFRs here first:

- NFR1: every endpoint's **95th pct** under 1,000 ms; search under 2,000 ms.
- NFR2: **Total** error % under 1%.

### 2. Dashboard → Errors and Top 5 Errors by sampler

If there are errors, **what** are they? `409/Conflict` on orders when stock runs out is the
business rule working. `500` is a defect. `Non HTTP response code: java.net.SocketTimeoutException`
means the server stopped answering in time. `Connection refused` means it stopped answering at
all. Error type tells you more than error count.

### 3. Charts → Over Time

| Chart | Look for |
|---|---|
| **Active Threads Over Time** | The load shape you *intended*. Check it's what you designed |
| **Response Times Over Time** | Flat = healthy. Climbing while threads are flat = degradation (leak, queue building up). Spikes = something periodic (GC, a cron job) |
| **Hits / Transactions per Second** | Should rise with users, then hold steady |
| **Response Time Percentiles Over Time** | Whether the *tail* (p95/p99) misbehaves while the median looks fine |

### 4. Charts → Response Times → Time vs Threads

Response time plotted against the number of active threads. **This is the capacity curve** — the
single most useful chart in the report for a ramp-up test.

### APDEX

The dashboard opens with an **APDEX** score per sampler — an index from 0 to 1 based on how many
responses were "satisfying" (under 500 ms by default) or "tolerable" (under 1,500 ms). It's a
quick summary; don't report it without the percentiles behind it.

---

## 3. Reading the curve

Here is QA Shop run with the reference shopper plan at increasing load — 50 seconds per step, a
fresh database each time, on one developer laptop:

| Users | Throughput (req/s) | Error % | p95 all (ms) | p95 search | p95 list | p95 `POST /orders` |
|---|---|---|---|---|---|---|
| 10 | 7.0 | 0 | 128 | 136 | 145 | 95 |
| 50 | 35.4 | 0 | 128 | 137 | 137 | 90 |
| 100 | 70.5 | 0 | 123 | 135 | 135 | 82 |
| 200 | 138.9 | 0 | 149 | 170 | 114 | 118 |
| 400 | 188.3 | 0 | **2,470** | 856 | 1,428 | **3,274** |

*Your numbers will differ — a slower laptop reaches the knee sooner. The shape is what matters.*

Read it like this:

```
throughput                                   p95 response time
(req/s)                                      (ms)
  200 ┤                    ●······●            3000 ┤                          ●
  150 ┤               ●                        2000 ┤
  100 ┤                                        1000 ┤
   50 ┤      ●   ●                                  ┤
    0 ┼──●──────────────────────               0 ┼──●────●────●─────●────────
       10   50  100  200     400                   10   50  100  200     400  users
                     ▲ knee                                      ▲ knee
```

1. **10 → 200 users: linear.** Double the users, double the throughput, flat response times. The
   system has spare capacity. Little's Law holds: 100 users with ~1.4 s per step ≈ 70 req/s. ✓
2. **200 → 400 users: the knee.** Users doubled but throughput rose only 35%, and p95 went up
   *sixteen-fold*. The system is **saturated** — some resource is full and requests are queueing
   for it. Every extra user now adds waiting time, not work done.
3. **Past the knee**, a well-behaved system keeps throughput flat and starts rejecting work cleanly
   (`503`, `429`). A badly-behaved one sees throughput *fall* as it thrashes, and errors and
   timeouts arrive together. Find out which yours is — that's the stress test (tomorrow).

**Capacity = the highest load *before* an NFR is breached**, not the load at which it falls over.
On this laptop QA Shop meets NFR1 somewhere between 200 and 400 users — the next run would step
between them to find where.

### Which resource is full?

The client-side numbers say *that* it's saturated; you need server-side numbers to say *why*.
During a run, in another terminal:

```bash
docker stats
```

```
NAME            CPU %     MEM USAGE / LIMIT          (illustrative)
qa-shop-api-1   98.7%     95MiB / 15.5GiB
qa-shop-db-1    310.2%    410MiB / 15.5GiB
```

- **API CPU near 100%**: Node.js runs your JavaScript on one core. One busy core = saturated API.
- **Database CPU high**: expensive queries — `count(*)` over 200,000 products on every list
  request, `ILIKE '%term%'` on every search. Week 7 shows you how to see this with `EXPLAIN`.
- **Neither busy, yet slow**: something is *waiting* — a full connection pool (QA Shop's API has
  10 database connections; request #11 queues), locks, or a slow downstream call.

---

## 4. Is it the system, or is it JMeter?

On one laptop, JMeter, the API and the database all compete for the same CPU. Before you blame
the system:

- **Check JMeter's own CPU** in Task Manager / Activity Monitor / `top`. If the Java process is
  pinned, your load generator is the bottleneck.
- **Check `Connect` times** in the results. Rising connect time can mean the *client* has run out
  of sockets or threads.
- **Check the JMeter log** for `OutOfMemoryError` or warnings.
- In real projects, run JMeter on **separate machines** from the system under test — several of
  them for big loads (JMeter's *distributed testing* mode, or cloud load-testing services).

### Comparing runs fairly

A performance result means something only relative to another run. Make the comparison fair:

- **Same plan, same properties, same duration.**
- **Same starting data** — reset the database before every run. A database with 50,000 extra
  orders from yesterday's test is a different system.
- **Same environment**, nothing else running (close the browser streaming music).
- **One change at a time.** Change the code *and* the load *and* the data, and you've learned
  nothing.
- **Repeat.** Run each step at least twice. If two identical runs differ by 30%, your environment
  is too noisy to detect a 10% regression.
- **Name and keep everything**: `results/2026-10-12_shopper_200users/`.

---

## Lab (17 minutes)

Reset the database. Close everything you don't need.

**Part A — one proper run (5 min)**

```bash
cd labs/qa-shop/jmeter
mkdir -p results && rm -rf results/run-20.jtl results/report-20
jmeter -n -t shopper.jmx -Jthreads=20 -Jrampup=20 -Jduration=90 \
  -l results/run-20.jtl -e -o results/report-20
```

(Use the reference plan `../reference/jmeter/qa-shop-load.jmx` if yours isn't ready.) While it
runs, have `docker stats` open in another terminal. Open the dashboard and check NFR1 and NFR2.

**Part B — a stepped capacity test (12 min)**

Run the same plan at increasing load, resetting between steps:

```bash
mkdir -p results
for users in 10 50 100 200; do
  rm -rf "results/step-$users.jtl" "results/step-$users"
  docker compose -f ../docker-compose.yml exec -T api npm run db:reset
  jmeter -n -t shopper.jmx -Jthreads=$users -Jrampup=10 -Jduration=50 \
    -l "results/step-$users.jtl" -e -o "results/step-$users"
done
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force results | Out-Null
foreach ($users in 10, 50, 100, 200) {
  Remove-Item -Recurse -Force "results\step-$users.jtl", "results\step-$users" -ErrorAction SilentlyContinue
  docker compose -f ..\docker-compose.yml exec -T api npm run db:reset
  jmeter.bat -n -t shopper.jmx "-Jthreads=$users" -Jrampup=10 -Jduration=50 `
    -l "results\step-$users.jtl" -e -o "results\step-$users"
}
```

From each step's Statistics table, fill in a table like the one in section 3. If you haven't
reached the knee by 200, add 300 and 400. Note `docker stats` CPU for the API and database at
each step.

**Debrief questions**
- At what load does your laptop's QA Shop reach the knee? Which endpoint degrades first?
- Was the API or the database the busier container? What does that suggest about where to look?
- Did throughput keep rising past the knee, flatten, or fall?
- Was JMeter itself near 100% CPU at any step? If so, how much do you trust that step?

---

## Common mistakes juniors make

- Running the real test in the GUI, with View Results Tree enabled.
- Reporting one run as "the result" with no comparison and no repeat.
- Not resetting data between runs, so each step tests a bigger database.
- Re-using a `.jtl` filename without deleting it, so JMeter appends and the "new" report is two
  runs blended together.
- Reading only the Statistics table and never the over-time charts — missing degradation that
  happens *during* the run.
- Calling the breaking point "capacity". Capacity is the last load that still meets the NFRs.
- Blaming the system when the laptop running JMeter was the thing at 100% CPU.
- Changing three things between runs and attributing the difference to one of them.

---

## Homework (about 45 minutes)

1. **Finish Part B** and write a half-page **capacity summary**: the table, where the knee is, which
   endpoint degrades first, which container was busiest, and your estimate of capacity *within*
   NFR1. Include one chart from the dashboard (*Time vs Threads* is ideal).
2. **Repeatability.** Run the 50-user step three times. How much do the p95s vary between
   identical runs? What does that mean for detecting a small regression?
3. **Find the waiting.** At the knee, are the API and database CPUs both below 100%? If so, what
   else could requests be queueing for? (Hint: re-read QA Shop's pool size, and look up the
   `DB_POOL_SIZE` setting in `app/src/db.js`.)

---

## Check your understanding

<details>
<summary>1. Why must load tests run in non-GUI mode?</summary>

The GUI renders results live, which costs CPU and memory on the same machine that's generating
the load. Under real load, that overhead throttles the virtual users and the GUI can run out of
memory — so you'd be measuring JMeter's limits, not the system's. Non-GUI mode writes raw samples
to a file and builds the dashboard afterwards.
</details>

<details>
<summary>2. Between 200 and 400 users, throughput rose from 139 to 188 req/s while p95 rose from 149 ms to 2,470 ms. Explain what's happening.</summary>

The system has passed its knee and is saturated: a resource (CPU on the API's single thread, the
database, or the connection pool) is fully used, so extra requests queue rather than being
processed. Throughput is close to its ceiling — doubling users adds little completed work — while
each request now spends most of its time waiting, so response times explode. Capacity within the
NFR lies somewhere between 200 and 400 users on that machine.
</details>

<details>
<summary>3. Two identical 50-user runs give p95s of 140 ms and 190 ms. A developer's change makes the next run 165 ms. Has performance got worse?</summary>

You can't tell. The run-to-run variation (50 ms) is larger than the difference you're trying to
detect. You need a quieter environment, longer runs, or several repeats of each version so you
can compare distributions rather than single numbers. Without that, any conclusion — better or
worse — is noise.
</details>

<details>
<summary>4. In the dashboard, the Statistics table shows a healthy p95, but Response Times Over Time shows response times climbing steadily from start to finish at constant load. Should you worry?</summary>

Yes. A steady climb at constant load means the system is getting worse the longer it runs — a
queue building up, a memory or connection leak, a table growing without an index. The overall
p95 hides it because the early, fast samples dilute the late, slow ones. Run longer (a soak test)
and correlate with server memory and database metrics.
</details>

---

## Glossary additions

`non-GUI mode` · `JTL results file` · `HTML dashboard report` · `summariser` · `APDEX` ·
`capacity curve` · `knee` · `saturation` · `bottleneck` · `load-generator bottleneck` ·
`docker stats` · `connection pool` · `distributed testing` · `heap` · `stepped load test` ·
`run-to-run variation`
