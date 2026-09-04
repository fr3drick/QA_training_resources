# Day 5 — Test Levels and Test Types (including Smoke Testing)

> **Week 1 · Day 5 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2 (2.2 Test Levels, 2.3 Test Types, 2.4 Maintenance Testing)
> Prerequisites: Days 1–4

---

## At a glance

By the end of this session you should be able to:

1. Name the four test levels and say what each is looking for.
2. Distinguish the four test types: functional, non-functional, black-box, white-box.
3. Explain the difference between **re-testing** and **regression testing** — precisely.
4. Explain **smoke testing** and **sanity testing**, when to run each, and what belongs in a
   smoke suite.
5. Read a test pyramid and say what it implies about where bugs should be caught.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Week recap + homework review |
| 0:05 – 0:18 | The four test levels |
| 0:18 – 0:28 | Test types: functional, non-functional, black/white box |
| 0:28 – 0:40 | Smoke, sanity, re-test, regression — the confusion killers |
| 0:40 – 0:47 | The test pyramid and maintenance testing |
| 0:47 – 0:57 | **Activity:** build a smoke suite |
| 0:57 – 1:00 | Week 1 wrap, weekend homework |

---

## 1. Test levels — *where* in the system you are testing

A test level is a group of test activities organised and managed together. Each level has its
own object under test, its own test basis, and its own typical defects.

### Component testing (unit testing)

- **Object under test:** a single function, class, module, in isolation.
- **Who:** developers, usually, as part of writing the code.
- **Test basis:** detailed design, the code itself.
- **Typical defects:** wrong logic, wrong calculation, off-by-one, unhandled null.
- **Isolation:** dependencies are replaced by **stubs**, **mocks** or **drivers**.
- **Speed:** milliseconds. Thousands of them run in the CI pipeline on every commit.

### Integration testing

Two flavours, and interviewers love the distinction:

- **Component integration testing** — do modules inside our system talk to each other
  correctly? (Order service ↔ inventory service.)
