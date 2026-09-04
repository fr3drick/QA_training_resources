# Day 1 — What Is Testing? Quality, Errors, Defects and Failures

> **Week 1 · Day 1 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 1 (1.1, 1.2, 1.3, 1.4, 1.5)
> Prerequisites: none. This is your first day.

---

## At a glance

By the end of this session you should be able to:

1. Explain what software testing is — and what it is **not**.
2. Say why testing exists in business terms, not just technical ones.
3. Use the words **error**, **defect** and **failure** correctly, and never mix them up again.
4. Distinguish **QA**, **QC** and **testing**.
5. Recite and apply the **seven testing principles**.
6. Name the activities in the **test process** and what each produces.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Introductions, how the 4 weeks will run |
| 0:05 – 0:15 | What testing is, and the objectives of testing |
| 0:15 – 0:25 | Error → defect → failure, with the ATM example |
| 0:25 – 0:32 | QA vs QC vs testing |
| 0:32 – 0:45 | The seven principles, discussed not recited |
| 0:45 – 0:57 | **Activity:** test a pen / test a lift |
| 0:57 – 1:00 | Homework and wrap-up |

---

## 1. What testing actually is

A lot of people think testing means "clicking around to see if it breaks". That is a small
part of it. A working definition:

> **Software testing is the process of evaluating a product to find out whether it satisfies
> the stated requirements and to identify the ways in which it does not.**

Two halves of that sentence matter equally:

- **Verification** — did we build the thing *right*? Does it match the spec?
- **Validation** — did we build the *right thing*? Does it solve the user's real problem?

A feature can pass verification and fail validation. If the requirement says "the user enters
their date of birth as MM/DD/YYYY" and you build exactly that, but every user of the product
is Nigerian and expects DD/MM/YYYY, then you built it right and built the wrong thing. Good
testers raise both kinds of problem.

### Testing is not only dynamic

- **Dynamic testing** — you run the software. (Most of this course.)
- **Static testing** — you examine the work product without running it: reviewing a
  requirement, reading code, checking a design document. Finding a contradiction in a
  requirements document on Monday is far cheaper than finding it in production in December.

### Typical objectives of testing

- Evaluate work products: requirements, designs, code, documentation.
- Trigger failures and find defects.
- Ensure required coverage of the object under test.
- Reduce the level of **risk** of inadequate software quality.
- Verify whether specified requirements have been fulfilled.
- Verify that the object under test complies with contractual, legal or regulatory requirements.
- Provide information to stakeholders so they can make decisions.
- Build confidence in the quality of the object under test.

That last one is the one interns forget. **Testing produces information.** You are not the
quality police; you are the person who makes sure nobody ships in the dark.

---

## 2. Why testing exists

Say it in business language, because that is the language of the people who fund your job.

| Cost of a bug | Where it is found |
|---------------|-------------------|
| Minutes | In a requirements review |
| Hours | By the developer, on their own machine |
| A day | By QA in a test environment |
| Days + reputation | By a customer in production |
| Months + lawyers | By a regulator, or in the press |

Real consequences of untested software: financial loss, loss of time, damage to business
reputation, injury or death (medical, automotive, aviation), and legal liability.

**The relationship testing has with quality:** testing does not *create* quality. Testing
*measures* quality and gives the team the feedback it needs to build quality in. A thermometer
does not make you well.

---

## 3. Error, defect, failure — and root cause

These three words are used interchangeably in casual speech, and precisely in ISTQB, in bug
triage meetings, and in any conversation with a senior engineer. Learn them today.

| Term | Also called | What it is | Who/what "has" it |
|------|-------------|------------|-------------------|
| **Error** | Mistake | A human action that produces an incorrect result | A person |
| **Defect** | Bug, fault | The flaw in the work product caused by the error | The code/document |
| **Failure** | — | The observable wrong behaviour when a defect is executed | The running system |
| **Root cause** | — | The underlying reason the error happened | The process/environment |

**The chain, with an example:**

