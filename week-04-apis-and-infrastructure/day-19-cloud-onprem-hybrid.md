# Day 19 — On-Prem vs Cloud vs Hybrid, and Test Environments

> **Week 4 · Day 19 · 60 minutes**
> ISTQB CTFL v4.0 mapping: Chapter 2 (test environments), Chapter 5 (test planning), Chapter 6 (tools)
> Prerequisites: Week 3, Days 16–18

---

## At a glance

By the end of this session you should be able to:

1. Compare **on-premises**, **cloud** and **hybrid** hosting, and say what changes for QA in each.
2. Explain **IaaS, PaaS, SaaS** and the shared responsibility model.
3. Name the major cloud providers and the services you'll actually encounter.
4. Describe a normal **environment strategy** (dev → QA → staging → prod) and its failure modes.
5. Explain containers, CI/CD pipelines and feature flags at a QA-relevant level.

---

## Session plan

| Time | Activity |
|------|----------|
| 0:00 – 0:05 | Homework review: the auth suite results |
| 0:05 – 0:18 | On-prem vs cloud vs hybrid |
| 0:18 – 0:27 | IaaS / PaaS / SaaS and shared responsibility |
| 0:27 – 0:40 | Test environments and environment parity |
| 0:40 – 0:50 | Containers, CI/CD, feature flags, testing in production |
| 0:50 – 0:57 | **Activity:** design an environment strategy |
| 0:57 – 1:00 | Homework |

---

## 1. Where software runs

### On-premises

The organisation owns the hardware, in its own building or a rented data-centre rack. It buys
the servers, installs them, powers them, patches them and replaces them.

**Strengths:** total control; data never leaves your premises (decisive for some regulators);
predictable long-term cost at steady scale; works without internet connectivity; no dependence
on a vendor's pricing or availability.

**Weaknesses:** large up-front capital cost; scaling means buying and installing hardware
(weeks or months); you own every failure at 3am; capacity is sized for peak and idle the rest
of the time.

**What changes for QA:**
- Test environments are **scarce and shared** — you queue for them, and someone else's test run
  pollutes your data.
- Environments drift from production because refreshing them is manual work.
- You may need to test **installation and upgrade** procedures themselves, because customers run
  the software on their own hardware — installability, migration and rollback become
  first-class test objects.
- You may have to test on specific hardware, OS versions and configurations the customer uses.

### Cloud

Someone else's computers, rented by the minute. AWS, Azure, Google Cloud.

**Strengths:** no capital cost; provision an environment in minutes; scale up and down with
demand; managed services (databases, queues, storage) you don't have to operate; global regions.

**Weaknesses:** costs can escalate fast and unpredictably; vendor lock-in; data residency and
compliance questions; you depend on the provider's uptime; requires new skills.

**What changes for QA:**
- **Environments become cheap and disposable.** A per-pull-request environment is normal. This
  is a huge quality win — you can test in isolation.
- **Infrastructure as code** means environments are reproducible from a repository, so
  environment drift can be eliminated (if the team does it properly).
- New failure modes: region outages, auto-scaling lag (**cold starts** — Day 13), throttling,
  service quotas, IAM permission errors.
- **Cost becomes a test concern.** A load test can generate a serious bill. Ask before you run one.

### Hybrid

Some workloads on-premises, some in the cloud, connected over a VPN or a dedicated link.

**Why organisations do it:** regulated or sensitive data stays in-house (the core banking
ledger, patient records) while the customer-facing web front end runs in the cloud for scale;
or an old system can't be migrated and must be integrated with new cloud services; or a phased
migration is in progress; or the organisation deliberately avoids depending on one vendor.

**What changes for QA — hybrid is the hardest to test, and this is where you earn your money:**
- **The link between the two is the top risk.** Test what happens when it's slow, saturated, or
  down. Does the cloud front end degrade gracefully when the on-prem core is unreachable, or
  does it show a stack trace?
