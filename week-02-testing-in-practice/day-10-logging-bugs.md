# Day 10 — Logging a Bug: Every Field, With Examples

> **Week 2 · Day 10 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 5 (5.5 Defect Management, defect report contents)
> Prerequisites: Day 9

---

## At a glance

By the end of this session you should be able to:

1. Name every field in a bug report and say what it's for.
2. Write a title that a developer can triage without opening the ticket.
3. Write steps to reproduce that work on someone else's machine.
4. Set **severity** and **priority** correctly, and explain the difference under pressure.
5. Attach the right evidence, and know what evidence is missing.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:04 | Homework review |
| 0:04 – 0:10 | Why bug reports are your professional signature |
| 0:10 – 0:22 | The fields, one by one |
| 0:22 – 0:32 | Severity vs priority, with the matrix |
| 0:32 – 0:42 | Three worked examples, bad → good |
| 0:42 – 0:56 | **Activity:** rewrite bad bugs; log a real one |
| 0:56 – 1:00 | Homework |

---

## 1. Why this matters more than anything else you do

Most of your work is invisible. Your bug reports are not — they are read by developers, leads,
product owners, and sometimes executives. **A bug report is the main artefact by which your
professional competence is judged.**

Practically:
- A vague report bounces back as "Cannot Reproduce" and wastes two days.
- A precise report gets fixed the same afternoon.
- A well-argued severity gets the right thing fixed first.
- A poorly written report makes the whole QA function look expensive and unhelpful.

**The test:** could a developer who has never used the feature, on a different continent, at
2am, reproduce your bug without asking you a single question?

---

## 2. The fields, one by one

Field names vary by tool (Jira, Azure DevOps, Bugzilla, GitHub Issues, a spreadsheet). The
*concepts* don't.

| # | Field | Purpose | Example |
|---|---|---|---|
| 1 | **ID / Key** | Unique reference. Auto-generated | `PAY-4412` |
| 2 | **Title / Summary** | One line: what, where, when | `Checkout: order total excludes VAT when a coupon is applied (all browsers)` |
| 3 | **Description / Overview** | 1–3 sentences of context and impact | See below |
| 4 | **Steps to Reproduce** | Numbered, exact, from a known start | See below |
| 5 | **Expected Result** | What *should* happen, and your source for that | `Total = ₦45,000 (₦40,000 + 12.5% VAT)` per REQ-88 |
| 6 | **Actual Result** | What *did* happen, precisely | `Total = ₦40,000. VAT line missing from the summary.` |
| 7 | **Severity** | Technical impact on the system | `Critical` |
| 8 | **Priority** | Business urgency of fixing | `P1 — fix before release` |
| 9 | **Environment** | Where it happened | `QA2, build 4.3.0-rc2, Chrome 121.0 / Windows 11, 1920×1080` |
| 10 | **Build / Version** | Exact version under test | `4.3.0-rc2 (commit a1b2c3d)` |
| 11 | **Module / Component / Area** | For routing and reporting | `Checkout / Pricing engine` |
| 12 | **Reproducibility / Frequency** | Always / Intermittent (n of m) / Once | `Intermittent — 3 of 10 attempts` |
| 13 | **Test data used** | The exact accounts, values, records | `user qa.efe+coupon01@example.com, coupon SAVE20, SKU BK-1099` |
| 14 | **Preconditions** | State required before step 1 | `Logged in; cart empty; coupon SAVE20 active and unused by this user` |
| 15 | **Attachments / Evidence** | Screenshot, video, logs, HAR, request/response | `total.png`, `session.har`, `app-2026-03-12.log` |
| 16 | **Reported by / Date** | Who to ask; when it appeared | `Efe, 2026-03-12 14:32 WAT` |
| 17 | **Assigned to** | Current owner | `Ada (Payments team)` |
| 18 | **Status** | Where it is in the lifecycle (Day 9) | `New` |
| 19 | **Linked requirement / story** | Traceability | `PAY-3990`, `REQ-88` |
| 20 | **Related defects** | Duplicates, blockers, similar | `Duplicate of PAY-4390`, `Blocks PAY-4500` |
| 21 | **Workaround** | What users/support can do meanwhile | `Apply the coupon after selecting delivery; the total then recalculates correctly` |
| 22 | **Impact / Affected users** | Who and how many | `All customers using a coupon — ~18% of orders (analytics, last 30 days)` |
| 23 | **Root cause** | Filled in by the developer later | `VAT applied to pre-discount subtotal in PricingService.calculate()` |
| 24 | **Fix version** | Which release contains the fix | `4.3.1` |
| 25 | **Labels / Tags** | Filtering: `regression`, `security`, `mobile`, `customer-reported` | `regression`, `revenue-impacting` |