> A developer is tired at 11pm on a Friday and types `>` where the requirement says
> "greater than or equal to". → That is the **error** (a human mistake).
>
> The code now reads `if (balance > amount)` instead of `if (balance >= amount)`.
> → That is the **defect**, sitting in the source file whether or not anyone runs it.
>
> A customer with exactly ₦5,000 in their account tries to withdraw exactly ₦5,000 and is told
> "Insufficient funds". → That is the **failure**, observed at runtime.
>
> The team had no code review process and a culture of late-night hotfixes.
> → That is the **root cause**.

Three things follow from this that matter in your daily work:

1. **A defect does not always cause a failure.** The buggy line only misbehaves at the exact
   boundary. If nobody ever withdraws their exact balance, nobody ever sees it. This is why
   we deliberately test boundaries (Day 7).
2. **Not every failure is caused by a defect in your code.** Failures can be caused by
   environment problems, bad test data, radiation flipping a bit in memory, a network outage,
   or the tester misreading the requirement. Always confirm before you log.
3. **A "false positive" is a test that reports a failure that isn't real.** A
   **"false negative"** is a test that passes when the software is actually broken. False
   negatives are the dangerous ones — they buy false confidence.

---

## 4. QA vs QC vs testing

Interns are frequently asked this in interviews. Keep the answer short and structural.

| | Focus | Orientation | Example activities |
|---|---|---|---|
| **Quality Assurance (QA)** | The **process** | Preventive, proactive | Defining a definition-of-done, introducing code review, improving the release process, training |
| **Quality Control (QC)** | The **product** | Corrective, reactive | Testing, inspections, verifying the build meets criteria |
| **Testing** | One activity **within** QC | Detective | Designing and executing test cases, reporting defects |

So: testing ⊂ quality control ⊂ quality management, and QA sits beside QC under quality
management. Your job title probably says "QA" but most of your day is QC. That's normal.

---

## 5. The seven testing principles

Don't memorise these as a list to recite. Understand what each one *stops you from doing*.

**1. Testing shows the presence of defects, not their absence.**
You can never prove software is bug-free. You can only reduce the probability that undiscovered
defects remain. Never say "there are no bugs"; say "we found no further defects in the areas we
covered."

**2. Exhaustive testing is impossible.**
A single form with 10 text fields has effectively infinite input combinations. Instead of trying
everything, use risk analysis, priorities, and test techniques (Day 7) to choose a small,
high-value set.

**3. Early testing saves time and money ("shift left").**
Start test activities as early as possible in the lifecycle — review the requirement before a
line of code exists. The cheapest bug is the one killed in a meeting.

**4. Defects cluster together.**
A small number of modules usually contain most of the defects. If you find three bugs in the
payments module and none in the profile page, spend your remaining time on payments, not on
distributing effort evenly. (This is the basis of risk-based testing.)

**5. Tests wear out (the pesticide paradox).**
Running the same tests over and over eventually stops finding new bugs, exactly as pests become
resistant to a repeated pesticide. Existing tests must be reviewed and revised, and new,
different tests written. This is the argument for exploratory testing (Day 8).

**6. Testing is context dependent.**
There is no single right way to test. Testing a hospital infusion pump and testing a marketing
landing page are different disciplines with different risk tolerances.

**7. Absence-of-defects is a fallacy.**
Finding and fixing lots of defects does not help if the system built is unusable or does not
meet users' needs and expectations. A flawless implementation of the wrong product is still a
failure.

---

## 6. The test process at a glance

You will spend the whole course going deeper into these. Today, just know the shape and the
main deliverable of each.

| Activity | What you do | Main output |
|----------|-------------|-------------|
| **Test planning** | Define objectives, scope, approach, resources, schedule | Test plan |
| **Test monitoring & control** | Compare actual progress against plan; adjust | Test progress reports |
| **Test analysis** | *What* to test — analyse the basis, identify test conditions | Prioritised test conditions |
| **Test design** | *How* to test — turn conditions into test cases | Test cases, test data requirements, test environment design |
| **Test implementation** | Build what you need to run | Test procedures, test data, test suites |
| **Test execution** | Run tests, compare actual vs expected | Test logs, defect reports |
| **Test completion** | Report, archive, learn | Test summary report, lessons learned |

