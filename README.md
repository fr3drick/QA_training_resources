# QA Internship Training — 4 Week Programme

A 20-session (4 week × 5 weekday) training course for QA interns. Each session is designed
to fill **one hour of contact time**, plus 20–40 minutes of homework.

The course is loosely aligned to the **ISTQB Certified Tester Foundation Level (CTFL) v4.0**
syllabus, but goes beyond it into the practical, technical skills a working QA engineer needs:
bug reporting, databases, networking, HTTP and API testing.

---

## How to use this material

**For the instructor**

- Each day is a single markdown file. Share the file with interns *after* the session, or at
  the start if you want them to follow along.
- Every file has the same shape:
  1. **At a glance** — objectives, ISTQB mapping, prerequisites
  2. **Session plan** — a minute-by-minute timebox for the hour
  3. **Content** — the teaching material, with examples
  4. **Live activity** — something the interns do in the room
  5. **Common mistakes** — what juniors get wrong, so you can pre-empt it
  6. **Homework**
  7. **Check your understanding** — quiz with hidden answers
  8. **Glossary additions**
- The timeboxes assume you talk for roughly half the hour and the interns work for the rest.
  If you only have interns for 45 minutes, drop the "Going further" sections.

**For the intern**

- Read the file before the session if you can. Do the homework — the next day builds on it.
- Keep your own running glossary. The single fastest way to look senior is to use the right
  word for the right thing.
- Answers to quizzes are hidden behind a toggle. Try first, then expand.

---

## Curriculum map

### [Week 1 — Foundations](week-01-foundations/)
*What testing is, where it fits, and what a tester is actually responsible for.*

| Day | Topic | File |
|-----|-------|------|
| 1 | What Is Testing? Quality, Errors, Defects and Failures | [day-01-what-is-testing.md](week-01-foundations/day-01-what-is-testing.md) |
| 2 | The Software Development Lifecycle | [day-02-sdlc.md](week-01-foundations/day-02-sdlc.md) |
| 3 | Agile vs Waterfall, and QA's Place in a Team | [day-03-agile-vs-waterfall.md](week-01-foundations/day-03-agile-vs-waterfall.md) |
| 4 | Requirements, User Stories and Project Management | [day-04-requirements-and-project-management.md](week-01-foundations/day-04-requirements-and-project-management.md) |
| 5 | Test Levels and Test Types (incl. Smoke Testing) | [day-05-test-levels-and-types.md](week-01-foundations/day-05-test-levels-and-types.md) |

### [Week 2 — Testing in Practice](week-02-testing-in-practice/)
*Designing tests, running them, and reporting what you find.*

| Day | Topic | File |
|-----|-------|------|
| 6 | Manual Testing: Writing and Running Test Cases | [day-06-manual-testing.md](week-02-testing-in-practice/day-06-manual-testing.md) |
| 7 | Test Design Techniques That Cut Your Workload | [day-07-test-design-techniques.md](week-02-testing-in-practice/day-07-test-design-techniques.md) |
| 8 | Exploratory Testing | [day-08-exploratory-testing.md](week-02-testing-in-practice/day-08-exploratory-testing.md) |
| 9 | The Bug Lifecycle | [day-09-bug-lifecycle.md](week-02-testing-in-practice/day-09-bug-lifecycle.md) |
| 10 | Logging a Bug: Every Field, With Examples | [day-10-logging-bugs.md](week-02-testing-in-practice/day-10-logging-bugs.md) |

### [Week 3 — Under the Hood](week-03-under-the-hood/)
*The technology your application actually runs on.*

| Day | Topic | File |
|-----|-------|------|
| 11 | Client, Server, Host, IP, Port, Protocol, DNS | [day-11-core-technical-terms.md](week-03-under-the-hood/day-11-core-technical-terms.md) |
| 12 | Networking Essentials, Ports and Protocols | [day-12-networking-essentials.md](week-03-under-the-hood/day-12-networking-essentials.md) |
| 13 | Network Troubleshooting for QA | [day-13-network-troubleshooting.md](week-03-under-the-hood/day-13-network-troubleshooting.md) |
| 14 | Databases and Types of Databases | [day-14-databases.md](week-03-under-the-hood/day-14-databases.md) |
| 15 | SQL for Testers and Data Validation | [day-15-sql-for-testers.md](week-03-under-the-hood/day-15-sql-for-testers.md) |

### [Week 4 — APIs and Infrastructure](week-04-apis-and-infrastructure/)
*Testing below the user interface, and understanding where software lives.*

| Day | Topic | File |
|-----|-------|------|
| 16 | HTTP: Methods, Status Codes and Headers | [day-16-http-deep-dive.md](week-04-apis-and-infrastructure/day-16-http-deep-dive.md) |
| 17 | API Testing Fundamentals | [day-17-api-testing.md](week-04-apis-and-infrastructure/day-17-api-testing.md) |
| 18 | API Authentication and Authorization | [day-18-api-authentication.md](week-04-apis-and-infrastructure/day-18-api-authentication.md) |
| 19 | On-Prem vs Cloud vs Hybrid, and Test Environments | [day-19-cloud-onprem-hybrid.md](week-04-apis-and-infrastructure/day-19-cloud-onprem-hybrid.md) |
| 20 | Capstone: A Full Test Cycle, and What Comes Next | [day-20-capstone.md](week-04-apis-and-infrastructure/day-20-capstone.md) |

---

## Supporting material

- [GLOSSARY.md](GLOSSARY.md) — every term introduced in the course, in one place
- [templates/bug-report-template.md](templates/bug-report-template.md)
- [templates/test-case-template.md](templates/test-case-template.md)
- [templates/exploratory-charter-template.md](templates/exploratory-charter-template.md)
- [templates/test-plan-lite-template.md](templates/test-plan-lite-template.md)

---

## Tools the interns will need

Nothing here requires a paid licence.

| Purpose | Tool | Notes |
|---------|------|-------|
| Browser + DevTools | Chrome or Firefox | Used from Week 3 onward |
| API client | Postman, Insomnia, Bruno, or `curl` | Week 4 |
| Database client | DBeaver, TablePlus, or `psql` / `mysql` CLI | Week 3 |
| Practice API | `https://reqres.in`, `https://jsonplaceholder.typicode.com`, `https://httpbin.org` | Free, public |
| Practice app to test | Any deliberately buggy demo app — e.g. OWASP Juice Shop, SauceDemo | Week 2 and 20 |
| Bug tracker | Jira, Azure DevOps, GitHub Issues, or a shared spreadsheet | A spreadsheet is fine for training |

---

## A note on the ISTQB exam

This course covers most of the CTFL v4.0 syllabus but is **not** an exam cram. Chapters
covered heavily: 1 (Fundamentals), 2 (Testing Throughout the SDLC), 4 (Test Analysis and
Design), 5 (Managing Test Activities). Covered lightly: 3 (Static Testing), 6 (Test Tools).
If an intern intends to sit the exam, Day 20 points them at what to revise on their own.
