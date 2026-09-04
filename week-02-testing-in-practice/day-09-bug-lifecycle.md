# Day 9 — The Bug Lifecycle

> **Week 2 · Day 9 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 5 (5.5 Defect Management)
> Prerequisites: Day 7 (state transition testing), Day 8

---

## At a glance

By the end of this session you should be able to:

1. Draw the defect lifecycle and name every state.
2. Say who owns a defect in each state, and what "owns" means.
3. Handle the awkward states: Rejected, Duplicate, Deferred, Cannot Reproduce, Reopened.
4. Run — or survive — a **defect triage** meeting.
5. Read defect metrics and know which ones lie.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: exploratory session reports |
| 0:05 – 0:20 | The lifecycle, state by state |
| 0:20 – 0:32 | The awkward states, and how to argue well |
| 0:32 – 0:42 | Triage: how the meeting works |
| 0:42 – 0:50 | Defect metrics and what they hide |
| 0:50 – 0:58 | **Activity:** run a triage meeting |
| 0:58 – 1:00 | Homework |

---

## 1. The lifecycle

A defect is a state machine — exactly the thing you learned to test on Day 7. Here it is
governing your own working life.

```
                        ┌──────────┐
                        │   NEW    │  ← tester logs it
                        └────┬─────┘
                             │ triage
                ┌────────────┼────────────┬──────────────┬───────────────┐
                ▼            ▼            ▼              ▼               ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌───────────┐   ┌──────────┐
          │ ASSIGNED │ │ REJECTED │ │DUPLICATE │  │ DEFERRED  │   │ NEED INFO│
          └────┬─────┘ └────┬─────┘ └────┬─────┘  └─────┬─────┘   └────┬─────┘
               │            │            │              │              │
               ▼            └────────────┴──────┐       │              │
          ┌──────────┐                          │       │ (backlog)    │ tester
          │IN PROGRESS│                         │       │              │ responds
          └────┬─────┘                          ▼       ▼              │
               │                            ┌─────────────┐            │
               ▼                            │   CLOSED    │◄───────────┘
          ┌──────────┐                      └─────────────┘
          │  FIXED   │  ← dev says done, in build X          ▲
          └────┬─────┘                                        │
               │ deployed to test env                         │
               ▼                                              │
          ┌──────────────┐    re-test passes                  │
          │ READY FOR QA │──────────────────────────► VERIFIED┘
          └────┬─────────┘
               │ re-test fails
               ▼
          ┌──────────┐
          │ REOPENED │──────────────► back to ASSIGNED
          └──────────┘
```

### State by state

| State | Meaning | **Owner** | What must happen next |
|---|---|---|---|
| **New** | Logged, not yet triaged | Tester (until triage) | Triage: validate, prioritise, assign |
| **Assigned** | Accepted and given to a developer | Developer | Investigate and fix |
| **In Progress** | Being worked on | Developer | Produce a fix |
| **Fixed / Resolved** | Dev believes it's fixed, states the build | Developer → Tester | Deploy to test environment |
| **Ready for QA** | Fix is deployed and testable | Tester | **Re-test** (confirmation testing) |
| **Verified** | Re-test passed | Tester | Move to Closed (per your workflow) |
| **Reopened** | Re-test failed | Developer | Fix properly; explain what was missed |
| **Closed** | Done, no further action | — | Nothing |
| **Rejected / Not a bug** | Working as designed, or tester error | Tester | Accept, or escalate with evidence |
| **Duplicate** | Already reported | Tester | Link to the original and follow that one |
| **Deferred / Backlog** | Real, but not being fixed now | Product Owner | Revisit at a stated time |
| **Cannot Reproduce** | Dev can't make it happen | Tester | Provide more detail, or close honestly |
| **Need More Info** | Report is incomplete | Tester | Add what's missing, fast |

**Two rules that will save you grief:**

1. **The person who found it verifies the fix.** Not the developer. Not "whoever is free".
   The finder knows the exact conditions.
2. **Never close your own bug as "fixed" without re-testing on a build where the fix is
   actually deployed.** "Fixed in 4.2.1" while QA2 is running 4.2.0 means you are testing the
   old code, and your "verified" is a lie.

---

## 2. The awkward states — how to handle them well

### Rejected / "Not a bug"

Reasons a bug is legitimately rejected: it is working as specified; the tester used the wrong
data or environment; the tester misunderstood the requirement; it is a duplicate; the behaviour
is a deliberate limitation.

**How to respond professionally:**

- Check first — you're wrong sometimes, and admitting it fast costs you nothing.
- If you disagree, argue with the **requirement**, not with feelings: quote the AC, the spec
  section, or the design mock-up.
