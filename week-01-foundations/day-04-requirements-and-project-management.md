# Day 4 — Requirements, User Stories and Project Management

> **Week 1 · Day 4 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 3 (Static Testing), Chapter 5 (5.1 Test Planning, 5.2 Risk Management)
> Prerequisites: Day 3

---

## At a glance

By the end of this session you should be able to:

1. Name the types of requirement and tell a good one from a bad one.
2. Write a user story with **INVEST**-compliant acceptance criteria in Given/When/Then form.
3. Review a requirement and find defects in it **before any code is written**.
4. Explain a requirements traceability matrix and why anyone bothers.
5. Understand enough project management vocabulary — scope, estimate, risk, RAID — to be useful
   in a planning conversation.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the password reset story |
| 0:05 – 0:15 | Types of requirement; what makes one testable |
| 0:15 – 0:27 | User stories, INVEST, acceptance criteria |
| 0:27 – 0:36 | Static testing: reviewing requirements to find defects |
| 0:36 – 0:44 | Traceability, and PM vocabulary that matters to QA |
| 0:44 – 0:57 | **Activity:** shred a real requirements document |
| 0:57 – 1:00 | Homework |

---

## 1. Types of requirement

**Functional requirements** — *what the system does.*
> "The system shall allow a customer to transfer funds between two accounts they own."

**Non-functional requirements (NFRs)** — *how well it does it.* These are the ones nobody
writes down and everybody assumes. Learn to ask for them explicitly:

| Category | Question to ask | Example requirement |
|---|---|---|
| Performance | How fast? Under what load? | "Search results return in < 2s for 95% of requests at 500 concurrent users" |
| Reliability / availability | How much downtime is acceptable? | "99.9% monthly uptime" |
| Security | Who can do what? What's protected? | "Passwords stored using bcrypt; failed logins locked after 5 attempts" |
| Usability | Who is the user? What's their context? | "A first-time user completes registration in under 3 minutes without help" |
| Compatibility | Which browsers, OS, devices, versions? | "Chrome, Safari, Edge latest 2 versions; iOS 15+; Android 11+" |
| Portability | Where does it run? | "Deployable to on-prem Kubernetes and AWS EKS" |
| Maintainability | How easily changed? | "Unit test coverage of new code ≥ 70%" |
| Accessibility | Can everyone use it? | "WCAG 2.1 AA compliant" |
| Localisation | Languages, currencies, date formats, time zones? | "Supports en-GB and fr-FR; all times displayed in the user's local time zone" |
| Legal / regulatory | What rules apply? | "Personal data retained no longer than 24 months (GDPR / NDPR)" |

**Constraints** — things that are true whether you like them or not: "must use the existing
Oracle database", "must ship before the tax year ends".

**Implicit requirements** — never written, but their violation is still a bug: the app
shouldn't crash; money shouldn't disappear; the back button should work; a page should look
broadly like the rest of the product.

### What makes a requirement testable?

A requirement is testable if you can write, in advance, an unambiguous check that it either
passes or fails. Run every requirement through this list:

| Quality | Bad | Good |
|---|---|---|
| **Unambiguous** | "The page should load quickly" | "The dashboard renders within 2 seconds on a 10 Mbps connection" |
| **Complete** | "Users can upload a photo" | "…JPEG/PNG/HEIC, max 10 MB, max 4000×4000 px; larger files rejected with an error message" |
| **Consistent** | Section 3 says session expires after 15 min, section 9 says 30 min | One stated value, referenced everywhere |
| **Verifiable** | "The system should be user-friendly" | "90% of a 10-person test group complete task X unaided within 5 min" |
| **Necessary** | Gold-plating nobody asked for | Traceable to a business need |
| **Prioritised** | Everything is "must have" | MoSCoW: Must / Should / Could / Won't |

**Weasel words that mean "there is a bug hiding here":** *quickly, easily, user-friendly,
efficiently, robust, seamless, intuitive, appropriate, sufficient, etc., and so on, as needed,
handle gracefully, where applicable, if necessary, support (as in "support large files")*.

Whenever you see one, ask: **"How would I measure that? What number goes there?"**

---

## 2. User stories and acceptance criteria

### The story format

