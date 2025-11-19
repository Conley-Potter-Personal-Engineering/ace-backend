# AGENTS.md — Repository Layer Rules

## Purpose
Defines rules for database access.

## Responsibilities
• handle all DB reads/writes  
• map camelCase to snake_case  
• enforce Supabase type safety  

## Prohibitions
• must not contain Zod schemas  
• must not call LLMs  
• must not emit events  
• must not include business logic  

## Required Patterns
• create, update, findById, delete, findMany  
• return typed results  
