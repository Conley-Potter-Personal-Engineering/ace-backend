# AGENTS.md — Database Layer Rules

## Purpose
Document safe database interaction and migration rules.

## Responsibilities
• maintain typed client  
• manage migrations  
• enforce schema consistency  

## Prohibitions
• no business logic  
• no LLM calls  
• no workflow code  

## Required Patterns
• migrations in /migrations  
• regenerate Supabase types after changes  
