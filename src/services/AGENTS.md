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
