# Day 7 — Test Design Techniques That Cut Your Workload

> **Week 2 · Day 7 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 4 (4.2 Black-box techniques, 4.3 White-box, 4.4 Experience-based)
> Prerequisites: Day 6

---

## At a glance

By the end of this session you should be able to:

1. Explain why techniques beat intuition — and prove it with numbers.
2. Apply **equivalence partitioning** and **boundary value analysis**.
3. Build a **decision table** for combinational logic.
4. Build a **state transition** diagram and table, and test invalid transitions.
5. Recognise **use case testing**, **pairwise testing**, and the white-box coverage criteria.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: coupon test cases |
| 0:05 – 0:10 | Why techniques? The combinatorial problem |
| 0:10 – 0:22 | Equivalence partitioning + boundary value analysis |
| 0:22 – 0:33 | Decision tables |
| 0:33 – 0:43 | State transition testing |
| 0:43 – 0:50 | Use cases, pairwise, and white-box coverage in brief |
| 0:50 – 0:58 | **Activity:** apply EP + BVA to a real field |
| 0:58 – 1:00 | Homework |

---

## 1. Why techniques?

An age field accepting 0–120 has 121 valid values, plus infinite invalid ones (letters, empty,
negative, decimals, 10^9, emoji, SQL). You cannot test them all — that's Day 1's principle 2.

Untrained testers respond by picking values that *feel* representative: 25, 30, 45. All three
are the same test. Techniques let you argue, with a straight face, that **6 well-chosen values
cover this field better than 60 random ones** — and let you defend your coverage in a review.

Three families:

| Family | Derived from | Examples |
|---|---|---|
| **Black-box** (specification-based) | The spec/requirements | EP, BVA, decision tables, state transition, use cases, pairwise |
| **White-box** (structure-based) | The internal structure/code | Statement, branch/decision coverage |
| **Experience-based** | The tester's knowledge and intuition | Error guessing, exploratory testing, checklist-based |

You need all three. Techniques give you a defensible baseline; experience finds what the spec
never mentioned.

---

## 2. Equivalence Partitioning (EP)

**The idea:** divide the input domain into groups ("partitions") where every member should be
treated the same way by the system. Test **one value from each partition** — if one works, the
rest of that partition probably works too.

**Example — a "Quantity" field on a product page: valid range 1 to 99, whole numbers only.**

| Partition | Type | Example value |
|---|---|---|
| Less than 1 (0 and negatives) | Invalid | -5 |
| 1 to 99 | **Valid** | 42 |
| Greater than 99 | Invalid | 250 |
| Non-integer numbers | Invalid | 2.5 |
| Non-numeric text | Invalid | "abc" |
| Empty | Invalid | (blank) |
| Whitespace only | Invalid | "   " |

Seven tests instead of hundreds — with a documented rationale.

**Rules that keep you out of trouble:**
- Partitions must not overlap, and together must cover the whole input domain.
- Partition **outputs** too, not just inputs. A shipping calculator with free/standard/express
  bands has three output partitions worth hitting.
- **One invalid value per test case.** If you enter -5 into quantity *and* leave the address
  blank, and it errors, you don't know which rule fired — and the first validation may mask the
  second. Valid values can be combined; invalid ones should be tested one at a time.

---

## 3. Boundary Value Analysis (BVA)

**The idea:** defects cluster at the edges of partitions, because that's where `<` vs `<=`,
off-by-one, and rounding live. So test the boundaries explicitly.

For each boundary there are two common approaches:

- **2-value BVA:** the boundary value and its nearest neighbour on the other side.
- **3-value BVA:** the value below, the boundary, and the value above.

**For quantity 1–99, 3-value BVA gives:**

| Value | Why | Expected |
|---|---|---|
| 0 | Just below minimum | Rejected |
| **1** | Minimum boundary | Accepted |
| 2 | Just above minimum | Accepted |
| 98 | Just below maximum | Accepted |
| **99** | Maximum boundary | Accepted |
| 100 | Just above maximum | Rejected |

EP + BVA together — about a dozen tests — give you a far stronger case than 100 random values,
and they are the two techniques you will use most often for the rest of your career.

**Boundaries hide in more places than numbers:**

| Domain | Boundaries to test |
|---|---|
| Text length (max 50 chars) | 0, 1, 49, 50, 51, and *exactly* 50 with multi-byte characters |
| Dates | Yesterday/today/tomorrow, month end, 31 Dec → 1 Jan, 28/29 Feb in a leap year, DST change |
| Money | 0, 0.01, the exact balance, one kobo over, the daily limit, one over the limit |
| Files | 0 bytes, 1 byte, exactly the size limit, one byte over |
| Lists / pagination | 0 items, 1 item, exactly one page (e.g. 20), one more than a page (21), the last page |
| Time | Session expiring at exactly the timeout, a token used one second before and after expiry |
| Age/eligibility | The day before an 18th birthday, on it, the day after |

