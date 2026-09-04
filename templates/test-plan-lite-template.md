# Lightweight Test Plan Template

For a feature or a sprint. One page. If it runs to five pages, nobody reads it and it stops
being true.

---

## 1. What we are testing

**Feature / release:**
**Story / requirement references:**
**Build / version:**
**One-paragraph summary of the change:**

## 2. Scope

**In scope**
-

**Out of scope** (and why — this is the most important list here)
-

## 3. Risk assessment

| Area | Probability of defects | Impact if it fails | Risk | Effort allocated |
|---|---|---|---|---|
| | High/Med/Low | High/Med/Low | High/Med/Low | % |

**Where 70% of the effort goes, and why:**

**Project risks** (environment, dependencies, people, third parties):

## 4. Test approach

| Test level | Who | What |
|---|---|---|
| Component | Developers | |
| Integration / API | | |
| System | | |
| Acceptance | | |

**Test types:** functional · performance · security · usability · compatibility ·
accessibility · localisation *(strike out what doesn't apply)*

**Techniques to be used:** EP · BVA · decision tables · state transition · exploratory ·
error guessing

**Automation:** what will be automated, at which level, and by when.

## 5. Environment and data

| Need | Detail | Ready? | Owner |
|---|---|---|---|
| Environment | | | |
| Test accounts / roles | | | |
| Test data | | | |
| Third-party sandboxes | | | |
| Tools / access | | | |
| Feature flag states | | | |

**Known differences from production:**

## 6. Entry and exit criteria

**Entry — testing may begin when:**
- [ ] Build deployed to the test environment, version confirmed
- [ ] Smoke suite passing
- [ ] Test data loaded
- [ ] Acceptance criteria agreed

**Exit — testing is complete when:**
- [ ] All P1 test cases executed
- [ ] ≥ __% pass rate
- [ ] Zero open Blocker/Critical defects
- [ ] All remaining known issues documented and accepted by the PO, with owners
- [ ] Test summary produced

## 7. Schedule

| Activity | Start | End | Owner |
|---|---|---|---|

## 8. Deliverables

- [ ] Test cases
- [ ] Exploratory session reports
- [ ] Defect reports
- [ ] Test summary report
- [ ] Updated regression / automation suite

## 9. Test summary report (fill in at the end)

**Executed:** ___ of ___ cases · **Passed:** ___ · **Failed:** ___ · **Blocked:** ___

**Defects:** ___ Critical · ___ Major · ___ Minor · ___ open at time of writing

**What was covered:**

**What was NOT covered, and why:**

**Residual risk, in one sentence:**

**Recommendation:** Ship / Ship with known issues / Do not ship —
**and what would change my mind:**
