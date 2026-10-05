# Course Glossary

Every term introduced across the 40 sessions, alphabetically. The day it is introduced is in
brackets. If you can define 80% of these without looking, you are ahead of most people applying
for junior QA roles.

---

## A

**Acceptance criteria** *(D4)* — The conditions a story must satisfy to be accepted. Usually
written Given/When/Then.

**Acceptance testing** *(D5)* — Test level confirming fitness for use and readiness to deploy.
Forms: UAT, operational, contractual, regulatory, alpha, beta.

**ACID** *(D14)* — Atomicity, Consistency, Isolation, Durability. The guarantees a relational
transaction provides.

**Ad hoc testing** *(D8)* — Unstructured testing with no charter, timebox or notes. Not the same
as exploratory testing.

**Agile Manifesto** *(D3)* — The 2001 statement of four values and twelve principles underlying
Agile methods.

**allow_failure** *(D38)* — GitLab job setting: a failing job shows as a warning and does not block the pipeline. The mechanism behind quarantine — and dangerous on a real gate.

**Alpha testing** *(D5)* — Acceptance testing by representative users at the *developing
organisation's* site.

**ALTER DEFAULT PRIVILEGES** *(D31)* — Sets the privileges that tables created in future will receive. Forget it and the read-only role cannot see next sprint's new table.

**APDEX** *(D29)* — An index from 0 to 1 in the JMeter dashboard based on how many responses were "satisfying" or "tolerable". A summary; always report percentiles too.

**API** *(D17)* — Application Programming Interface. A contract letting one piece of software
ask another to do something.

**API gateway** *(D12)* — A front door for APIs handling auth, routing and rate limiting.

**API key** *(D18)* — An opaque string identifying a calling application.

**Artifact (CI)** *(D36, D37)* — Files a pipeline job keeps for download or for later jobs — reports, logs, results. Use `when: always` so they survive a failure.

**Assertion** *(D17, D22, D27)* — A check that makes a test pass or fail. In Postman, `pm.expect` inside `pm.test`; in JMeter, an element applied after a sampler.

**Atomicity** *(D14)* — All of a transaction happens, or none of it.

**Authentication (AuthN)** *(D18)* — Establishing *who you are*. Failure = 401.

**Authorization (AuthZ)** *(D18)* — Establishing *what you may do*. Failure = 403.

**Authorization code flow** *(D18)* — The correct OAuth 2.0 flow for web and mobile apps, used
with PKCE.

**Auto-login** *(D23)* — A collection-level pre-request script that logs in whenever the token is missing or about to expire, so any folder can run on its own.

## B

**BASE** *(D14)* — Basically Available, Soft state, Eventual consistency. The trade-off many
distributed NoSQL systems make instead of ACID.

**Baseline test** *(D26, D30)* — A run with one user (or a known load) to establish best-case response times before any load test.

**Basic authentication** *(D18)* — Username and password base64-encoded in the `Authorization`
header. Encoding, not encryption.

**Bearer token** *(D18)* — A token where possession alone grants access.

**before_script** *(D37)* — GitLab commands that run before a job's `script`, in the same shell. Used to start the API before tests.

**Beta testing** *(D5)* — Acceptance testing by real users at *their own* sites.

**Black-box testing** *(D5, D7)* — Testing derived from the specification, without knowledge of
internal structure.

**Blocked** *(D6)* — A test that could not be run. Never the same as Fail.

**Blocker** *(D10)* — Severity where testing cannot continue at all.

**Blue/green deployment** *(D19)* — Two identical environments; traffic switches between them.

**BOLA / IDOR** *(D17, D11)* — Broken Object Level Authorization / Insecure Direct Object
Reference. Accessing another user's resource by changing an ID. The most common serious API
vulnerability.

**Bottleneck** *(D29)* — The resource that saturates first and limits throughput for everything else.

**Boundary value analysis (BVA)** *(D7)* — Testing at the edges of equivalence partitions, where
defects cluster.

**Branch coverage** *(D7)* — Percentage of decision outcomes exercised by tests.

**Build verification test** *(D5)* — See *smoke testing*.

## C

**Cache (CI)** *(D38)* — Files reused between pipelines purely for speed (e.g. downloads). Not guaranteed to exist — never use it to pass results.

**Cache invalidation** *(D12, D14)* — Clearing or refreshing cached data when the underlying data
changes. A rich source of "I updated it but it still shows the old value" bugs.

