# [AGENTS.md](http://AGENTS.md) — Autonomous Coding Guide for ACE Backend

This file provides all AI coding agents (including Claude, GPT-5.2-codex, Gemini, and similar models) with the instructions, constraints, project structure, coding standards, and domain knowledge required to safely and effectively contribute to the ACE (Autonomous Content Engine) backend codebase.

This is the **machine-facing companion** to `README.md`.

**Last Updated:** January 2026 (Phase I / M1)

---

## 1. Project Purpose

ACE is an autonomous system that researches trends, generates creative content, publishes it, analyzes performance, and improves itself over time.

The **ACE Backend** is the **intelligence layer** that provides:

- Business logic and decision-making
- LLM-powered content generation and analysis
- Data validation and persistence via repository pattern
- Agent notes for learning loops
- System event logging for observability
- Stable HTTP API contracts for orchestration

The backend is intentionally designed to support **stateless agent services** that are orchestrated by **n8n workflows**.

---

## 2. Architectural Context (December 2025 Update)

### Division of Responsibilities

| **Responsibility** | **Owner** | **Why** |
| --- | --- | --- |
| Workflow orchestration | n8n | Sequencing, timing, external API calls, retries |
| Agent intelligence | Backend | LLM calls, scoring, creative decisions |
| Data validation | Backend | Zod schemas, type safety |
| Data persistence | Backend | Repository pattern, single source of truth |
| Agent notes | Backend | Learning loop, decision rationale |
| Domain events | Backend | Agent lifecycle, domain-specific events |
| Workflow events | n8n | Workflow lifecycle, stage tracking |
| OAuth & tokens | n8n | Platform credentials, token refresh |

### Key Principle

**Agents are stateless HTTP services invoked via API by n8n workflows.**

- Agents do NOT orchestrate other agents
- Agents do NOT contain workflow sequencing logic
- Agents do NOT make decisions about what to do next
- Agents receive input, perform intelligence work, return output

All orchestration logic lives in n8n workflows, not in backend agent code.

---

## 3. Core Principles for AI Coding Agents

AI agents must follow these universal rules when writing or modifying code:

1. **Use repository modules (never raw Supabase client calls).**
2. **Validate all inbound data with Zod schemas.**
3. **Emit system events for visibility and traceability.**
4. **Agents are stateless services—no orchestration logic in agent code.**
5. **Use the existing folder structure and naming conventions.**
6. **Prefer explicit, typed, side-effect-aware functions.**
7. **Never bypass validation, logging, or repository boundaries.**
8. **Return standardized response envelopes from all API endpoints.**
9. **Ask clarifying questions if specifications are unclear—never guess.**

This ensures all generated code aligns with ACE's architecture.

---

## 4. Repository Structure

Agents must respect the structure below.

```
root/
  src/
    agents/          — agent implementations (stateless services)
    services/        — agent service layer (business logic)
    repos/           — typed Supabase repository modules
    schemas/         — Zod validation schemas
    db/              — Supabase types + DB helpers
    utils/           — helpers shared across modules
    lib/             — core utilities (API clients, etc.)
    pages/api/       — Next.js API routes (agent HTTP endpoints)
  supabase/
    migrations/      — SQL migrations
[README.md](http://README.md)            — human-facing project overview
[AGENTS.md](http://AGENTS.md)            — this file
```

Agents must respect these boundaries:

- **All DB access goes through `/src/repos/`**
- **All validation logic lives in `/src/schemas/`**
- **All agent business logic lives in `/src/services/` (agent service classes)**
- **All HTTP endpoints live in `/src/pages/api/`**
- **n8n workflows live in separate `n8n-workflows` repository**

---

## 5. Build and Test Commands

