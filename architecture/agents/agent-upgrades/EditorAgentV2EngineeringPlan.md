# Editor Agent V2 Engineering Plan

Created by: Conley Potter
Created time: December 13, 2025 10:31 AM
Category: Agent Upgrades
Last edited by: Conley Potter
Last updated time: December 27, 2025 7:12 AM
GPT Author: ACE Engineer

---

## 🎬 EditorAgent (V2) — Implementation Blueprint

## 1. Objective

Upgrade **EditorAgent** to a structured, event-driven version that:

- Converts validated script content into a structured video asset.
- Integrates **style templates**, **composition metadata**, and **storage upload**.
- Emits standardized **system and domain events** (`video.render.*`, `agent.*`).
- Persists complete asset records to the `video_assets` table with full metadata.

This completes the mid-pipeline stage of the Phase I Content Cycle (`Scriptwriter → Editor → Publisher`).

---

## 2. Core Responsibilities by Layer

| Layer | Role | Change Summary |
| --- | --- | --- |
| **Schemas** | Define and export I/O for EditorAgent | Add EditorRequestSchema + VideoAssetSchema in `agentSchemas.ts`; re-export via new `editorSchema.ts` |
| **Repositories** | Persist generated assets | Extend `video_assetsRepo` with create/findByScriptId and full metadata support |
| **LLM / Render Chain** | Style-aware render specification | Update `editorChain.ts` to produce structured output from script + composition metadata |
| **Utility Layer** | File uploads | Add `storageUploader.ts`  |
| **Agent Layer** | Orchestrate end-to-end rendering | Upgrade `EditorAgent.ts` with validation, uploads, repo persistence, event emission |
| **Events** | Observability | Emit per-taxonomy lifecycle and error events |
| **Testing** | Reliability | Add Vitest unit + integration tests |
| **Docs** | Clarity | Update `AGENTS.md` with style metadata, retry policy, and storage behavior |

---

## 3. Architecture Flow

```
scriptsRepo ─▶ EditorAgent ─▶ editorChain ─▶ storageUploader ─▶ video_assetsRepo
     ▲             │                   │                    │
     │             │                   │                    │
  Script Data   Composition + Style   Render Spec     Persisted Asset

```

---

## 4. Implementation Breakdown

### 🧩 Step 1 — Schema Layer

**Files**

- `src/schemas/agentSchemas.ts` — defines schema logic
- `src/schemas/editorSchema.ts` — re-exports editor-related schemas and types

**In `agentSchemas.ts`**

```tsx
// EditorAgent schemas (defined within the consolidated file)
import { z } from "zod";

export const EditorRequestSchema = z.object({
  scriptId: z.string(),
  composition: z.object({
    duration: z.number().positive(),
    tone: z.string(),
    layout: z.string(),
  }),
  styleTemplateId: z.string().optional(),
  renderBackend: z.enum(["local", "s3", "supabase"]).default("supabase"),
});

export const VideoAssetSchema = z.object({
  id: z.string().uuid().optional(),
  scriptId: z.string(),
  storageUrl: z.string().url(),
  duration: z.number(),
  tone: z.string(),
  layout: z.string(),
  styleTags: z.array(z.string()).optional(),
});

```

**In `editorSchema.ts`**

```tsx
export {
  EditorRequestSchema,
  VideoAssetSchema,
  type EditorRequest,
  type VideoAsset,
} from "./agentSchemas";

```

This mirrors the `scriptwriterAgentSchema.ts` pattern exactly.

---

### 🧱 Step 2 — Repository Layer

**File:** `src/repos/video_assetsRepo.ts`

Add or confirm:

```tsx
export const video_assetsRepo = {
  async create(payload: InsertVideoAssetDTO) { /* insert validated asset */ },
  async findByScriptId(scriptId: string) { /* select by scriptId */ },
};

```

Zod-validate `payload` against `VideoAssetSchema` before insertion.

---

### ⚙️ Step 3 — Utility Layer

**File:** `src/utils/storageUploader.ts`

Encapsulate all file-storage logic:

```tsx
export async function storageUploader(file: Buffer, backend: "supabase" | "s3") {
  try {
    if (backend === "supabase") return await uploadToSupabase(file);
    if (backend === "s3") return await uploadToS3(file);
    throw new Error("Unsupported backend");
  } catch (err) {
    throw new Error(`Upload failed: ${err.message}`);
  }
}

```

