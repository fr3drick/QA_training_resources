# Day 28 — Realistic Load Scripts: Data, Correlation and Logic

> **Week 6 · Day 28 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2.2.2 (performance efficiency), Chapter 6.1 (tool support)
> Prerequisites: Day 27

---

## At a glance

Yesterday's plan had five identical, anonymous users browsing. Real shoppers log in as different
people, carry a token between requests, sometimes buy, and pay for what they ordered. A load test
that doesn't behave like real users measures a system nobody will ever run.

By the end of this session you should be able to:

1. **Parameterise** a script so every virtual user is a different customer (CSV Data Set Config).
2. **Correlate**: extract dynamic values (tokens, IDs) from one response and use them in the next.
3. Shape the journey with **logic controllers**: Once Only, Transaction, Throughput, If.
4. Debug a script with the **Debug Sampler** and the JMeter log.
5. Explain when to **record** a script and why recordings always need rework.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: predict-then-verify |
| 0:05 – 0:13 | Parameterisation with CSV data |
| 0:13 – 0:23 | Correlation: extractors |
| 0:23 – 0:33 | Logic controllers: shaping the journey |
| 0:33 – 0:38 | Debugging, functions, recording |
| 0:38 – 0:57 | **Lab:** the full QA Shop shopper journey |
| 0:57 – 1:00 | Homework |

---

## 1. Parameterisation: every user is a different customer

If all 20 virtual users log in as `efe@example.com`, you're testing one customer with 20
browser tabs — every order lands on the same account, caches stay unrealistically warm, and
per-user locks behave nothing like production.

QA Shop's seed data has 100 load-test accounts: `loadtest001@qa-shop.test` …
`loadtest100@qa-shop.test`, all with password `Passw0rd!`. Put them in
`labs/qa-shop/jmeter/data/users.csv`:

```csv
email,password
loadtest001@qa-shop.test,Passw0rd!
loadtest002@qa-shop.test,Passw0rd!
...
loadtest100@qa-shop.test,Passw0rd!
```

(One way to generate it in bash:
`{ echo "email,password"; for i in $(seq 1 100); do printf 'loadtest%03d@qa-shop.test,Passw0rd!\n' "$i"; done; } > users.csv`.
Or copy `labs/qa-shop/reference/jmeter/data/users.csv`.)

### CSV Data Set Config

| Setting | Value | Why |
|---|---|---|
| Filename | `data/users.csv` | Relative paths resolve from the `.jmx` file's folder |
| Variable Names | `email,password` | Become `${email}` and `${password}` |
| Ignore first line | True | Skip the header row |
| Recycle on EOF | True | Start again at the top when the file runs out |
| Stop thread on EOF | False | |
| Sharing mode | All threads | Each line is handed to exactly one thread at a time |

### Where you put it decides how often it reads

A CSV Data Set Config reads **a new line each time a sampler in its scope runs in a new
iteration**. Placed at Thread Group level, every user switches identity on every loop — logging
in once but suddenly being someone else. Place it **inside the Once Only controller with the
login request** (section 3), and each thread reads exactly one line, once: one user, one
customer, for the whole test.

---

## 2. Correlation: carrying dynamic values forward

**Correlation** means capturing a value the server generated and sending it back in a later
request. It's chaining from Day 23, in JMeter:

| Value | Comes from | Used in |
|---|---|---|
| `access_token` | `POST /auth/login` response body | `Authorization: Bearer …` on every protected request |
| order `id` | `POST /orders` response body (or `Location` header) | `POST /orders/{id}/pay` |

**Uncorrelated scripts are the single most common reason a load test "works" in the GUI and
measures nothing**: the token was hard-coded from a recording, expires an hour later, and every
protected request returns 401 in 2 ms. The report looks wonderfully fast.

### JSON Extractor (post-processor)

Add as a **child of the login sampler**:

| Field | Value |
|---|---|
| Names of created variables | `token` |
| JSON Path expressions | `$.access_token` |
| Match No. | `1` |
| Default Values | `NOT_FOUND` |