- If it isn't in the spec but is genuinely bad for users, **reframe it**: this isn't a
  spec violation, it's a usability/UX issue that will generate support calls. Then let the PO
  decide. That is their job, not yours.
- Losing an argument is fine. Losing it silently is not — make sure the decision is recorded on
  the ticket so nobody is surprised in production.

### Duplicate

- **Always search before logging.** Search by error message, by screen name, by module.
- If it's a duplicate, link it. Don't delete it — the second report often has better evidence,
  and two reports is a signal about frequency.
- If it's *similar but not identical* — same screen, different cause — say so and keep it separate.

### Deferred

The bug is real but won't be fixed now. This is a **business decision**, and it belongs to the
Product Owner, not the developer and not you.

Your job when a bug is deferred:
- Make sure the risk is *stated*: who is affected, how often, what's the workaround.
- Make sure it's *recorded*, not just verbally agreed.
- Make sure it has a *review date*. "Deferred" without a date means "closed but dishonest".
- If it's a known issue at release, get it in the **release notes** and tell support.

### Cannot Reproduce

The most frustrating state, and usually your fault — the report was missing something.

Before you push back, add:
- Exact build, environment and time of the failure.
- The exact user account and role, and its data state.
- Browser/device/OS and version, screen size.
- A video, if you can — it captures things you didn't think to write down.
- Whether it's intermittent, and how often (e.g. "3 of 10 attempts").
- Anything unusual in your session: a slow network, a second tab open, a previous action.

**Intermittent bugs are real bugs.** Never let "cannot reproduce" become "doesn't exist". Log
how frequently it happens and what you were doing; frequency is data.

### Reopened

- Explain precisely *what still fails*, in what build. "Still broken" helps nobody.
- If the original problem is fixed but you found something new, log a **new** bug instead of
  reopening — otherwise the history becomes unreadable and the metrics distort.
- A high reopen rate is a process signal worth raising in a retro: it usually means developers
  aren't re-testing before marking Fixed, or fixes are being marked Fixed before deployment.

---

## 3. Defect triage

A short, regular meeting (daily during a release crunch, twice a week otherwise) where new
defects are reviewed and decided.

**Who's there:** a tester (often the one who logged it), a developer or tech lead, the Product
Owner. Keep it small.

**For each new defect, decide four things:**
1. **Is it valid?** Real defect, duplicate, or working as designed?
2. **Severity** — how bad is the impact? (Technical judgement.)
3. **Priority** — how soon must it be fixed? (Business judgement.)
4. **Assignment** — who owns it, and for which release/sprint?

**How to prepare so triage takes 15 minutes instead of an hour:**
- Every ticket already has clear steps, evidence, and a proposed severity.
- You know the answer to "how many users does this affect?" and "is there a workaround?"
- Duplicates are already linked.
- You can demo the bug in 30 seconds if challenged.

**Anti-patterns to watch for:**
- Everything is "Critical" — then nothing is. If your severity distribution is 80% high, your
  scale is broken.
- Triage becomes a debugging session. Timebox it; take the deep dive offline.
- Bugs get deferred with no date and no owner.
- The loudest voice wins. Bring the data: frequency, user impact, workaround.

---

## 4. Defect metrics, and which ones lie

| Metric | What it's for | How it lies |
|---|---|---|
| **Open defect count** | Snapshot of outstanding work | Meaningless without severity split |
| **Defect density** (defects / size) | Compare modules; find defect clusters | Sensitive to how you measure "size" |
| **Defect discovery rate over time** | Are we finding fewer as we stabilise? | Falls when testers are pulled off, not just when quality rises |
| **Defect Removal Efficiency** — defects found before release ÷ (before + after) × 100 | How effective testing was | Only computable after the release |
| **Reopen rate** | Fix quality | High rate = fixes aren't verified before being marked Fixed |
| **Defect age** | How long bugs sit | Old low-severity bugs skew the average |
| **Defects by phase found** | Are we shifting left? | Requires disciplined tagging |
| **Escaped defects** (found in production) | The one that matters most | Under-reported when support doesn't log back to QA |

**Never use "bugs found per tester" as a performance measure.** It rewards logging trivia and
splitting one bug into five, punishes the tester assigned to the stable module, and destroys the
collaboration you need with developers. If a manager asks for it, offer escaped defects and
coverage instead.

**The curve to watch during a release:** new defects found per day should decline while the
fixed-and-verified count rises. If new defects are still climbing three days before release,
the release date is fiction — say so early, in writing, with the chart.

---

## Live activity (8 minutes)

**Run a triage meeting.** Assign roles: one Product Owner, one developer, the rest testers.
Triage these five, deciding valid/severity/priority/assignment for each, in 90 seconds each:

1. On the payment page, the "Pay" button can be clicked twice quickly, charging the customer
   twice. Happened to 1 tester, 3 times out of 10 attempts.
