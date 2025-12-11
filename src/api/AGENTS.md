# ACE API – Agent Guide

This document describes how AI coding agents should extend and maintain the ACE API layer.

## Core Rules
- **Use repositories**: All data access must go through `src/repos/**` (never raw Supabase calls or inline SQL).
- **Validate inputs**: Every request payload or query must pass a Zod schema in `src/schemas/apiSchemas.ts` (or a dedicated schema module).
- **Emit system events**: Use `logSystemEvent` for API lifecycle visibility, following `architecture/events.md`.
- **Reuse BaseAgent logic**: When triggering agents, call their `execute` method to preserve logging/error handling.
- **Keep routing thin**: `src/pages/api/**` files should be minimal wrappers delegating to handler modules in `src/api/handlers/**`.

## Structure
- `src/api/http.ts` – request/response helpers.
- `src/api/error.ts` – shared error normalization.
- `src/api/handlers/**` – business logic for each API domain.
- `src/pages/api/**` – Next-style route entrypoints.
- `src/schemas/apiSchemas.ts` – API-level validation.
- `src/schemas/agentSchemas.ts` – agent input validation (shared with agents).

## Implementation Checklist
1. Define/extend Zod schemas for request bodies and query params.
2. Implement handler functions that:
   - parse/validate inputs,
   - call repository functions (no direct Supabase),
   - emit system events where applicable,
   - return typed DTOs (avoid leaking raw db rows unless intended).
3. Add a thin route file in `src/pages/api/**` that:
   - checks the HTTP method,
   - delegates to the handler,
   - uses `handleApiError` and helpers in `http.ts` for responses.
4. Keep responses consistent: `{ success: boolean, data?: any, message?: string, error?: string }`.
5. Respect naming conventions from `AGENTS.md` and event taxonomy in `architecture/events.md`.

## Event Logging Guidance
- Lifecycle: log `agent.start/success/error` or `workflow.start/...` when manual triggers occur.
- Domain: prefer specific event types (e.g., `script.generate.start`, `video.render.success`, `feedback.recorded`).
- Include context payloads (ids, inputs) to aid observability; avoid storing secrets in event payloads.

## Adding New Endpoints
- Place logic in `src/api/handlers/<domain>Handler.ts`.
- Add schemas for the new domain to `src/schemas/apiSchemas.ts` (or a dedicated schema file).
- Create the route file under `src/pages/api/...`.
- If the endpoint triggers agents/workflows, route through their classes and repositories rather than duplicating logic.

## Testing
- Prefer unit tests around handlers and schema validation.
- Use existing repo mocks in `tests/utils/mocks` where possible.
- Avoid network calls; rely on repository interfaces for isolation.

## Safety
- Do not bypass validation, logging, or repository boundaries.
- Do not introduce new direct Supabase calls outside repos.
- Avoid speculative schemas or tables; confirm schema definitions in `architecture/schema.md`.
