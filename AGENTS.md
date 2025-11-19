# AGENTS.md — Autonomous Coding Guide for ACE

This file provides all AI coding agents (including OpenAI Codex-style agents) with the instructions, constraints, project structure, coding standards, and domain knowledge required to safely and effectively contribute to the ACE (Autonomous Content Engine) codebase.

This is the **machine-facing companion** to `README.md`.

---

# 1. Project Purpose

ACE is an autonomous system that researches trends, generates creative content, publishes it, analyzes performance, and improves itself over time.  
The codebase is organized intentionally to support **multi-agent collaboration**, **workflow orchestration**, and **typed, validated, safe database access**.

Agents interacting with this repository should follow all instructions in this document.

---

# 2. Core Principles for AI Coding Agents

AI agents must follow these universal rules when writing or modifying code:

1. **Use repository modules (never raw Supabase client calls).**  
2. **Validate all inbound data with Zod schemas.**  
3. **Emit system events for visibility and traceability.**  
4. **Extend the BaseAgent class when creating new agents.**  
5. **Use the existing folder structure and naming conventions.**  
6. **Prefer explicit, typed, side-effect-aware functions.**  
7. **Never bypass validation, logging, or repository boundaries.**  
8. **Never write broken code “just to get close”. Ask clarifying questions if needed.**  

This ensures all generated code aligns with ACE’s architecture.

---

# 3. Repository Structure

Agents must respect the structure below.

```
root/
  src/
    agents/          — agent implementations
    workflows/       — workflow engine and definitions
    repos/           — typed Supabase repository modules
    schemas/         — Zod validation schemas
    db/
      migrations/    — SQL migrations
    utils/           — helpers shared across modules
    core/
      BaseAgent.ts   — base class for all agents
architecture/
  agents/            — agent specification documents
  workflows/         — workflow definition documents
  schema.md          — full database schema
  events.md          — system event taxonomy
README.md            — human-facing project overview
AGENTS.md            — this file
```

Agents must respect these boundaries:

• **All DB access goes through `/src/repos/`**  
• **All validation logic lives in `/src/schemas/`**  
• **All agent classes live in `/src/agents/`**  
• **Workflow logic lives in `/src/workflows/`**

---

# 4. Build and Test Commands

Agents should use these commands when generating instructions for developers:

```
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run generate:types   (refresh Supabase types)
```

If a new migration is created:

```
supabase db push
```

---

# 5. Coding Standards

AI agents must write TypeScript code that follows these standards:

### TypeScript
• Use explicit return types.  
• Use `async`/`await`.  
• Prefer pure functions.  
• Avoid global state.  
• Always handle errors with `try/catch`.

### Naming
• camelCase for variables, functions, repo methods.  
• PascalCase for types, Zod schemas, and classes.  
• snake_case only for SQL table and column names.

### Repository Patterns
Each repository module must include:

```
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

```
const parsed = CreateScriptSchema.parse(payload)
```

---

# 6. Event Logging Requirements

All agents must log system events using `BaseAgent.logEvent()`.

Use the event taxonomy defined in `architecture/events.md`.

Required lifecycle events for all agents:

```
agent.start
agent.success
agent.error
```

Workflows require:

```
workflow.start
workflow.stage.start
workflow.stage.success
workflow.stage.error
workflow.end
```

Domain events include:

```
script.generate.*
video.render.*
publish.*
analytics.*
trends.*
system.*
```

**If in doubt, log the event.**

---

# 7. Database Access Rules

The Supabase schema is documented in `architecture/schema.md`.

Rules for all AI agents:

1. Never access Supabase directly.  
2. Never write inline SQL in code.  
3. Never construct Supabase queries manually.  

Use:

```
import { productsRepo } from "../repos/productsRepo"
```

and call methods like:

```
await productsRepo.create(...)
await scriptsRepo.findById(...)
```

Repositories enforce type safety and validation.

---

# 8. Workflow Rules

The workflow runner expects agents to:

• validate inputs  
• emit stage events  
• return predictable outputs  
• throw typed errors when appropriate  
• never perform long blocking work without logging progress  

Workflows are declarative and defined in `/architecture/workflows`.

---

# 9. Adding a New Agent (AI Workflow Checklist)

AI agents must follow this sequence when adding a new ACE agent:

1. Read `/architecture/agents/<Agent>.md`.  
2. Create Zod schemas in `/src/schemas/`.  
3. Create repo modules if needed.  
4. Create the agent class in `/src/agents/`.  
5. Extend `BaseAgent`.  
6. Implement event logging.  
7. Add tests.  
8. Register workflow steps if applicable.

Agents should never skip validation, event logging, or repo creation.

---

# 10. Domain Glossary

Key terms AI agents need to understand:

• **Product** – the core item ACE generates content for.  
• **Script** – generated creative text.  
• **Video Asset** – rendered content from scripts.  
• **Experiment** – a combination of script + asset + post.  
• **Published Post** – content posted on external platforms.  
• **Performance Metrics** – engagement and results.  
• **Creative Patterns** – reusable creative structures identified from analytics.  
• **Trend Snapshot** – trend data aggregated over time.  
• **System Event** – logged action representing agent behavior.  
• **Workflow** – multi-step pipeline executed by multiple agents.  

---

# 11. When an AI Agent Is Uncertain

If the agent does not understand:

• a missing type  
• an ambiguous specification  
• conflicting instructions  
• outdated schema  
• unclear input  
• unsafe action  

It must:

1. stop  
2. ask a clarifying question  
3. propose a plan  
4. wait for confirmation  

Never guess.

---

# 12. Summary

This `AGENTS.md` file gives AI agents the conventions, boundaries, and architectural rules needed to work effectively inside ACE.  
Follow the repo structure, validate inputs, emit system events, and rely on repository modules for all data access.

This ensures stability, traceability, and scalable multi-agent collaboration.

