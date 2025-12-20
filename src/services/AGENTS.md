# AGENTS.md — Service Layer Rules

## Purpose
Services orchestrate LLM calls, validation, and DTO shaping.

## Responsibilities
• perform LLM calls  
• apply Zod validation  
• return typed DTOs  
• contain pure logic  

## Prohibitions
• must not write to Supabase  
• must not emit events  
• must not run workflows  
• must not bypass validation  

## Required Patterns
• import LLM chains from /src/llm  
• validate all inputs and outputs  
• avoid side effects  

### Deprecated: ScriptwriterService
The ScriptwriterService has been deprecated as of the ScriptwriterAgent V2 upgrade.
All responsibilities (LLM invocation, validation, and payload shaping) are now handled
directly within the ScriptwriterAgent and scriptwriterChain modules.

It should not be reintroduced or referenced in new code.
