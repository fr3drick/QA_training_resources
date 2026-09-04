# Day 6 — Manual Testing: Writing and Running Test Cases

> **Week 2 · Day 6 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 1 (1.4 test activities), Chapter 4 (4.1), Chapter 5 (5.1)
> Prerequisites: Week 1

---

## At a glance

By the end of this session you should be able to:

1. Explain what manual testing is good at, and where automation beats it.
2. Write a test case that a stranger could execute and get the same result.
3. Distinguish test condition, test case, test procedure, test suite and test script.
4. Structure test data and preconditions so tests are repeatable.
5. Run a test cycle and record results with evidence.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Weekend homework review: smoke suites |
| 0:05 – 0:12 | What manual testing is for |
| 0:12 – 0:22 | The vocabulary: condition, case, procedure, suite |
| 0:22 – 0:38 | Anatomy of a good test case, with examples |
| 0:38 – 0:46 | Test data, preconditions, and repeatability |
| 0:46 – 0:57 | **Activity:** write and swap test cases |
| 0:57 – 1:00 | Homework |

---

## 1. What manual testing is actually for

Manual testing is not "automation we haven't got round to yet". Humans and machines are good
at different things, and knowing which is which is what makes you employable.

| Humans are better at | Machines are better at |
|---|---|
| Noticing that something looks *wrong* even though it matches the spec | Doing the same thing 10,000 times identically |
| Judging usability, tone, layout, accessibility in context | Running at 3am on every commit |
| Exploring, following a hunch, improvising | Comparing large data sets exactly |
| Testing something that doesn't exist yet (a mock-up, a paper design) | Load, stress and endurance |
| Asking "should it do this at all?" | Never getting bored or skipping a step |
| One-off tests not worth automating | Regression: proving what worked still works |

**The rule of thumb:** automate the checks that must be repeated and have an unambiguous
expected result. Do manually the testing that requires judgement, or that you'll only ever do
once. "Manual regression testing" for a mature product is usually a sign of missing automation
and burns out the team.

---

## 2. The vocabulary, in order of granularity

| Term | Definition | Example |
|---|---|---|
| **Test basis** | The source you derive tests from | The user story + AC + the design mock-up |
| **Test condition** | A testable aspect of the component/system | "Login with invalid credentials" |
| **Test case** | Preconditions, inputs, actions, expected results, postconditions | TC-042 with 6 steps and an expected result |
| **Test procedure / script** | The sequence in which test cases are executed, with any setup | "Run TC-040 → TC-042 → TC-045 in this order after seeding data" |
| **Test suite** | A named collection of test cases run together | "Regression – Payments" (87 cases) |
| **Test cycle / run** | One execution of a suite against one build | "Regression – Payments, build 4.2.1, 12 Aug" |
| **Test charter** | A goal for an exploratory session (Day 8) | "Explore checkout with expired cards to discover error-handling problems" |

One test condition can generate many test cases. "Password validation" (condition) becomes
cases for: too short, too long, no uppercase, no number, no special char, contains username,
same as previous password, leading/trailing spaces, and one valid case.

---

## 3. Anatomy of a good test case

### The fields