**The Day 1 bug** (`>` instead of `>=`, "withdraw your exact balance") is *only* caught by
testing the boundary. This is why the technique matters.

---

## 4. Decision tables

**Use when:** the outcome depends on a **combination** of conditions. Rules like "premium
customers ordering over ₦50,000 before the cut-off get free next-day delivery, unless the item
is oversized" are decision tables in disguise.

**Example — a loan application.**

Conditions: Credit score ≥ 700? · Employed? · Existing customer? → Action: approve, refer, reject.

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| **Credit ≥ 700** | Y | Y | Y | Y | N | N | N | N |
| **Employed** | Y | Y | N | N | Y | Y | N | N |
| **Existing customer** | Y | N | Y | N | Y | N | Y | N |
| **Approve** | ✔ | ✔ | | | | | | |
| **Refer to underwriter** | | | ✔ | ✔ | ✔ | ✔ | | |
| **Reject** | | | | | | | ✔ | ✔ |

Each **rule (column) becomes one test case** — 8 tests, with complete, provable coverage of the
combinations. Three conditions = 2³ = 8 columns; four = 16.

**How to build one:**
1. List every condition and every possible action.
2. Compute the number of rules (2^n for n binary conditions).
3. Fill in condition combinations systematically (half Y then half N, then quarters, etc. —
   this pattern guarantees you miss nothing).
