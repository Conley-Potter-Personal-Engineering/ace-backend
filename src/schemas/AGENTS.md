# AGENTS.md — Schema Layer Rules

## Purpose
Schemas define validation and DTO structure.

## Responsibilities
• define Zod schemas  
• validate agent and service inputs  
• generate DTO types  

## Prohibitions
• must not call LLMs  
• must not call Supabase  
• must not emit events  
• must not implement logic  

## Required Patterns
• name schemas consistently  
• export inferred types  
