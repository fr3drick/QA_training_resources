# QA Internship Training — 8 Week Programme

A 40-session (8 week × 5 weekday) training course for QA interns. Each session is designed
to fill **one hour of contact time**, plus 20–40 minutes of homework.

The course is loosely aligned to the **ISTQB Certified Tester Foundation Level (CTFL) v4.0**
syllabus, but goes beyond it into the practical, technical skills a working QA engineer needs:
bug reporting, databases, networking, HTTP and API testing.

- **Weeks 1–4** build the foundations: what to test, how to design tests and report defects, and
  the technology underneath — networks, databases, HTTP and APIs.
- **Weeks 5–8** are hands-on: API automation with Postman and Newman, performance testing with
  JMeter, database setup and SQL, and a GitLab CI pipeline that runs all of it on every change. All
  four weeks test one deliberately imperfect practice system, [QA Shop](labs/qa-shop/), which runs
  on the intern's own machine.

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
- **Weeks 5–8 are lab sessions.** The *Live activity* becomes a longer **Lab**, and you talk for
  15–20 minutes at most. If you can get 90 minutes for these weeks, give the extra time to the lab.
- Before Week 5, read [`labs/qa-shop/INSTRUCTOR_NOTES.md`](labs/qa-shop/INSTRUCTOR_NOTES.md):
  machine prerequisites (Docker), the list of planted defects, and expected results. Don't share
  it with interns.

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

### [Week 5 — API Automation with Postman and Newman](week-05-api-automation-postman-newman/)
*From sending requests to an automated, data-driven regression suite that runs from one command.*

| Day | Topic | File |
|-----|-------|------|
| 21 | Lab Setup, the Practice System, and Organising Postman Properly | [day-21-lab-setup-and-postman-workspaces.md](week-05-api-automation-postman-newman/day-21-lab-setup-and-postman-workspaces.md) |
| 22 | Assertions, Scripts and Schema Validation | [day-22-assertions-and-scripts.md](week-05-api-automation-postman-newman/day-22-assertions-and-scripts.md) |
| 23 | Chaining, Workflows, Multiple Users and Data-Driven Tests | [day-23-chaining-workflows-and-data-driven-tests.md](week-05-api-automation-postman-newman/day-23-chaining-workflows-and-data-driven-tests.md) |
| 24 | Newman: Running Collections From the Command Line | [day-24-newman-command-line-runs.md](week-05-api-automation-postman-newman/day-24-newman-command-line-runs.md) |
| 25 | Building a Maintainable API Regression Suite (Week 5 Project) | [day-25-maintainable-regression-suite-project.md](week-05-api-automation-postman-newman/day-25-maintainable-regression-suite-project.md) |

### [Week 6 — Performance Testing with JMeter](week-06-performance-testing-jmeter/)
*How the system behaves when everyone uses it at once — and the defects that only appear then.*

| Day | Topic | File |
|-----|-------|------|
| 26 | Performance Testing Fundamentals | [day-26-performance-testing-fundamentals.md](week-06-performance-testing-jmeter/day-26-performance-testing-fundamentals.md) |
| 27 | JMeter Building Blocks: Test Plans, Elements and Scope | [day-27-jmeter-building-blocks.md](week-06-performance-testing-jmeter/day-27-jmeter-building-blocks.md) |
| 28 | Realistic Load Scripts: Data, Correlation and Logic | [day-28-realistic-load-scripts.md](week-06-performance-testing-jmeter/day-28-realistic-load-scripts.md) |
| 29 | Running Load Tests Properly and Reading the Results | [day-29-running-and-analysing-load-tests.md](week-06-performance-testing-jmeter/day-29-running-and-analysing-load-tests.md) |
| 30 | Performance Test Project: Load, Stress, Spike, and the Race Condition | [day-30-performance-test-project.md](week-06-performance-testing-jmeter/day-30-performance-test-project.md) |

### [Week 7 — SQL Practice and Database Setup](week-07-sql-and-database-setup/)
*Standing up databases, designing them, creating test data, and proving data defects with SQL.*