**Canary release** *(D19)* — Releasing to a small percentage of users first, then widening.

**CAP theorem** *(D14)* — In a distributed system you can have at most two of Consistency,
Availability and Partition tolerance.

**Capacity** *(D26, D29)* — The highest load a system handles while still meeting its NFRs. Not the load at which it breaks.

**CDN** *(D12)* — Content Delivery Network. Serves static content from locations near the user.

**Certificate authority (CA)** *(D12)* — A trusted issuer of TLS certificates.

**Chaining** *(D17)* — Using a value from one API response in a subsequent request.

**Check-then-act** *(D30, D35)* — A race-condition pattern: a decision is based on a value that is stale by the time the write happens. Fixed with a row lock (`FOR UPDATE`) or a single conditional update.

**CI/CD variable** *(D37)* — A value configured in GitLab settings and injected into jobs as an environment variable. The place for secrets.

**Client** *(D11)* — The software that requests something. A role in a conversation, not a type
of machine.

**Cold start** *(D13, D19)* — The slow first request after an idle period, while a container or
function initialises.

**Collection (Postman)** *(D17, D21)* — A set of saved requests with shared scripts, variables and auth. Exported as JSON, kept in Git, reviewed like code.

**Collection Runner** *(D23)* — Postman's runner for a collection or folder, with iterations and data files.

**Component testing** *(D5)* — Unit testing. Testing a single module in isolation.

**Confirmation testing** *(D5)* — See *re-testing*.

**Connection pool** *(D29)* — A fixed set of database connections an application reuses. When all are busy, requests queue. QA Shop's holds 10.

**Connection string** *(D31)* — A URL giving user, password, host, port and database. Contains a secret — never paste it into tickets.

**Constraint** *(D4, D14)* — A limitation you must work within; in databases, a rule the database
itself enforces (`NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY`).

**Continuous delivery / deployment / integration** *(D2)* — CI: frequent automated merge, build
and test. CD (delivery): every passing change is *ready* to release. CD (deployment): every
passing change *is* released.

**Correlation ID / X-Request-Id** *(D13, D16)* — An identifier tracing one request across
services. Put it in every bug report.

**Correlation (load testing)** *(D28)* — Capturing a dynamic value — token, ID — from one response and sending it in later requests. Uncorrelated scripts measure nothing.

**CORS** *(D16)* — Browser policy controlling cross-origin requests. Why something works in
Postman but fails in the browser.

**Coverage** *(D1)* — The degree to which specified items have been exercised by tests.

**CRUD** *(D8)* — Create, Read, Update, Delete. A heuristic for generating test ideas.

**CSV Data Set Config** *(D28)* — JMeter config element that feeds threads rows from a CSV file. Where it sits decides how often it reads.

**CTE (Common Table Expression)** *(D33, D34)* — `WITH name AS (…)` — a named intermediate result that makes multi-step queries readable.

**curl** *(D13)* — Command-line HTTP client. Removes the browser from the equation.

**Cycle time** *(D3)* — Kanban metric: how long a work item takes from start to finish.

## D

**Data masking** *(D6)* — Anonymising personal data before using it in a test environment.
Legally required in most jurisdictions.

**Data-driven testing** *(D23)* — One test run once per row of a data file, each row holding inputs and the expected result.

**Data-quality suite** *(D35)* — A set of SQL checks, each counting rows that violate a rule, that exits non-zero when a critical check fails.

**DBeaver** *(D31)* — Free GUI database client. Colour-code connections green / amber / red by environment.

**DDL / DML** *(D32, D33)* — Data Definition Language changes structure (`CREATE`, `ALTER`); Data Manipulation Language changes data (`INSERT`, `UPDATE`, `DELETE`).

**Debug Sampler** *(D28)* — JMeter sampler that shows every variable's current value — the quickest way to check correlation worked.

**Decision table** *(D7)* — A technique for testing combinations of conditions. Each rule
(column) becomes a test case.

**Defect** *(D1)* — The flaw in the work product caused by an error. Also called a bug or fault.

**Defect density** *(D9)* — Defects per unit of size. Used to find defect clusters.

**Defect removal efficiency** *(D9)* — Defects found before release ÷ (before + after) × 100.

**Definition of Done (DoD)** *(D3)* — Team agreement on what "done" means. Should include tested.

