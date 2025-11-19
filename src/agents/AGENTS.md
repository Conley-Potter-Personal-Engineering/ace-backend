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