- **Latency is real and asymmetric.** A call that takes 2ms inside the data centre may take 80ms
  across the link. Chatty integrations that made hundreds of calls become unusable.
- **Data synchronisation and consistency** between the two sides — this is where eventual
  consistency (Day 14) bites hardest.
- **Two sets of environments, two release cadences.** The cloud side deploys daily; the on-prem
  core deploys quarterly. **Version compatibility testing becomes essential** — cloud version N
  must work with on-prem versions N-1 and N-2.
- Authentication crossing the boundary — federated identity, certificates, network rules.

### Also worth knowing

- **Multi-cloud** — using more than one provider, for redundancy or negotiating leverage.
- **Private cloud** — cloud-style self-service infrastructure, on your own hardware
  (VMware, OpenStack).
- **Edge computing** — running compute close to users (CDN edge functions, IoT gateways). Test
  angle: behaviour differs by region, and cached logic can be stale in one region only.

### Comparison

| | On-prem | Cloud | Hybrid |
|---|---|---|---|
| Up-front cost | High (capex) | Low (opex) | Mixed |
| Scaling | Weeks/months | Minutes | Varies by component |
| Control | Total | Shared | Split |
| Data residency | Fully yours | Depends on region choice | Sensitive data stays in-house |
| Test environments | Scarce, shared, drift | Cheap, disposable, reproducible | Complex, partly scarce |
| Biggest QA risk | Environment drift & availability | Cost, config errors, quotas | **The integration link and version skew** |
| Typical sectors | Banking core, defence, healthcare, manufacturing | Startups, SaaS, consumer products | Large enterprises, banks, telecoms, government |

---

## 2. IaaS, PaaS, SaaS, and shared responsibility

The question these answer is: **how much do you manage, and how much does the provider?**

```
              On-prem        IaaS          PaaS          SaaS
Application     YOU           YOU           YOU        provider
Data            YOU           YOU           YOU        YOU (your data is always yours)
Runtime         YOU           YOU        provider      provider
Middleware      YOU           YOU        provider      provider
OS              YOU           YOU        provider      provider
Virtualisation  YOU        provider      provider      provider
Servers         YOU        provider      provider      provider
Storage         YOU        provider      provider      provider
Networking      YOU        provider      provider      provider
```

| Model | You get | Examples | Analogy |
|---|---|---|---|
| **IaaS** | Virtual machines, storage, networks | AWS EC2, Azure VMs, Google Compute Engine | Renting an empty flat — you furnish it |
| **PaaS** | A platform to deploy code onto | Heroku, AWS Elastic Beanstalk, Azure App Service, Google App Engine | A furnished flat — you just move in |
| **SaaS** | Finished software | Gmail, Salesforce, Jira, Slack | A hotel room |
| **FaaS / Serverless** | Run a function on demand | AWS Lambda, Azure Functions, Cloud Functions | Renting a room by the hour |

**The shared responsibility model** is the security principle behind this: the provider secures
**of** the cloud (hardware, hypervisor, physical access); the customer secures **in** the cloud
(their data, access control, configuration, application code).

**Why testers care:** the vast majority of real cloud breaches are **customer** misconfiguration,
not provider failure — a storage bucket left public, an over-permissive IAM role, an unencrypted
database, a management port open to the internet. "It's in AWS so it's secure" is a false belief
worth challenging when you hear it. If you can browse to a storage bucket's URL and see files
without credentials, that's a finding, and it's a two-minute check.

**Serverless testing angles:** cold starts (first request after idle is slow — Day 13's fourth
scenario); execution time limits (a function that runs 3 seconds in QA may hit a 15-second
timeout with production data volumes); concurrency limits and throttling; and the fact that
functions are stateless, so anything cached in memory disappears between invocations.

---

## 3. Test environments

### The typical ladder