| Field | Why it exists |
|---|---|
| **ID** | Unique and stable. Referenced by bugs, the RTM, and reports |
| **Title** | Says what is being verified in one line. Readable in a list of 300 |
| **Module / feature** | For filtering and reporting |
| **Priority** | P1/P2/P3 — which to run when time is short |
| **Type** | Functional, negative, boundary, security, usability… |
| **Preconditions** | The state the system must be in before step 1 |
| **Test data** | Exact values, or a pointer to where they come from |
| **Steps** | Numbered, atomic, unambiguous actions |
| **Expected result** | Per step where it matters, plus an overall expected outcome |
| **Postconditions** | What state the system is left in (so the next test isn't polluted) |
| **Requirement link** | Traceability back to the story/requirement |
| **Automation candidate** | Yes/no — helps plan automation work |

### A bad test case

> **Title:** Test login
> **Steps:** Go to login page, enter details, click login.
> **Expected:** It should work.

Everything is wrong: which details? Which user? What does "work" mean? Two testers running this
get different results, and you cannot tell from a failure what actually broke.

### The same case, written properly

```
ID:            TC-LOGIN-007
Title:         Login is rejected after 5 consecutive failed attempts and the account locks
Module:        Authentication
Priority:      P1
Type:          Negative / security
Requirement:   REQ-032, AC4
Automatable:   Yes

Preconditions:
  1. Test environment: QA2, build ≥ 4.2.0
  2. A user account exists: qa.locktest@example.com, status ACTIVE, failed_attempts = 0
  3. The account is not currently locked (verify in DB or via admin panel)
  4. Browser cache and cookies cleared

Test data:
  Valid username:   qa.locktest@example.com
  Wrong password:   WrongPass!123
  Correct password: ValidPass!456

Steps:
  1. Navigate to https://qa2.example.com/login
     → Expected: Login page renders with Email, Password fields and a Sign In button
  2. Enter qa.locktest@example.com and WrongPass!123; click Sign In
     → Expected: Error "Invalid email or password." Attempts remaining is not disclosed.
  3. Repeat step 2 three more times (attempts 2, 3 and 4)
     → Expected: The same error each time; the account remains unlocked
  4. Perform a 5th failed attempt
     → Expected: Message "Your account has been locked for 30 minutes due to multiple failed
       sign-in attempts." A lockout email is sent to the registered address.
  5. Immediately enter qa.locktest@example.com with the CORRECT password ValidPass!456
     → Expected: Login is still refused with the lockout message, not "invalid password"

Overall expected result:
  The account is locked after exactly 5 failed attempts, the correct password does not bypass
  the lock, and the user is informed of the lockout duration.

Postconditions:
  Account qa.locktest@example.com is LOCKED with failed_attempts = 5.
  Reset via admin panel or: UPDATE users SET failed_attempts=0, locked_until=NULL WHERE ...
```

### The rules behind that example

1. **The title states the expectation**, not just the area. Someone scanning results learns
   something from the title alone.
2. **Preconditions are verifiable.** "User exists with failed_attempts = 0" is checkable;
   "user is set up" is not.
3. **Exact data.** Real values, not "a valid email".
4. **One action per step.** If a step fails, you know exactly what failed.
5. **Expected results are observable.** A message, a state, a value — not a feeling.
6. **The boundary is tested explicitly** (4 attempts vs 5) — that's Day 7 thinking.
7. **Postconditions tell the next tester how to clean up.** Tests that leave debris cause
   phantom failures later.
8. **It's independent.** It doesn't assume a previous test ran.

### Writing tips

- Write in the **imperative**: "Click Save", not "The user should click Save".
- Avoid embedding UI implementation detail that changes weekly ("click the blue button at
  coordinates…"). Name the control by its label.
- If a precondition needs 12 steps of setup, that's a smell — make it a data-seeding step or a
  script, not part of the test.
- Don't chain 40 steps into one case. If a step in the middle fails, everything after it is
  unknown. Split it.
- Keep a **negative** case for every positive one. Juniors write happy paths; seniors are known
  by their negative tests.

---

## 4. Test data and repeatability

Bad test data is the leading cause of "it works on my machine" in QA.

**Kinds of test data:**

| Kind | Description | Watch out for |
|---|---|---|
| Synthetic | Made up for the test | May not resemble real-world messiness |
| Production copy | Real data from production | **Must be masked/anonymised** — legal risk (GDPR/NDPR) |
| Generated | Created by script/faker | Great for volume; check realistic distributions |
| Golden dataset | Curated, known-good, version-controlled | The gold standard for repeatability |

**Data principles for testers:**

1. **Own your data.** Never depend on a record someone else might change. Create what you need
   at the start of the test, or use a record clearly labelled as yours (`qa.efe.locktest01@…`).
2. **Make it identifiable.** Prefix test records so they can be found and cleaned:
   `ZZTEST_`, `qa_`, `+qa` in email addresses (`me+qa001@example.com` routes to `me@example.com`).
3. **Never use real personal data** in a test environment. Not a colleague's real phone number,
   not a real card, not a real BVN/SSN.
4. **Know how to reset.** Every tester should be able to restore their data to a known state.
5. **Test data must cover the interesting cases**: empty, one record, many records, maximum
   length strings, unicode and emoji, names with apostrophes (O'Brien) and hyphens, RTL text,
   very old and future dates, zero and negative amounts, expired records, soft-deleted records.

**The classic date/time traps:** month boundaries, year boundaries, leap years (29 Feb),
daylight saving transitions, time zones (a user in Lagos and a server in UTC), and "today" being
computed on the client vs the server.

---

## 5. Running a test cycle and recording results

**Result statuses** — agree these with your team and use them consistently:

| Status | Meaning |
|---|---|
| **Pass** | Actual matched expected, completely |
| **Fail** | Actual did not match expected; a defect is raised |
| **Blocked** | Could not run — dependency broken, environment down, prerequisite feature missing |
| **Skipped / Not run** | Deliberately not executed this cycle (out of scope, no time) |
| **In progress** | Started, not finished |

**"Blocked" is not "Fail".** Mixing them ruins your reporting: a 60% pass rate where 30% is
blocked by a broken environment tells a completely different story from 30% genuinely failing.

**Evidence to capture as you go** (you will thank yourself on Day 10):
- Screenshot or screen recording of the failure.
- The exact build/version and environment.
- The timestamp (many logs are searched by time).
- Request/response if it's an API (Week 4).
- Any error ID, correlation ID or trace ID shown on screen.
- Relevant server log lines, and the browser console.

**Exit criteria for the cycle** — decide these *before* you start, so nobody negotiates them
down at 5pm on release day. Example: all P1 cases executed, ≥95% pass rate overall, zero open
blocker/critical defects, all failures either fixed and re-tested or explicitly accepted with a
named owner.

---

## Live activity (11 minutes)

**Write it, then swap it.**

1. (5 min) Each intern writes **one full test case** for this feature, using the template:

   > *A coupon code field on a checkout page. Valid codes give a percentage discount. Codes
   > expire. Some codes require a minimum order value of ₦10,000. A code can only be used once
   > per customer. Only one code can be applied per order.*

2. (4 min) Swap with the person next to you. **Execute their test case literally** — pretend to
   be a robot that only does exactly what is written. Mark every place you had to guess.

3. (2 min) Share the funniest ambiguity found.

**Debrief:** the point isn't perfection, it's the shock of discovering how much of a test case
lives in the author's head. Also note how many different *conditions* the group found: expired,
already used, minimum not met, second code applied, code with wrong case, code with trailing
space, code for a different customer segment, discount rounding to the kobo.

---

## Common mistakes juniors make

- Writing only happy paths.
- Vague expected results ("should work", "should display properly").
- Test cases that depend on the previous test having passed.
- Not recording the build number, then being unable to say whether a bug is new.
- Marking things "Fail" when they were actually "Blocked".
- Writing 200 shallow test cases when 40 well-designed ones would cover more (Day 7 fixes this).

---

## Homework (about 35 minutes)

1. Write **5 test cases** for the coupon feature from the activity, using the full template in
   [templates/test-case-template.md](../templates/test-case-template.md). At least three must be
   negative or boundary cases.
2. For each, state which **test condition** it covers, and note whether you'd automate it.
3. List the **test data** you'd need to seed to run all five, as a table.

---

## Check your understanding

<details>
<summary>1. Why is "Blocked" a distinct status from "Fail"?</summary>

"Fail" means the software did the wrong thing — there is a defect in the product. "Blocked"
means you could not run the test at all — the environment was down, the data wasn't there, a
prerequisite feature isn't built. They point at completely different actions (fix the product vs
fix the environment) and mixing them makes your pass-rate report meaningless.
</details>

<details>
<summary>2. Give three reasons a test case should not depend on a previous test case.</summary>

(1) If the earlier test fails, everything after it is unknown rather than genuinely failing.
(2) You cannot run a single case in isolation to re-test a fix. (3) It prevents running tests in
parallel or in a different order, which blocks automation and slows down a squeezed test window.
Independent cases also survive being reordered by priority, which happens on every crunched release.
</details>

<details>
<summary>3. Your test uses a production copy of the customer database. What is the risk and what do you do?</summary>

Real personal data in a non-production environment is a legal and security exposure — test
environments have weaker access controls, get shared with vendors, and get restored to laptops.
Under GDPR/NDPR that is a reportable breach waiting to happen; it also means test emails and SMS
can reach real customers. The fix: anonymise/mask on extract (names, emails, phone numbers,
account and ID numbers), redirect all outbound mail to a sink, and keep the data volume/shape
without keeping the identities.
</details>

<details>
<summary>4. When is writing a detailed test case a waste of time?</summary>

When the test will only ever be run once by the person writing it, when the feature is still
changing daily, and when the cost of writing it exceeds the value of the record. In those
situations use an exploratory charter (Day 8) or a checklist instead. Detailed cases earn their
keep when they will be repeated, handed to someone else, automated, or used as audit evidence.
</details>

---

## Glossary additions

`test condition` · `test case` · `test procedure` · `test script` · `test suite` ·
`test cycle` · `precondition` · `postcondition` · `expected result` · `actual result` ·
`test data` · `data masking` · `golden dataset` · `blocked` · `pass rate` · `exit criteria`