4. Fill in the expected action for each rule, **from the specification**.
5. Where the spec has no answer, you have found a requirements defect — raise it now.
6. Collapse rules where a condition is irrelevant, marking it "–" (don't care), to reduce
   test count. In the table above, R7 and R8 collapse into one rule: if credit < 700 and not
   employed, "existing customer" doesn't matter.

**The real value:** step 5. Decision tables are the fastest way to find the combination nobody
thought about. Interns routinely find 2–3 unspecified combinations in their first real table.

---

## 5. State transition testing

**Use when:** the system behaves differently depending on what happened before — anything with
a status field. Orders, tickets, accounts, sessions, subscriptions, media players.

**Example — an order.**

```
   [Created] --pay--> [Paid] --pack--> [Shipped] --deliver--> [Delivered]
       |                 |                                        |
     cancel            refund                                   return
       |                 |                                        |
       v                 v                                        v
   [Cancelled]      [Refunded]                                [Returned]
```

**The state table.** Rows are states, columns are events. Fill in the resulting state, and use
`—` for a transition that must be refused.

| State \ Event | pay | pack | deliver | cancel | refund | return |
|---|---|---|---|---|---|---|
| **Created** | Paid | — | — | Cancelled | — | — |
| **Paid** | — | Shipped | — | Cancelled | Refunded | — |
| **Shipped** | — | — | Delivered | — | — | — |
| **Delivered** | — | — | — | — | — | Returned |
| **Cancelled** | — | — | — | — | — | — |
| **Refunded** | — | — | — | — | — | — |

**Coverage levels:**
- **All states** — visit every state at least once. Weakest.
- **All valid transitions (0-switch)** — exercise every arrow. The usual minimum.
- **All transition pairs (1-switch)** — every valid sequence of two transitions. Catches bugs
  that only appear in a particular order.
- **Invalid transitions** — the dashes. **This is where the bugs are.**

**The dashes are the gold.** Every `—` is a test: what happens if you try it? Can I cancel an
order that has already shipped by hitting the API directly? Can I refund twice by
double-clicking? Can I pay for an order that was cancelled in another tab? UI buttons are
usually hidden for invalid transitions — so test at the API level (Week 4), where the button
isn't there to stop you.

---

## 6. Three more, briefly

### Use case testing

Derive tests from a use case: the actor, the preconditions, the **main success scenario**, and
every **alternative and exception flow**. It's how you find end-to-end defects that unit-level
techniques miss, because it follows a real user's whole journey including where they go wrong,
abandon, or come back.

### Pairwise / all-pairs testing

When you have many parameters that combine — browser (5) × OS (4) × language (6) × payment
method (5) = 600 combinations. Research shows most defects are triggered by a *single* parameter
or an *interaction between two*. Pairwise testing generates a small set (often ~30) that covers
every **pair** of values at least once. Tools: PICT, ACTS, `allpairspy`. Enormous saving on
compatibility matrices.

### White-box coverage (know the words, even if devs do the work)

- **Statement coverage** — % of executable statements exercised. 100% statement coverage can
  still miss a branch.
- **Branch / decision coverage** — % of decision outcomes exercised (each `if` taken both true
  and false). Stronger. 100% branch coverage implies 100% statement coverage.
- Coverage is a *measure of what you executed*, not a measure of whether your assertions were
  any good. 100% coverage with no assertions proves nothing.

### Error guessing (experience-based)

Deliberately try what has broken before: empty submissions, double-clicking submit, the back
button mid-flow, pressing Enter in a text field, refreshing after payment, copy-pasting with
whitespace, special characters (`' " < > & % \ /`), very long strings, closing the laptop
mid-transaction, two browser tabs doing the same thing. Keep a personal list; it grows with
your career. Day 8 formalises this into exploratory testing.

---

## Live activity (8 minutes)

**The field on screen: "Password" — must be 8 to 20 characters, contain at least one uppercase
letter, one lowercase letter, one digit and one special character, and must not contain the
username.**

In pairs, 5 minutes:
1. List the **equivalence partitions**.
2. Apply **BVA** to the length rule.
3. Decide how many test cases you need and defend the number.

<details>
<summary>Facilitator answer key</summary>

**Length BVA (3-value):** 7 (reject), 8 (accept), 9 (accept), 19 (accept), 20 (accept),
21 (reject). Also 0 (empty).

**Character-class partitions** — one test per missing class, each otherwise valid:
no uppercase, no lowercase, no digit, no special character, all four present (valid).

**Other partitions:** contains the username (reject); contains only whitespace; leading/trailing
spaces (is a space a "special character"? — **spec question, raise it**); unicode/emoji
(is 😀 a special character? does it count as 1 char or 4 bytes against the 20 limit? — **spec
question**); a 20-character password of multi-byte characters (boundary + encoding).

**Roughly 14–16 cases**, and — the real prize — at least three questions the specification does
not answer. That is the point of the exercise: technique surfaces requirement defects.
</details>

---

## Common mistakes juniors make

- Testing many values from the same partition (25, 30, 45 for an age field) and calling it thorough.
- Forgetting the invalid partitions entirely.
- Combining several invalid inputs in one test, so you can't tell which rule fired.
- Building a decision table and then only testing the rows that "make sense".
- Never testing invalid state transitions because the UI hides the button.
- Treating 100% code coverage as 100% tested.

---

## Homework (about 40 minutes)

1. **Decision table:** build the full table for this shipping rule, then write the test cases.
   > *Free shipping if the order is over ₦25,000. Express shipping costs ₦2,000, or is free for
   > Premium members. Orders to remote areas add ₦1,500 regardless of anything else. Premium
   > members never pay the remote-area surcharge on orders over ₦50,000.*
2. **State transitions:** draw the state diagram and table for a support ticket
   (New → Open → In Progress → Resolved → Closed, with Reopened, and On Hold). Mark the
   invalid transitions and pick the three most worth testing.
3. **EP + BVA:** apply both to a "date of birth" field for a service with an 18+ age limit.
   Do not forget leap years and time zones.

---

## Check your understanding

<details>
<summary>1. A field accepts 18 to 65. Which values does 3-value BVA give you, and why isn't testing 30 and 50 enough?</summary>

3-value BVA gives 17, 18, 19, 64, 65, 66. Testing 30 and 50 exercises the same equivalence
partition twice — both are ordinary members of the valid range and will pass or fail together.
Boundary defects (`<` vs `<=`, off-by-one) only show at the edges, so 30 and 50 cannot detect
the most likely bug in the field.
</details>

<details>
<summary>2. You build a decision table with 4 binary conditions. How many rules, and what if the spec doesn't define one of them?</summary>

2⁴ = 16 rules. If the spec doesn't define the outcome for a rule, that is a **requirements
defect** — raise it with the BA/PO before development guesses. This is one of the most valuable
things a tester does, because a guess in code becomes a production incident with no
specification to appeal to.
</details>

<details>
<summary>3. Why are invalid state transitions the most valuable tests in state transition testing?</summary>

Because valid transitions are what developers implemented and thought about, so they usually
work. Invalid transitions are usually prevented only in the UI (hiding a button), not enforced
in the backend. Anyone hitting the API directly, double-clicking, using two tabs, or replaying
a request can drive the system into a state the developers never considered — refunding twice,
cancelling a shipped order, reusing a consumed token.
</details>

<details>
<summary>4. When would you use pairwise testing?</summary>

When many independent parameters combine into an impractically large matrix — browser × OS ×
device × language × payment method × user role. Most defects are caused by one parameter or an
interaction of two, so covering all *pairs* gets the bulk of the defect-detection value from a
fraction of the combinations. It's the standard tool for compatibility and configuration testing.
</details>

---

## Glossary additions

`equivalence partitioning` · `boundary value analysis` · `decision table` · `rule` ·
`don't care` · `state transition testing` · `0-switch coverage` · `invalid transition` ·
`use case testing` · `pairwise testing` · `statement coverage` · `branch coverage` ·
`error guessing` · `experience-based technique`
