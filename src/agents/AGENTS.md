# AGENTS.md — Rules for ACE Agents

## Purpose
Defines the rules and constraints for all ACE agent implementations.

## Agent Responsibilities
• orchestrate logic, not perform it  
• delegate work to services, repos, and workflows  
• validate inputs using schemas before acting  
• emit system events through BaseAgent  
• maintain predictable, typed interfaces  

## Agent Prohibitions
• agents must not call Supabase directly  
• agents must not run raw SQL  
• agents must not call LLMs directly  
• agents must not perform Zod validation inside agent files  
• agents must not bypass BaseAgent lifecycle rules  

## Required Patterns
• extend BaseAgent  
• implement run() with explicit inputs and outputs  
• log agent.start and agent.success  
• use try/catch and log agent.error  

## ScriptwriterAgent — ACE Agent Profile

### Purpose
Generate structured short-form scripts for products using creative patterns and trend data.

### Inputs
• productId  
• trendSnapshotIds  
• patternIds  
• creativeVariables  

### Outputs
• structured script object with title, hook, CTA, outline, body  
• persisted to scripts table with metadata  

### Responsibilities
• validate inputs  
• gather creative context  
• call scriptwriterChain  
• persist results  
• emit events  
• write rationale notes  

### Data Access
• reads: products, creative_patterns, trend_snapshots  
• writes: scripts, agent_notes  

### Events Emitted
• agent.start  
• agent.success  
• agent.error  
• script.generate.start  
• script.generate.success  
• script.generate.error  

### Testing
• covered by Vitest unit and integration tests  

### Deprecated Components
• the old ScriptwriterService has been retired; all logic now resides within ScriptwriterAgent and scriptwriterChain  

### Notes for Future Agents or Codex Runs
• always validate inputs with Zod  
• never access Supabase directly  
• always emit lifecycle and domain events  
• use repositories for persistence  
• use scriptwriterChain for LLM generation  
• keep file and class names consistent across upgrades  

## EditorAgent — ACE Agent Profile

### Purpose
Render video assets from approved scripts, producing ready-to-publish short-form outputs with metadata.

### Inputs
• scriptId  
• overrideStoragePath (optional)  

### Outputs
• rendered asset record with storage path, duration, thumbnail, and beat-level metadata  
• persisted video_assets entry plus associated metadata for downstream publishing  

### Responsibilities
• validate inputs  
• load the source script context  
• call renderVideoAsset via editorService  
• persist the generated asset and metadata  
• emit events for rendering lifecycle and context  
• store rationale notes for traceability  

### Data Access
• reads: scripts  
• writes: video_assets, agent_notes  

### Events Emitted
• agent.start  
• agent.success  
• agent.error  
• video.render.start  
• context.script_loaded  
• video.assets.created  
• memory.note_stored  
• video.render.success  
• video.render.error  

### Testing
• covered by Vitest unit and integration tests for rendering pipeline and schema validation  

### Notes for Future Agents or Codex Runs
• always validate inputs with Zod  
• never access Supabase directly  
• always emit lifecycle and domain events  
• use repositories for persistence  
• rely on editorService/renderVideoAsset for generation  
• keep file and class names consistent across upgrades  
