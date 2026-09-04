# Day 8 — Exploratory Testing

> **Week 2 · Day 8 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4 (4.4 Experience-based techniques), Chapter 5 (5.1.5)
> Prerequisites: Days 6–7

---

## At a glance

By the end of this session you should be able to:

1. Define exploratory testing and say why it is not "random clicking".
2. Write a **test charter** and run a timeboxed **session**.
3. Apply heuristics — **SFDIPOT**, **RCRCRC**, **CRUD**, "tours" — to generate test ideas fast.
4. Take useful session notes and report findings so the session is credible to a manager.
5. Decide when exploratory testing beats scripted testing, and vice versa.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: decision table |
| 0:05 – 0:13 | What exploratory testing is (and is not) |
| 0:13 – 0:22 | Charters and session-based test management |
| 0:22 – 0:35 | Heuristics and tours |
| 0:35 – 0:52 | **Activity:** a real 12-minute exploratory session |
| 0:52 – 0:58 | Debrief |
| 0:58 – 1:00 | Homework |

---

## 1. What exploratory testing is

> **Exploratory testing is simultaneous learning, test design and test execution.**
> — Cem Kaner

The three activities happen in a loop, and each informs the next:

```
        learn about the product
                 ↓
        design a test based on what you just learned
                 ↓
        execute it and observe
                 ↓
        learn something new  ──┐
                 ↑             │
                 └─────────────┘
```

In scripted testing, design happens once, in advance, and execution just follows the script. In
exploratory testing, **what you find changes what you test next**. That is the entire point: you
cannot script the response to a discovery you haven't made yet.

### It is not ad hoc testing

| | Ad hoc / "monkey" testing | Exploratory testing |
|---|---|---|
| Goal | None stated | A written charter |
| Timebox | None | 45–120 minutes |
| Notes | None | Session notes, always |
| Repeatable | No | Reproducible findings, documented setup |
| Accountable | No | A session report you can defend |
| Skill | Any | Uses techniques, heuristics, and product knowledge |

If someone dismisses exploratory testing as unprofessional, they have seen ad hoc testing
mislabelled. Exploratory testing is *structured*; what it doesn't have is pre-scripted steps.

### Why it finds what scripted testing misses

- Scripted tests can only find defects you anticipated when you wrote them (the pesticide
  paradox — Day 1, principle 5).
- Scripts encode the happy path plus the negative cases you thought of at the time.
- Real users are far more creative than your test cases. Exploratory testing lets you be too.
- It's fast: no writing overhead, so it's ideal for new features, tight deadlines, and
  investigating a vague bug report.

**When to prefer exploratory:**
new or changed feature; no useful specification; a bug report you must reproduce; a
high-risk area you want to probe deeply; smoke-check of a third-party integration; not enough
time to script.

**When to prefer scripted:**
regulatory/audit evidence needed; the test must be repeated identically every release;
you're handing the test to someone with less product knowledge; the test is a candidate for
automation; a complex data setup must be reproduced exactly.

Mature teams do both: automated regression checks the known, exploratory sessions probe the
unknown.

---

## 2. Charters and session-based test management (SBTM)

SBTM is what makes exploratory testing manageable and reportable. Three parts: a **charter**, a
**timebox**, and a **debrief**.

### The charter

A charter is a one-sentence mission. The classic template:

```
Explore <target>
With <resources>
To discover <information>
```

**Good charters:**

- *Explore the coupon code field with expired, used and malformed codes, using the API client,
  to discover error-handling and validation problems.*
- *Explore the checkout flow on a slow 3G connection, using Chrome DevTools throttling, to
  discover timeout and double-submission problems.*
- *Explore the user profile page as a user with no data (new account), to discover empty-state
  and null-handling defects.*
- *Explore file upload with unusual files (0 bytes, 2 GB, wrong extension, unicode filename,
  a .exe renamed to .jpg), to discover validation and security problems.*

**Bad charters:** "Test the checkout." "Explore the app." Too broad to focus a session or to
report on afterwards.

**A charter is scoped so it can plausibly be done in one session.** If you can't, split it.

### The session

- **Timeboxed:** short (~45 min), normal (~90 min), or long (~120 min). Set a timer.
- **Uninterrupted.** Notifications off. Exploration depends on holding a mental model; every
  interruption resets it.
- **One charter at a time.** Note distractions and come back to them — don't chase them mid-session.
- **Take notes as you go**, not afterwards. You will forget the setup that produced the bug.

### Session notes — what to record

