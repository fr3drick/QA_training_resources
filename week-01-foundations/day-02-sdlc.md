# Day 2 — The Software Development Lifecycle

> **Week 1 · Day 2 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2 (2.1)
> Prerequisites: Day 1

---

## At a glance

By the end of this session you should be able to:

1. Name the phases every software project goes through, whatever the methodology.
2. Describe **Waterfall**, the **V-model**, **iterative** and **incremental** development.
3. Explain what "shift left" means and why it saves money.
4. Say where testing activities live in each model.
5. Explain **DevOps** and **CI/CD** at a level appropriate to a junior QA.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: error/defect/failure definitions |
| 0:05 – 0:12 | The phases every project has |
| 0:12 – 0:22 | Waterfall and the V-model |
| 0:22 – 0:32 | Iterative and incremental |
| 0:32 – 0:40 | Shift left, and testing in DevOps/CI-CD |
| 0:40 – 0:55 | **Activity:** map a project to a model |
| 0:55 – 1:00 | Homework |

---

## 1. Every project has the same phases

The methodology changes *when* and *how often* you do these, not *whether* you do them.

1. **Requirements / analysis** — what should it do, and for whom?
2. **Design / architecture** — how will we build it? Screens, data model, services.
3. **Implementation** — write the code.
4. **Testing** — check it does what it should.
5. **Deployment / release** — put it in front of users.
6. **Maintenance / operation** — fix, support, monitor, improve.

Waterfall does each once, in order. Agile does all six every two weeks, on a slice of the
product. That's genuinely most of the difference.

---

## 2. Waterfall

Each phase completes before the next begins, and each produces a signed-off document that feeds
the next.

```
Requirements
     └──> Design
              └──> Implementation
                        └──> Testing
                                  └──> Deployment
                                            └──> Maintenance
```

**Where testing sits:** at the end. Testers are often idle for months and then asked to test
everything in two weeks under enormous pressure.

**Strengths**
- Clear structure, easy to plan and budget.
- Heavy documentation — good for regulated industries (aviation, medical, banking, government).
- Works when requirements genuinely cannot change (a contract, a hardware deadline, a legal mandate).

**Weaknesses**
- Feedback arrives extremely late. A misunderstood requirement in January is discovered in October.
- Testing is squeezed: if development overruns, the release date rarely moves — the *test window* shrinks.
- No working software until the very end, so stakeholders can't course-correct.

**Signs your organisation is doing Waterfall even if it calls itself Agile:** a hardening/UAT
phase at the end of every "sprint"; test cases written only after the code is finished;
requirements frozen and change-controlled.

---

## 3. The V-model

The V-model is Waterfall folded in half, and it is the single most useful diagram for a junior
QA to internalise, because it shows that **every development activity has a matching test
activity, and the test activity should be planned at the same time.**

```
Requirements  ────────────────────────────────►  Acceptance Testing
   \                                                    /
    Functional/System Spec  ─────────────────►  System Testing
       \                                            /
        Architecture/High-level Design  ──►  Integration Testing
           \                                    /
            Detailed Design  ─────────►  Component (Unit) Testing
               \                            /
                \                          /
                 └──►  Coding  ◄──────────┘
```

Read it like this:

- The **left side** is verification of what you're going to build.
- The **bottom** is where you build it.
- The **right side** is where you validate, each level checking the deliverable from its
  matching level on the left.
- The **horizontal lines** are the important part: *while* the requirements are being written,
  the acceptance tests are being designed. Not after.

That is the origin of **shift left**: test *design* happens early even though test *execution*
happens later. When you review a requirement and ask "how would I know this works?", you are
doing the V-model correctly, and you will find defects in the requirement before code exists.

---

## 4. Iterative and incremental development

These two words get used interchangeably. They are different, and the distinction is worth
one minute of your life.

- **Incremental** — you build the product in pieces, each piece complete. Build the login,
  then the catalogue, then the cart, then checkout. Like building a house room by room.
- **Iterative** — you build a rough version of the whole thing, then improve it in cycles.
  Sketch the painting, then add detail everywhere, then refine.

Most modern methods (Scrum, Kanban, SAFe, XP) are **both**: each sprint adds new increments
*and* refines existing ones.

**What this means for testing:**
- Regression testing becomes essential. Every iteration risks breaking what worked before.
- Test automation stops being a luxury and becomes the only way to keep up.
- Requirements evolve, so test cases must be maintained continually, not written once.
- Testers are embedded in the team throughout, not a downstream department.

Other models you may hear named:
- **Spiral** — iterative with an explicit risk-analysis step each cycle. Used on large, risky systems.
- **RAD / Prototyping** — build throwaway prototypes to nail down requirements fast.
- **Big Bang** — no plan; code until it works. You will meet this at startups. It is not a model, it is a symptom.

---

## 5. Shift left, DevOps and CI/CD

### Shift left

Move test activities earlier in the timeline (leftward on a schedule drawn left to right).

Concretely, shift-left looks like:
- Reviewing requirements and raising ambiguity before development starts (Day 4).
- Writing acceptance criteria together with the BA and developer.
- Static analysis and unit tests running on the developer's machine.
- Testers pairing with developers during implementation.
- API-level tests written before the UI exists.

Why it works: a defect costs roughly an order of magnitude more to fix at each phase it survives.