```
As a   <type of user>
I want <some goal>
So that <some benefit/value>
```

The "so that" clause is not decoration. It tells you the *intent*, which lets you judge whether
an edge case matters. "So that I can log in again after forgetting my password" tells you the
user is locked out and anxious — so an unclear error message is a real problem, not a nitpick.

### The 3 Cs

- **Card** — the short written story. A placeholder.
- **Conversation** — the discussion that fills in the detail. Where most of the value is.
- **Confirmation** — the acceptance criteria that say when it's done.

### INVEST — a checklist for a good story

| Letter | Means | QA angle |
|---|---|---|
| **I**ndependent | Can be delivered on its own | Dependent stories can't be tested in isolation |
| **N**egotiable | Not a rigid contract | Leaves room for the conversation |
| **V**aluable | Delivers value to a user | "Refactor the DAO" is a task, not a story |
| **E**stimable | Team can size it | If not estimable, it isn't understood — a testing risk |
| **S**mall | Fits comfortably in a sprint | Big stories arrive on the last day, untested |
| **T**estable | You can prove it works | **This is your veto.** If you can't test it, it isn't ready |

### Acceptance criteria in Given/When/Then

```
Given <the starting context>
When  <an action occurs>
Then  <this observable outcome must be true>
```

**Worked example — "Transfer funds between my own accounts":**

```
AC1 — Successful transfer
Given I am logged in and have a current account with a balance of ₦50,000
And   I have a savings account with a balance of ₦10,000
When  I transfer ₦20,000 from current to savings
Then  the current account balance is ₦30,000
And   the savings account balance is ₦30,000
And   both accounts show the transaction in their history within 5 seconds
And   I receive a confirmation reference number

AC2 — Insufficient funds
Given my current account balance is ₦5,000
When  I attempt to transfer ₦5,001
Then  the transfer is rejected
And   I see the message "Insufficient funds. Available balance: ₦5,000."
And   neither account balance changes

AC3 — Exact balance (boundary)
Given my current account balance is ₦5,000
When  I transfer exactly ₦5,000
Then  the transfer succeeds and the current account balance is ₦0

AC4 — Invalid amounts
When  I enter 0, a negative number, more than 2 decimal places, or a non-numeric value
Then  the transfer is rejected with a field-level validation message
And   the submit button remains disabled until the input is valid

AC5 — Same account
Given I select the same account as source and destination
Then  the destination list excludes the selected source account
```

Notice that AC3 exists purely because a tester thought about boundaries. That single line
would have caught the `>` vs `>=` defect from Day 1.

**Note:** Given/When/Then is a communication format. It is *not* automatically Cucumber/BDD
automation, and writing it does not commit you to any tool.

---

## 3. Static testing: reviewing requirements

**Static testing** = examining a work product without executing it. It is the cheapest defect
detection you will ever do, and reviewing requirements is where a junior tester can add
outsized value in week one of a job.

**Review types, from informal to formal:**

| Type | Formality | Led by | Output |
|---|---|---|---|
| Informal review | None | Anyone | Comments, no records required |
| Walkthrough | Low | Author | Findings, sometimes a log |
| Technical review | Medium | Moderator/peers | Documented findings, technical decisions |
| Inspection | High | Trained moderator | Formal metrics, logged defects, entry/exit criteria, follow-up |

**Roles in a formal review:** author, moderator/facilitator, scribe/recorder, reviewer, manager.

**Your review checklist for any requirement or story:**

1. Is every statement **testable**? What is the number?
2. What is **missing**? Error cases, empty states, maximum values, permissions, what happens to
   existing data, what happens on failure halfway through.
3. Are there **contradictions** with other requirements or with existing behaviour?
4. Are the **NFRs** stated, or assumed?
5. Who are the **actors**? What can each role do and not do?
6. What are the **boundaries**? Min, max, zero, empty, first, last.
7. What happens on **failure** — network drop, timeout, third party down, browser closed mid-flow?
8. Is there **data migration**? What about records that already exist?
9. Is it **traceable** to a business need?
10. Are there **security or privacy** implications? (Who can see this data?)

---

## 4. Traceability

A **Requirements Traceability Matrix (RTM)** maps requirements → test cases → results → defects.