Then an **HTTP Header Manager** wherever authenticated requests live:

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${token}` |

And for the order:

| Field | Value |
|---|---|
| Names of created variables | `order_id` |
| JSON Path expressions | `$.id` |
| Default Values | `NOT_FOUND` |

**Always set a default.** If extraction fails, `${order_id}` becomes `NOT_FOUND` rather than
keeping last iteration's value — so failures are visible instead of silently paying for the
wrong order.

### Regular Expression Extractor

For values not in a JSON body — headers, HTML, plain text. To take the order ID from the
`Location: /orders/3021` header:

| Field | Value |
|---|---|
| Field to check | Response Headers |
| Name of created variable | `order_id` |
| Regular Expression | `Location: /orders/(\d+)` |
| Template | `$1$` |
| Match No. | `1` |
| Default Value | `NOT_FOUND` |

Prefer the JSON Extractor for JSON — it's clearer and doesn't break when the formatting changes.

---

## 3. Logic controllers: shaping the journey

The workload model from Day 26 — log in once; browse, view, search every time; buy 30% of the
time — maps onto controllers directly:

```
Thread Group "Shoppers"
├── Uniform Random Timer (500 + 0–1500 ms)          think time before every sampler
├── Once Only Controller "Log in"
│   ├── CSV Data Set Config (users.csv)             one customer per thread
│   └── POST /auth/login
│       ├── Response Assertion: 200
│       └── JSON Extractor: token ← $.access_token
├── Transaction Controller "TX Browse catalogue"
│   ├── GET /products
│   └── GET /products/{id}
├── Transaction Controller "TX Search"
│   ├── CSV Data Set Config (search-terms.csv)
│   └── GET /products/search?q=${term}
└── Throughput Controller "Buy something (30%)"
    ├── HTTP Header Manager: Authorization: Bearer ${token}
    └── Transaction Controller "TX Checkout"
        ├── POST /orders
        │   ├── Response Assertion: 201|409, Ignore Status
        │   └── JSON Extractor: order_id ← $.id
        └── If Controller: order was created
            └── POST /orders/${order_id}/pay
