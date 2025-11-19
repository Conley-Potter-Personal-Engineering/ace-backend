# AGENTS.md — LLM Layer Rules

## Purpose
Defines how the LLM layer handles models, prompts, chains, and parsing.

## Responsibilities
• contain all model wrappers, prompts, chains  
• define strict JSON output schemas  
• ensure deterministic parsing  
• keep chains stateless and pure  

## Prohibitions
• must not write to the database  
• must not emit system events  
• must not be imported directly by agent classes  
• must not contain business logic  

## Required Patterns
• services import chains, not agents  
• prompts define structure  
• parsers validate LLM output  