| Day | Topic | File |
|-----|-------|------|
| 31 | Setting Up a Database: Servers, Clients, Roles and Connections | [day-31-database-setup.md](week-07-sql-and-database-setup/day-31-database-setup.md) |
| 32 | Designing Tables: Data Types, Constraints and Schema Review | [day-32-designing-tables-and-constraints.md](week-07-sql-and-database-setup/day-32-designing-tables-and-constraints.md) |
| 33 | Test Data with SQL: Create, Change, Seed, Reset, Snapshot | [day-33-test-data-management.md](week-07-sql-and-database-setup/day-33-test-data-management.md) |
| 34 | Advanced Queries, and Why Some Queries Are Slow | [day-34-advanced-queries-and-query-performance.md](week-07-sql-and-database-setup/day-34-advanced-queries-and-query-performance.md) |
| 35 | Database Testing Project: Verify, Audit, and Reproduce the Race by Hand | [day-35-database-testing-project.md](week-07-sql-and-database-setup/day-35-database-testing-project.md) |

### [Week 8 — CI Pipelines with GitLab](week-08-ci-pipelines-gitlab/)
*Everything from Weeks 5–7, running automatically on every change, as a quality gate.*

| Day | Topic | File |
|-----|-------|------|
| 36 | CI/CD, Git for Testers, and Your First GitLab Pipeline | [day-36-ci-cd-and-first-gitlab-pipeline.md](week-08-ci-pipelines-gitlab/day-36-ci-cd-and-first-gitlab-pipeline.md) |
| 37 | API Tests in the Pipeline: Newman, Reports, Secrets and Merge Requests | [day-37-api-tests-in-the-pipeline.md](week-08-ci-pipelines-gitlab/day-37-api-tests-in-the-pipeline.md) |
| 38 | Quality Gates: Quarantine, Data Checks, Pipeline Flow and Debugging | [day-38-quality-gates-data-checks-and-debugging.md](week-08-ci-pipelines-gitlab/day-38-quality-gates-data-checks-and-debugging.md) |
| 39 | Performance Tests in the Pipeline: Schedules, Thresholds and Noise | [day-39-performance-tests-in-the-pipeline.md](week-08-ci-pipelines-gitlab/day-39-performance-tests-in-the-pipeline.md) |
| 40 | Capstone: The Full Quality Pipeline, and a Defect From Report to Regression Test | [day-40-capstone-the-full-quality-pipeline.md](week-08-ci-pipelines-gitlab/day-40-capstone-the-full-quality-pipeline.md) |

---

## Supporting material

- [GLOSSARY.md](GLOSSARY.md) — every term introduced in the course, in one place
- [labs/qa-shop/](labs/qa-shop/) — the QA Shop practice system for Weeks 5–8: setup, the API
  specification (the test basis), and the instructor's reference Postman collection, JMeter plan,
  SQL data-quality suite and GitLab CI pipeline in `reference/`
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
| Containers | Docker Desktop (Windows needs WSL 2) or Docker Engine | Weeks 5–8: runs QA Shop and PostgreSQL |
| Runtime | Node.js 20+ | Week 5: Newman (`npm install -g newman newman-reporter-htmlextra`) |
| Load testing | Apache JMeter 5.6+ with Java 17+ | Week 6 |
| Version control and CI | Git, and a free GitLab.com account with identity verification done | Week 8 |

---

## A note on the ISTQB exam

This course covers most of the CTFL v4.0 syllabus but is **not** an exam cram. Chapters
covered heavily: 1 (Fundamentals), 2 (Testing Throughout the SDLC), 4 (Test Analysis and
Design), 5 (Managing Test Activities). Covered lightly: 3 (Static Testing), 6 (Test Tools).
If an intern intends to sit the exam, Day 20 points them at what to revise on their own.
Weeks 5–8 take chapter 6 (tools) and the non-functional and DevOps parts of chapter 2 well
beyond Foundation level; Day 40 suggests the ISTQB specialist certificates that follow on.