**Definition of Ready (DoR)** *(D3)* — Team agreement on what a story needs before entering a
sprint.

**Denormalisation** *(D14)* — Deliberately duplicating data for read speed. Risk: copies drift
apart.

**Deferred** *(D9)* — Defect state: real, but not being fixed now. A business decision; needs an
owner and a review date.

**DNS** *(D11)* — Domain Name System. Translates hostnames to IP addresses.

**Docker** *(D19)* — The common container tool. Packages an app with everything it needs to run.

**Documentation drift** *(D17)* — API documentation no longer matching the API's actual
behaviour. A defect regardless of which side is "wrong".

**Driver** *(D5)* — A test harness that calls a component being tested bottom-up.

**Dynamic variable (Postman)** *(D21)* — Built-in generated values such as `{{$timestamp}}`, `{{$guid}}`, `{{$randomEmail}}`.

## E

**Entry / exit criteria** *(D4, D6)* — Conditions that must be met to begin or to finish a test
activity.

**Environment parity** *(D19)* — How closely a test environment resembles production. Every
difference is a place a bug can hide.

**Environment (Postman)** *(D17, D21)* — A named set of variables used to point one collection at different targets.

**Ephemeral port** *(D11)* — A high-numbered temporary source port used by a client for an
outgoing connection.

**Equivalence partitioning (EP)** *(D7)* — Dividing inputs into groups treated identically, and
testing one value from each.

**Error** *(D1)* — A human mistake. Distinct from the defect it produces.

**Error guessing** *(D7)* — Experience-based technique: deliberately trying what has broken before.

**Escaped defect** *(D9)* — A defect found in production. The metric that matters most.

**Eventual consistency** *(D14)* — Replicas may briefly disagree after a write but will converge.
Sometimes correct behaviour, not a bug — but the UI must handle the gap.

**Exit code** *(D24)* — 0 means success, anything else means failure. The contract between a test tool and a CI pipeline.

**Exit criteria** — see *entry / exit criteria*.

**EXPLAIN / EXPLAIN ANALYZE** *(D34)* — Shows a query's plan. `ANALYZE` actually runs the query — wrap data-changing statements in a transaction.

**Exploratory testing** *(D8)* — Simultaneous learning, test design and test execution, guided by
a charter and a timebox.

**expose_as** *(D37)* — GitLab artifact option that links a report directly from the merge request page.

**extends** *(D37)* — GitLab keyword that reuses the configuration of another (usually hidden) job.

## F

**Failure** *(D1)* — The observable wrong behaviour when a defect is executed.

**False negative** *(D1)* — A test that passes when the software is actually broken. The dangerous
kind.

**False positive** *(D1)* — A test that reports a failure that isn't real.

**Feature flag** *(D19)* — A switch turning a feature on or off without deploying. Means the
build number alone no longer determines behaviour — record flag state in bug reports.

**Flaky test** *(D25)* — A test that passes and fails on the same code. Almost always state, order or timing. Fix the cause; never retry until green.

**FOR UPDATE** *(D35)* — `SELECT … FOR UPDATE` locks the selected rows until the transaction ends, so a check and its update cannot be interleaved.

**Foreign key** *(D14)* — A column pointing at another table's primary key.

**Functional testing** *(D5)* — Testing *what* the system does.

## G

**generate_series** *(D33, D34)* — PostgreSQL function producing a series of numbers or timestamps as rows. Used for bulk test data and gap detection.

**Git** *(D36)* — Version control: a history of every change. Commit, branch, push, merge request.

**GitLab CI** *(D36)* — GitLab's pipeline system, configured by `.gitlab-ci.yml` at the repository root.

**Given/When/Then** *(D4)* — Format for acceptance criteria: starting context, action, expected
outcome.

**GraphQL** *(D17)* — API style where the client specifies exactly what data it wants. Returns
HTTP 200 even for errors — assert on the body.

**Grey-box testing** *(D5)* — Testing through the interface while also inspecting logs, network
and data. Where most practical QA work happens.

## H

**HAR file** *(D13)* — An archive of all browser network activity. Contains tokens and personal
data — scrub before sharing.

**Health endpoint** *(D19)* — An endpoint reporting service status and deployed version.

**Heuristic** *(D8)* — A fallible rule of thumb that helps generate test ideas.

