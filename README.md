# ACE – Autonomous Content Engine

ACE is a modular, multi agent system designed to research trends, generate high quality scripts, produce video assets, publish content automatically, collect performance analytics, and evolve creative strategy over time. It operates as an intelligent creative pipeline rather than a single app.

This repository contains the data backbone, integration layer, and agent scaffolding that power ACE.

## Core Concepts

### Agents
ACE is built from autonomous workers that collaborate. Examples include:

• Scriptwriter  
• Editor or Video Generator  
• Publisher  
• Research Agent  
• Trend Analyst  
• Optimization Agent  
• Watchdog  
• Meta Agent  

All agents inherit functionality from a shared BaseAgent class that handles lifecycle behavior, structured event logging, and error handling.

### Workflows
Agents are orchestrated into end to end workflows such as:

• Product selection  
• Script generation  
• Asset creation  
• Experiment creation  
• Publishing  
• Performance ingestion  
• Strategy updates  

Workflows are observable, recoverable, and stateful through system events.

### Repositories
All database operations are performed through typed repository modules that wrap the Supabase client. No agent interacts with tables directly. Repositories provide:

• Typed inserts  
• Typed queries  
• Input validation  
• Error handling  
• Business logic boundaries  

### Validation Layer
ACE uses Zod schemas to validate all incoming data into repositories. Each schema defines the canonical DTO structure that agents use when passing data into the system.

## Project Structure

```
src/
  agents/
    BaseAgent.ts
  db/
    db.ts
  repos/
    ... repository modules for each table ...
  schemas/
    ... Zod schemas for input validation ...
  workflows/
    ... workflow runners (future) ...
architecture/
  overview.md
  schema.md
  events.md
  agents/
  workflows/
README.md
```

This structure creates a clear separation between intelligence, data, validation, and orchestration.

## Data Backbone

ACE is powered by a relational schema in Supabase that includes:

• products  
• creative patterns  
• agent notes  
• embeddings  
• raw videos  
• trend snapshots  
• scripts  
• video assets  
• experiments  
• published posts  
• performance metrics  
• system events  

These tables give ACE the ability to study trends, generate content, publish experiments, measure results, and evolve over time.

A complete schema description lives in `architecture/schema.md`.

## System Events

System events record everything that happens inside ACE. Agents emit events whenever they start a task, complete a task, encounter an error, or produce meaningful intermediate output.

This creates a continuous, query friendly timeline of ACE behavior.  
Events support:

• debugging  
• workflow reconstruction  
• failure recovery  
• analytics  
• learning and adaptation  

Event definitions and naming conventions are in `architecture/events.md`.

## Development Setup

### Install dependencies
```
npm install
```

## Authentication

Agent endpoints accept either `Authorization: Bearer <token>` or `x-api-key: <ACE_API_KEY>`.
User-facing endpoints (experiments, artifacts, workflows, etc.) require bearer tokens only.

### Supabase setup
Ensure the Supabase CLI is installed.

Authenticate:
```
supabase login
```

Link to your project:
```
supabase link --project-ref <your-ref>
```

Run migrations:
```
npx supabase db push
```

Generate types:
```
npx supabase gen types typescript > src/types/supabase.ts
```

## Running Agents and Workflows

Agents will be runnable through a workflow runner that executes each stage of the creative pipeline. That layer is being built now.

When complete, you will be able to run a full cycle:

• Product research  
• Script generation  
• Asset creation  
• Experiment creation  
• Publishing  
• Performance ingestion  
• Optimization loop  

Each step will produce system events and write state to the data backbone.

## Goals

ACE aims to become a fully autonomous creative system capable of:

• researching real time cultural signals  
• generating on brand, high performing scripts  
• producing videos at scale  
• running live experiments across social platforms  
• analyzing performance in real time  
• adapting creative strategy without human oversight  

The broader purpose is to merge automation, intelligence, and creativity into a self improving content engine.

## Next Steps

Documentation coming soon:

• Architecture overview  
• Agent specifications  
• Workflow definitions  
• System event taxonomy  
• Trend and research logic  

Engineering next steps:

• Implement BaseAgent  
• Build ScriptwriterAgent  
• Build EditorAgent  
• Build PublisherAgent  
• Implement workflow runner  
• Add Watchdog agent  
• Implement Analyst and Optimization agents  