- **System integration testing** — does our system talk correctly to *external* systems?
  (Our app ↔ the payment gateway ↔ the SMS provider ↔ the bank's API.)

- **Typical defects:** wrong data format across a boundary, mismatched field names, wrong units
  (kobo vs naira, metres vs feet), timeouts, missing error handling when the other side fails,
  sequencing/ordering problems.
- **Approaches:** big-bang (integrate everything then test — hard to localise failures),
  top-down (uses stubs), bottom-up (uses drivers), incremental (safest, integrate a piece at a time).

### System testing

- **Object under test:** the whole, integrated system, end to end.
- **Who:** typically the test team — this is where most manual QA effort lives.
- **Test basis:** requirements, user stories, use cases, risk analysis.
- **Covers both** functional behaviour and non-functional characteristics (performance,
  security, usability) in an environment resembling production.
- **Typical defects:** end-to-end flows that fail, incorrect or unexpected functional or
  non-functional behaviour, wrong data flow through the system.

### Acceptance testing

Confirms fitness for use and readiness to deploy. Usually finds *few* new defects — if it finds
many, something upstream went wrong.

| Form | Who | Question it answers |
|---|---|---|
| **User Acceptance Testing (UAT)** | Real business users | "Does this work the way I actually do my job?" |
| **Operational Acceptance Testing (OAT)** | Ops/SRE | "Can we run, back up, restore, monitor and patch this?" |
| **Contractual / Regulatory** | Customer, auditor, regulator | "Does this meet the contract / the law?" |
| **Alpha testing** | Representative users, **at the developing organisation's site** | Early real-world feedback |
| **Beta testing** | Real users, **at their own sites** | Broad real-world feedback before general release |

---

## 2. Test types — *what kind of quality* you are testing for

| Type | Question | Examples |
|---|---|---|
| **Functional** | *What* does it do? | Can I transfer money? Is the total correct? Does the discount apply? |
| **Non-functional** | *How well* does it do it? | Is it fast enough? Secure? Usable? Accessible? Portable? |
| **Black-box (specification-based)** | Derived from the spec, no knowledge of internals | Equivalence partitioning, boundary values (Day 7) |
| **White-box (structure-based)** | Derived from the internal structure | Statement coverage, branch/decision coverage |
| **Change-related** | Did the change work, and did it break anything? | Confirmation testing, regression testing |

**Grey-box** is the mix you will actually work in: you test through the UI or API like a user,
but you also look at the database, the logs and the network calls to understand what's
happening. Most of Weeks 3 and 4 is training you for grey-box work.

### Non-functional types worth naming

| Type | What it checks |
|---|---|
| Performance / load | Behaviour under expected load |
| Stress | Behaviour beyond expected load; how it degrades and recovers |
| Soak / endurance | Behaviour over a long period (memory leaks, log-disk exhaustion) |
| Spike | Sudden surge in traffic |
| Scalability | Does adding resources add capacity? |
| Security | Authentication, authorisation, injection, data exposure |
| Usability | Effectiveness, efficiency, satisfaction |
| Accessibility | Usable by people with disabilities (WCAG) |
| Compatibility | Browsers, OS, devices, screen sizes, other software |
| Reliability | Failure rate, recoverability, fault tolerance |
| Portability | Installability, adaptability, replaceability |
| Localisation | Language, currency, date/number formats, right-to-left text, time zones |

---

## 3. The four words juniors mix up

This section alone is worth the hour. Get these exactly right.

### Re-testing (confirmation testing)

> **Running the exact test that failed, on a new build, to confirm the specific defect is fixed.**

- Scope: **narrow** — one defect.
- Trigger: a developer says "fixed in build 4.2.1".
- If it passes, you close the defect. If it fails, you reopen it (Day 9).
- You must re-test in the **same conditions** that produced the failure — same data, same role,
  same browser — or you haven't confirmed anything.

### Regression testing

> **Re-running tests on parts of the system that were previously working, to detect whether a
> change has broken them.**

- Scope: **broad** — anything that could have been affected.
- Trigger: any change — a fix, a new feature, a config change, a library upgrade, an
  environment change.
- Regression suites grow over time and are the prime candidate for automation.
- **Impact analysis** decides how much regression to run: what does this change touch, what
  shares code or data with it, what has historically broken?

**In one line:** *re-testing proves the fix works; regression testing proves the fix didn't
break anything else.* You almost always do both, in that order.

### Smoke testing (build verification test)

> **A shallow, wide set of tests run on a new build to decide whether it is stable enough to
> justify further testing.**

The name comes from hardware: power the board on, and if you see smoke, stop — no point
continuing.

- **Purpose:** protect the test team's time and give fast feedback to developers.
- **Depth:** one level deep. Does it launch? Can I log in? Does the main page load? Can I
  reach the primary flows?
- **Duration:** 5–15 minutes manually; ideally automated and run on every deployment.
- **Outcome is binary:** build accepted for testing, or rejected back to the developers.
- **When:** after every deployment to a test environment, and as a final check after a
  production release.

**A good smoke suite for an e-commerce site (10 checks, ~8 minutes):**

1. Home page loads, HTTP 200, no console errors.
2. Log in with a valid account.
3. Search for a known product and get results.
4. Open a product detail page; price and image render.
5. Add to cart; cart count increments.
6. Proceed to checkout; the page renders with the correct total.
7. Place an order with a test card; an order number is returned.
8. Order appears in "My Orders".
9. Log out.
10. Health endpoints return 200 and the build number matches what was deployed.

**Rules for smoke suites:** every check is on the critical path; no edge cases; no deep
validation; must be fast; must be reliable — a flaky smoke test is worse than none, because
people start ignoring it.

### Sanity testing

> **A narrow, deep check on a specific area after a small change, to decide whether that area
> is worth testing further.**

- Smoke = **wide and shallow**, over the whole build.
- Sanity = **narrow and deep**, over one area.
- Sanity is often unscripted and quick: "they changed the VAT rate; let me verify tax on three
  order types before I run the full pack."

| | Smoke | Sanity |
|---|---|---|
| Breadth | Whole system | One function/module |
| Depth | Shallow | Deeper |
| Scripted? | Usually, and usually automated | Often ad hoc |
| Runs after | Any new build | A minor change or a fix |
| Answers | "Is this build testable at all?" | "Is this specific change sane?" |

---

## 4. The test pyramid, and where defects should be caught

```
              /\
             /  \        End-to-end / UI tests
            /____\       Few. Slow. Brittle. Highest confidence per test.
           /      \
          /        \     Integration / API tests
         /__________\    More. Faster. Stable. Great value for money.
        /            \
       /              \  Unit tests
      /________________\ Many. Milliseconds. Cheap to write and run.
```

The point isn't the shape — it's the economics. A defect caught by a unit test costs seconds to
diagnose because it points at one function. The same defect caught by a UI test costs an hour,
because "checkout failed" could be anything.

**The ice-cream cone** is the anti-pattern: a huge pile of slow UI tests, few unit tests. Symptoms:
a 6-hour test run, constant flaky failures, and nobody trusting the results.

**What this means for you as a manual tester:** ask "could this have been caught cheaper and
earlier?" A bug you find in the UI that a unit test could have caught is a process finding as
well as a product finding. Say so in the retro.

---

## 5. Maintenance testing

Testing changes to a system that is already in production. Triggers:

- **Modification** — new features, fixes, patches, config changes.
- **Upgrade or migration** — new OS, new database version, moving to a new host or cloud
  provider. Includes **data migration testing** and **conversion testing**, and a check that
  the old system's behaviour is preserved where it should be.
- **Retirement** — decommissioning a system. Test data archival, restore-from-archive, and
  that dependent systems survive its removal.
- **Operational triggers** — a hotfix, a security patch, an expiring certificate.

The core activity is **impact analysis**: what does this change touch, and how much regression
testing does that justify? Poor impact analysis is why "a one-line change" takes down production.

---

## Live activity (10 minutes)

**Build a smoke suite.** Pick an app everyone knows — a banking app, WhatsApp, a college portal.
In pairs, write the **8 checks** you would run in 10 minutes after a new build, to decide
whether the build is worth testing.

Rules: no check may take more than 90 seconds; every check must be on the critical path; you
must be able to justify each one in a sentence.

**Debrief:** compare lists and argue about the marginal ones. The argument *is* the lesson —
a smoke suite is a statement about what the product is fundamentally for. Then ask: "which of
these would you automate first?" (Answer: the login and the primary transaction, because
everything else depends on them.)