**Hidden job** *(D37)* — A GitLab job whose name starts with a dot. Never runs; exists only to be reused with `extends`.

**HMAC signing** *(D18)* — Signing a request with a shared secret to prove integrity. Used for
payments and webhooks.

**Host** *(D11)* — Any device on a network with an IP address.

**Hosts file** *(D11)* — A local file overriding DNS. Useful for testing; a classic cause of
"only broken on my machine".

**htmlextra** *(D24)* — Newman reporter producing one self-contained HTML page with every request, response and assertion.

**HTTP** *(D16)* — The stateless request/response protocol of the web.

**HttpOnly** *(D16)* — Cookie flag preventing JavaScript access. Without it, an XSS bug becomes
account takeover.

**Hybrid** *(D19)* — Some workloads on-premises, some in the cloud. The hardest architecture to
test.

## I

**Idempotent** *(D16)* — Repeating the request has the same effect as making it once. GET, PUT,
DELETE are; POST is not.

**Idempotency key** *(D16)* — A client-generated value letting the server collapse duplicate
requests. The correct fix for double-charging.

**Identity column** *(D32)* — An auto-generated key column. Values are unique but not gap-free: failed inserts consume them.

**If Controller** *(D28)* — JMeter logic controller that runs its children only when a condition (use `__jexl3`) is true.

**Ignore Status** *(D27, D28)* — Response Assertion option. Without it JMeter marks every 4xx/5xx as a failure, including expected ones like 409.

**Impact analysis** *(D5)* — Determining what a change could affect, to decide how much
regression testing is needed.

**Incremental development** *(D2)* — Building the product piece by piece, each piece complete.

**Index** *(D14)* — A database lookup structure making searches fast. A missing one is the most
common reason a feature is fast in QA and slow in production.

**Inspection** *(D4)* — The most formal review type, with a trained moderator and logged metrics.

**Integration testing** *(D5)* — Testing the interaction between components (component
integration) or between systems (system integration).

**INVEST** *(D4)* — Independent, Negotiable, Valuable, Estimable, Small, **Testable**. A checklist
for user stories.

**IP address** *(D11)* — The numeric address of a host. Private ranges (10.x, 172.16–31.x,
192.168.x) are not reachable from the internet.

**Iron triangle** *(D4)* — Scope, time, cost — with quality in the middle. Fix all three and
quality is the only variable left.

**Iteration data** *(D23)* — The current row of a data file during a data-driven run: `pm.iterationData.get("column")`.

**Iterative development** *(D2)* — Building a rough whole and refining it in cycles.

## J

**JMeter** *(D26–D30)* — Apache's open-source load-testing tool. Plans are `.jmx` files; real runs are non-GUI.

**JMeter property** *(D27, D29)* — A value set with `-Jname=value` and read with `${__P(name,default)}`. Lets one plan serve every load profile.

**JOIN** *(D15)* — SQL operation combining rows from multiple tables. `LEFT JOIN … IS NULL` finds
missing and orphaned records.

**jq** *(D17)* — Command-line JSON processor. Worth 15 minutes to learn.

**JSON Extractor** *(D28)* — JMeter post-processor that saves a value from a JSON response into a variable. Always set a default.

**JSON Schema** *(D22)* — A description of a JSON document's shape — required fields, types, allowed values. `additionalProperties: false` catches leaked fields.

**JTL file** *(D29)* — JMeter's results file, one row per sample. JMeter appends to an existing one — delete it between runs.

**JUnit XML** *(D24, D37)* — The standard machine-readable test-result format. GitLab parses it into the Tests tab and MR widget.

**JWT** *(D18)* — JSON Web Token. Three base64url parts: header, payload, signature. **The
payload is readable by anyone holding the token.**

## K

**Kanban** *(D3)* — Continuous-flow method using WIP limits rather than fixed sprints.

**Key-value store** *(D14)* — Database type storing a key and a value. Redis, Memcached. Used for
sessions, caches, rate limiting.

**Knee** *(D29)* — The point on the capacity curve where response times climb sharply and throughput stops rising.

**Known issue** *(D9)* — A defect shipping with a release, documented in the release notes.

**Kubernetes** *(D19)* — Orchestrates containers across many machines.

## L

**Latency (load testing)** *(D26)* — Time from just before sending a request to receiving the first byte of the response.