### CI/CD in one paragraph each

- **Continuous Integration (CI)** — every developer merges their work into a shared branch
  frequently (at least daily). Every merge automatically triggers a build and an automated test
  suite. If it fails, the team fixes it before anything else. The goal is that integration
  problems are found in minutes rather than at the end of the project.
- **Continuous Delivery (CD)** — every change that passes the pipeline is *automatically made
  ready* to release; a human presses the button.
- **Continuous Deployment** — the same but without the human; every passing change goes to
  production automatically.

**What this means for you as QA:** in a CI/CD shop, manual regression testing cannot keep up.
Your value shifts to (a) exploratory testing of new behaviour, (b) designing the automated
checks, (c) testing in production-like environments, and (d) monitoring after release.

### Shift right

The counterpart: testing activities that happen *after* release — monitoring, alerting,
canary releases, feature flags, A/B tests, chaos engineering, and analysing real user
behaviour. Modern QA does both.

---

## 6. Choosing the model — a quick heuristic

| If… | Lean toward |
|-----|-------------|
| Requirements are stable, fixed-price contract, regulated | Waterfall / V-model |
| Safety-critical, must show traceability from requirement to test | V-model |
| Requirements are unclear or expected to change | Iterative / Agile |
| Product is user-facing and needs fast feedback | Agile + CI/CD |
| Very large, high risk, expensive to get wrong | Spiral / staged with risk reviews |

Reality check: most organisations run a **hybrid**. Requirements and budget approval look like
Waterfall; delivery looks like Scrum. Learn to work in whatever you land in, and notice where
testing is being squeezed.

---

## Live activity (15 minutes)

Present three short scenarios; interns decide the model and — more importantly — say **what
they would do as the tester on day one.**

**Scenario A.** A government agency is procuring a tax filing system. Contract is fixed price,
requirements are in a 300-page document signed by both parties, and there is a legal
go-live date.

**Scenario B.** A 4-person startup is building a food delivery app. They have no idea what
features users will want; they want something in front of users in 6 weeks.

**Scenario C.** A bank is adding a new fraud-detection service to an existing core banking
platform. It must not break anything that exists, and the regulator will audit the test evidence.

<details>
<summary>Facilitator notes</summary>

- **A** — Waterfall/V-model. Tester's day one: start reading the 300 pages and building a
  requirements traceability matrix; raise ambiguities now; design acceptance tests in parallel
  with the spec; negotiate a protected test window in the plan *before* it is compressed.
- **B** — Agile/iterative. Tester's day one: get into the story-refinement conversation; write
  acceptance criteria with the team; do exploratory testing each sprint; set up a thin layer
  of automated smoke tests early because the code will churn.
- **C** — Hybrid: V-model rigour with iterative delivery. Tester's day one: focus on
  integration and regression risk, plan for a strong regression suite, insist on
  production-like test data, and keep audit-quality evidence of every test run.
</details>

---

## Common mistakes juniors make

- Believing the model determines whether testing is "allowed" to start early. It never does —
  you can always review a requirement.
- Assuming Agile means "no documentation". Agile means *just enough* documentation.
- Not noticing that the test window is silently shrinking. Track it and say so, in writing, early.

---

## Homework (about 25 minutes)

1. Find out which model your organisation (or a company you'd like to join) actually uses.
   Write three sentences on the evidence: how often do they release? Are requirements frozen?
   Is there a test phase at the end?
2. Draw the V-model from memory and label, for each right-hand level, **one** thing you would
   test there for a login feature.
3. Read the ISTQB CTFL syllabus section 2.1 if you have it. Otherwise, write down two questions
   about SDLC you want answered tomorrow.

---

## Check your understanding

<details>
<summary>1. In the V-model, what is the test activity that corresponds to the requirements phase, and when should it be designed?</summary>

Acceptance testing. The acceptance tests should be **designed during the requirements phase**,
in parallel with the requirements themselves — even though they will be *executed* near the
end. Designing them early exposes vague or contradictory requirements.
</details>

<details>
<summary>2. Why does iterative development make regression testing more important than Waterfall does?</summary>

Because working code is changed repeatedly. Each iteration modifies or extends software that
already passed testing, so there is a continuous risk of breaking previously working behaviour.
In Waterfall the code is written once and tested once, so there are fewer opportunities for
regression — though also far less feedback.
</details>

<details>
<summary>3. Your team releases to production 10 times a day. What happens to a 3-day manual regression pack?</summary>

It becomes impossible to run. Either it gets automated, or it gets skipped and quietly becomes
a fiction. The honest response is to (a) automate the high-value checks into the pipeline,
(b) keep a very short manual smoke set, and (c) reallocate human time to exploratory testing
and to monitoring production.
</details>

<details>
<summary>4. What is the difference between incremental and iterative?</summary>

Incremental = building the product piece by piece, each piece finished (room by room).
Iterative = building a rough whole and refining it in cycles (sketch, then detail).
Most modern approaches use both simultaneously.
</details>

---

## Glossary additions

`SDLC` · `Waterfall` · `V-model` · `iterative development` · `incremental development` ·
`spiral model` · `shift left` · `shift right` · `continuous integration` ·
`continuous delivery` · `continuous deployment` · `DevOps` · `regression testing` ·
`traceability`