```
Charter:      Explore the coupon field with invalid codes to discover validation problems
Tester:       Efe
Date/Build:   2026-03-12, build 4.3.0-rc2, QA2
Duration:     60 min
Test notes:
  - Applied SAVE20 (valid) → 20% off, total correct ✓
  - Applied SAVE20 twice → second attempt correctly rejected "already used" ✓
  - Applied " SAVE20 " with spaces → REJECTED. Should it trim? *** ISSUE 1 (question)
  - Applied save20 lowercase → accepted. Inconsistent with the spaces behaviour? *** ISSUE 2
  - Applied SAVE20 then EXPIRED10 → error, but the FIRST discount was silently removed *** BUG 1
  - 500-char coupon code → 500 error page, stack trace visible *** BUG 2 (security-ish)
  - Applied a code, then went Back and resubmitted → discount applied twice, total wrong *** BUG 3 (critical)
Bugs:         BUG-5511, BUG-5512, BUG-5513
Issues/questions for the PO: 2 (trimming, case sensitivity)
Time split:   65% testing, 20% bug reporting, 15% setup
Coverage:     Coupon entry & validation. NOT covered: coupons + gift cards together,
              coupons on subscriptions, admin coupon creation.
```

**The last two lines are what make the session credible to a manager.** They turn "I explored
for an hour" into "here is what I covered, what I did not, and where the time went."

### The debrief

A short conversation with a lead or peer after the session: what did you find, what surprised
you, what should the next charter be? Five minutes, and it's where the next test ideas come from.

---

## 3. Heuristics — how to generate ideas when you're stuck

A heuristic is a fallible rule of thumb that helps you think. Here are the ones worth memorising.

### SFDIPOT (the "San Francisco Depot" heuristic — product elements)

Walk a feature through each letter:

| Letter | Element | Questions |
|---|---|---|
| **S**tructure | What it's made of | Files, code, hardware, components — what can be missing or corrupted? |
| **F**unction | What it does | Every function and sub-function; calculations, error handling |
| **D**ata | What it processes | Inputs, outputs, big/small/empty/invalid/temporal/persistent data |
| **I**nterfaces | How it's accessed | UI, API, CLI, imports/exports, other systems |
| **P**latform | What it depends on | OS, browser, device, network, third-party services |
| **O**perations | How it will be used | Real usage patterns, misuse, extreme users, environments |
| **T**ime | Anything time-related | Timeouts, race conditions, ordering, time zones, DST, expiry |

### RCRCRC (regression risk heuristic — what to re-test when time is short)

| Letter | Look at what is… |
|---|---|
| **R**ecent | Newly changed code |
| **C**ore | Essential functions that must work |
| **R**isky | Complex, historically fragile, or high impact |
| **C**onfiguration-sensitive | Environment- or setting-dependent |
| **R**epaired | Recently fixed (fixes break things) |
| **C**hronic | Areas that break again and again |

### CRUD

For any entity, test all four: **C**reate, **R**ead, **U**pdate, **D**elete. Then the awkward
combinations: read after delete, update after delete, create a duplicate, delete twice, delete
something referenced by something else, update to an identical value, read as a different user.

### Tours (from James Whittaker's *Exploratory Software Testing*)

Explore the product with a themed lens, like a tourist:

| Tour | What you do |
|---|---|
| **The Guidebook tour** | Follow the user manual/help docs exactly. Do they match reality? |
| **The Money tour** | Test the features that sell the product — the demo path |
| **The Landmark tour** | Pick key features and hop between them in an unusual order |
| **The Back Alley tour** | Test the least-used, least-loved features |
| **The Garbage Collector tour** | Visit every screen in order, methodically, however boring |
| **The Supermodel tour** | Ignore function; look only at the UI — alignment, spacing, responsiveness, truncation |
| **The Saboteur tour** | Actively try to break it — kill the network, remove permissions, corrupt data |
| **The Obsessive-Compulsive tour** | Repeat, repeat, repeat: submit twice, refresh, go back, undo, redo |
| **The Couch Potato tour** | Do as little as possible — accept every default, submit empty forms |
| **The Antisocial tour** | Enter the least likely values everywhere |

### Other high-yield rules of thumb

- **"Follow the data."** Enter something, then chase it through the UI, the API response, the
  database, the email, the report, the export. Mismatch anywhere is a bug.
- **"Zero, one, many."** Test with no records, exactly one, and a lot.
- **"Interrupt everything."** Close the tab, lose the network, log out in another tab, let the
  session expire, rotate the phone mid-flow.
- **"Two of everything."** Two tabs, two users, two clicks, two devices — this is how you find
  race conditions and double-submission bugs.
- **"Goldilocks."** Too big, too small, just right.

---

## 4. The activity — a real exploratory session (17 minutes)

