# Day 20 — Capstone: A Full Test Cycle, and What Comes Next

> **Week 4 · Day 20 · 60 minutes**
> Prerequisites: everything
> This session is mostly the interns working. Keep your own talking to about 15 minutes.

---

## At a glance

Today you put the whole course together on one feature, produce the artefacts a real QA engineer
produces, and leave with a plan for the next three months.

By the end you should have, for a single feature: a risk-based test approach, a set of designed
test cases, an exploratory charter, at least one well-written bug report, and a test summary
you could send to a stakeholder.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:08 | The full cycle, end to end — how the 19 days connect |
| 0:08 – 0:45 | **The capstone exercise** (in pairs) |
| 0:45 – 0:52 | Present the test summary reports |
| 0:52 – 1:00 | ISTQB, next steps, and how to keep learning |

---

## 1. The whole cycle, in one page

This is the course, in the order you'd actually do it on a real feature.

```
1.  UNDERSTAND      Read the story and AC. Ask questions in refinement.        (Days 3, 4)
        │            Find the ambiguities and the missing NFRs before code exists.
        ▼
2.  ASSESS RISK     What's the product risk? Where do defects cluster?         (Days 1, 4)
        │            Decide where the effort goes. You cannot test everything.
        ▼
3.  PLAN            Scope, levels, types, entry/exit criteria, data,           (Days 4, 5, 6)
        │            environment needs. Written down, however briefly.
        ▼
4.  DESIGN          EP, BVA, decision tables, state transitions.               (Day 7)
        │            Write the cases. Include the negative ones.
        ▼
5.  PREPARE         Test data, environment, accounts, tools, access.           (Days 6, 14, 19)
        ▼
6.  SMOKE           Is the build worth testing at all?                         (Day 5)
        ▼
7.  EXECUTE         Run the scripted cases. Record pass/fail/blocked.          (Day 6)
        │            Then explore beyond them, with a charter.                 (Day 8)
        │            Test at the API level, not just the UI.                   (Days 16, 17, 18)
        │            Verify what was actually stored.                          (Days 14, 15)
        ▼
8.  INVESTIGATE     Reproduce. Minimise. Check the network and logs.           (Day 13)
        │            Is it a regression? Is it just me?
        ▼
9.  REPORT          Write the bug properly. Severity and priority, justified.  (Days 9, 10)
        ▼
10. RE-TEST         Confirm the fix. Then regression-test around it.           (Days 5, 9)
        ▼
11. SUMMARISE       What was covered, what wasn't, what risk remains.          (Days 4, 6)
        │            Give stakeholders what they need to decide.
        ▼
12. LEARN           Retro: how do we prevent this class of defect next time?   (Days 1, 3)
```

**If you remember only one thing from four weeks:** your job is not to find every bug. It is to
**give the team an accurate picture of the risk**, as early as possible, so they can decide what
to do about it.

---

## 2. The capstone exercise (37 minutes)

Work in pairs. Use any real system — the QA environment of your own product if you have one, or
a public demo app (SauceDemo, OWASP Juice Shop, `reqres.in` for the API portion).

### The feature under test

> **Story:** *As a registered customer, I want to apply a discount coupon at checkout so that I
> pay less.*
>
> **Acceptance criteria given to you (deliberately incomplete):**
> - AC1: A valid coupon code reduces the order total by the coupon's percentage.
> - AC2: An invalid coupon code shows an error message.
> - AC3: Only one coupon may be applied per order.
>
> **What you know about the system:** coupons have a percentage, an expiry date, an optional
> minimum order value, and a usage limit of one per customer. The order total is calculated
> server-side. VAT is 12.5%. The API endpoint is `POST /v2/orders/{id}/coupon`.

### Deliverables — produce all six

**1. Requirements review (5 min)** — list at least **8 questions** the AC do not answer, and for
each say what you would assume if nobody answered. *(Day 4)*

**2. Risk assessment (3 min)** — name the top 3 product risks with probability × impact, and say
where you would spend 70% of your effort and why. *(Days 1, 4)*