```

| Controller | Does | Settings that matter |
|---|---|---|
| **Once Only** | Runs its children on the first iteration of each thread only | — |
| **Transaction** | Groups samplers into one measured business transaction | *Generate parent sample* off (you get both the transaction row and its samplers); *Include duration of timer…* off (measure the system, not the think time) |
| **Throughput** | Runs its children for a percentage of executions | *Percent Executions*, `30` |
| **If** | Runs its children only when a condition is true | Condition `${__jexl3("${order_id}" != "NOT_FOUND")}`; tick *Interpret Condition as Variable Expression* |
| **Loop** | Repeats its children N times | — |
| **Random** | Runs one child at random each time | Good for "pick one of five journeys" |

**Transaction Controllers answer the business question.** "Checkout takes 1.8 s at p95" is
something a product owner understands. "`POST /orders` 1.2 s, `POST /orders/{id}/pay` 0.6 s" is
something a developer needs. A transaction controller gives you both rows.

**If Controller performance note:** use `__jexl3` (or `__groovy`) with *Interpret Condition as
Variable Expression* ticked. The older default evaluates JavaScript for every check, which is
slow and, on recent Java versions, may not work at all.

---

## 4. Timers, functions, debugging, recording

### Timers

| Timer | Pause | Use |
|---|---|---|
| Constant Timer | Exactly N ms | Rarely realistic |
| **Uniform Random Timer** | N ms + random 0–M ms | Default choice for think time |
| Gaussian Random Timer | Normally distributed around N | Slightly more realistic |
| Constant / Precise Throughput Timer | Whatever it takes to hit a target rate | When the NFR is a request rate, not a user count |

### Functions worth knowing

| Function | Returns |
|---|---|
| `${__Random(1,19)}` | Random integer in the range |
| `${__RandomString(8,abcdef0123456789)}` | Random string from those characters |
| `${__UUID()}` | A fresh UUID |
| `${__time()}` | Current time in ms |
| `${__P(name,default)}` | A property, set with `-Jname=value` |
| `${__jexl3(expression)}` | Evaluates an expression — conditions, simple maths |
| `${__threadNum}` | The current thread's number |

### Debugging a script

- **Debug Sampler** (Add → Sampler → Debug Sampler): put one after the login. In View Results
  Tree, its response shows every variable — is `token` a real token or `NOT_FOUND`?
- **The JMeter log**: the yellow ⚠ triangle top-right counts errors; click it to open the log.
  Script errors (a bad JSON path, a missing CSV file) show up there, not in the results.
- **Run with 1 thread, 1 loop first.** Every time. A script that's wrong for one user is wrong
  for a thousand, and much harder to read.

### Recording — and why it's only a start

For browser-driven web apps, JMeter's **HTTP(S) Test Script Recorder** (start from *Templates →
Recording*) acts as a proxy: point a browser at it (port 8888), browse, and it writes samplers
for every request. It installs a temporary root certificate (`ApacheJMeterTemporaryRootCA.crt`,
valid for 7 days) so it can see HTTPS traffic.

A recording is **raw material, not a test**:

- It captures hard-coded tokens, session IDs and order numbers → correlate them.
- It captures images, fonts, analytics calls → exclude or delete them.
- It captures *your* think time and *your* data → replace with timers and CSV.
- It has no assertions → add them.

For APIs, recording is rarely worth it — build from the spec. A useful shortcut: in Postman,
*Code → cURL* gives you a request as a `curl` command, and JMeter's **Tools → Import from cURL**
turns it into a sampler.

---

## Lab (19 minutes)

Reset the database. Save a copy of `browse.jmx` as `labs/qa-shop/jmeter/shopper.jmx` and build the
tree from section 3.

1. Create `data/users.csv` (100 load-test users) and `data/search-terms.csv` (a `term` header and
   about 10 terms: `mug`, `deluxe`, `jollof`, `rice`, `charger`…).
2. **Once Only** + CSV + `POST /auth/login` with body `{"email": "${email}", "password":
   "${password}"}`, a 200 assertion, and the token JSON Extractor.
3. Add a **Debug Sampler** after the login. Run **1 thread, 1 loop**. Confirm in View Results
   Tree that `token` holds a real JWT and `email` is `loadtest001@…`.
4. Wrap browse and search in **Transaction Controllers**.
5. Add the **Throughput Controller (30%)** with the Authorization Header Manager, `POST /orders`
   (body `{"items": [{"product_id": ${__Random(1,19)}, "qty": 1}]}`), its assertion with *Ignore
   Status*, the `order_id` extractor, and the **If Controller** with `POST
   /orders/${order_id}/pay`.
6. Remove the Debug Sampler. Run **5 threads, 60 seconds** (tick *Infinite* loops and set
   *Duration* to 60). Watch the API log scroll.
7. Check the Aggregate Report: is roughly 30% of iterations reaching `POST /orders`? Is the error
   rate 0%?

**Compare with the reference** plan, `labs/qa-shop/reference/jmeter/qa-shop-load.jmx`. Open it in
the GUI. What's different from yours?

**Debrief questions**
- Step 3: what would the results have looked like if you'd forgotten the JSON Extractor?
  Would the response times have looked better or worse?
- Why does the CSV config sit inside the Once Only controller in this plan?
- Each user pays for its order immediately. In real life, some customers abandon at payment.
  How would you model "60% of people who order go on to pay"?

---

## Common mistakes juniors make

- Hard-coded tokens or IDs from a recording — everything "passes" fast with 401s.
- No default value on extractors, so a failed extraction silently reuses last iteration's ID.
- CSV config at the wrong level, so users change identity mid-session.
- Every user logging in as the same account.
- Including timer durations inside Transaction Controller times, inflating them with think time.
- Building the full journey and running it with 50 users before checking it with 1.
- Expecting a recording to be a finished test.

---

## Homework (about 40 minutes)

1. **Finish `shopper.jmx`** and run it for 2 minutes with 10 users. Save the Aggregate Report
   as CSV (*Save Table Data*).
2. **Model abandonment:** change the plan so that of those who place an order, only 60% pay.
   (Hint: a second Throughput Controller, or an If Controller with `${__Random(1,100)}`.)
3. **Correlate from a header:** replace the `order_id` JSON Extractor with a Regular Expression
   Extractor on the `Location` header. Confirm it still works with a Debug Sampler.
4. **Think about data:** after a 10-minute run with 20 users, how many orders will exist? What
   happens to the database — and to later tests — if you run this every night without a reset?

---

## Check your understanding

<details>
<summary>1. A recorded script replays perfectly the day it was recorded and fails with 401 errors the next morning. What's wrong?</summary>

It isn't correlated: the access token captured during recording was hard-coded into the
requests, and it has expired (QA Shop's last one hour). Add a JSON Extractor to the login
response that captures `access_token` into a variable, and reference `${token}` in the
Authorization header instead of the literal value.
</details>

<details>
<summary>2. What's the difference between a Transaction Controller and a Throughput Controller?</summary>

A Transaction Controller doesn't change *what* runs — it groups samplers so their combined time
is reported as one business transaction ("TX Checkout"). A Throughput Controller changes
*whether* its children run: it executes them for a set percentage (or count) of executions,
which is how you model "30% of shoppers buy".
</details>

<details>
<summary>3. Why set the JSON Extractor's default value to <code>NOT_FOUND</code> instead of leaving it blank?</summary>

If extraction fails and there's no default, JMeter can leave the variable holding its value from
a previous iteration — so the next request silently acts on a stale ID or token and the test
reports success. A distinctive default makes failure visible: requests to `/orders/NOT_FOUND/pay`
fail loudly, and an If Controller can skip steps that depend on the missing value.
</details>

<details>
<summary>4. Twenty threads share a CSV of 100 users at Thread Group level, with login in a Once Only controller. What goes wrong?</summary>

The CSV config is read on every iteration of every thread, so after the first loop each thread's
`${email}` changes to a new user — but it never logs in again, because the login is Once Only.
The token belongs to one customer while the variables say another; and any per-user assertions or
data become inconsistent. Put the CSV config inside the Once Only controller so each thread reads
one line, once.
</details>

---

## Glossary additions

`parameterisation` · `CSV Data Set Config` · `sharing mode` · `correlation` · `JSON Extractor` ·
`Regular Expression Extractor` · `default value` · `Once Only Controller` ·
`Transaction Controller` · `Throughput Controller` · `If Controller` · `__jexl3` ·
`Uniform Random Timer` · `Debug Sampler` · `JMeter log` · `HTTP(S) Test Script Recorder` ·
`Import from cURL`
