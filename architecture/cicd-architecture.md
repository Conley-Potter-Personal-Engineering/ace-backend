# ACE CI/CD Architecture (Dual Deploy Configuration)

This document defines the **Continuous Integration and Deployment (CI/CD)** system for the Autonomous Content Engine (ACE), updated for the **dual-service deployment architecture**.

---

## 1. Environments and Branching Strategy

**Git Branches**

- `agents-development` — Active backend branch for API and workflow work  
- `dev` — Consolidated staging branch  
- `main` — Stable, production-ready branch  

**Supabase Projects**

- `supabase-test` — Integration + staging  
- `supabase-prod` — Production database  

**Railway Services**

| Service | Role | Connected DB | Deploy Target |
|----------|------|--------------|----------------|
| `ace-api-staging` | Public API service (HTTP endpoints) | `supabase-test` | `dev` |
| `ace-api-prod` | Production API service | `supabase-prod` | `main` |
| `ace-worker-staging` | Background workflows (deferred) | `supabase-test` | — |
| `ace-worker-prod` | Background workflows (future) | `supabase-prod` | — |

**Deployment Flow**

```
feature → agents-development → CI tests → staging deploy (optional)

agents-development → main → CI tests → production deploy
```

---

## 2. Continuous Integration (CI)

All jobs run in `.github/workflows/ci.yml` using **GitHub Actions**.

### Pipeline Stages

1. **Setup**
   - `actions/checkout`
   - `actions/setup-node@v4` (Node 20)
   - NPM cache + install via `npm ci`

2. **Static Checks**
   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Unit Tests**
   ```bash
   npm run test
   ```
   - Mocks Supabase + LangChain
   - Ensures schemas and repos are correct

4. **Integration Tests**
   ```bash
   npm run test:integration
   ```
   - Runs against `supabase-test`
   - Verifies `/api/**` handlers, repositories, and event writes

5. **Build Verification**
   ```bash
   npm run build
   ```
   - Confirms Next.js API + TypeScript compile cleanly before packaging

---

## 3. Continuous Deployment (CD)

### Dual-Service Deployment Flow

1. **ace-api**  
   - Stateless Next.js API  
   - Exposes `/api/**` routes  
   - Deployed via Docker + Railway

2. **ace-worker** (deferred)  
   - Long-running Node process for orchestration  
   - Will deploy later using same CI template with worker target enabled

---

### CD Pipeline (API)

1. **Build Container**
   - Railway **Nixpacks** or `Dockerfile`
   - Optional: push image to GHCR

2. **Deploy to Railway**
   - Triggered on `main` or manual promotion from `agents-development`
   - Uses GitHub Secrets:
     ```
     RAILWAY_API_KEY
     RAILWAY_PROJECT_ID
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
     OPENAI_API_KEY
     ```

3. **Smoke Test**
   - Verify `/api/system-events` responds successfully
   - Logs output to GitHub Actions console

---

## 4. Test Architecture

Unchanged from earlier revision, with the addition of **API handler integration tests** to verify new endpoints.

```
/tests/unit
/tests/integration/api
/tests/integration/workflows
```

---

## 5. Environment & Secrets

| Environment | File/Source | Description |
|--------------|-------------|--------------|
| Local | `.env.local` | Developer configuration |
| Test | `.env.test` | Integration Supabase project |
| Staging | Railway Variables | Deployed from `agents-development` |
| Production | Railway Variables | Deployed from `main` |

Each service (`ace-api`, `ace-worker`) includes:
```
ACE_ENV=prod
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

---

## 6. Deployment Files (per Service)

| File | Purpose |
|------|----------|
| `Dockerfile` | Node 20 container build |
| `Procfile` | Railway entrypoint (`web: npm start`) |
| `railway.json` | Service definition + environment bindings |
| `.env.example` | Developer reference |
| `.github/workflows/deploy.yml` | CI/CD automation for API deploy |

---

## 7. Observability

* `system_events` continues as the telemetry backbone.
* Railway logs integrated with GitHub build output.
* Planned addition: log forwarding and Prometheus-compatible metrics.

---

## 8. Summary Diagram

```
Developer Commit (agents-development)
           │
           ▼
    ┌────────────────────┐
    │ GitHub Actions CI  │
    │ • Lint             │
    │ • Typecheck        │
    │ • Tests            │
    │ • Build            │
    └────────────────────┘
           │
           ▼
    ┌────────────────────┐
    │ Continuous Deploy  │
    │ • Docker Build     │
    │ • Railway Deploy   │
    │ • Smoke Test       │
    └────────────────────┘
           │
   ┌────────────────────────┐
   │ ace-api (Railway)      │
   │ • /api/** endpoints    │
   │ • Supabase access      │
   └────────────────────────┘
           │
   ┌────────────────────────┐
   │ ace-worker (Future)    │
   │ • Background workflows │
   └────────────────────────┘
```

---

## 9. Guiding Principles

* **Modularity** — Each service can deploy independently.  
* **Traceability** — CI/CD logs stored in GitHub Actions and Railway.  
* **Simplicity** — Railway + Supabase + GitHub = minimal ops overhead.  
* **Scalability** — Dual-service pattern supports future growth.