**3. Test design (10 min)** — using EP, BVA and a decision table, produce **12 test case titles**
with expected results. At least 5 must be negative or boundary cases. Mark which you would
automate. *(Days 6, 7)*

**4. Exploratory charter (2 min)** — write one charter you'd run after the scripted cases,
in the proper format. *(Day 8)*

**5. API and data checks (7 min)** — write:
   - 4 API-level tests for `POST /v2/orders/{id}/coupon`, including one authorization test and
     one idempotency test *(Days 16, 17, 18)*
   - 3 SQL queries you'd run to validate the result in the database *(Day 15)*

**6. Bug report (10 min)** — you observe this:

> *Applying coupon `SAVE20` to a ₦40,000 order gives a total of ₦32,000. Applying `SAVE20`,
> then removing it, then applying it again gives a total of ₦25,600. Each subsequent
> apply/remove cycle reduces the total further. The API returns 200 each time. The
> `orders.total_amount` column matches the wrong figure shown in the UI.*

Write the complete bug report — every core field, correct severity and priority with
justification, and the exact evidence you would attach. *(Days 9, 10, 13)*

---

## 3. Present the test summary (7 minutes)

Each pair delivers a **60-second verbal test summary report** as if to a Product Owner deciding
whether to release tomorrow. It must contain:

1. What was tested, and what was **not**.
2. What was found — with severity.
3. The residual risk in one sentence.
4. A clear recommendation: **ship / ship with known issues / do not ship** — and what would
   change your mind.

**Point to make in the debrief:** notice that the recommendation is *advice*, not a veto. You
present the risk; the business decides. But you must make the risk impossible to misunderstand,
and you must say plainly what you did not cover — that sentence is what protects everyone,
including you.

<details>
<summary>Facilitator: what a strong answer to the bug report looks like</summary>

**Severity: Critical** — direct revenue loss, and the stored data is wrong, not just the display.
**Priority: P1** — trivially discoverable by any customer, exploitable deliberately, and every
occurrence costs real money. Arbitrarily large discounts are reachable by repeating the cycle.

The strongest reports will notice:
- The discount is being applied to the **already-discounted** total (compounding), not the
  original subtotal.
- The database matches the UI, so this is a **calculation** defect, not a display defect —
  which localises it to the server-side pricing logic and rules out the frontend.