| Environment | Purpose | Data | Who uses it | Stability |
|---|---|---|---|---|
| **Local** | A developer's machine | Made up, tiny | One developer | Whatever they broke last |
| **Dev / Integration** | First place code from all developers meets | Synthetic | Developers | Frequently broken — that's fine |
| **QA / Test** | Functional testing | Curated test data | Testers | Should be stable within a build |
| **Staging / Pre-prod** | Final verification; **should mirror production** | Masked production-like data, similar volume | QA, PO, sometimes customers | Very stable |
| **UAT** | Business users accept | Realistic business scenarios | Business users | Stable |
| **Production** | Real users | Real data | Everyone | Must not break |
| **Performance** | Load and stress testing | Production-scale volume | Performance engineers | Isolated, so tests don't skew other work |
| **Sandbox / Demo** | Sales demos, partner integration | Clean, curated | Sales, partners | Stable |

Not every organisation has all of these. Small teams may have dev → staging → prod, which is
fine if staging genuinely resembles production.

### Environment parity — the thing that actually matters

**Every difference between staging and production is a place where a bug can hide until release
day.** Keep a written list of the known differences; it is one of the most useful documents a
QA team can own.

Differences that regularly cause production-only defects:

| Difference | What it breaks |
|---|---|
| **Data volume** — 10k rows vs 10M | Missing indexes; timeouts; pagination; report generation (Day 14) |
| **Configuration** — feature flags, limits, timeouts | Behaviour differs in ways nobody documented |
| **Third-party integrations** — sandbox vs live | Sandbox payment gateways accept things live ones reject, and vice versa |
| **Certificates** — self-signed in QA | HTTPS behaviour, cookie `Secure` flags, mixed content |
| **Scale** — 1 app instance vs 12 behind a load balancer | Session stickiness, caching, race conditions, in-memory state |
| **Caching / CDN** — often disabled in QA | Stale content, cache invalidation bugs |
| **Email/SMS** — redirected to a sink in QA | Real deliverability, templates, links, spam classification |
| **Permissions/roles** — testers often have admin | Authorization defects invisible in QA. **Always test as a real, low-privilege user** |
| **Network** — one VPC vs multi-region | Latency, timeouts, regional failover |
| **Time zone / locale** — server in UTC, users in WAT | Date boundaries, "today" calculations, DST |

**Write these down and put them in your test plan.** When something works in staging and fails
in production, this list is where you start, and it usually contains the answer.

### Environment hygiene

- Every environment should expose a **version/health endpoint** so you can confirm what's
  deployed: `GET /health` → `{"status":"ok","version":"4.3.0","commit":"a1b2c3d"}`. If your
  product doesn't have one, requesting it is a genuinely useful thing for a tester to ask for.
- Know how test data is **refreshed** and how to reset your own.
- Know who to tell when an environment is down, and record the downtime — environment
  unavailability is a **project risk** (Day 4) and it belongs in your reports. "We lost 11 of 40
  test-hours this sprint to QA2 being unavailable" is a fact that changes decisions.

---

## 4. Containers, pipelines and flags

### Containers and orchestration

A **container** packages an application with everything it needs to run, so it behaves the same
everywhere. **Docker** is the common tool; **Kubernetes** orchestrates many containers across
many machines.

**Why it matters to QA:**
- "Works on my machine" largely disappears — the container *is* the machine.
- You can often run the whole application stack locally with one command, which means you can
  test without queueing for a shared environment.
- An **image tag** identifies exactly what's deployed. `myapp:4.3.0-rc2` is precise, so
  "which build is on QA2?" becomes answerable.
- New failure modes worth knowing: a container that restarts in a loop (`CrashLoopBackOff`),
  memory limits killing a process mid-request, and configuration injected as environment
  variables that differ per environment.

### CI/CD pipeline — where your tests live

```
git push
   │
   ├─► Build            compile, package, build the container image
   ├─► Static analysis  linting, security scanning, dependency vulnerability checks
   ├─► Unit tests       seconds
   ├─► Integration/API  minutes   ← your Postman/Newman collection runs here
   ├─► Deploy to QA     automatic
   ├─► Smoke tests      minutes   ← your Day 5 smoke suite runs here
   ├─► UI tests         longer, on a subset
   ├─► Deploy to staging
   └─► Deploy to production  (manual gate, or automatic)
```