---

## Common mistakes juniors make

- Calling every re-run "regression testing". If you're checking one fixed bug, that's re-testing.
- Letting the smoke suite grow. It creeps from 10 checks to 60 and stops being fast; then it
  gets skipped. Review and trim it every few months.
- Reporting "smoke passed" as if the build is good. Smoke passing means testing may *begin*.
- Skipping re-test of the original failing conditions and testing a happier path instead.
  You have then closed a defect you never confirmed fixed.

---

## Week 1 wrap-up

You now have the vocabulary and the mental model:

- **Day 1** — what testing is, error/defect/failure, the seven principles.
- **Day 2** — where testing lives in the lifecycle, and the V-model's insistence on early design.
- **Day 3** — how Agile and Waterfall change your day, and the ceremonies where you have leverage.
- **Day 4** — requirements are where defects are cheapest to kill.
- **Day 5** — levels, types, and the four confusable words.

Next week you start producing artefacts: test cases, techniques, exploratory charters, and
bug reports.

---

## Weekend homework (about 45 minutes)

1. **Smoke suite:** finalise your 8–10 check smoke suite from the activity. Write it as a
   numbered list with expected results, so someone else could execute it.
2. **Levels:** for a "user uploads a profile photo" feature, write one test you would run at
   each of the four levels. Make clear why each belongs at that level.
3. **Vocabulary drill:** in your own words, in under 30 words each — re-testing, regression
   testing, smoke testing, sanity testing.
4. **Read ahead:** skim [templates/test-case-template.md](../templates/test-case-template.md).
   Monday you'll write real test cases.

---

## Check your understanding

<details>
<summary>1. A developer fixes BUG-101 in build 12. What do you run, and in what order?</summary>

First **re-test** (confirmation test): re-run the exact steps from BUG-101, with the same data,
role and environment, on build 12. If it passes, close the defect. Then **regression test** the
areas the fix could have affected, based on impact analysis — what code, data or configuration
the change touched. If the re-test fails, reopen the defect and don't waste time on regression yet.
</details>

<details>
<summary>2. The smoke test passes but the build has a broken discount calculation. Did smoke testing fail at its job?</summary>

No. Smoke testing is deliberately wide and shallow — its only job is to answer "is this build
stable enough to test?" A discount calculation defect is exactly what the deeper functional
testing that follows is for. Smoke testing would only have failed if the build had been so
broken that testing was pointless and it let it through anyway.
</details>

<details>
<summary>3. Which test level would catch "the payment service sends the amount in naira but the gateway expects kobo"?</summary>

Integration testing — specifically system integration testing, since the gateway is an external
system. Unit tests on each side would pass, because each component is internally consistent;
the defect only exists at the boundary between them. This is the classic integration defect.
</details>

<details>
<summary>4. Give an example of a functional and a non-functional test for the same feature — "search for a product".</summary>

Functional: searching for "blue shirt" returns products whose title or description contains
both words, ranked by relevance, and returns a "no results" state for a nonsense term.
Non-functional: the search returns results within 2 seconds for 95% of requests at 500
concurrent users; the results page is keyboard-navigable and screen-reader friendly; it renders
correctly at 320px width.
</details>

<details>
<summary>5. What's the difference between alpha and beta testing?</summary>

Both are forms of acceptance testing done by potential or existing users rather than the
development team. **Alpha** is performed at the *developing organisation's* site, with the team
nearby. **Beta** is performed by users at *their own* sites, in their own environments, which is
why beta uncovers environment and configuration problems alpha never sees.
</details>

---

## Glossary additions

`test level` · `component testing` · `integration testing` · `system testing` ·
`acceptance testing` · `UAT` · `OAT` · `alpha testing` · `beta testing` · `stub` · `mock` ·
`driver` · `functional testing` · `non-functional testing` · `black-box testing` ·
`white-box testing` · `grey-box testing` · `re-testing` · `confirmation testing` ·
`regression testing` · `smoke testing` · `sanity testing` · `build verification test` ·
`test pyramid` · `impact analysis` · `maintenance testing`
