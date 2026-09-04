# Course Glossary

Every term introduced across the 20 sessions, alphabetically. The day it is introduced is in
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

**Alpha testing** *(D5)* — Acceptance testing by representative users at the *developing
organisation's* site.

**API** *(D17)* — Application Programming Interface. A contract letting one piece of software
ask another to do something.

**API gateway** *(D12)* — A front door for APIs handling auth, routing and rate limiting.

**API key** *(D18)* — An opaque string identifying a calling application.

**Atomicity** *(D14)* — All of a transaction happens, or none of it.

**Authentication (AuthN)** *(D18)* — Establishing *who you are*. Failure = 401.

**Authorization (AuthZ)** *(D18)* — Establishing *what you may do*. Failure = 403.

**Authorization code flow** *(D18)* — The correct OAuth 2.0 flow for web and mobile apps, used
with PKCE.

## B

**BASE** *(D14)* — Basically Available, Soft state, Eventual consistency. The trade-off many
distributed NoSQL systems make instead of ACID.

**Basic authentication** *(D18)* — Username and password base64-encoded in the `Authorization`
header. Encoding, not encryption.

**Bearer token** *(D18)* — A token where possession alone grants access.

**Beta testing** *(D5)* — Acceptance testing by real users at *their own* sites.

**Black-box testing** *(D5, D7)* — Testing derived from the specification, without knowledge of
internal structure.

**Blocked** *(D6)* — A test that could not be run. Never the same as Fail.

**Blocker** *(D10)* — Severity where testing cannot continue at all.

**Blue/green deployment** *(D19)* — Two identical environments; traffic switches between them.

**BOLA / IDOR** *(D17, D11)* — Broken Object Level Authorization / Insecure Direct Object
Reference. Accessing another user's resource by changing an ID. The most common serious API
vulnerability.

**Boundary value analysis (BVA)** *(D7)* — Testing at the edges of equivalence partitions, where
defects cluster.

**Branch coverage** *(D7)* — Percentage of decision outcomes exercised by tests.

**Build verification test** *(D5)* — See *smoke testing*.

## C

**Cache invalidation** *(D12, D14)* — Clearing or refreshing cached data when the underlying data
changes. A rich source of "I updated it but it still shows the old value" bugs.

**Canary release** *(D19)* — Releasing to a small percentage of users first, then widening.

**CAP theorem** *(D14)* — In a distributed system you can have at most two of Consistency,
Availability and Partition tolerance.

**CDN** *(D12)* — Content Delivery Network. Serves static content from locations near the user.

**Certificate authority (CA)** *(D12)* — A trusted issuer of TLS certificates.

**Chaining** *(D17)* — Using a value from one API response in a subsequent request.

**Client** *(D11)* — The software that requests something. A role in a conversation, not a type
of machine.

**Cold start** *(D13, D19)* — The slow first request after an idle period, while a container or
function initialises.

**Component testing** *(D5)* — Unit testing. Testing a single module in isolation.

**Confirmation testing** *(D5)* — See *re-testing*.

**Constraint** *(D4, D14)* — A limitation you must work within; in databases, a rule the database
itself enforces (`NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY`).

**Continuous delivery / deployment / integration** *(D2)* — CI: frequent automated merge, build
and test. CD (delivery): every passing change is *ready* to release. CD (deployment): every
passing change *is* released.

**Correlation ID / X-Request-Id** *(D13, D16)* — An identifier tracing one request across
services. Put it in every bug report.

**CORS** *(D16)* — Browser policy controlling cross-origin requests. Why something works in
Postman but fails in the browser.

**Coverage** *(D1)* — The degree to which specified items have been exercised by tests.

**CRUD** *(D8)* — Create, Read, Update, Delete. A heuristic for generating test ideas.

**curl** *(D13)* — Command-line HTTP client. Removes the browser from the equation.

**Cycle time** *(D3)* — Kanban metric: how long a work item takes from start to finish.

## D

**Data masking** *(D6)* — Anonymising personal data before using it in a test environment.
Legally required in most jurisdictions.

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

## E

**Entry / exit criteria** *(D4, D6)* — Conditions that must be met to begin or to finish a test
activity.

**Environment parity** *(D19)* — How closely a test environment resembles production. Every
difference is a place a bug can hide.

**Ephemeral port** *(D11)* — A high-numbered temporary source port used by a client for an
outgoing connection.

**Equivalence partitioning (EP)** *(D7)* — Dividing inputs into groups treated identically, and
testing one value from each.

**Error** *(D1)* — A human mistake. Distinct from the defect it produces.

