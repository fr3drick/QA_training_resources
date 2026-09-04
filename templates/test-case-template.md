# Test Case Template

---

```
ID:              TC-<MODULE>-<NNN>            e.g. TC-LOGIN-007
TITLE:           <States the expectation, not just the area>
                 e.g. "Login is rejected after 5 failed attempts and the account locks"
MODULE:          Authentication
PRIORITY:        P1 | P2 | P3
TYPE:            Functional | Negative | Boundary | Security | Usability | Performance |
                 Compatibility | Accessibility
REQUIREMENT:     REQ-032, story PAY-3990 AC4
TEST CONDITION:  <the testable aspect this case covers>
AUTOMATABLE:     Yes / No — <reason>

PRECONDITIONS:
  1. <Environment and build>
  2. <Required data state — verifiable, e.g. "failed_attempts = 0">
  3. <Required user/role>
  4. <Browser/cache state>

TEST DATA:
  <exact values, one per line>

STEPS:
  1. <action>
     → Expected: <observable outcome>
  2. <action>
     → Expected: <observable outcome>
  3. ...

OVERALL EXPECTED RESULT:
  <the single outcome this case proves>

POSTCONDITIONS:
  <state the system is left in, and how to reset it — include the SQL or admin step>

NOTES:
  <anything a future executor needs to know>
```

---

## Rules for writing these

1. **The title states the expectation**, so results are readable at a glance.
2. **Preconditions are verifiable**, not "user is set up".
3. **Exact data** — real values, never "a valid email".
4. **One action per step**, so a failure points at exactly one thing.
5. **Expected results are observable** — a message, a state, a value.
6. **Test the boundary explicitly** (4 attempts vs 5), not just the middle of the range.
7. **Postconditions tell the next tester how to clean up.**
8. **Independent** — never assumes a previous test case ran.
9. Write in the **imperative**: "Click Save", not "The user should click Save".
10. **Every positive case deserves a negative sibling.**

---

## Result statuses

| Status | Meaning |
|---|---|
| **Pass** | Actual matched expected, completely |
| **Fail** | Actual did not match expected; a defect is raised |
| **Blocked** | Could not run — dependency, environment, or missing prerequisite |
| **Skipped / Not run** | Deliberately not executed this cycle |
| **In progress** | Started, not finished |

**"Blocked" is never "Fail".** Mixing them destroys your reporting.

---

## Execution log

| Cycle / Build | Date | Executed by | Result | Defect | Notes |
|---|---|---|---|---|---|
| 4.3.0-rc2 | 2026-03-12 | Efe | Fail | PAY-4412 | VAT missing after coupon |
| 4.3.0-rc3 | 2026-03-14 | Efe | Pass | — | Re-test of PAY-4412 confirmed |