**Listener** *(D27)* — JMeter element that collects or displays results. Disable heavy ones (View Results Tree) for load runs.

**Little's Law** *(D26)* — Concurrent users = throughput × (response time + think time). Used to size and sanity-check load tests.

**Load balancer** *(D12)* — Distributes traffic across identical servers. A common explanation
for "it only fails sometimes".

**Load test** *(D26)* — Runs the expected peak load to check the NFRs are met.

**localhost** *(D11)* — This machine. Always 127.0.0.1. "Works on localhost" proves very little.

## M

**Maintenance testing** *(D5)* — Testing changes to a system already in production, including
migration and retirement.

**Many-to-many** *(D14)* — A relationship needing a junction table.

**Masked variable** *(D37)* — A CI/CD variable whose value is replaced with `[MASKED]` in job logs. Does not protect artifacts or transformed values.

**Merge request (MR)** *(D36, D37)* — A request to merge a branch into `main`, where the change is reviewed and the pipeline runs. GitHub calls it a pull request.

**Migration** *(D32)* — A versioned script that changes a database schema. Test it on realistic data, and test its rollback.

**Mock** *(D5)* — A test double that simulates a dependency and can assert on how it was called.

**MoSCoW** *(D4)* — Must / Should / Could / Won't. A prioritisation scheme.

**mTLS** *(D18)* — Mutual TLS. Both sides present certificates. Common in banking and
service-to-service traffic.

## N

**NAT** *(D11)* — Network Address Translation. Lets many private addresses share one public one.

**needs** *(D38)* — GitLab keyword letting a job start as soon as named jobs finish, instead of waiting for whole earlier stages.

**Newman** *(D17)* — Postman's command-line runner. Lets your collection run in CI.

**Non-functional requirement (NFR)** *(D4)* — *How well* the system does something: performance,
security, usability, compatibility, accessibility. The ones nobody writes down.

**Non-GUI mode** *(D29)* — Running JMeter from the command line (`-n`). The only correct way to run a real load test.

**Normalisation** *(D14)* — Organising data to eliminate duplication.

**NoSQL** *(D14)* — Umbrella term for document, key-value, column-family and graph databases.

**NOT VALID** *(D32)* — Adds a CHECK or foreign-key constraint for new rows without checking existing ones. `VALIDATE CONSTRAINT` later.

**NULL** *(D15)* — SQL's "unknown". Not equal to anything, including itself. Use `IS NULL`, never
`= NULL`.

## O

**OAuth 2.0** *(D18)* — Delegated authorization. Lets an app act on your behalf without your
password.

**OIDC (OpenID Connect)** *(D18)* — Authentication layer on top of OAuth 2.0, adding an ID token.
OAuth = authorization; OIDC = authentication.

**ON CONFLICT (upsert)** *(D33)* — Insert, or update/ignore if the row already exists. Makes seed scripts idempotent.

**Once Only Controller** *(D28)* — JMeter controller whose children run only on each thread's first iteration — e.g. login.

**On-premises** *(D19)* — The organisation owns and runs the hardware.

**OpenAPI / Swagger** *(D17)* — A machine-readable API contract. Your test basis for API testing.

**Orphaned record** *(D15)* — A row referencing a parent that no longer exists. A data integrity
defect.

**OSI model** *(D12)* — Seven-layer network model. Useful as a diagnostic ladder: check from the
bottom up.

## P

**Pairwise testing** *(D7)* — Covering every pair of parameter values in a small set of
combinations. For compatibility matrices.

**Parameterisation** *(D28)* — Feeding different data to each virtual user, so the test exercises many customers rather than one.

**Parameterised query** *(D15)* — Sending input separately from SQL so it can never be
interpreted as code. The actual fix for SQL injection.

**PATCH / PUT** *(D16)* — PATCH updates part of a resource; PUT replaces it entirely. Sending a
partial PUT can silently wipe fields.

**Percent-encoding** *(D11)* — Escaping special characters in URLs (`%20` for space).

**Percentile (p95)** *(D26)* — The value below which that percentage of responses fall. Performance NFRs are written as percentiles because averages hide outliers.

**Pesticide paradox** *(D1, D8)* — Repeated identical tests stop finding new defects.

**pg_dump / pg_restore** *(D33)* — PostgreSQL tools to snapshot a database to a file and restore it.