**A QA intern's realistic first pipeline contribution:** getting the smoke suite and the API
collection running automatically on every deploy. It is high value and very achievable.

### Deployment strategies you should recognise

| Strategy | How it works | QA angle |
|---|---|---|
| **Blue/green** | Two identical environments; switch traffic between them | Test "green" fully before the switch; rollback is instant |
| **Canary** | Release to 1% of users, then 5%, then everyone | Monitor error rates between cohorts; you are testing in production, deliberately |
| **Rolling** | Replace instances a few at a time | **Two versions run simultaneously** — test version compatibility, especially of APIs and database schemas |
| **Big bang** | Everything at once | High risk; needs a tested rollback plan |

Rolling deployments have a QA consequence people miss: for several minutes, an old client can
call a new API and vice versa. Backward compatibility is testable, and a schema change that
breaks the old version causes errors during every deploy.

### Feature flags

A switch that turns a feature on or off without deploying code.

**Benefits:** deploy code dark and enable it later; enable for internal users first; kill a
broken feature instantly without a rollback.

**QA consequences — this is genuinely important and often missed:**
- **The build alone no longer determines behaviour.** "Which flags were on?" becomes part of
  every bug report's environment section.
- The number of combinations explodes. Ten independent flags is 1,024 states — you cannot test
  them all (Day 1, principle 2), so test the combinations that will actually be enabled together,
  plus each flag on and off in isolation.
- Test the **off** path too. It's the fallback, and it's usually less exercised.
- Old flags that are never removed become permanent hidden complexity. Raise them as tech debt.

### Testing in production, responsibly

It sounds reckless; it's standard practice done properly (this is "shift right" from Day 2):
smoke tests after every deploy, synthetic monitoring hitting critical journeys every few
minutes, real user monitoring, error-rate alerting, canary analysis, and clearly-labelled test
accounts excluded from analytics and billing. **What makes it responsible:** it never writes
real financial transactions, test accounts are identifiable, and there is a rollback plan.

---

## Live activity (7 minutes)

**Design an environment strategy.** Scenario:

> *A Nigerian fintech runs its core ledger on-premises for regulatory reasons. The mobile app
> and its API run on AWS. There are 40 developers, releases go out twice a week to the cloud
> side, and the on-prem ledger is updated quarterly. Payments go through a third-party gateway
> that has a sandbox.*

In pairs, answer:
1. What environments do you need, and what does each contain?
2. What are the top three risks, and which one keeps you awake?
3. What are the five biggest parity gaps between staging and production?
4. What do you test at the boundary between cloud and on-prem?

<details>
<summary>Facilitator notes</summary>

**Environments:** dev (cloud, mocked ledger), QA (cloud + a shared on-prem test ledger instance),
staging (production-like on both sides, masked real-volume data, gateway sandbox), performance
(isolated, production-scale), production.

**Top risks:** (1) **version skew** — the cloud side moves twice a week, the ledger quarterly, so
the cloud must remain compatible with the current *and* next ledger version; (2) the link between
cloud and on-prem — latency, saturation, outage; (3) shared on-prem test capacity becoming the
bottleneck for 40 developers. The one that should keep you awake is version skew, because it
fails silently and at the worst moment.

**Parity gaps:** ledger data volume; the payment gateway sandbox behaving differently from live
(sandbox accepts test cards that live rejects, and never actually declines for insufficient
funds unless you ask it to); link latency and bandwidth; certificate configuration; feature flag
states; and the fact that testers usually hold elevated roles in QA.

**Boundary tests:** link down mid-transaction (does the money end up in exactly one place — the
atomicity question from Day 14?); link slow (timeouts, retries, **duplicate submissions** — the
idempotency question from Day 16); ledger returning an error, an unexpected format, or a
previously-unseen status code; ledger version N-1 against cloud version N; reconciliation between
the two sides after a partial failure; and what the user sees while all this happens.

