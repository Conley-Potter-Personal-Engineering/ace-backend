# Scriptwriter Agent V2 Engineering Plan

Created by: Conley Potter
Created time: December 11, 2025 7:49 AM
Category: Agent Upgrades
Last edited by: Conley Potter
Last updated time: December 27, 2025 7:12 AM
GPT Author: ACE Engineer

## 🧭 Orientation Summary

### Current State

- **ScriptwriterAgent (v1)** already extends `BaseAgent`, emits lifecycle and domain events (`script.generate.*`), and writes validated `scripts` via the repo.
- It currently **lacks enrichment** from:
    - `trend_snapshots` (ResearchAgent output)
    - `creative_patterns`
    - prior `agent_notes`
- Output is a **raw script string**, not a structured creative object.

### V2 Goal (per Roadmap)

Add richer creative intelligence by integrating structured contextual inputs and structured outputs.

---

## ✍️ ScriptwriterAgent V2 — Engineering Plan

### 1. Architectural Layer Touchpoints

| Layer | Required Update | Reference |
| --- | --- | --- |
| **Schemas** | Update input schema (`ScriptWriterInput`) and define new output schema (`ScriptOutput`) including `title`, `hook`, `cta`, `outline`, `body`. | Backend Conventions §3 |
| **Repos** | Ensure `scriptsRepo` supports storing structured JSON metadata fields (`patternUsed`, `trendReference`, `creativeVariables`). | Data Backbone §3.1 |
| **LLM Chain** | Replace `scriptwriterChain.ts` with a chain that accepts structured trend + pattern context and returns schema-validated output. | Backend Conventions §5 |
| **Agent** | Update `ScriptwriterAgent` implementation to: 
• validate inputs
• fetch context
• call chain
• persist script + notes
• emit `script.generate.*` events. | Agents Overview §1 |
| **Events** | Maintain lifecycle + domain events per taxonomy (`agent.start/success/error`, `script.generate.start/success/error`). | Event Taxonomy §4.1 |
| **Tests** | Add unit + integration tests with mocks for repos and LLM chain. | Backend Conventions §11 |

---

### 2. Task Breakdown

### (a) Schemas – `src/schemas/scriptwriterSchemas.ts`

```tsx
import { z } from "zod";

export const ScriptWriterV2Input = z.object({
  productId: z.string(),
  trendSnapshotIds: z.array(z.string()).optional(),
  patternIds: z.array(z.string()).optional(),
  creativeVariables: z.record(z.string(), z.string()).optional(),
});

export const ScriptOutput = z.object({
  title: z.string(),
  hook: z.string(),
  cta: z.string(),
  outline: z.array(z.string()),
  body: z.string(),
});

```

This enables typed IO for the LLM chain and repo writes.

---

### (b) LLM Chain – `src/llm/chains/scriptwriterChain.ts`

- Accepts `product`, `trendSnapshots`, `creativePatterns`, `creativeVariables`.
- Returns structured JSON matching `ScriptOutput`.
- Validate output with `ScriptOutput.safeParse`.

---

### (c) Agent Implementation – `src/agents/scriptwriter/scriptwriterAgentV2.ts`

Follows `BaseAgent` contract:

1. **Emit** `agent.start` + `script.generate.start`.
2. **Fetch** product, patterns, trends, recent notes via repos.
3. **Call** `scriptwriterChainV2`.
4. **Persist** new script via `scriptsRepo.create`.
5. **Write** rationale note to `agent_notesRepo`.
6. **Emit** `script.generate.success` + `agent.success`.
7. **Catch** errors → emit `script.generate.error` + `agent.error`.

---

### (d) Tests – `src/agents/scriptwriter/__tests__/scriptwriterAgentV2.test.ts`

- Mock repos and LLM chain.
- Verify correct event emission order.
- Validate schema enforcement and successful script creation.

---

### 3. Implementation Prompt Template for Codex

When generating code, use the **Codex Prompting Best Practices** default template:

```
You are writing code for the ACE system.

Task:
Implement ScriptwriterAgent V2 in src/agents/scriptwriter/scriptwriterAgentV2.ts

Requirements:
- extend BaseAgent
- use Zod validation (ScriptWriterV2Input, ScriptOutput)
- call repositories (productsRepo, creativePatternsRepo, trendSnapshotsRepo, scriptsRepo, agentNotesRepo)
- call LLM chain (scriptwriterChainV2)
- emit events: agent.start/success/error and script.generate.start/success/error
- persist structured output and rationale
- include all imports and exports

```

---

### 4. Integration Points

- **Workflow:** Content Cycle → step 2 uses ScriptwriterAgent V2
- **Data:** writes to `scripts` and `agent_notes`
- **Events:** recorded in `system_events`

---

### 5. Deliverables (Phase I Acceptance)

| Deliverable | Success Signal |
| --- | --- |
| `scriptwriterSchemas.ts` | Typecheck ✓ |
| `scriptwriterChainV2.ts` | Returns validated `ScriptOutput` ✓ |
| `scriptwriterAgentV2.ts` | Emits all lifecycle + domain events ✓ |
| Tests | Pass locally + in CI ✓ |
| Docs | AGENTS.md updated for V2 ✓ |

[Codex Prompts](Scriptwriter%20Agent%20V2%20Engineering%20Plan/Codex%20Prompts%202c6be295a73e80bb8df9ec0c65cc379d.csv)