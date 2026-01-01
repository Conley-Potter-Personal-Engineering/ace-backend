# Scriptwriter Agent Pipeline Technical Audit

Created by: Conley Potter
Created time: December 27, 2025 6:46 AM
Category: Agent Upgrades, Planning
Last edited by: Conley Potter
Last updated time: December 30, 2025 6:35 AM
GPT Author: ACE Engineer

## 🧩 Technical Audit — `ScriptwriterAgent` Pipeline

**Architecture Note (December 2025):** This audit has been updated to reflect the **n8n orchestration architecture**. ScriptwriterAgent is now a **domain intelligence unit** invoked via HTTP API by n8n workflows. All agents are **stateless or minimally stateful**, focused on business logic, LLM calls, and scoring. **Orchestration (sequencing, timing, retries) lives in n8n**, not in the agent.

---

### 1. `ScriptwriterAgent.ts` — Agent Intelligence Layer

**Current:**

- Invoked via HTTP API by n8n workflow
- Receives product, pattern, and trend data as API input
- Creates a `scriptRequest` DTO and runs [`scriptwriterChain.run](http://scriptwriterChain.run)()`
- Emits basic `script.generate.\*` events
- Writes script row to DB
- Returns result to n8n caller

**Architecture Alignment:**

- Agent is a **stateless service** - n8n handles workflow state
- Agent is **invoked via API** - n8n calls `/api/agents/scriptwriter/run` (or similar)
- Agent **does not orchestrate** - n8n handles sequencing, retries, external I/O
- Agent **focuses on intelligence** - business logic, LLM calls, data normalization

**Issues & Opportunities**

| Category | Observed | Optimization |
| --- | --- | --- |
| **Data Depth** | Uses only top-level `product` fields (name, description). | Inject the products’ full `meta` JSON (key_features, objections, demo_ideas, compliance) into DTO. |
| **Pattern Usage** | Uses only `hook_text` and `structure`. | Include `emotion_tags`, `style_tags`, and `observed_performance` in the chain input. |
| **Trend Influence** | Uses `tiktok_trend_tags` superficially. | Pass `popularity_score`, `velocity_score` and `trend_tags` to help model choose pacing and tone. |
| **Event Payloads** | Emits start/success/error, but payloads omit pattern/trend IDs. | Extend payload with `{ productId, patternId, trendSnapshotId }` per event taxonomy . |
| **Agent Notes** | Rarely writes rationale. | After success, call `BaseAgent.storeNote()` summarizing rationale and creative decisions. |

✅ **Refactor actions**

- Extend DTO schema (`agentSchemas.ts`) to accept deep product meta, pattern details, and trend stats
- Enhance event payloads to include `workflow_id` and `correlation_id` (top-level fields per updated schema)
- Add rationale notes on success
- Follow agent lifecycle standards (`agent.start`, `agent.success`, `agent.error`)
- **Expose clean HTTP API endpoint** for n8n to invoke (e.g., `POST /api/agents/scriptwriter/run`)
- **Return typed response** to n8n with success/error status and script data
- **Agent should be stateless** - no workflow state management in agent code

---

### 2. `scriptwriterChain.ts` — LLM Coordination Layer

**Current:**

- Calls `buildPrompt(product, pattern, trend)` from `scriptwriterPrompt`.
- Sends to model and parses result.
- No fallback or structured retries.

**Issues & Opportunities**

| Category | Observed | Optimization |
| --- | --- | --- |
| **Prompt Construction** | Flat injection, lacks role or sections. | Use structured template: system role, product brief, creative pattern, trend insight, compliance. |
| **Validation** | Parser output only checked for non-empty text. | Wrap with Zod schema for `hook`, `outline`, `cta`, and `creative_variables`. |
| **Fallbacks** | None. | Add retry with simplified prompt on truncation or model error. |
| **Model Context Control** | No control over model temperature (gpt-4o, ie), or reasoning_effort and verbosity (gpt-5, ie) | Tune model params dynamically (e.g., higher temperature if pattern style = “playful”). |

✅ **Refactor actions**

- Split chain into `buildPrompt() → runModel() → parseAndValidate()`.
- Add fallback branch with compressed prompt version.
- Use typed Zod schema validation (aligns with backend conventions §3 Schemas Layer).
- Add the ability to control the model’s temperature, reasoning_effort, or verbosity. The first parameter is for the gpt-4o model and others, while the last two parameters apply to gpt-5. We will need to switch on the model provided to control these parameters.

---

### 3. `scriptwriterPrompt.ts` — Prompt Template Layer

**Current:**

- Simple text prompt with product name and a one-liner about the product.
- Optional hook/structure, maybe trend hashtags.

**Issues & Opportunities**

| Category | Observed | Optimization |
| --- | --- | --- |
| **Product Context** | Ignores most of `meta`. | Add explicit sections: `Key Features`, `Demo Ideas`, `Objections`, `Compliance`. |
| **Creative Pattern Context** | Only uses hook/structure. | Include style + emotion tags and performance insight (e.g., “above-avg watch retention”). |
| **Trend Context** | Tags appended raw. | Reframe as creative guidance: “Incorporate CleanTok pacing and Before/After transitions.” |
| **Prompt Structure** | Unstructured text. | Convert to multi-section JSON template for LLM clarity:  `{ product: {...}, pattern: {...}, trend: {...}, instructions: [...] }` |
| **Few-Shot Examples** | None. | Add few-shot examples of high-performing scripts per structure (e.g., problem-solution, demo-proof-CTA). |

✅ **Refactor actions**

- Implement structured prompt builder with explicit sections.
- Support multi-pattern context (choose highest performance pattern).
- Add compliance section (“Avoid claims: …”).
- Use `Codex Prompting Best Practices` — state constraints, include examples, keep task atomic .

---

### 4. `scriptwriterParser.ts` — Output Validation Layer

**Current:**

- Regex or heuristic extraction of hook.
- Basic string output validation.

**Issues & Opportunities**

| Category | Observed | Optimization |
| --- | --- | --- |
| **Schema Validation** | Minimal. | Replace with strict Zod schema: `hook`, `outline[]`, `script_text`, `creative_variables`. |
| **Creative Variables Extraction** | Usually null. | Parse JSON section if present (tone, patternId, trendTags). |
| **Error Handling** | No structured errors. | Emit `script.generate.error` on parse failure + log details. |
| **Output Consistency** | Not enforcing tone/format. | Normalize output (trim, ensure outline numbering). |

✅ **Refactor actions**

- Define `ScriptOutputSchema` with Zod.
- Wrap parse in try/catch that emits `agent.error` event on failure.
- Save `creative_variables` for EditorAgent reuse.

---

### 5. `agentSchemas.ts` — DTO Validation

Add or extend:

```tsx
exportconstScriptRequestSchema = z.object({
product:ProductSchema,
pattern:CreativePatternSchema.nullable(),
trend:TrendSnapshotSchema.nullable(),
});

```

and enrich ProductSchema to ensure nested `meta` keys are typed (e.g., `key_features: string[]`).

---

### 6. `patternsSchema.ts`, `trendsSchema.ts`, `productsSchema.ts`

Ensure they align with new fields:

- `creative_patterns`: add `emotion_tags`, `style_tags`, `observed_performance`.
- `trend_snapshots`: add normalized numeric fields for scores.
- `products`: expand `meta` sub-schema.

---

### 7. Eventing and Notes

**Required per event taxonomy (updated for n8n architecture)**

**New schema fields (top-level):**

- `workflow_id` - n8n workflow execution ID (passed from n8n)
- `correlation_id` - for cross-system tracing
- `agent_name` - "ScriptwriterAgent"

```tsx
// Receive workflow_id and correlation_id from n8n in API request
const { workflow_id, correlation_id } = req.body;

awaitemitEvent("script.generate.start", {
  agent_name: "ScriptwriterAgent",
  workflow_id,
  correlation_id,
  payload: { productId, patternId, trendSnapshotId }
});

awaitemitEvent("script.generate.success", {
  agent_name: "ScriptwriterAgent",
  workflow_id,
  correlation_id,
  payload: { scriptId, productId, patternId, trendSnapshotId }
});

awaitemitEvent("script.generate.error", {
  agent_name: "ScriptwriterAgent",
  workflow_id,
  correlation_id,
  payload: { productId, patternId, trendSnapshotId, error }
});
```

and after success:

```tsx
awaitstoreNote({
  agent_name: "ScriptwriterAgent",
  topic: "script_generation_rationale",
  content: `Used pattern ${patternId} (${pattern.structure}), trend tags ${trend.tiktok_trend_tags}`,
  importance: 0.7,
});
```

---

## 🧠 Cross-Layer Alignment Checklist

| Goal | Implementation Layer | Alignment Reference |
| --- | --- | --- |
| **n8n orchestration** | n8n workflow calls agent via HTTP API | Architecture Update: n8n Orchestration Layer |
| **Stateless agent** | `ScriptwriterAgent.ts` (no workflow state) | Agents Overview §9 (agents are intelligence units, not orchestrators) |
| **Clean API interface** | `POST /api/agents/scriptwriter/run` | Backend Conventions §8 HTTP API Layer |
| **Updated event schema** | `system_events` with `workflow_id`, `correlation_id` | Event Taxonomy §1 (updated schema) |
| **Richer creative input** | `ScriptwriterAgent` → DTO → Prompt | Data Backbone §2 Products & Creative Patterns |
| **Structured prompt** | `scriptwriterPrompt.ts` | Codex Prompting Best Practices §1–5 (updated for n8n) |
| **Validated output schema** | `scriptwriterParser.ts` | Backend Conventions §3 Schemas Layer |
| **Traceable events** | `ScriptwriterAgent.ts` | Event Taxonomy §4.1 Script events |
| **Observability + learning loop** | `system_events` + `agent_notes` | Agents Overview §1 ScriptwriterAgent |

---

## 🚀 Recommended Implementation Sequence (Updated for n8n Architecture)

1. **Schema pass** — update `productsSchema`, `patternsSchema`, `trendsSchema`, and `agentSchemas` with new fields
2. **API interface** — ensure agent exposes clean HTTP endpoint (e.g., `POST /api/agents/scriptwriter/run`) that accepts:
    - Product, pattern, trend data
    - `workflow_id` and `correlation_id` from n8n
    - Returns typed response with script data or error
3. **Event schema update** — use new `system_events` schema with top-level `workflow_id`, `correlation_id`, `agent_name`
4. **Prompt refactor** — build structured prompt generator
5. **Parser upgrade** — Zod validation + creative_variables extraction
6. **Chain logic** — add fallback + typed validation (note: **retries handled by n8n**, not in agent)
7. **Agent refactor** — extend DTO + richer event payloads + agent_notes + **stateless design**
8. **Integration tests** — verify:
    - n8n → API call → agent run → DB row → events → response to n8n
    - Agent is stateless (no workflow state)
    - Events include `workflow_id` and `correlation_id` for n8n tracing

**Key Principle:** Agent handles **intelligence** (LLM calls, business logic, scoring). n8n handles **orchestration** (sequencing, retries, external API calls).