The point to land: **every architectural boundary is a test boundary**, and the questions you
ask there come straight from Days 14, 16 and 17.
</details>

---

## Common mistakes juniors make

- Assuming staging equals production. List the differences instead.
- Testing as an admin and never as a real user with limited permissions.
- Not recording which feature flags were enabled when a bug occurred.
- Reporting a bug without confirming which build and environment they were on.
- Running a load test in a shared cloud environment without asking — it costs money and it ruins
  everyone else's day.

---

## Homework (about 40 minutes)

1. **Map your own environments.** For your organisation (or a company you'd like to join), list
   every environment, what it's for, what data it holds, and its known differences from
   production. If you don't know, write the questions you'd ask on day one — that list is itself
   a deliverable.
2. **Shared responsibility:** for a system with a cloud-hosted web app and an on-prem database,
   write who is responsible for each of: physical security, OS patching, database backups,
   access control, application code, encryption at rest, and TLS certificates.
3. **Feature flags:** if a product has 6 independent flags, how many combinations exist? Which
   would you actually test, and how would you justify that selection to a manager?
4. **Prepare for tomorrow's capstone.** Re-read your Week 2 bug reports and Week 4 Postman
   collection. Tomorrow you run a complete mini test cycle.

---

## Check your understanding

<details>
<summary>1. Why is hybrid usually harder to test than either pure cloud or pure on-prem?</summary>

Because you inherit the constraints of both plus the integration between them. The link itself
is a failure point with real latency, and it must be tested slow, saturated and down. The two
sides typically have different release cadences, so you must test version compatibility across
the boundary. Data is split across two consistency domains, so synchronisation and
reconciliation become test objects. And environment provisioning is limited by whichever side is
scarcer — usually the on-prem one.
</details>

<details>
<summary>2. Under the shared responsibility model, who is responsible for a publicly readable storage bucket containing customer data?</summary>

The customer — you. The provider secures the infrastructure *of* the cloud; access configuration
of your resources is squarely yours. The provider gives you the controls and (usually) secure
defaults; choosing to make a bucket public, or failing to notice it is, is a customer
misconfiguration. This is why the majority of headline "cloud breaches" involve no provider
failure at all, and why checking whether storage is publicly reachable is a legitimate and quick
test.
</details>

<details>
<summary>3. A feature works in staging and fails in production. Name five differences you'd check first.</summary>

Data volume (a missing index that only matters at scale), configuration and feature-flag state,
third-party integrations (sandbox vs live gateway), the number of running instances and
therefore caching/session/race behaviour, and permissions — you likely tested as an
over-privileged user. Also worth checking: CDN and caching enabled in production but not
staging, certificate and HTTPS differences, and time zone/locale settings.
</details>

<details>
<summary>4. Why do feature flags complicate bug reports, and what should you add?</summary>

Because the build number no longer fully determines behaviour — the same build behaves
differently depending on which flags are on for which users. Two testers on the same version can
see different products. Add the **flag state** to the environment section of every bug report,
and to your test evidence generally. When investigating an unreproducible bug, comparing flag
states between the two sessions is one of the first things to check.
</details>

---

## Glossary additions

`on-premises` · `cloud` · `hybrid` · `multi-cloud` · `private cloud` · `edge computing` ·
`IaaS` · `PaaS` · `SaaS` · `FaaS` · `serverless` · `shared responsibility model` · `IAM` ·
`region` · `availability zone` · `cold start` · `environment parity` · `staging` · `UAT` ·
`data masking` · `health endpoint` · `container` · `Docker` · `Kubernetes` · `image tag` ·
`CI/CD pipeline` · `blue/green deployment` · `canary release` · `rolling deployment` ·
`feature flag` · `synthetic monitoring` · `testing in production`