**Target:** any public demo application. Good choices:
`https://www.saucedemo.com` (deliberate bugs), OWASP Juice Shop, or your own product's QA
environment.

**Setup (2 min).** Assign each intern (or pair) a different charter:

1. *Explore login and session handling, to discover authentication and session-expiry problems.*
2. *Explore the cart with 0, 1 and many items, to discover state and calculation problems.*
3. *Explore the checkout form with invalid and extreme inputs, to discover validation problems.*
4. *Explore the product listing with sorting and filtering, to discover consistency problems.*
5. *Explore the whole app using only the keyboard, to discover accessibility problems.*
6. *Explore the app at 320px width, to discover responsive layout problems.*

**Session (12 min).** Timer on. Notes required. Remind them: no bug reports yet, just notes and
enough detail to reproduce.

**Debrief (3 min).** Each intern gives **one** finding in 20 seconds, plus what they did *not*
cover.

**Points to draw out in the debrief:**
- Almost everyone found something, in twelve minutes, with no test cases.
- The charters produced different findings — focus works.
- Ask "how many of you went off-charter?" Everyone does. That's fine — note it and come back.
- Ask "could you reproduce your finding right now?" Whoever hesitates has just learned why
  notes matter, one day before Day 10.

---

## 5. Making exploratory testing credible

The objection you will hear: *"How do I know you did anything? How do I plan for it?"*

Answers that work:

- **Charters are planned and assigned**, just like test cases. You can estimate them (n sessions
  × 90 minutes) and put them in a sprint.
- **Session reports give coverage information**: what was explored, what wasn't.
- **The time split** (test / bug / setup) shows where effort actually went — and often shows
  that a broken environment ate 40% of the session, which is management's problem to fix.
- **Metrics exist if you want them**: sessions completed, bugs per session, areas covered.
- **Pair it with automation.** "Automation covers the known regression; exploratory sessions
  cover the new and the unknown" is a strategy any manager can understand.

---

## Common mistakes juniors make

- No charter — wandering, then unable to say what was covered.
- Not taking notes, then not being able to reproduce the best bug of the day.
- Chasing every interesting thing and never finishing the charter. Note and return.
- Exploring only the UI. Open the network tab and the database — exploratory testing applies to
  APIs, logs and data too (Weeks 3 and 4).
- Only exploring the happy path with slightly wrong data. Be genuinely adversarial.

---

## Homework (about 40 minutes)

1. Run a **45-minute exploratory session** on any app of your choice with a charter you write
   yourself. Produce a session report with all the sections from §2 — including the "not
   covered" line and the time split.
2. Write **3 charters** you would run next, prioritised, with one sentence each on why.
3. Pick one finding and hold on to it — tomorrow and Wednesday you'll learn to write it up
   properly and to track it through its lifecycle.

---

## Check your understanding

<details>
<summary>1. Your manager says exploratory testing is "unstructured and unaccountable". Give a three-part answer.</summary>

(1) It is structured by a written charter and a timebox — the mission is decided before the
session starts. (2) It is accountable through session notes and a session report that states
what was covered, what was not, what was found, and how the time was spent. (3) It is
complementary, not a replacement: automation covers known regression; exploratory sessions find
what nobody thought to script, which is where the pesticide paradox says the remaining defects are.
</details>

<details>
<summary>2. Apply the "two of everything" heuristic to a payment page. Name three tests.</summary>

Double-click "Pay" — is the customer charged twice? Open the checkout in two tabs and pay in
both — does the order duplicate or the stock go negative? Two users buying the last item at the
same moment — does oversell happen? Also: the same card used on two accounts, two coupon codes,
two browser sessions for the same user with different cart contents.
</details>

<details>
<summary>3. You have 2 hours before a release and no test cases. What do you do?</summary>

Write three or four charters ranked by risk using RCRCRC — recent changes first, then core
flows, then anything historically fragile or recently repaired. Run 25–30 minute sessions on
each with notes. Report coverage honestly at the end: what you explored, what you found, and
what remains untested so the release decision is made with eyes open. Do not attempt to write
test cases in the time you have to run them.
</details>

<details>
<summary>4. What makes a charter good?</summary>

It names a specific target, the resources or conditions to use, and the kind of information it
is hunting for — and it is small enough to complete in one timeboxed session. "Explore the app"
fails all four. "Explore file upload with 0-byte, oversized and misnamed files to discover
validation and error-handling problems" passes.
</details>

---

## Glossary additions

`exploratory testing` · `ad hoc testing` · `test charter` · `session-based test management` ·
`timebox` · `session notes` · `debrief` · `heuristic` · `SFDIPOT` · `RCRCRC` · `CRUD` ·
`tour` · `race condition` · `pesticide paradox`