Note that these are **activities, not sequential phases**. In an Agile team you will do several
of them in the same afternoon.

---

## Live activity (12 minutes)

**"Test this pen."** (Or: test this lift / this stapler / this water bottle.)

Split into pairs. Give each pair 5 minutes to write down as many tests as they can. Then
compare on the whiteboard and group them:

- **Functional** — does it write? On paper? On the first stroke after a week unused?
- **Non-functional** — how long does the ink last? Is it comfortable after an hour?
- **Usability** — can a left-handed person use it? A child?
- **Negative / destructive** — what happens if I drop it? Write on glass? Remove the ink tube?
- **Compatibility** — does the cap fit other pens of the same brand?
- **Requirements questions** — *who is this pen for?* Is it a ₦100 biro or a gift pen?

**Debrief points to make:**
- The best testers asked "what is this pen *for*?" before writing tests. That's requirements
  analysis, and it's Day 4.
- Nobody produced an exhaustive list. That's principle 2.
- Every pair's list was different. That's why we use techniques rather than intuition alone.

---

## Common mistakes juniors make

- Saying "the system is bug-free" or "testing is complete". Say what you covered and what you did not.
- Logging a failure without confirming it is reproducible (Day 10 fixes this).
- Treating "QA" as a gatekeeper role — blocking releases as a personality trait. Your job is to
  report risk accurately; the *release decision* belongs to the team and its stakeholders.
- Confusing "I don't like this" with "this is a defect". Both are worth raising, but label them honestly.

---

## Homework (about 30 minutes)

1. Pick any app on your phone that you use every day. Write **10 test ideas** for one single
   screen of it. Label each as functional, non-functional, usability or negative.
2. Find **one real defect** in it. Write two or three sentences: what you did, what you
   expected, what actually happened. (Keep this — you will rewrite it properly on Day 10 and
   see how much better it gets.)
3. Write, in your own words and without looking, the difference between an error, a defect and
   a failure. Bring it tomorrow.

---

## Check your understanding

<details>
<summary>1. A developer misreads the spec and writes the wrong formula. QA never runs that code path. Is there a defect? Is there a failure?</summary>

There is a **defect** (the wrong formula is in the code). There is **no failure**, because a
failure only exists when the defective code is executed and produces an incorrect result.
There was also an **error** — the developer's misreading.
</details>

<details>
<summary>2. Your manager says "we ran 500 tests and they all passed, so the release is safe." Which principles would you cite in response?</summary>

Principle 1 (testing shows presence, not absence of defects) and principle 7
(absence-of-defects fallacy). Also principle 5 if those 500 are the same regression tests run
every sprint — they may have stopped finding anything new. A good reply: "500 passing tests
tells us the areas we covered behave as expected; here is what we did *not* cover."
</details>

<details>
<summary>3. Give one QA activity and one QC activity for a team that keeps shipping bugs in checkout.</summary>

QC (product-focused, reactive): add targeted regression tests around checkout; run an
exploratory session on the payment flow.
QA (process-focused, preventive): introduce a mandatory peer review for changes to the payment
module; add "tested on 3 card types" to the definition of done; run a root-cause session on the
last five checkout defects.
</details>

<details>
<summary>4. Why is a false negative more dangerous than a false positive?</summary>

A false positive (a test reporting a problem that isn't real) costs you investigation time —
annoying but visible. A false negative (a test passing while the software is genuinely broken)
is invisible: it actively creates confidence that the feature works, so nobody looks again, and
the defect reaches users.
</details>

---

## Glossary additions

`testing` · `verification` · `validation` · `static testing` · `dynamic testing` · `error` ·
`defect` · `failure` · `root cause` · `false positive` · `false negative` · `quality assurance` ·
`quality control` · `test basis` · `test condition` · `test case` · `coverage` · `risk`
