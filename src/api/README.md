# ACE API Layer

Next-style API routes that back the ACE frontend. These routes expose read-only listings and manual triggers for agents/workflows plus artifact lookup and feedback intake. Authentication is currently out of scope, but all calls expect the `x-api-key` header for forward compatibility.

## Project Layout
- `src/api/http.ts` – lightweight helpers for requests/responses.
- `src/api/error.ts` – shared error normalization/handlers.
- `src/api/handlers/` – business logic for each route family (agents, workflows, artifacts, feedback, system events).
- `src/pages/api/**` – route entrypoints that call the handlers above.
- `src/schemas/apiSchemas.ts` – Zod schemas for API inputs/queries.
- `src/schemas/agentSchemas.ts` – shared agent input schemas.

## Endpoints
Base path: `/api/`

- `GET /api/agents` – list registered agents with inferred status/last event.
- `POST /api/agents/[name]/run` – trigger an agent with `{ "input": { ... } }` body.
- `GET /api/workflows` – list known workflows with inferred status.
- `POST /api/workflows/[id]/start` – emit `workflow.start` for manual triggers.
- `GET /api/artifacts` – list recent artifacts (currently `video_assets`-backed).
- `GET /api/artifacts/[id]` – fetch detail for a single artifact.
- `POST /api/feedback` – record structured feedback; logs `feedback.recorded`.
- `GET /api/system-events` – fetch recent system events (debug/live view).

### Request Notes
- Headers: `x-api-key: <ACE_API_KEY>` (present for future enforcement).
- Body validation: all payloads/queries are validated with Zod schemas in `src/schemas/apiSchemas.ts` (and agent schemas where applicable).
- Data access: handlers call repository modules only (no direct Supabase access).
- Events: system events are logged via `logSystemEvent` for traceability.

## Examples
Trigger ScriptwriterAgent:
```bash
curl -X POST http://localhost:3000/api/agents/ScriptwriterAgent/run \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{ "input": { "productId": "00000000-0000-0000-0000-000000000000" } }'
```

List workflows:
```bash
curl -H "x-api-key: dev" http://localhost:3000/api/workflows
```

Fetch artifacts:
```bash
curl -H "x-api-key: dev" "http://localhost:3000/api/artifacts?limit=20"
```

Submit feedback:
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{ "artifact_id": "00000000-0000-0000-0000-000000000000", "rating": 5, "comment": "Great pacing." }'
```

## Local Development
- Install deps: `npm install`
- Run dev server: `npm run dev` (serves `/api/**` under Next-style routing via tsx)
- Typecheck: `npm run typecheck` (note: tests live outside `rootDir` today; adjust TS config if you want clean typecheck across tests)

## Extending
1. Add/adjust schemas in `src/schemas/apiSchemas.ts` (and agent/workflow schemas).
2. Implement handler logic in `src/api/handlers`.
3. Wire a route file under `src/pages/api/**` that delegates to the handler and uses shared error helpers.
4. Emit system events for observability; keep all DB access inside `src/repos/**`.
5. Update the examples section as new endpoints are added.