**pg_trgm / trigram index** *(D34)* — PostgreSQL extension that indexes three-letter fragments, so `ILIKE '%term%'` can use an index.

**Pipeline** *(D36)* — One run of the jobs defined in `.gitlab-ci.yml`, triggered by a push, MR, schedule or by hand.

**Pipeline schedule** *(D39)* — A pipeline triggered on a cron timetable — e.g. a nightly load test.

**PKCE** *(D18)* — Proof Key for Code Exchange. Secures the OAuth authorization code flow for
public clients.

**pm.sendRequest** *(D23)* — Sends an HTTP request from inside a Postman script — used to arrange a test's preconditions.

**pm.test** *(D22)* — Defines one named Postman test; it fails if any assertion inside throws.

**Port** *(D11)* — A numbered door on a host identifying which program traffic is for.
0–1023 well-known, 1024–49151 registered, 49152+ ephemeral.

**Postcondition** *(D6)* — The state the system is left in after a test. Tells the next tester how
to clean up.

**Post-response / pre-request script** *(D22)* — Postman JavaScript that runs after / before a request. Pre-request arranges; post-response asserts and stores.

**Practice system** *(D21)* — A system you own and may break — QA Shop. Never load- or security-test a system without permission.

**Precondition** *(D6)* — The state required before a test's first step. Must be verifiable.

**Primary key** *(D14)* — Uniquely identifies a row. Never null, never duplicated.

**Priority** *(D10)* — How soon a defect must be fixed. A **business** decision.

**Product risk** *(D4)* — The possibility the system fails to meet needs. Testers own its analysis.

**Project risk** *(D4)* — The possibility the project fails to deliver. Flag those affecting testing.

**Protected variable** *(D37)* — A CI/CD variable only available on protected branches. Empty on MR branches — a common cause of mysterious failures.

**psql** *(D31)* — PostgreSQL's command-line client. Backslash meta-commands such as `\dt`, `\d`, `\conninfo`.

## Q

**Quality assurance (QA)** *(D1)* — Process-focused, preventive. Distinct from QC.

**Quality control (QC)** *(D1)* — Product-focused, corrective. Testing sits inside QC.

**Quality gate** *(D37, D38)* — A check the pipeline enforces before a change may merge. A gate that cannot fail is decoration.

**Quarantine** *(D24, D38)* — Running tests for known, reported defects separately so they stay visible without blocking. Each needs a linked bug and an exit plan.

**Query plan** *(D34)* — How the database will execute a query — scans, joins, sorts. Read bottom up.

## R

**RAID log** *(D4)* — Risks, Assumptions, Issues, Dependencies. A risk *might* happen; an issue
already has.

**Race condition** *(D8)* — A defect where the outcome depends on the timing of concurrent
operations. Found with the "two of everything" heuristic.

**Ramp-up** *(D27)* — The time JMeter takes to start all threads. Zero ramp-up is a spike test.

**RCRCRC** *(D8)* — Recent, Core, Risky, Configuration-sensitive, Repaired, Chronic. Regression
prioritisation heuristic.

**Read-only role** *(D31)* — A database role granted only CONNECT, USAGE and SELECT. Test that it cannot write.

**Referential integrity** *(D14)* — The database refusing rows that reference non-existent parents.

**Refinement (grooming)** *(D3)* — The ceremony where upcoming stories are clarified. A tester's
highest-leverage hour of the week.

**Regression** *(D10)* — A defect where something that used to work no longer does.

**Regression testing** *(D5)* — Re-running tests on previously working areas to detect breakage
from a change. Broad.

**Reopen rate** *(D9)* — Percentage of fixed defects that fail re-test. A high rate means fixes
aren't being verified.

**Replay attack** *(D18)* — Resending a previously valid request. Prevented by timestamps and
nonces.

**Re-testing (confirmation testing)** *(D5)* — Running the exact failed test on a new build to
confirm a specific fix. Narrow.

**RETURNING** *(D33)* — Returns columns from rows just inserted, updated or deleted. Never guess generated IDs.

**Reverse proxy** *(D12)* — Front door handling TLS, routing and rate limits. Source of 502 and
504 responses.

**Risk-based testing** *(D4)* — Allocating test effort by probability × impact.

**Role (database)** *(D31)* — A user (if it can log in) or group, defined server-wide, holding privileges.

**Root cause** *(D1)* — The underlying reason an error happened. Usually a process problem.