2. The company logo is 4 pixels off-centre on the login page. Every user sees it.
3. Users cannot log in at all on Safari 15. About 8% of traffic.
4. The error message says "An error occured" (missing an "r"). On a rarely-seen 500 page.
5. Search returns results 6 seconds after the button is pressed. The NFR says 2 seconds. All users.

<details>
<summary>Facilitator answer key</summary>

1. **Valid. Severity: Critical** (financial loss, data integrity). **Priority: Highest** — fix
   before release, no exceptions. Intermittency doesn't reduce severity when money is involved.
   Ask whether the double charge is refundable automatically; ask whether it's already happening
   in production.
2. **Valid. Severity: Cosmetic/Low. Priority: Low.** Fine to defer — but note it's on the login
   page, the first thing every user sees, so it may matter more to the brand than to the
   function. PO decides.
3. **Valid. Severity: Critical** (complete loss of function). **Priority: Highest**, unless
   Safari 15 is outside the supported browser list — check the compatibility NFR first. That
   check is the tester's job before triage.
4. **Valid. Severity: Low** (typo). **Priority: Low**, but it's a 10-second fix — a good
   candidate to bundle with any other change to that file. Note: if the same typo appears in
   many messages, it's one bug, not twenty.
5. **Valid. Severity: High** (NFR breach affecting all users). **Priority: High.** Needs
   investigation before the fix can be sized; likely a database or indexing issue. Ask for the
   measured p95, not just one observation — this is where Week 3's skills start paying off.

**Meta-point for the debrief:** the tester's contribution to triage is *evidence*, not opinion.
Frequency, user impact, and whether a workaround exists decide most of these arguments.
</details>

---

## Common mistakes juniors make

- Marking a bug Verified without confirming the fix is actually deployed to the environment.
- Reopening a bug for a *different* defect found nearby.
- Taking rejection personally. It's a decision about a ticket, not about you.
- Letting bugs sit in "Need More Info" for a week — that's your queue, and it blocks the fix.
- Logging five tickets for one underlying cause (or one ticket for five unrelated problems).
- Never following up on deferred bugs, so they silently become permanent.

---

## Homework (about 30 minutes)

1. Draw the defect lifecycle used by your organisation (or a standard Jira workflow) from
   memory. Mark, for each state, **who owns it** and **what unblocks it**.
2. Write the exact wording you would use to push back, professionally, on a bug wrongly marked
   "Cannot Reproduce" — assume you *can* reproduce it 3 times in 10.
3. Take three findings from your exploratory session and assign each a severity and a priority,
   with a one-sentence justification. Tomorrow you'll write them up as full bug reports.

---

## Check your understanding

<details>
<summary>1. A developer marks a bug "Fixed in build 4.2.1". The QA environment runs 4.2.0. What state should the bug be in and what do you do?</summary>

It stays in Fixed/Resolved — it is **not** Ready for QA, because the fix isn't in the
environment. Do not re-test; anything you observe is the old code. Note the build discrepancy on
the ticket and chase the deployment. Testers who skip this step verify fixes that were never
deployed and then look foolish when the bug reappears in production.
</details>

<details>
<summary>2. Who decides that a bug is Deferred, and what must be recorded?</summary>

The Product Owner or an equivalent business owner — deferral is a business trade-off, not a
technical one. Record the decision, who made it, the reason, the user impact and frequency, any
workaround, and a **review date**. If it's shipping with the release, it also goes into the
release notes and to the support team.
</details>

<details>
<summary>3. Your team's reopen rate is 30%. What does that suggest, and what would you propose?</summary>

Fixes are being marked Fixed without being verified by the developer, or without being deployed,
or the root cause is being patched at the symptom level. Proposals: require the developer to
state how they verified the fix; require the build number and the deployment before a bug moves
to Ready for QA; add a unit or automated test with each fix; and review the reopened tickets in
the retro to find the pattern.
</details>

<details>
<summary>4. Why is "number of bugs found per tester" a harmful metric?</summary>

It measures the wrong thing and changes behaviour for the worse: testers split one issue into
five, log trivia to pad the count, avoid the risky-but-quiet modules, and stop helping
developers prevent bugs (since prevented bugs don't count). It also penalises whoever is
assigned to the most stable area. Better measures: escaped defects found in production, coverage
of high-risk areas, and the cycle time from bug found to bug verified.
</details>

---

## Glossary additions

`defect lifecycle` · `triage` · `assigned` · `resolved` · `verified` · `reopened` · `deferred` ·
`duplicate` · `cannot reproduce` · `not a bug` · `defect density` · `defect removal efficiency` ·
`reopen rate` · `escaped defect` · `release notes` · `known issue`