**Error guessing** *(D7)* — Experience-based technique: deliberately trying what has broken before.

**Escaped defect** *(D9)* — A defect found in production. The metric that matters most.

**Eventual consistency** *(D14)* — Replicas may briefly disagree after a write but will converge.
Sometimes correct behaviour, not a bug — but the UI must handle the gap.

**Exit criteria** — see *entry / exit criteria*.

**Exploratory testing** *(D8)* — Simultaneous learning, test design and test execution, guided by
a charter and a timebox.

## F

**Failure** *(D1)* — The observable wrong behaviour when a defect is executed.

**False negative** *(D1)* — A test that passes when the software is actually broken. The dangerous
kind.

**False positive** *(D1)* — A test that reports a failure that isn't real.

**Feature flag** *(D19)* — A switch turning a feature on or off without deploying. Means the
build number alone no longer determines behaviour — record flag state in bug reports.

**Foreign key** *(D14)* — A column pointing at another table's primary key.

**Functional testing** *(D5)* — Testing *what* the system does.

## G

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

**HMAC signing** *(D18)* — Signing a request with a shared secret to prove integrity. Used for
payments and webhooks.

**Host** *(D11)* — Any device on a network with an IP address.

**Hosts file** *(D11)* — A local file overriding DNS. Useful for testing; a classic cause of
"only broken on my machine".

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

**Iterative development** *(D2)* — Building a rough whole and refining it in cycles.

## J

**JOIN** *(D15)* — SQL operation combining rows from multiple tables. `LEFT JOIN … IS NULL` finds
missing and orphaned records.

**jq** *(D17)* — Command-line JSON processor. Worth 15 minutes to learn.

**JWT** *(D18)* — JSON Web Token. Three base64url parts: header, payload, signature. **The
payload is readable by anyone holding the token.**

## K

**Kanban** *(D3)* — Continuous-flow method using WIP limits rather than fixed sprints.

**Key-value store** *(D14)* — Database type storing a key and a value. Redis, Memcached. Used for
sessions, caches, rate limiting.

**Known issue** *(D9)* — A defect shipping with a release, documented in the release notes.

**Kubernetes** *(D19)* — Orchestrates containers across many machines.

## L

**Load balancer** *(D12)* — Distributes traffic across identical servers. A common explanation
for "it only fails sometimes".

**localhost** *(D11)* — This machine. Always 127.0.0.1. "Works on localhost" proves very little.

## M

**Maintenance testing** *(D5)* — Testing changes to a system already in production, including
migration and retirement.

**Many-to-many** *(D14)* — A relationship needing a junction table.

**Mock** *(D5)* — A test double that simulates a dependency and can assert on how it was called.

**MoSCoW** *(D4)* — Must / Should / Could / Won't. A prioritisation scheme.

**mTLS** *(D18)* — Mutual TLS. Both sides present certificates. Common in banking and
service-to-service traffic.

## N

**NAT** *(D11)* — Network Address Translation. Lets many private addresses share one public one.

**Newman** *(D17)* — Postman's command-line runner. Lets your collection run in CI.

**Non-functional requirement (NFR)** *(D4)* — *How well* the system does something: performance,
security, usability, compatibility, accessibility. The ones nobody writes down.

**Normalisation** *(D14)* — Organising data to eliminate duplication.

**NoSQL** *(D14)* — Umbrella term for document, key-value, column-family and graph databases.

**NULL** *(D15)* — SQL's "unknown". Not equal to anything, including itself. Use `IS NULL`, never
`= NULL`.

## O

**OAuth 2.0** *(D18)* — Delegated authorization. Lets an app act on your behalf without your
password.

**OIDC (OpenID Connect)** *(D18)* — Authentication layer on top of OAuth 2.0, adding an ID token.
OAuth = authorization; OIDC = authentication.

**On-premises** *(D19)* — The organisation owns and runs the hardware.

**OpenAPI / Swagger** *(D17)* — A machine-readable API contract. Your test basis for API testing.

**Orphaned record** *(D15)* — A row referencing a parent that no longer exists. A data integrity
defect.

**OSI model** *(D12)* — Seven-layer network model. Useful as a diagnostic ladder: check from the
bottom up.

## P

**Pairwise testing** *(D7)* — Covering every pair of parameter values in a small set of
combinations. For compatibility matrices.

**Parameterised query** *(D15)* — Sending input separately from SQL so it can never be
interpreted as code. The actual fix for SQL injection.

**PATCH / PUT** *(D16)* — PATCH updates part of a resource; PUT replaces it entirely. Sending a
partial PUT can silently wipe fields.

