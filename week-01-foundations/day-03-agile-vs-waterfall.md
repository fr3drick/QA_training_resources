# Day 3 — Agile vs Waterfall, and QA's Place in a Team

> **Week 1 · Day 3 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2 (2.1), Chapter 5 (5.1.2 whole-team approach)
> Prerequisites: Day 2

---

## At a glance

By the end of this session you should be able to:

1. Compare Agile and Waterfall honestly, including where Waterfall is the better choice.
2. Explain the Agile Manifesto's four values without reciting them as slogans.
3. Describe the Scrum ceremonies and what a tester does in each.
4. Explain **Definition of Ready** and **Definition of Done**, and why QA cares.
5. Describe the **whole-team approach** and the difference between Scrum and Kanban.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review |
| 0:05 – 0:12 | The Agile Manifesto, read properly |
| 0:12 – 0:25 | Agile vs Waterfall side by side |
| 0:25 – 0:40 | Scrum ceremonies and the tester's job in each |
| 0:40 – 0:48 | DoR, DoD, and the whole-team approach |
| 0:48 – 0:57 | **Activity:** run a 5-minute stand-up + refine a story |
| 0:57 – 1:00 | Homework |

---

## 1. The Agile Manifesto, read properly

Four value statements, written in 2001. Note the exact wording — the second half of each line
is the part people skip.

> We value:
> - **Individuals and interactions** over processes and tools
> - **Working software** over comprehensive documentation
> - **Customer collaboration** over contract negotiation
> - **Responding to change** over following a plan
>
> *That is, while there is value in the items on the right, we value the items on the left more.*

That closing sentence matters. Agile does not say documentation is worthless. It says that when
you must choose, prefer working software. Teams that use "we're Agile" to justify having no
requirements, no test cases and no records are not being Agile; they are being disorganised.

**The twelve principles** are worth reading once. The ones that touch QA hardest:
- Deliver working software frequently.
- Business people and developers must work together daily.
- Working software is the primary measure of progress.
- Continuous attention to technical excellence and good design enhances agility.
- At regular intervals, the team reflects on how to become more effective, and adjusts.

---

## 2. Agile vs Waterfall, side by side

| | **Waterfall** | **Agile** |
|---|---|---|
| Requirements | Fixed up front, change-controlled | Emergent, refined continuously |
| Delivery | One big release at the end | Small releases every 1–4 weeks |
| Documentation | Comprehensive, signed off | Just enough, living |
| Customer involvement | At the start and at UAT | Continuous |
| Testing | A phase near the end | An activity every day |
| Tester's position | Separate QA department, downstream | Embedded in the delivery team |
| Test basis | Detailed specification | User stories + acceptance criteria + conversation |
| Change | Expensive, resisted | Expected, welcomed |
| Feedback loop | Months | Days |
| Risk shows up | Late, all at once | Early, in small pieces |
| Best when | Requirements stable, regulated, fixed contract | Requirements uncertain, product evolving |
| Fails when | Requirements were wrong (you find out too late) | Team lacks discipline (no tests, no DoD, endless churn) |

**Do not let anyone tell you Agile is simply better.** If you are building the flight control
software for an aircraft, the regulator wants traceability from every requirement to every
test result, and a V-model gives you that cleanly. If you are building a consumer app in a
market you don't yet understand, Waterfall will have you perfect the wrong product.

### What actually changes for the tester

| | Waterfall tester | Agile tester |
|---|---|---|
| Gets requirements | As a document | As a conversation + a story |
| Writes test cases | Once, in a big batch | Continuously, per story |
| Finds bugs | In a compressed test phase | Every day, often in the same hour they were written |
| Reports to | A QA manager | The delivery team (and maybe a QA chapter/guild) |
| Biggest risk | Test window compressed to nothing | Becoming a mini-waterfall inside the sprint |

That last one deserves a name: **the mini-waterfall anti-pattern**. Developers code for 8 days,
throw the work over the wall on day 9, testers panic on day 10, and untested work rolls to the
next sprint. Signs you're in it: stories always "done" on the last day; a "testing" column that
is permanently full; carry-over every sprint. The fixes are structural: slice stories smaller,
demand that stories are testable, test each story the day it's finished, and make "tested" part
of the Definition of Done rather than a separate later phase.

