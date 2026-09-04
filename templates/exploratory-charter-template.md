# Exploratory Session Template

---

## The charter

```
Explore      <target — a specific area, feature or flow>
With         <resources — tools, data, personas, conditions, constraints>
To discover  <the kind of information you are hunting for>
```

**Good examples**

- *Explore the coupon code field with expired, used and malformed codes, using the API client,
  to discover error-handling and validation problems.*
- *Explore checkout on a throttled Slow 3G connection, using Chrome DevTools, to discover
  timeout and double-submission problems.*
- *Explore the profile page as a brand-new account with no data, to discover empty-state and
  null-handling defects.*
- *Explore file upload with 0-byte, oversized, misnamed and unicode-named files, to discover
  validation and security problems.*

**Bad:** "Test the checkout." "Explore the app." Too broad to focus or to report on.

---

## The session report

```
CHARTER:        <as above>
TESTER:         
DATE / BUILD:   <date, build number, environment>
DURATION:       Short (~45m) | Normal (~90m) | Long (~120m)   Actual: ___ min

SETUP:
  <accounts, data, tools, flags — enough that someone could recreate the session>

TEST NOTES:
  <running log, written AS YOU GO. Mark findings inline.>
  - <what you did> → <what you observed>            ✓
  - <what you did> → <what you observed>            *** BUG 1
  - <what you did> → <what you observed>            *** QUESTION 1
  - <distraction noted, returned to charter>

BUGS FOUND:
  <ticket IDs, or a one-line description each if not yet logged>

QUESTIONS / ISSUES FOR THE PO:
  <spec gaps and ambiguities — these are findings too>

TIME SPLIT:
  Testing ___%   Bug reporting ___%   Setup / environment ___%

COVERAGE — WHAT I EXPLORED:
  <specific>

COVERAGE — WHAT I DID *NOT* EXPLORE:
  <specific — this line is what makes the report credible>

NEXT CHARTERS SUGGESTED:
  1.
  2.
```

The last three sections turn "I explored for an hour" into a report a manager can act on.

---

## Heuristics — when you run out of ideas

**SFDIPOT** (product elements): **S**tructure · **F**unction · **D**ata · **I**nterfaces ·
**P**latform · **O**perations · **T**ime

**RCRCRC** (what to regression-test when time is short): **R**ecent · **C**ore · **R**isky ·
**C**onfiguration-sensitive · **R**epaired · **C**hronic

**CRUD**: Create · Read · Update · Delete — then the awkward combinations (read after delete,
delete twice, update a deleted record, create a duplicate).

**Tours**: Guidebook · Money · Landmark · Back Alley · Garbage Collector · Supermodel ·
Saboteur · Obsessive-Compulsive · Couch Potato · Antisocial

**Quick rules of thumb**
- *Follow the data* — UI → API → database → email → export. Mismatch anywhere is a bug.
- *Zero, one, many* — no records, exactly one, a lot.
- *Two of everything* — two tabs, two clicks, two users, two devices.
- *Interrupt everything* — close the tab, kill the network, expire the session, rotate the phone.
- *Goldilocks* — too big, too small, just right.