Agents should use these commands when generating instructions for developers:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run test:unit
npm run test:integration
npm run test:unit -- tests/unit/api/system-events-detail.test.ts # example of running an individual test, which you are allowed to do
npm run typecheck
npm run generate:types   # refresh Supabase types
```

If a new migration is created:

```bash
supabase db push
```

---

## File Structure Conventions

### Repository Pattern
- **All repositories MUST be placed in `src/repos/`** (never in `src/lib/api/repositories/` or any other location)
- Repositories are data access patterns used across the entire backend
- Examples: `src/repos/performanceMetrics.ts`, `src/repos/systemEvents.ts`, `src/repos/scripts.ts`
- Never create repositories in API-specific folders

### API Route-Specific Code
- **API route middleware**: `src/lib/api/middleware/`
  - Examples: `apiKeyAuth.ts`, `auth.ts`, `errorHandler.ts`
  - Use for middleware that only applies to Next.js API routes
- **API route utilities**: `src/lib/api/utils/`
  - Examples: `metricsAggregation.ts`, `pagination.ts`, `queryBuilder.ts`
  - Use for utilities exclusively used within `/api` routes

### General/Shared Code
- **General middleware**: `src/middleware/`
  - Examples: `withAuth.ts`
  - Use for middleware that applies across the application
- **General utilities**: `src/utils/`
  - Examples: `env.ts`, `logger.ts`, `storageUploader.ts`
  - Use for utilities shared across the entire codebase

### Decision Tree for File Placement
1. Is it a repository (data access layer)? → `src/repos/`
2. Is it middleware only for API routes? → `src/lib/api/middleware/`
3. Is it a utility only for API routes? → `src/lib/api/utils/`
4. Is it general middleware? → `src/middleware/`
5. Is it a general utility? → `src/utils/`

---

## 6. Coding Standards

AI agents must write TypeScript code that follows these standards:

### TypeScript

- Use explicit return types.
- Use `async`/`await`.
- Prefer pure functions.
- Avoid global state.
- Always handle errors with `try/catch`.
- Use strict TypeScript configuration.

### Naming

- camelCase for variables, functions, repo methods.
- PascalCase for types, Zod schemas, and classes.
- snake_case only for SQL table and column names.
- Descriptive names over abbreviations.

### Repository Patterns

Each repository module must include:

```tsx
create(data)
update(id, data)
findById(id)
findMany(filters)
delete(id)
```

Plus table-specific helpers as needed.

### Validation Patterns

All input must pass through Zod schemas located in `/src/schemas`.

Example:

```tsx
const parsed = CreateScriptSchema.parse(payload)
```

### Response Envelope Pattern

All API endpoints must return a standardized response envelope:

**Success:**

```tsx
{
  success: true,
  data: { ... },
  message?: string
}
```

**Error:**

```tsx
{
  success: false,
  error: {
    code: string,      // ERROR_CODE from standardized list
    message: string,   // Human-readable message
    details?: object   // Optional additional context
  }
}
```

**With Pagination:**

```tsx
{
  success: true,
  data: [...],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    has_more: boolean
  }
}
```

---

## 7. Event Logging Requirements

All agents must log system events.

Use the event taxonomy defined in `architecture/events.md`.

**Agent lifecycle events:**

```
agent.start
agent.success
agent.error
```

**Domain events by agent:**

```
script.generate.start
script.generate.success
script.generate.error

video.render.start
video.render.success
video.render.error

publish.prepare.start
publish.prepare.success
publish.prepare.error
publish.complete.start
publish.complete.success
publish.complete.error
```

**Workflow events (emitted by n8n, not backend):**

```
workflow.start
workflow.stage.start
workflow.stage.success
workflow.stage.error
workflow.end
```

**Event correlation:**

All events must include `correlation_id` and optionally `workflow_id` when available (passed from n8n in request headers `x-correlation-id` and `x-workflow-id`).

**If in doubt, log the event.**

---

## 8. Database Access Rules

The Supabase schema is documented in `architecture/schema.md`.

Rules for all AI agents:

1. Never access Supabase directly.
2. Never write inline SQL in code.
3. Never construct Supabase queries manually.

Use:

```tsx
import { productsRepo } from "@/repos/productsRepo"
```

and call methods like:

```tsx
await productsRepo.create(...)
await scriptsRepo.findById(...)
```

Repositories enforce type safety and validation.

---

## 9. Agent Architecture Pattern

### Agent Service Classes

Business logic lives in service classes in `/src/services/`:

```tsx
// src/services/scriptwriterService.ts
export class ScriptwriterService {
  constructor(
    private scriptsRepo: ScriptsRepo,
    private agentNotesRepo: AgentNotesRepo
  ) {}

