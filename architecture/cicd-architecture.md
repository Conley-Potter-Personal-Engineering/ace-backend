# ACE CI/CD Architecture

This document outlines the continuous integration and continuous deployment (CI/CD) architecture for the Autonomous Content Engine (ACE).  
It defines the environments, test layers, and automation pipelines that ensure ACE’s reliability, safety, and scalability.

---

## 1. Environments and Branching Strategy

**Git Branches**

- `dev` — Active development branch  
- `main` — Stable, deployable branch  
- Feature branches — Short-lived, merged into `dev`

**Supabase Projects**

- `supabase-test` — Used for integration testing and staging workflows  
- `supabase-prod` — Production database for ACE

**Railway Services**

- `ace-worker-staging` → connected to `supabase-test`  
- `ace-worker-prod` → connected to `supabase-prod`

**Deployment Flow**

```

feature → dev → CI tests → staging deploy (optional)

dev → main → CI tests → prod deploy

```

---

## 2. Continuous Integration (CI)

All CI tasks are defined in `.github/workflows/ci.yml`.

### Triggers

- Runs on `push` and `pull_request` to `dev` and `main`.

### Pipeline Stages

1. **Checkout & Setup**
   - Uses `actions/checkout` and `actions/setup-node@v4`
   - Node 20 environment
   - NPM caching enabled

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Lint**

   ```bash
   npm run lint
   ```

4. **Type Check**

   ```bash
   npm run typecheck
   ```

5. **Unit Tests**

   ```bash
   npm run test:unit
   ```

   * Fast, deterministic
   * Mocks Supabase and LangChain
   * Must pass before integration tests run

6. **Integration Tests**

   ```bash
   npm run test:integration
   ```

   * Runs only if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   * Executes against the `supabase-test` project
   * Validates repository behavior, agent I/O, and event logging

7. **Build**

   ```bash
   npm run build
   ```

   * Ensures the ACE worker compiles before deployment

---

## 3. Continuous Deployment (CD)

### Deployment Triggers

* Runs on merges to `main` (and optionally `develop` for staging)

### Deployment Pipeline

1. **Build Container Image**

   * Uses Railway Nixpacks or a local `Dockerfile`
   * (Optional) Build and push to GHCR for versioned releases

2. **Deploy to Railway**

   * Railway auto-deploys from GitHub on `main`
   * Environment variables define connection targets (`prod` vs `staging`)

3. **Smoke Check**

   * Simple validation step (optional)
   * Confirms service can connect to Supabase and execute a basic agent task

---

## 4. Test Architecture

ACE uses a **three-tier test strategy**.

### 1️⃣ Unit Tests

* Located in `/tests/unit`
* No network calls
* Mocked dependencies (`Supabase`, `LangChain`, `OpenAI`)
* Tests Zod schemas, services, and pure logic

### 2️⃣ Integration Tests

* Located in `/tests/integration`
* Connect to `supabase-test`
* Verify real data flow:

  * Repository calls
  * Agent `.execute()` pipelines
  * `system_events` and persistence

### 3️⃣ Workflow Tests (Future)

* Full end-to-end content cycles (run locally or in staging)
* Simulate complete ACE workflows (Research → Scriptwriter → Publish)

---

## 5. ACE Worker Runtime (Production Behavior)

### Worker Entrypoint

```
src/worker/startWorker.ts
```

**Responsibilities**

* Initialize environment
* Launch scheduled or triggered workflows
* Handle:

  * `ContentCycle`
  * `TrendRefresh`
  * `AnalyticsIngestion`
  * `OptimizationCycle`

**Scheduling**

* Short term: `node-cron` or manual triggers
* Long term: queue-based system or workflow orchestrator (Temporal, BullMQ, etc.)

**System Events**

* Every agent emits structured events to the `system_events` table
* Enables debugging, tracing, and observability

---

## 6. Environment and Secret Management

**Local Development**

```
config/.env.local
```

Used for development. Loaded via `dotenv`.

**Testing**

```
config/.env.test
```

Dedicated Supabase project for safe, isolated testing.

**GitHub Actions Secrets**

* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `OPENAI_API_KEY`

**Railway Environment Variables**
Each Railway service defines:

* `ACE_ENV` (`staging` or `prod`)
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `OPENAI_API_KEY`

---

## 7. Migrations and Schema Evolution

* SQL migrations live in `/supabase/migrations/`
* Run locally via:

  ```bash
  npx supabase db push
  ```
* Apply to test environment first (`supabase-test`)
* Once validated, apply to `supabase-prod`

Future enhancement:

* CI job that validates new migrations automatically

---

## 8. Observability

ACE uses a lightweight event-driven observability model:

* `system_events` acts as the internal telemetry stream
* Tracks:

  * Workflow state changes
  * Agent inputs/outputs
  * Failures and recoveries

**Future enhancements**

* Stream `system_events` into a monitoring dashboard
* Add Railway log forwarding and alert triggers
* Create a metrics view summarizing success/failure rates per agent

---

## 9. Summary Diagram

```
          ┌──────────────────────────────────┐
          │            Developer              │
          │   Commit / PR → GitHub Actions    │
          └──────────────────────────────────┘
                         │
                         ▼
              ┌───────────────────┐
              │ Continuous Integration │
              │   • Lint             │
              │   • Typecheck        │
              │   • Unit Tests       │
              │   • Integration Tests│
              └───────────────────┘
                         │
                         ▼
              ┌───────────────────┐
              │ Continuous Deployment │
              │   • Build Container  │
              │   • Deploy to Railway│
              │   • Smoke Test       │
              └───────────────────┘
                         │
                         ▼
           ┌────────────────────────────┐
           │  ACE Worker (Railway)       │
           │  • Runs workflows           │
           │  • Writes to Supabase       │
           │  • Emits system_events      │
           └────────────────────────────┘
```

---

### Author Notes

This CI/CD architecture reflects the 2025 ACE stack’s priorities:

* **Type safety and reliability**
* **Fast iteration and isolated environments**
* **Infrastructure simplicity** (Railway + Supabase + GitHub Actions)
* **Scalability without complexity**