**Percent-encoding** *(D11)* — Escaping special characters in URLs (`%20` for space).

**Pesticide paradox** *(D1, D8)* — Repeated identical tests stop finding new defects.

**PKCE** *(D18)* — Proof Key for Code Exchange. Secures the OAuth authorization code flow for
public clients.

**Port** *(D11)* — A numbered door on a host identifying which program traffic is for.
0–1023 well-known, 1024–49151 registered, 49152+ ephemeral.

**Postcondition** *(D6)* — The state the system is left in after a test. Tells the next tester how
to clean up.

**Precondition** *(D6)* — The state required before a test's first step. Must be verifiable.

**Primary key** *(D14)* — Uniquely identifies a row. Never null, never duplicated.

**Priority** *(D10)* — How soon a defect must be fixed. A **business** decision.

**Product risk** *(D4)* — The possibility the system fails to meet needs. Testers own its analysis.

**Project risk** *(D4)* — The possibility the project fails to deliver. Flag those affecting testing.

## Q

**Quality assurance (QA)** *(D1)* — Process-focused, preventive. Distinct from QC.

**Quality control (QC)** *(D1)* — Product-focused, corrective. Testing sits inside QC.

## R

**RAID log** *(D4)* — Risks, Assumptions, Issues, Dependencies. A risk *might* happen; an issue
already has.

**Race condition** *(D8)* — A defect where the outcome depends on the timing of concurrent
operations. Found with the "two of everything" heuristic.

**RCRCRC** *(D8)* — Recent, Core, Risky, Configuration-sensitive, Repaired, Chronic. Regression
prioritisation heuristic.

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

**Reverse proxy** *(D12)* — Front door handling TLS, routing and rate limits. Source of 502 and
504 responses.

**Risk-based testing** *(D4)* — Allocating test effort by probability × impact.

**Root cause** *(D1)* — The underlying reason an error happened. Usually a process problem.

## S

**Safe method** *(D16)* — An HTTP method that does not change server state: GET, HEAD, OPTIONS.
A state-changing GET is a real defect.

**SameSite** *(D16)* — Cookie flag controlling cross-site sending. Protects against CSRF.

**Sanity testing** *(D5)* — Narrow and deep check on one area after a small change. Contrast with
smoke: wide and shallow.

**Schema** *(D14)* — The structure of a database: tables, columns, types, rules. Reviewing one is
static testing.

**Scope creep** *(D4)* — Uncontrolled growth of scope. Eats test time first.

**Scrum** *(D3)* — Agile framework with fixed sprints, three roles, and five events.

**Serverless / FaaS** *(D19)* — Running functions on demand without managing servers. Test cold
starts, timeouts and concurrency limits.

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

**Soft delete** *(D14)* — Marking a record deleted rather than removing it. Test whether it still
appears in search, reports, exports and the API.

**SOAP** *(D17)* — XML-based API protocol with a WSDL contract. Errors return HTTP 200 with a
`<soap:Fault>` — status code alone tells you nothing.

**SQL injection** *(D15)* — Attack where input is interpreted as SQL. Test with a lone
apostrophe; never with destructive payloads.

**State transition testing** *(D7)* — Technique for systems with states. **The invalid
transitions are where the bugs are**, and they're usually only reachable via the API.

**Statement coverage** *(D7)* — Percentage of executable statements exercised.

**Static testing** *(D1, D4)* — Examining a work product without executing it. The cheapest defect
detection available.

**Stub** *(D5)* — A test double standing in for a component that isn't ready.

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

**Three-valued logic** *(D15)* — SQL evaluates conditions as true, false or unknown. The source
of the NULL trap.

**Timebox** *(D8)* — A fixed duration for an activity.

**TLS** *(D12)* — Encrypts traffic, authenticates the server, guarantees integrity. Successor to
SSL.

**Traceability (RTM)** *(D4)* — Mapping requirements to test cases to results to defects. Shows
what nobody tested.

**Transaction** *(D14, D15)* — A group of operations that succeed or fail together. `BEGIN` …
`COMMIT` / `ROLLBACK`.

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

**V-model** *(D2)* — Waterfall folded in half. Every development activity has a matching test
activity **designed at the same time**.

**Validation** *(D1)* — Did we build the right thing?

**Velocity** *(D3)* — Story points completed per sprint. A planning aid, never a target.

**Verification** *(D1)* — Did we build the thing right?

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

**WIP limit** *(D3)* — Kanban cap on work in progress. Makes the bottleneck visible instead of
making it the tester's problem.

**Workaround** *(D10)* — What users or support can do until a defect is fixed. "None" is an
important answer.