  async generateScript(input: GenerateScriptInput): Promise<Script> {
    // 1. Validate input (already done by API route with Zod)
    // 2. Perform business logic (LLM calls, scoring, etc.)
    // 3. Write agent notes
    // 4. Persist via repo
    // 5. Return result
  }
}
```

### API Route Handlers

HTTP endpoints live in `/src/pages/api/`:

```tsx
// src/pages/api/agents/scriptwriter/generate.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    })
  }

  try {
    // 1. Parse and validate input with Zod
    const input = GenerateScriptSchema.parse(req.body)
    
    // 2. Extract correlation tracking from headers
    const correlationId = req.headers['x-correlation-id'] as string | undefined
    const workflowId = req.headers['x-workflow-id'] as string | undefined
    
    // 3. Call service layer
    const service = new ScriptwriterService(scriptsRepo, agentNotesRepo)
    const result = await service.generateScript({
      ...input,
      correlationId,
      workflowId
    })
    
    // 4. Return standardized response
    return res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    // 5. Handle errors with standardized format
    return handleApiError(error, res)
  }
}
```

### No Orchestration in Agents

Agents should NOT:

- Call other agents
- Decide what to do next
- Implement retry logic
- Sequence multiple operations
- Manage workflow state

That's n8n's job.

---

## 10. Agent Notes for Learning Loops

All agents must write agent notes documenting their decisions.

**Purpose:** Enable future agents to learn from past decisions and outcomes.

**Pattern:**

```tsx
await agentNotesRepo.create({
  agent_name: 'ScriptwriterAgent',
  topic: 'script_generation',
  content: `
    Generated script ${scriptId} for product ${productId}.
    
    Creative pattern: ${patternName}
    Trend context: ${trendTopic}
    
    Decisions made:
    - Hook strategy: ${hookStrategy}
    - Tone: ${tone}
    - CTA placement: ${ctaPlacement}
    
    Hypothesis: This script should perform well because ${reasoning}
  `,
  entity_type: 'script',
  entity_id: scriptId,
  correlation_id: correlationId
})
```

Agent notes are structured text (markdown-friendly) that future analytics agents can query and learn from.

---

## 11. Current Agent Implementations (Phase I / M1)

### ScriptwriterAgent (UPGRADED)

**Status:** V2 implementation complete (December 2025)

**Endpoint:** `POST /api/agents/scriptwriter/generate`

**Capabilities:**

- Generates video scripts using LLM pipeline
- Integrates creative patterns and trend data
- Multi-stage refinement (draft → refine → polish)
- Writes detailed agent notes with creative rationale
- Emits script.generate.* events

**Recent Changes:**

- Refactored LLM pipeline for multi-stage generation
- Enhanced creative pattern integration
- Improved schema with creative_variables
- Added agent service layer separation

**Reference:** `src/services/scriptwriterService.ts`, `src/pages/api/agents/scriptwriter/generate.ts`

### EditorAgent

**Status:** Phase I implementation complete

**Endpoint:** `POST /api/agents/editor/render`

**Capabilities:**

- Renders video assets from scripts
- Applies style templates and compositions
- Uploads to Supabase Storage
- Returns signed URLs
- Emits video.render.* events

**Reference:** `src/services/editorService.ts`, `src/pages/api/agents/editor/render.ts`

### PublisherAgent (HYBRID MODEL)

**Status:** Refactoring to hybrid architecture (January 2026)

**Endpoints:**

- `POST /api/agents/publisher/prepare` — validate, decide, generate metadata
- `POST /api/agents/publisher/complete` — record outcome, persist data

**Architecture:**

- **Backend (prepare):** Validates experiment, checks asset requirements, generates platform-specific metadata, writes agent notes, makes publishing decision
- **n8n:** Handles actual platform publishing (OAuth, upload, API calls)
- **Backend (complete):** Records published post, updates experiment, writes outcome notes

**Key Insight:** n8n has native platform nodes (TikTok, YouTube, etc.) — we leverage those instead of rebuilding platform integrations in backend.

**Reference:** Recent architecture doc on hybrid publishing model

---

## 12. Domain Glossary

Key terms AI agents need to understand:

- **Product** – the core item ACE generates content for.
- **Script** – generated creative text (hook, body, CTA).
- **Video Asset** – rendered content from scripts.
- **Experiment** – a combination of product + script + asset + hypothesis.
- **Published Post** – content posted on external platforms.
- **Performance Metrics** – engagement and results from published posts.
- **Creative Patterns** – reusable creative structures identified from analytics.
- **Trend Snapshot** – trend data aggregated over time.
- **Agent Notes** – logged decision rationale for learning loops.
- **System Event** – logged action representing agent or system behavior.
- **Workflow** – n8n-orchestrated multi-step pipeline.
- **Correlation ID** – UUID for tracing related operations across services.
- **Workflow ID** – UUID identifying a specific workflow execution.

---

## 13. Adding a New Agent (AI Workflow Checklist)

AI agents must follow this sequence when adding a new ACE agent:

1. Read `/architecture/agents/<Agent>.md` specification.
2. Create Zod schemas in `/src/schemas/`.
3. Create or update repo modules in `/src/repos/` if needed.
4. Create agent service class in `/src/services/`.
5. Create API route handler in `/src/pages/api/agents/<agent-name>/`.
6. Implement event logging throughout.
7. Implement agent notes at key decision points.
8. Write tests for service layer and API routes.
9. Update this [AGENTS.md](http://AGENTS.md) file with new agent details.
10. Create n8n workflow in `n8n-workflows` repo to orchestrate agent (if needed).

Agents should never skip validation, event logging, agent notes, or repo creation.

---

## 14. Error Handling Standards

### Standardized Error Codes

Use these error codes in API responses:

- `UNAUTHORIZED` (401) - Authentication required or invalid
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request parameters (Zod validation failure)
- `INTERNAL_ERROR` (500) - Server error
- `AGENT_ERROR` (500) - Agent execution failure
- `WORKFLOW_ERROR` (500) - Workflow execution failure
- `DATABASE_ERROR` (500) - Database operation failure
- `EXTERNAL_API_ERROR` (502) - External service failure
- `RATE_LIMITED` (429) - Too many requests

### Error Response Format

```tsx
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid product_id format',
    details: {
      field: 'product_id',
      expected: 'uuid',
      received: 'abc123'
    }
  }
}
```

### Error Handling in Code

```tsx
try {
  // Operation
} catch (error) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.flatten()
      }
    })
  }
  
  // Log error
  await logSystemEvent({
    event_type: 'agent.error',
    severity: 'error',
    payload: { error: error.message, stack: error.stack }
  })
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'AGENT_ERROR',
      message: 'Agent execution failed',
      details: { error: error.message }
    }
  })
}
```

---

## 15. Integration with n8n Workflows

### How n8n Calls Backend Agents

n8n workflows invoke agents via HTTP Request nodes:

```json
{
  "method": "POST",
  "url": "${ACE_BACKEND_URL}/api/agents/scriptwriter/generate",
  "headers": {
    "x-api-key": "${ACE_API_KEY}",
    "x-correlation-id": "${correlationId}",
    "x-workflow-id": "${workflowId}"
  },
  "body": {
    "product_id": "uuid",
    "creative_pattern_id": "uuid",
    "trend_snapshot_id": "uuid"
  }
}
```

### Authentication for Agent vs User Endpoints

- Agent endpoints accept either `Authorization: Bearer <token>` or `x-api-key: <ACE_API_KEY>`.
- User-facing endpoints (experiments, artifacts, workflows, etc.) require bearer tokens only.

### What Backend Should Provide

- **Stable API contracts** — don't break endpoints n8n depends on
- **Standardized response envelopes** — n8n expects `{success, data, error}`
- **Proper HTTP status codes** — 2xx for success, 4xx for client errors, 5xx for server errors
- **Idempotent operations where possible** — same input → same output
- **Fast response times** — n8n has timeout limits (30s default)

### What Backend Should NOT Do

- **Don't orchestrate workflows** — that's n8n's job
- **Don't call other agents** — n8n sequences the calls
- **Don't implement retry logic** — n8n handles retries
- **Don't manage OAuth tokens** — n8n handles platform credentials

---

## 16. Testing Guidelines

### Unit Tests

Test individual functions and services:

```tsx
describe('ScriptwriterService', () => {
  it('should generate a valid script', async () => {
    const service = new ScriptwriterService(mockRepo, mockNotesRepo)
    const result = await service.generateScript(mockInput)
    expect(result).toHaveProperty('script_id')
    expect(result.script_text).toContain('hook')
  })
})
```

### Integration Tests

Test API routes end-to-end:

```tsx
describe('POST /api/agents/scriptwriter/generate', () => {
  it('should return 200 with valid script', async () => {
    const res = await request(app)
      .post('/api/agents/scriptwriter/generate')
      .send(validInput)
      .set('x-api-key', API_KEY)
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect([res.body.data](http://res.body.data)).toHaveProperty('script_id')
  })
})
```

### Mock External Dependencies

- Mock Supabase client
- Mock LLM API calls
- Mock storage operations
- Use deterministic UUIDs in tests

---

## 17. When an AI Agent Is Uncertain

If the agent does not understand:

- a missing type
- an ambiguous specification
- conflicting instructions
- outdated schema
- unclear input
- unsafe action

It must:

1. Stop
2. Ask a clarifying question
3. Propose a plan
4. Wait for confirmation

**Never guess. Never hallucinate. Never write broken code to "get close".**

Provide explanations with code so the developer can review reasoning.

---

## 18. Prompting Guidelines for This Codebase

When prompting AI coding agents to work on ACE backend:

### Provide Context

- Reference this [AGENTS.md](http://AGENTS.md) file
- Link to agent specification docs
- Clarify which agent or endpoint is being modified

### State Constraints

- "Must use Zod for validation"
- "Must use repository pattern, no direct Supabase"
- "Must emit events at key points"
- "Must write agent notes for decisions"
- "Must return standardized response envelope"
- "Agents are stateless HTTP services—no orchestration logic"

### Describe Requirements

Focus on **what** needs to happen, not **how** to code it:

- "Generate a script that matches a creative pattern and trend context"
- "Validate that the experiment exists and the asset meets platform requirements"
- "Record the publishing outcome and update the experiment"

### Include Examples

Show data structures (what the API returns), not implementation:

```tsx
// Expected output format:
{
  script_id: "uuid",
  hook: "string",
  script_text: "string",
  creative_variables: { ... }
}
```

### Request Comprehensive Output

- "Include all necessary imports"
- "Handle errors with try/catch"
- "Return standardized response envelope"
- "Include TypeScript types"
- "Write agent notes documenting decisions"

### Allow Explanations

Do NOT include "respond without explanation" in prompts.

Explanations help with:

- Understanding agent reasoning
- Reviewing implementation choices
- Catching potential issues
- Learning from the agent's approach

---

## 19. Key Reference Documents

AI agents should be familiar with these architecture documents:

- ACE Backend API Reference — Full API documentation
- ACE Architecture Update: Introduction of n8n Orchestration Layer — Architectural context
- Publisher Agent Architectural Update: Hybrid n8n-Backend Model — Publishing architecture
- Prompting Coding Models to Generate n8n Workflows — n8n workflow patterns

---

## 20. Summary

This [`AGENTS.md`](http://AGENTS.md) file gives AI agents the conventions, boundaries, and architectural rules needed to work effectively inside the ACE backend.

**Core Principles:**

1. Agents are **stateless HTTP services**
2. n8n handles **orchestration**, backend handles **intelligence**
3. Follow the **repository pattern** for all data access
4. Validate inputs with **Zod schemas**
5. Emit **system events** for observability
6. Write **agent notes** for learning loops
7. Return **standardized response envelopes**
8. Ask questions when uncertain—**never guess**

This ensures stability, traceability, and scalable multi-agent collaboration.

---

## 21. Architecture Documentation in Notion

ACE architecture specifications and planning documents live in **Notion**, not in this repository.

### Why Notion?

- **Single source of truth** — Architecture docs are maintained in Notion where planning happens
- **No drift risk** — Avoids keeping docs in sync between Notion and the repo
- **Direct access** — Coding agents with Notion MCP can query specs on demand

### What's in Notion (Not in Repo)

- **Agent specifications** — Detailed specs for each agent 
- **Workflow definitions** — Workflow specs for n8n orchestration 
- **Agent upgrade plans** — Historical planning and engineering design docs
- **Current implementation tasks** — Roadmap, milestones, task database

### Accessing Notion Documentation

**For Codex and MCP-enabled coding agents:**

Use the Notion MCP to search and retrieve architecture documents from **The Synthetic Mirror Studio** workspace when needed.

Example queries:

- "Show me the EditorAgent specification"
- "Show me the engineering documents related to the Coding Prompt: '...'?"
- "Find the latest Scriptwriter Agent upgrade plan"

**For other coding agents:**

Architecture context has been consolidated into this file. If you need detailed agent specifications or workflow definitions, request them from the developer.

### What's in This Repo

- [**`AGENTS.md`**](http://AGENTS.md) (this file) — Coding conventions, patterns, and architectural principles
- **`tests/[README.md](http://README.md)`** — Testing setup and conventions
- **`src/api/[README.md](http://README.md)`** — API endpoint documentation
- **Code** — All implementation code, schemas, repos, services, and agents

**For questions about this guide or ACE architecture, consult:**

- Recent Engineering Documents (last 2 weeks)
- Completed roadmap tasks
- Architecture documentation in the ACE Command Center's Engineering Documents.