---

## 3. Scrum, and what QA does in each ceremony

**Roles:** Product Owner (owns the *what* and the priority), Scrum Master (owns the *process*
and removes impediments), Developers (everyone who builds the increment — **testers are part of
this group**, not a separate role in Scrum's rules).

**Artifacts:** Product Backlog → Sprint Backlog → Increment.

| Ceremony | Duration (2-week sprint) | Purpose | **What the tester does** |
|---|---|---|---|
| **Backlog refinement / grooming** | ~1 hr/week | Clarify and size upcoming stories | *Your highest-leverage hour of the week.* Ask the awkward questions. "What should happen if the card is declined halfway?" "Is there a maximum length?" "What do we do with existing records?" Every ambiguity you kill here is a bug that never gets written. |
| **Sprint planning** | 2–4 hrs | Choose and commit to sprint scope | Give the testing effort for each story, not just dev effort. Flag stories with no acceptance criteria. Raise test-data and environment needs *now*. |
| **Daily stand-up** | 15 min | Sync, surface blockers | Say what you tested, what you'll test, what blocks you. "I'm blocked on the staging DB refresh" is exactly what this meeting is for. |
| **Sprint review / demo** | 1–2 hrs | Show the increment to stakeholders | Do not let untested work be demoed as done. Useful place to surface usability findings. |
| **Retrospective** | 1 hr | Improve the process | Bring data, not vibes: "6 of 9 stories reached testing on the final day" beats "testing feels rushed". |

**Other Scrum vocabulary you'll hear:** *velocity* (story points completed per sprint — a
planning aid, not a performance target), *story points* (relative size, not hours), *burndown
chart*, *spike* (a timeboxed investigation), *impediment*, *sprint goal*.

### Scrum vs Kanban

| | Scrum | Kanban |
|---|---|---|
| Cadence | Fixed-length sprints | Continuous flow |
| Commitment | Sprint scope committed | Pull work when there's capacity |
| Core lever | Timebox | **WIP limits** |
| Key metrics | Velocity, burndown | Cycle time, lead time, throughput |
| Suits | Feature delivery | Support, ops, unpredictable inbound work |

For QA, the interesting Kanban idea is the **WIP limit**: if the "In Testing" column is capped
at 3, developers cannot dump 9 stories on you — the board makes the bottleneck visible instead
of making it your problem.

---

## 4. Definition of Ready and Definition of Done

Two team agreements that protect testers more than any other artifact.

**Definition of Ready (DoR)** — a story may not enter a sprint unless it meets these. Example:

- [ ] Has a clear user story statement and business value
- [ ] Has testable acceptance criteria
- [ ] Dependencies identified
- [ ] Designs/mockups attached where relevant
- [ ] Estimated by the team
- [ ] Test data and environment needs known
- [ ] Small enough to finish in one sprint

**Definition of Done (DoD)** — a story is not "done" until all of these are true. Example:

- [ ] Code written and peer reviewed
- [ ] Unit tests written and passing
- [ ] Merged to main, CI green
- [ ] Acceptance criteria verified by someone other than the author
- [ ] Exploratory testing session completed on the change
- [ ] Regression suite passing
- [ ] No open blocker or critical defects on the story
- [ ] Documentation / release notes updated
- [ ] Demoed to and accepted by the Product Owner

"**Done** means done, not *dev-done*." If your team says "done but not tested", that phrase is
the bug. Push for the DoD to include testing, and put it on the wall.

---

## 5. The whole-team approach

The idea: quality is owned by the entire team, not delegated to a QA person at the end.
In practice this means:

- Developers write unit tests and test their own work before handing it over.
- Testers help write acceptance criteria and share test ideas *before* code is written.
- The Product Owner accepts based on evidence, not optimism.
- The whole team stops and fixes a broken build.
- Testers pair with developers; developers pair with testers. Both learn.

**Being the only tester on a team?** Then your leverage is not in executing more test cases; it
is in refinement conversations, in teaching the team to test, and in the automation that lets
you spend your time on what only a human can do.

---