**rules (GitLab)** *(D38)* — Conditions deciding whether and how a job runs: `if`, `changes`, `when: manual / never`.

**Runner** *(D36)* — The machine that executes CI jobs. GitLab.com's shared runners need identity verification.

## S

**Safe method** *(D16)* — An HTTP method that does not change server state: GET, HEAD, OPTIONS.
A state-changing GET is a real defect.

**SameSite** *(D16)* — Cookie flag controlling cross-site sending. Protects against CSRF.

**Sampler** *(D27)* — The JMeter element that sends a request and records a sample — e.g. HTTP Request.

**Sanity testing** *(D5)* — Narrow and deep check on one area after a small change. Contrast with
smoke: wide and shallow.

**Saturation** *(D29)* — A resource is fully used; extra work queues, so response times climb while throughput stays flat.

**Savepoint** *(D33)* — A bookmark inside a transaction you can roll back to without losing earlier work.

**Schema** *(D14)* — The structure of a database: tables, columns, types, rules. Reviewing one is
static testing.

**Scope creep** *(D4)* — Uncontrolled growth of scope. Eats test time first.

**Scope (JMeter)** *(D27)* — An element applies to every sampler at its own level and below. Timers at thread-group level run before every sampler.

**Scrum** *(D3)* — Agile framework with fixed sprints, three roles, and five events.

**Seed script** *(D33)* — Creates the baseline data tests rely on. Should be deterministic, ordered and idempotent.

**Sequential scan** *(D34)* — Reading every row of a table. Fine on small tables; a scalability problem on large, busy ones.

**Serverless / FaaS** *(D19)* — Running functions on demand without managing servers. Test cold
starts, timeouts and concurrency limits.

**Service (CI)** *(D36)* — A container started alongside a CI job — e.g. PostgreSQL — reachable by its alias.

**Session-based test management (SBTM)** *(D8)* — Managing exploratory testing through charters,
timeboxes and debriefs.

**Session fixation** *(D16)* — An attack where the session ID isn't rotated at login. Test that
it is.

**Severity** *(D10)* — How bad the technical impact is. A **tester's** judgement.

**SFDIPOT** *(D8)* — Structure, Function, Data, Interfaces, Platform, Operations, Time. Product
element heuristic.

**Shared responsibility model** *(D19)* — The provider secures *of* the cloud; the customer
secures *in* the cloud. Most cloud breaches are customer misconfiguration.

**Shift left** *(D2)* — Moving test activities earlier in the lifecycle.

**Shift right** *(D2)* — Testing activities after release: monitoring, canaries, real user data.

**Smoke testing** *(D5)* — Shallow, wide tests on a new build to decide whether it is stable
enough to test further. Binary outcome.

**Soak test** *(D26)* — Moderate load for hours to find degradation over time: leaks, growing queues.

**Soft delete** *(D14)* — Marking a record deleted rather than removing it. Test whether it still
appears in search, reports, exports and the API.

**SOAP** *(D17)* — XML-based API protocol with a WSDL contract. Errors return HTTP 200 with a
`<soap:Fault>` — status code alone tells you nothing.

**Spike test** *(D26, D30)* — A sudden surge of load and back. The key finding is often recovery.

**SQL injection** *(D15)* — Attack where input is interpreted as SQL. Test with a lone
apostrophe; never with destructive payloads.

**Stage / job (CI)** *(D36)* — Jobs run shell commands in fresh containers; stages group jobs and run in order.

**State transition testing** *(D7)* — Technique for systems with states. **The invalid
transitions are where the bugs are**, and they're usually only reachable via the API.

**Statement coverage** *(D7)* — Percentage of executable statements exercised.

**Static testing** *(D1, D4)* — Examining a work product without executing it. The cheapest defect
detection available.

**Stress test** *(D26)* — Load beyond the expected peak to find the breaking point and the failure mode.

**Stub** *(D5)* — A test double standing in for a component that isn't ready.

**Synthetic data** *(D33)* — Generated test data with realistic shape and no personal data. Preferable to copying production.

**System testing** *(D5)* — Testing the whole integrated system end to end.

## T

**Test basis** *(D6)* — The source from which tests are derived.

**Test case** *(D6)* — Preconditions, inputs, actions, expected results, postconditions.

**Test charter** *(D8)* — A one-sentence mission for an exploratory session.