| Req ID | Requirement | Test case IDs | Status | Defects |
|---|---|---|---|---|
| REQ-014 | Transfer between own accounts | TC-101, TC-102, TC-103 | 2 pass, 1 fail | BUG-4412 |
| REQ-015 | Insufficient funds rejected | TC-104, TC-105 | Pass | — |
| REQ-016 | Transfer limit ₦1,000,000/day | *(none)* | **Not covered** | — |

Why it earns its keep:

- **Coverage** — the third row above instantly shows a requirement nobody tested.
- **Impact analysis** — a requirement changes; the matrix says which tests to update.
- **Reporting** — "we have verified 43 of 50 requirements" is far more meaningful to a
  stakeholder than "we ran 300 tests".
- **Audit** — in regulated environments, this document *is* the evidence.

Keep it proportionate. In a small Agile team, links between a Jira story and its tests are
often enough. In a bank, you'll maintain a real matrix.

---

## 5. Project management vocabulary QA needs

You don't need to be a PM, but you must be able to hold a conversation with one.

- **Scope** — what's in and out. **Scope creep** is uncontrolled growth of scope; it eats test time first.
- **The iron triangle** — scope, time, cost, with quality in the middle. Fix all three and
  quality is the only variable left to give. When someone says "the date can't move and the
  scope can't shrink and we can't hire", they have chosen to reduce quality; your job is to
  make that choice explicit rather than silent.
- **Estimate** — a forecast, not a promise. Techniques: expert judgement, three-point
  (optimistic + 4×likely + pessimistic) ÷ 6, planning poker, historical data.
- **Milestone / deadline / release date.**
- **Dependency** — work blocked by other work or another team. Say your dependencies out loud early.
- **RAID log** — Risks, Assumptions, Issues, Dependencies. A risk *might* happen; an issue
  already has.
- **Stakeholder** — anyone affected by the outcome. QA reports to stakeholders; know who yours are.
- **Entry / exit criteria** — conditions to start or finish an activity. Your test entry
  criteria might be "build deployed to QA, smoke test passed, test data loaded". Your exit
  criteria might be "all planned tests run, no open critical/blocker defects, 95% pass rate,
  known issues documented and accepted".

### Risk, in the QA sense

**Risk = probability × impact.** Risk-based testing means spending the most test effort where
probability × impact is highest.

| Area | Probability of defects | Impact if it fails | Risk | Test effort |
|---|---|---|---|---|
| Payment processing | Medium | Catastrophic (money, regulator) | **High** | Deep, plus negative and security tests |
| New search feature | High (brand new code) | Medium (annoying) | **Medium-High** | Solid functional coverage |
| Footer copyright year | Very low | Trivial | **Low** | Glance at it |

This is how you answer "you can't test everything, so what did you test?" — with a defensible
risk rationale rather than a shrug. Two useful ISTQB distinctions:
**product risk** (the system fails to satisfy needs — the table above) and **project risk**
(the project fails to deliver — late environment, key person leaves, unstable third-party API).

---

## Live activity (13 minutes)

**Shred this requirements document.** Put it on screen; interns work in pairs for 7 minutes
listing every problem, then 6 minutes comparing.

> **REQ-001** The system shall allow users to upload documents.
> **REQ-002** Uploaded documents should be processed quickly.
> **REQ-003** The system must be secure.
> **REQ-004** Users can share documents with other users as needed.
> **REQ-005** The system shall support large files.
> **REQ-006** Admins can delete documents. Deleted documents are removed.
> **REQ-007** The upload page should be user-friendly and work on all devices.

<details>
<summary>Facilitator answer key — at least 25 findings</summary>

**REQ-001:** Which users — any role? What file types? Max size? Max number? Upload from where
(drag-drop, camera, cloud)? Virus scanning? What if the same filename is uploaded twice? What
if upload fails at 90%? Is it resumable? Storage quota per user?

**REQ-002:** "Quickly" is unmeasurable. What is "processed" — OCR, thumbnailing, indexing,
virus scan? Sync or async? What does the user see while waiting? What if processing fails?

**REQ-003:** Meaningless as written. Encryption in transit? At rest? Who can access a document?
Authentication method? Audit logging? Penetration testing? Compliance regime (GDPR/NDPR/HIPAA)?