You will not fill in all 25 every time. **The non-negotiable core is 2, 4, 5, 6, 7, 8, 9, 12, 15.**

---

### Field 2 — Title. The most-read line you will ever write.

A good title answers **where + what + when/condition** and can be triaged without opening the
ticket.

**Formula:** `[Area]: <what goes wrong> when <condition> (<scope/qualifier>)`

| ❌ Bad | ✅ Good |
|---|---|
| "Login broken" | `Login: "Invalid credentials" shown for valid users when the password contains an ampersand` |
| "App crashes" | `Mobile app crashes on launch when the device language is set to Arabic (iOS 17 only)` |
| "Wrong total" | `Checkout: order total excludes VAT when a coupon is applied — customer underpaid` |
| "Not working on mobile" | `Product page: "Add to cart" button is unreachable below 360px width (button off-screen)` |
| "Bug in search" | `Search: results page shows 0 results for terms containing an apostrophe (e.g. "men's")` |
| "Slow" | `Search: p95 response time is 6.2s against a 2s NFR, with 500 concurrent users` |

Rules: no ALL CAPS, no "URGENT!!!" (that's what priority is for), no vague verbs ("doesn't
work", "has issues"), under ~110 characters so it isn't truncated in a list.

---

### Field 4 — Steps to Reproduce. Where reports live or die.

Rules:
1. **Start from a known state.** "Log in as X" or "Open an incognito window at <URL>". Never
   start from wherever you happened to be.
2. **Number every step. One action per step.**
3. **Use exact values.** Not "enter a coupon" — `enter SAVE20`.
4. **Include the data and account**, or point to where they came from.
5. **Say where the failure occurs.** Mark the step: `← FAILS HERE`.
6. **Minimise.** Reproduce it again, dropping steps, until you have the shortest sequence that
   still fails. A 4-step repro gets fixed; a 19-step one gets deferred. Minimising also often
   reveals the real trigger — you'll discover the coupon isn't the cause, the *delivery option*
   is.
7. **Say if the order matters.** "Applying the coupon *before* selecting delivery is required."

**Bad:**
> Add stuff to cart, use a coupon, and the total is wrong.

**Good:**
```
Preconditions: Coupon SAVE20 (20%, no minimum) is active and unused by this account.
               Account qa.efe+coupon01@example.com exists with an empty cart.

1. Open Chrome in an incognito window and go to https://qa2.example.com
2. Log in as qa.efe+coupon01@example.com / ValidPass!456
3. Search for "BK-1099" and open the product "Standard Notebook" (₦40,000)
4. Click "Add to cart"
5. Click the cart icon, then "Proceed to checkout"
6. Observe the order summary: Subtotal ₦40,000 · VAT ₦5,000 · Total ₦45,000   ✔ correct so far
7. In the "Coupon code" field, enter SAVE20 and click "Apply"   ← FAILS HERE

Note: reproduces 10/10. Does NOT occur if the coupon is applied after selecting a delivery
option, which suggests the recalculation path differs.
```

---

### Fields 5 & 6 — Expected vs Actual. State your source.

The weakest thing a junior writes is "Expected: it should work." Say what should happen **and
why you believe that**, so a disagreement is about the requirement rather than about you.

```
Expected result:
  After applying SAVE20, the summary should show:
    Subtotal      ₦40,000
    Discount     -₦8,000   (20%)
    VAT (12.5%)   ₦4,000   (calculated on the discounted subtotal of ₦32,000)
    Total         ₦36,000
  Source: REQ-88 "VAT is calculated on the post-discount subtotal", and story PAY-3990 AC3.

Actual result:
  Subtotal      ₦40,000
  Discount     -₦8,000
  Total         ₦32,000
  The VAT line disappears entirely and no tax is charged. The customer is undercharged by
  ₦4,000 per order and the invoice PDF also omits VAT (see invoice.pdf attached).
```

Notice the last sentence: it extends the blast radius from "the number on screen" to "the
invoice and our tax position". That sentence changes the priority.

---

### Field 9 — Environment. Be specific enough to reproduce.

```
Environment:  QA2  (https://qa2.example.com)
Build:        4.3.0-rc2 (commit a1b2c3d, deployed 2026-03-12 09:10 WAT)
Browser:      Chrome 121.0.6167.85, 64-bit
OS:           Windows 11 Pro 23H2
Resolution:   1920×1080, 100% zoom
Network:      Office wifi, ~50 Mbps
Account role: Standard customer (not Premium)
Also reproduced on: Firefox 122 / macOS 14, Safari 17 / iOS 17.3
NOT reproduced on: PROD (4.2.9) — this is a regression introduced in 4.3.0
```

That last pair of lines is worth more than everything above it: it tells the team the bug is
**new**, narrows it to one release, and often points straight at the commit.

---

### Field 12 — Reproducibility

- `Always (10/10)` — best case.
- `Intermittent (3/10)` — still log it. Say what you tried, and any pattern you noticed
  ("only on the first attempt after a fresh login", "only when two tabs are open").
- `Once, could not reproduce` — log it anyway with everything you have, tagged as such. If a
  second person hits it, your report is the evidence that makes it real.

Never quietly drop an intermittent bug because it's inconvenient. Intermittent usually means a
race condition or a caching problem, and those are exactly the bugs that hurt in production.

---

### Field 15 — Evidence

| Evidence | When | Note |
|---|---|---|
| Screenshot | Almost always | Annotate it: circle the wrong number. Include the whole window — the URL bar and any error ID matter |
| Screen recording | Intermittent bugs, timing bugs, complex flows | Keep it under 60 seconds |
| Browser console output | Any UI bug | F12 → Console. Copy the red text as text, not a picture of text |
| Network / HAR file | Anything data-related, any API bug | F12 → Network → right-click → Save all as HAR. **Scrub tokens and passwords first** |
| Server logs | 500s, backend errors | Include the timestamp and any correlation/trace ID |
| Database query result | Data-integrity bugs | `SELECT` output showing the wrong stored value (Week 3) |
| Request/response | API bugs | Full method, URL, headers, body, status (Week 4) |
| The exact error ID | Whenever the UI shows one | Devs search logs by it; it can save hours |

**Security note:** never paste real customer data, session tokens, API keys or passwords into a
ticket. Redact them. A bug tracker is usually readable by far more people than you think.

---

## 3. Severity vs priority

The most common interview question in QA, and the most common thing juniors get wrong.

|  | **Severity** | **Priority** |
|---|---|---|
| Question | How bad is the impact on the system? | How soon must it be fixed? |
| Decided by | The tester (technical judgement) | The Product Owner / business |
| Changes over time? | Rarely | Often — as dates and context change |
| Typical scale | Blocker / Critical / Major / Minor / Trivial | P1 / P2 / P3 / P4 |

**Severity definitions worth adopting:**

| Severity | Definition | Example |
|---|---|---|
| **Blocker** | Testing cannot continue; the system is unusable | The app won't launch; login is down for everyone |
| **Critical** | Major function broken, data loss/corruption, financial or security impact; no workaround | Customers charged twice; a user can see another user's data |
| **Major** | Important function broken or badly wrong, but a workaround exists | Search filters ignored; PDF invoice missing a required field |
| **Minor** | Small functional problem, low impact | Sort order wrong on a secondary column; a tooltip shows stale text |
| **Trivial** | Cosmetic | Typo; 4px misalignment; inconsistent capitalisation |

**Priority definitions:**

| Priority | Meaning |
|---|---|
| **P1 / Immediate** | Drop other work; fix now, possibly hotfix to production |
| **P2 / High** | Must be fixed before this release ships |
| **P3 / Medium** | Should be fixed in a coming sprint |
| **P4 / Low** | Fix when convenient; may never be fixed |

### The four corners — this is the whole lesson

| | **High priority** | **Low priority** |
|---|---|---|
| **High severity** | Payment fails for all users. *Obvious: fix now.* | Total data loss in a feature being removed next month, used by nobody. *Bad, but not worth fixing.* |
| **Low severity** | The company name is misspelled on the homepage. *Trivial to fix, but the CEO demo is tomorrow — embarrassment is a business cost.* | A tooltip on an admin page has a typo. *Someday.* |

Memorise the two off-diagonal examples. They prove you understand that severity is technical
and priority is commercial, and they are the answer to the interview question.

**How to argue for a higher priority** (you will need to):
- Lead with **frequency and reach**: "18% of orders", "every user on first login".
- State the **cost**: money lost, support tickets generated, regulatory exposure, reputational risk.
- State whether a **workaround** exists and how discoverable it is.
- Do not say "this is critical" without a number. Say the number.

---

## 4. Three worked examples

### Example A — the vague bug, rewritten

**❌ As logged by an intern**
> **Title:** Search not working
> **Description:** I searched for something and it didn't work. Please fix.
> **Severity:** Critical

**✅ Rewritten**
```
Title:  Search: 0 results returned for any term containing an apostrophe (e.g. "men's shirt")

Description:
Product search returns an empty result set whenever the search term contains a straight
apostrophe ('), even when matching products exist. Affects an estimated 4% of searches
(analytics: 2,100 of 52,000 searches in the last 30 days contained an apostrophe). No error is
shown — the user simply sees "No products found", so they assume we don't stock the item.

Steps to reproduce:
  1. Go to https://qa2.example.com (no login required)
  2. Confirm the product "Men's Cotton Shirt" (SKU SH-2042) exists: open
     https://qa2.example.com/product/SH-2042 → the product page loads correctly
  3. In the search box, type: men's shirt
  4. Press Enter                                            ← FAILS HERE

Expected result:
  The results page lists "Men's Cotton Shirt" (SH-2042) and other matching products.
  Source: REQ-51 "Search shall match on product title and description".

Actual result:
  "No products found matching your search." 0 results.
  The network response is HTTP 200 with {"results": [], "total": 0}.
  Searching for "mens shirt" (no apostrophe) correctly returns 12 results, including SH-2042.
  The typographic apostrophe (') is also affected.

Severity:          Major   (core function broken for a subset of input; workaround = omit the apostrophe,
                            but users have no way of knowing that)
Priority:          P2      (proposed — affects ~4% of searches and directly loses sales)
Environment:       QA2, build 4.3.0-rc2, Chrome 121 / Windows 11
Reproducibility:   Always (10/10). Also reproduces on PROD 4.2.9 — this is NOT a new regression.
Test data:         SKU SH-2042 "Men's Cotton Shirt"
Attachments:       search-apostrophe.png, search-request.har
Related:           Possibly related to SEARCH-2201 (special characters in search)
Note for dev:      The query appears to be escaped twice; the HAR shows the request going out as
                   q=men%5C%27s. Worth checking the input-sanitisation layer.
```

That last note is optional and must be humble ("appears to", "worth checking") — but a tester
who can point at the network tab is a tester developers want to work with.

### Example B — severity/priority disagreement

> **Bug:** The password reset email arrives 20 minutes late.
> **Tester logs:** Severity Major, Priority P1.
> **Developer says:** "It arrives eventually. Low."

**The tester's winning argument** is not "it's important". It is:
> *"Support logged 40 tickets last week from users who requested three or four resets because
> nothing arrived. Each extra request invalidates the previous link (SEC-88), so a user who
> clicks the first email gets 'This link has expired' — which is why 12 of those 40 escalated.
> That's roughly 3 support-hours a week, and it's our most common signup-abandonment point."*

Data, cost, and a second-order consequence nobody had connected. That's how priority arguments
are won.

### Example C — the bug that isn't a bug (yet)

You find that the app allows a user to set their date of birth to a future date. There is no
requirement about it.

**Log it anyway**, but honestly:
- **Title:** `Profile: date of birth accepts future dates (no validation) — spec gap`
- Severity: Minor. Priority: P3.
- Description: state that no requirement covers this, the observed behaviour, and the
  consequence (age-based eligibility checks would compute a negative age; the 18+ gate could be
  bypassed by picking a future date if the calculation wraps).
- Add a question for the PO: "Should DOB be constrained to between today−120 years and today?"

This is how a tester handles a spec gap: report the behaviour, name the risk, ask the question,
and let the PO decide. Do not silently ignore it, and do not assert a requirement that doesn't
exist.

---

## 5. The pre-submit checklist

Before you press Create, run this. It takes 60 seconds and doubles your credibility.

- [ ] Did I **reproduce it at least twice**?
- [ ] Did I **minimise** the steps?
- [ ] Did I **search for a duplicate**?
- [ ] Is the **title** self-explanatory in a list of 200?
- [ ] Could a **stranger** follow my steps with no verbal explanation?
- [ ] Are my **exact test data and account** in the ticket?
- [ ] Did I state **expected vs actual** separately, with a **source** for expected?
- [ ] Is the **environment and build** recorded?
- [ ] Did I check whether it **also happens on production / the previous build** (is it a regression)?
- [ ] Is there **evidence attached**, with secrets redacted?
- [ ] Have I stated **frequency** and **who/how many are affected**?
- [ ] Is there a **workaround**, and did I say so?
- [ ] Are severity and priority **justified**, not just asserted?

---

## Live activity (14 minutes)

**Part 1 (5 min) — Rewrite these.** Three real-world-style bad reports; interns rewrite one each.

1. *"The page is slow sometimes."*
2. *"Doesn't work on my phone."*
3. *"After I did some stuff the balance was wrong, screenshot attached." (screenshot shows only a number)*

Ask for the **five questions** each report fails to answer.

**Part 2 (9 min) — Log a real one.** Everyone takes their best finding from Day 8's exploratory
session and writes it up in full, using
[templates/bug-report-template.md](../templates/bug-report-template.md).

Then **swap and audit** against the pre-submit checklist. The auditor's job is to find the one
thing that would make a developer come back and ask a question.

---

## Common mistakes juniors make

- Multiple defects in one ticket. One bug, one ticket — otherwise it can't be triaged, assigned,
  fixed or closed cleanly.
- Writing "expected: it should work correctly".
- Assuming the developer knows the context. They were in a different feature all week.
- Emotional language: "This is completely broken and unacceptable." It reads as unprofessional
  and gets you discounted in the next argument you actually need to win.
- Setting everything to Critical. It destroys the signal, and then your genuine Critical gets ignored.
- Not checking the previous build — "is this a regression?" is the first thing a lead will ask.
- Logging a bug the moment you see it, without reproducing it once more.

---

## Weekend homework (about 45 minutes)

1. Write **three complete bug reports** from your exploratory findings, using every core field.
   Vary the severity — one high, one medium, one cosmetic — and justify each.
2. For each, write one sentence on the **priority argument** you'd make in triage if it were
   pushed back.
3. Find a real published bug report (any open-source project's issue tracker — e.g. a
   well-written Firefox or VS Code issue). Write three sentences on what it does well and one
   thing it's missing.
4. **Read ahead:** Week 3 is technical. If you've never opened your browser's DevTools
   (F12 → Network tab), spend 10 minutes clicking around a website with it open. You don't need
   to understand it yet — just see it.

---

## Check your understanding

<details>
<summary>1. Give an example of a high-severity, low-priority bug and explain the reasoning.</summary>

A feature that corrupts data catastrophically, but in a module that is being decommissioned next
month and currently has no users — or a total crash that only occurs on a browser version below
our supported minimum. Severity is high because the technical impact is severe; priority is low
because the business cost of it happening is near zero and the fix effort is better spent
elsewhere. The point: severity describes the damage, priority describes the urgency of spending
money to prevent it.
</details>

<details>
<summary>2. Your bug is returned as "Cannot Reproduce". List five things to add before you send it back.</summary>

(1) The exact build and environment, plus the timestamp of the failure so logs can be searched.
(2) The exact account, its role, and its data state — a bug that needs a coupon already used
won't reproduce on a fresh account. (3) A screen recording. (4) The frequency ("3 of 10") and any
pattern you spotted. (5) Anything unusual in your session — a second tab, a slow network, a
previous action, a specific browser zoom or window width. Also confirm the developer used the
same steps, in the same order, since order dependency is a common cause.
</details>

<details>
<summary>3. Why does "is it also on production?" matter so much?</summary>

It tells the team whether the defect is a **regression** (new, introduced by recent changes) or
a long-standing issue. A regression is more urgent — it means something that used to work is
now broken, it likely affects a known set of recent commits, and it may be about to reach
customers. A long-standing bug that nobody has complained about in two years is usually less
urgent. It also narrows the search: the fault is somewhere between the two builds.
</details>

<details>
<summary>4. What is the single most valuable thing you can do to a bug report before submitting it?</summary>

Minimise the reproduction steps by reproducing it again and removing everything unnecessary. It
proves the bug is real, gives the developer the shortest path to the fault, often reveals the
actual trigger (which is frequently not what you first assumed), and it is the difference
between a bug that's fixed today and one that sits in the backlog.
</details>

<details>
<summary>5. Two bugs, both "Critical". One affects 100% of users at login; the other affects 0.5% of users at checkout, losing money each time. Which is higher priority?</summary>

There's no single right answer, and saying so *with the trade-off* is the correct response.
Login affects everyone and blocks all use — it usually wins on reach. But the checkout bug loses
money per occurrence and may create refund and reconciliation work, so its cost per user is far
higher and it may carry regulatory exposure. Bring both numbers to triage — reach × cost — and
let the Product Owner decide. Your job is to make the trade-off visible, not to decide it.
</details>

---

## Glossary additions

`defect report` · `steps to reproduce` · `minimisation` · `expected result` · `actual result` ·
`severity` · `priority` · `blocker` · `reproducibility` · `regression` · `workaround` ·
`HAR file` · `correlation ID` · `evidence` · `spec gap`