## Live activity (9 minutes)

**Part 1 (3 min) — run a real stand-up.** Each intern gives yesterday / today / blockers about
this course. Enforce the 15-second limit. Point out afterwards how quickly it turns into
problem-solving, and that problem-solving belongs *after* the stand-up.

**Part 2 (6 min) — refine a bad story.** Put this on screen:

> "As a user, I want to reset my password so that I can log in again."

Ask: **would you accept this into a sprint?** Collect the questions the interns would ask.

<details>
<summary>Questions a good tester raises here</summary>

- Reset by email, SMS, or security questions? Which is in scope?
- How long is the reset link valid? What happens after expiry?
- Can the link be used twice?
- What if the email address isn't registered — do we say so? (Saying "no such user" leaks
  which emails have accounts. Security concern; worth raising.)
- Are there password complexity rules? Can the new password equal the old one?
- Is the user logged out of other sessions after a reset?
- Rate limiting — can I request 500 reset emails for someone else's account?
- What does the email look like, and who wrote the copy?
- Does this work on mobile? Which browsers?
- What should the audit log record?

Then rewrite it with acceptance criteria in the Given/When/Then form (Day 4 goes deeper).
Ten questions in five minutes is ten defects that never get written.
</details>

---

## Common mistakes juniors make

- Sitting silently in refinement. Your questions *are* the job.
- Treating velocity as a target. It is a planning aid; gaming it damages quality first.
- Accepting "we'll write the acceptance criteria later". Later means never, and you will be
  asked to test something with no oracle for what "correct" is.
- Saying "Agile means no test cases". It means the level of documentation should match the risk.

---

## Homework (about 30 minutes)

1. Take the password reset story above and write it out properly: story statement, at least
   **8 acceptance criteria** in Given/When/Then form, and a note of what is explicitly out of scope.
2. Write your team's (or a proposed) **Definition of Done** — at least 7 items — and mark
   which items you as a tester would refuse to compromise on.
3. Write two sentences on a project you know that would be *better* in Waterfall than Agile,
   and why.

---

## Check your understanding

<details>
<summary>1. In Scrum, which ceremony gives a tester the most influence over the quality of the release, and why?</summary>

Backlog refinement. It is the only ceremony that happens *before* code exists, so questions
asked there prevent defects instead of detecting them. Everything else in the sprint is
detection. (Retrospective is a strong second — it changes the process rather than the product.)
</details>

<details>
<summary>2. Your team's board has 11 stories in "In Testing" and 1 in "In Progress" on day 9 of a 10-day sprint. What is the problem and what would you propose in the retro?</summary>

The mini-waterfall anti-pattern: development ran the full sprint and testing was deferred to the
end, so nothing will be genuinely done. Proposals: a WIP limit on the testing column; slicing
stories smaller; "tested" in the Definition of Done; testers pairing with devs during
development; devs picking up testing when the column backs up (whole-team approach). Bring the
count as data, not as a complaint.
</details>

<details>
<summary>3. A Product Owner says a story is "done, we'll test it next sprint." How do you respond?</summary>

Refer to the Definition of Done — untested work is not done, it is work in progress with
unknown risk. Concretely: it can't be safely demoed as complete, it may carry defects into work
built on top of it, and the sprint's reported velocity becomes fictional. If the deadline is
genuinely immovable, the honest move is to record it as accepted risk, visibly, with the PO's
name on the decision.
</details>

<details>
<summary>4. Name one thing Waterfall does better than Agile.</summary>

Any of: traceability and audit evidence for regulators; up-front cost and schedule predictability
for a fixed-price contract; coordination of large, distributed teams with hardware or external
dependencies; situations where late change genuinely is impossible (a printed manual, a
certified device, a legally mandated go-live).
</details>

---

## Glossary additions

`Agile Manifesto` · `Scrum` · `sprint` · `Product Owner` · `Scrum Master` · `backlog` ·
`refinement` · `stand-up` · `sprint review` · `retrospective` · `velocity` · `story point` ·
`spike` · `Kanban` · `WIP limit` · `cycle time` · `Definition of Ready` · `Definition of Done` ·
`whole-team approach` · `user story`