**Test condition** *(D6)* — A testable aspect of the component or system.

**Test level** *(D5)* — Component, integration, system, acceptance.

**Test pyramid** *(D5)* — Many fast unit tests, fewer integration tests, few UI tests. Inverted
("ice-cream cone") is an anti-pattern.

**Test suite** *(D6)* — A named collection of test cases run together.

**Testable** *(D4)* — A requirement is testable if you can write an unambiguous pass/fail check
in advance. Untestable requirements are your veto.

**Think time** *(D26, D28)* — The pause a real user takes between actions. Zero think time turns a load test into a much heavier one.

**Thread Group** *(D27)* — A JMeter group of virtual users: how many, how fast they start, how long they run.

**Three-valued logic** *(D15)* — SQL evaluates conditions as true, false or unknown. The source
of the NULL trap.

**Throughput** *(D26)* — Requests or transactions completed per second. Its plateau is the system's capacity.

**Throughput Controller** *(D28)* — JMeter controller that runs its children for a percentage of executions — e.g. 30% of shoppers buy.

**Timebox** *(D8)* — A fixed duration for an activity.

**Timer** *(D27, D28)* — JMeter element that pauses before a sampler; models think time.

**TLS** *(D12)* — Encrypts traffic, authenticates the server, guarantees integrity. Successor to
SSL.

**Traceability (RTM)** *(D4)* — Mapping requirements to test cases to results to defects. Shows
what nobody tested.

**Transaction** *(D14, D15)* — A group of operations that succeed or fail together. `BEGIN` …
`COMMIT` / `ROLLBACK`.

**Transaction Controller** *(D28)* — Groups samplers into one measured business transaction, e.g. "Checkout".

**Triage** *(D9)* — The meeting deciding validity, severity, priority and assignment of new
defects.

**TTFB** *(D13)* — Time To First Byte. A high value points at server-side slowness, not bandwidth.

**TTL** *(D11, D14)* — Time To Live. How long a DNS answer or a cached value stays valid.

## U

**UAT** *(D5)* — User Acceptance Testing. Real business users confirming it works the way they
work.

**URL** *(D11)* — scheme://host:port/path?query#fragment. The fragment never reaches the server.

**Use case testing** *(D7)* — Deriving tests from the main success scenario plus alternative and
exception flows.

**User enumeration** *(D18)* — Revealing which accounts exist, e.g. via "no account with that
email". Use a generic message.

**User story** *(D3, D4)* — As a &lt;role&gt;, I want &lt;goal&gt;, so that &lt;benefit&gt;. The
"so that" tells you the intent.

## V

**View** *(D34)* — A saved query that behaves like a table and is always current.

**Virtual user** *(D26)* — One simulated user (a JMeter thread) running a script in a loop.

**V-model** *(D2)* — Waterfall folded in half. Every development activity has a matching test
activity **designed at the same time**.

**Validation** *(D1)* — Did we build the right thing?

**Velocity** *(D3)* — Story points completed per sprint. A planning aid, never a target.

**Verification** *(D1)* — Did we build the thing right?

**Volume test** *(D26)* — Normal load against very large data.

## W

**WAF** *(D12)* — Web Application Firewall. Blocks malicious-looking requests — including
legitimate ones like the surname `O'Brien`.

**Walkthrough** *(D4)* — An informal review led by the author.

**Waterfall** *(D2)* — Sequential lifecycle where each phase completes before the next begins.

**Webhook** *(D18)* — An HTTP callback from another system. Verify the signature, or anyone can
tell your system a payment succeeded.

**White-box testing** *(D5, D7)* — Testing derived from internal structure.

**Whole-team approach** *(D3)* — Quality owned by the whole team, not delegated to a tester at
the end.

**Window function** *(D34)* — `function() OVER (PARTITION BY … ORDER BY …)` — computes across related rows without collapsing them: ROW_NUMBER, RANK, LAG, running SUM.

**WIP limit** *(D3)* — Kanban cap on work in progress. Makes the bottleneck visible instead of
making it the tester's problem.

**Workaround** *(D10)* — What users or support can do until a defect is fixed. "None" is an
important answer.

**Workload model** *(D26)* — Which journeys, in what mix, at what pace. Without one, a load test is a random number generator.

**Workspace (Postman)** *(D21)* — Top-level container for a team's collections and environments.