Supports local mock for tests.

---

### 🤖 Step 4 — Agent Layer

**File:** `src/agents/editor/editorAgent.ts`

Responsibilities:

1. Validate input with `EditorRequestSchema`
2. Emit `agent.start` + `video.render.start`
3. Retrieve script via `scriptsRepo.findById`
4. Pass data into `editorChain` for render instructions
5. Upload file via `storageUploader`
6. Persist asset in `video_assetsRepo.create`
7. Emit `video.render.success` + `agent.success`
8. On failure, emit `video.render.error` + `agent.error`
9. Retry upload with backoff; emit `system.retry` if retried

**Event Taxonomy**

- `agent.start`
- `video.render.start`
- `system.retry` *(optional on upload failure)*
- `video.render.success` / `video.render.error`
- `agent.success` / `agent.error`

---

### 🧠 Step 5 — LLM / Render Chain

**File:** `src/llm/chains/editorChain.ts`

Extend to:

- Accept `scriptContent`, `composition`, and `styleTemplate`
- Return structured JSON:
    
    ```json
    {
      "renderInstructions": "...",
      "duration": 45,
      "tone": "energetic",
      "layout": "modern",
      "styleTags": ["bold", "dynamic"]
    }
    
    ```
    
- Validate output with `VideoAssetSchema.parse()`
- Remain pure (no I/O or uploads)

---

### 🧪 Step 6 — Testing (Vitest)

### Unit Tests

**File:** `src/agents/editor/__tests__/editorAgent.test.ts`

- Mock: `scriptsRepo`, `video_assetsRepo`, `editorChain`, `storageUploader`
- Verify:
    - correct event order
    - correct repo calls
    - input validation
    - failure and retry logic

### Integration Tests

**File:** `tests/integration/editorAgent.integration.test.ts`

- Use in-memory DB or Supabase test project
- Mock storage only
- Validate that:
    - script → video_assets persistence works
    - all expected events appear in `system_events`
    - data integrity holds (scriptId linkage, metadata)

---

### 📘 Step 7 — Documentation

**File:** `src/agents/editor/AGENTS.md`

Include:

- **Purpose**: Converts scripts into persisted video assets with style metadata
- **Inputs/Outputs**: `EditorRequestSchema`, `VideoAssetSchema`
- **Responsibilities**: validation, rendering, upload, persistence, event emission
- **Data Access**: reads `scripts`, writes `video_assets`
- **Events**: `video.render.*`, `agent.*`, optional `system.retry`
- **Testing**: Vitest unit + integration
- **Deprecated Components**: any legacy editorService removed
- **Notes for Codex agents**: validate inputs, never call Supabase directly, follow BaseAgent lifecycle

---

## 5. Event Flow Example

| Stage | Event | Sample Payload |
| --- | --- | --- |
| Start | `agent.start` | `{ agent: "EditorAgent", scriptId: "uuid" }` |
| Render Start | `video.render.start` | `{ composition: { tone: "bright" } }` |
| Retry | `system.retry` | `{ attempt: 2, reason: "upload failed" }` |
| Success | `video.render.success` | `{ assetId: "uuid", storageUrl: "...", duration: 45 }` |
| Complete | `agent.success` | `{ message: "Video rendered successfully" }` |
| Failure | `video.render.error` | `{ error: "...stack..." }` |

---

## 6. Success Criteria (Milestone M1)

| Category | Definition |
| --- | --- |
| **Functional** | `EditorAgent.run()` produces a persisted `video_asset` record with valid metadata |
| **Observability** | All `video.render.*` and `agent.*` events visible in dashboard |
| **Resilience** | Upload retry works and emits `system.retry` |
| **Validation** | Invalid inputs rejected via Zod |
| **Coverage** | Unit + integration tests pass |
| **Docs** | Updated `AGENTS.md` and schema re-exports committed |

---

## ✅ Summary of Key Decisions

| Area | Decision | Rationale |
| --- | --- | --- |
| Schema structure | Define in `agentSchemas.ts`, re-export from `editorSchema.ts` | Matches Scriptwriter pattern |
| Service layer | Removed | Replaced by `storageUploader` util |
| Retry policy | Add with event emission | Improves fault tolerance |
| Tests | Unit + integration | Mirrors ScriptwriterAgent V2 |
| Documentation | Required | Standardized across agents |