- The API returns **200** each time, so no error handling would ever catch it. AC3 ("one coupon
  per order") is arguably being violated in spirit, since the coupon is applied repeatedly.
- **It is exploitable**: reduce any order to near zero. That reframes it from a maths bug to a
  fraud vector, which changes the priority conversation.
- The missing test: nobody wrote a case for *remove then re-apply*. That's a state transition
  (Day 7) — the apply/remove cycle is a state machine nobody drew.
- Good reports also ask: are there **existing orders in production** already affected? That
  question turns a bug fix into an incident response, and asking it is what a senior tester does.
</details>

---

## 4. ISTQB CTFL — what to revise on your own

This course covered most of the syllabus, but not as exam preparation. If you intend to sit the
Foundation Level exam:

| Chapter | Covered here | Revise independently |
|---|---|---|
| **1. Fundamentals of Testing** | Days 1, 5 | The formal test process activities and work products; tester/developer mindset; whole-team approach |
| **2. Testing Throughout the SDLC** | Days 2, 3, 5 | Test-first approaches (TDD, ATDD, BDD); the precise definitions of each test level and type |
| **3. Static Testing** | Day 4 (partly) | **Review types and the formal review process in detail — this is the least covered chapter here** |
| **4. Test Analysis and Design** | Days 6, 7, 8 | White-box techniques in more depth; collaboration-based approaches |
| **5. Managing the Test Activities** | Days 4, 9, 10 | **Test planning, estimation techniques, test monitoring metrics, the test pyramid, testing quadrants, and configuration management** |
| **6. Test Tools** | Days 13, 17, 19 | Tool categories, benefits and risks of automation, tool selection |

**Exam format:** 40 multiple-choice questions, 60 minutes (75 if English is not your first
language), pass mark 65% (26/40). Questions map to K-levels: K1 (remember), K2 (understand),
K3 (apply). The K3 questions are the technique ones — EP, BVA, decision tables, state transition
— so **practise applying them, not just describing them**.

**How to prepare:** download the official syllabus (free from istqb.org), read it once fully,
then work through official sample exam papers. The exam uses precise ISTQB terminology — where
this course said "roughly", the exam wants the exact definition.

---

## 5. What to learn next

**In your first three months on a real team, in priority order:**

1. **Learn the product deeply.** Know it better than anyone else on the team. This is the single
   biggest differentiator between a tester who is tolerated and one who is consulted.
2. **Get comfortable with SQL and the API layer.** They are the difference between "the page is
   broken" and a diagnosed defect.
3. **Read the logs.** Ask for access on day one. Learn how to search them.
4. **Start automating.** Begin with API tests (Postman/Newman) rather than UI tests — faster to
   write, far more stable, and they run in the pipeline.
5. **Go to refinement and ask questions.** Prevention beats detection, every time.

**Skills to build over the next year:**

| Area | Start with | Then |
|---|---|---|
| Programming | Python or JavaScript basics | Writing your own test scripts |
| API automation | Postman + Newman | REST Assured, pytest + requests, or Playwright's API testing |
| UI automation | Playwright or Cypress | Page objects, stable selectors, parallel runs |
| Performance | k6 or JMeter basics | Designing a load profile from real traffic data |
| Security | OWASP Top 10 | Burp Suite Community, OWASP ZAP |
| CI/CD | Reading your pipeline config | Adding your tests to it |
| Databases | The SQL from Day 15 | Query plans, indexes, why a query is slow |
| Accessibility | WCAG basics, axe DevTools | Screen-reader testing |

**Things worth reading:**
- The ISTQB CTFL syllabus (free, and shorter than you'd think)
- *Explore It!* — Elisabeth Hendrickson (exploratory testing)
- *Agile Testing* — Lisa Crispin & Janet Gregory (the testing quadrants)
- *Perfect Software and Other Illusions About Testing* — Gerald Weinberg
- The **OWASP Top 10** — free, and every item is testable
- Ministry of Testing (`ministryoftesting.com`) — community, articles, a good place to ask questions

**Habits that make a career:**
- Keep a personal **bug journal**: the interesting bugs you found, and how. It becomes your
  error-guessing checklist and your interview material.
- Keep a **snippets file**: the SQL queries, curl commands and Postman scripts you reuse.
- When you find a bug, ask **"how could this have been prevented?"** and say the answer in the
  retro. That question is what turns a tester into a QA engineer.
- Never say "it works". Say **what** you tested, and what you did **not**.

---

## Final exercise — for after the course (60 minutes, on your own)

Pick a real application you use daily. Produce a complete one-page **test strategy** for it:

1. What kind of product is it, and who are its users?
2. What are the top 5 product risks?
3. What test levels and types would you apply, and where would you spend your effort?
4. What would be in the smoke suite?
5. What would you automate first, and why?
6. What are the three things you would want to know about its architecture before starting?
7. What are the NFRs nobody has written down?

Keep it. Bring it to your next job interview — a candidate who arrives with a written test
strategy for the interviewer's own product is not a candidate they forget.

---

## Course glossary

Every term from all 20 days is collected in [GLOSSARY.md](../GLOSSARY.md). If you can define
80% of it without looking, you are ahead of most people applying for junior QA roles.

---

## Closing note for the instructor

Things worth saying out loud on the last day:

- Four weeks gets them vocabulary, mental models and a starting toolkit. It does not get them
  experience. Experience comes from testing real software with real consequences.
- The interns who progress fastest are the ones who ask questions in refinement and who read
  logs without being asked.
- Tell them what you actually think of their bug reports from Day 10 versus Day 20. The
  improvement is usually dramatic, and they cannot see it themselves.