**REQ-004:** "As needed" — by whom, with what permission levels (view/comment/edit)? Share with
external users? Public links? Can shares be revoked? Do shares survive the owner leaving? Does
sharing notify anyone?

**REQ-005:** "Large" is undefined. 10 MB? 10 GB? Contradicts REQ-001 if that has a limit.
What happens *at* the limit and *one byte over* — a boundary that needs a defined behaviour.

**REQ-006:** Ambiguous and dangerous. Soft delete or hard delete? Recoverable? Does it delete
other users' shared copies? What about legal retention obligations? Is there a confirmation
step? Is it audited? Can an admin delete another admin's document?

**REQ-007:** Two requirements in one sentence — split them. "User-friendly" is unverifiable.
"All devices" is untestable as written; name browsers, OS versions, and minimum screen width.

**Cross-cutting:** none of these are prioritised; none are traceable to a business need; there
is no requirement covering *viewing* or *downloading* a document, or what a user sees when they
have zero documents; nothing states data retention; nothing states concurrent-edit behaviour.
</details>

---

## Common mistakes juniors make

- Waiting for a perfect specification. It is never coming. Ask questions and write down the answers.
- Treating "the requirement doesn't say" as permission to skip the case. If it isn't specified,
  that *is* the finding.
- Testing only the acceptance criteria. AC are the minimum, not the ceiling — Day 8 is about
  everything beyond them.
- Not writing down verbal answers. If the PO tells you the limit is 10 MB in a corridor, put it
  in the ticket as a comment the same day.

---

## Homework (about 35 minutes)

1. Rewrite **REQ-001** and **REQ-006** from the activity as proper, testable requirements with
   acceptance criteria in Given/When/Then. Aim for 4–6 AC each.
2. Take any feature of an app you use and build a small **RTM**: 5 requirements, 2–3 test case
   titles each. Deliberately leave one requirement uncovered and note how visible that is.
3. List **5 non-functional requirements** for that feature that nobody has written down.

---

## Check your understanding

<details>
<summary>1. Why is "the system must be fast" not a requirement?</summary>

It is not verifiable — there is no way to decide unambiguously whether it passed. It has no
metric, no threshold, no load conditions and no scope. A testable version names the operation,
the target time, the percentile and the conditions: "95% of search requests return within 2
seconds with 500 concurrent users on a 10 Mbps connection."
</details>

<details>
<summary>2. A story has no acceptance criteria and the sprint starts tomorrow. What do you do?</summary>

Say so before the sprint starts, not after. Raise it against the Definition of Ready. Then be
constructive: draft the AC yourself from what you understand, send them to the PO and developer,
and ask them to confirm or correct. A draft gets a response; "there are no AC" gets a shrug.
If it enters the sprint anyway, record that the criteria were assumed, so nobody is surprised later.
</details>

<details>
<summary>3. What is the difference between a product risk and a project risk?</summary>

Product risk is the possibility that the system fails to meet users' or stakeholders' needs —
payment miscalculates, data leaks, performance collapses. Project risk is the possibility that
the project itself fails to deliver — the test environment isn't ready, the vendor is late, the
only person who understands the legacy module resigns. Testers own analysis of product risk and
must flag project risks that affect testing.
</details>

<details>
<summary>4. Your RTM shows REQ-016 with no test cases. Is that automatically a problem?</summary>

Not automatically — but it must be a *decision*, not an accident. It may be covered by a unit
test, deferred, out of scope for this release, or judged too low-risk to test. Any of those is
fine if it's recorded. What is unacceptable is nobody knowing. The RTM's value is making the gap
visible so someone can choose.
</details>

---

## Glossary additions

`functional requirement` · `non-functional requirement` · `constraint` · `implicit requirement` ·
`testable` · `user story` · `acceptance criteria` · `Given/When/Then` · `INVEST` · `3 Cs` ·
`MoSCoW` · `static testing` · `review` · `walkthrough` · `inspection` ·
`requirements traceability matrix` · `scope creep` · `iron triangle` · `RAID log` ·
`entry criteria` · `exit criteria` · `product risk` · `project risk` · `risk-based testing`
