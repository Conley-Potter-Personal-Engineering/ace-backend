# ACE System Event Taxonomy

This document defines the complete taxonomy of system events emitted throughout the Autonomous Content Engine (ACE). System events create a continuous, queryable timeline of everything ACE does. They support observability, debugging, workflow reconstruction, agent coordination, analytics, and long term learning.

This taxonomy serves as the authoritative reference for all agents, workflows, and infrastructure components.

---

# Purpose of System Events

System events are used to:

• track agent actions  
• monitor workflows  
• detect failures and trigger recovery  
• analyze performance across the pipeline  
• maintain a searchable history of operations  
• enable system level intelligence  
• support the Watchdog agent  
• allow Codex and human developers to trace behavior  

All agents must emit events using BaseAgent.logEvent().

---

# Structure of an Event

Each event is stored in the `system_events` table with the following fields:

• event_id: uuid primary key  
• agent_name: string  
• event_type: string  
• payload: jsonb  
• created_at: timestamp  

Event types follow the taxonomy below.

---

# Event Naming Convention

Event types are organized using a dotted hierarchy:

```
category.subcategory.action
```

For example:

```
script.generate.start
video.render.error
workflow.publish.success
engine.retry
```

This keeps the event space organized and machine interpretable.

---

# Top Level Categories

The taxonomy is divided into the following categories:

1. workflow  
2. script  
3. video  
4. publish  
5. experiment  
6. analytics  
7. trends  
8. agent  
9. engine  

Each category is detailed below.

---

# 1. workflow events

Events related to multi step pipeline execution.

### Start and end
• workflow.start  
• workflow.end  

### Stage transitions
• workflow.stage.start  
• workflow.stage.success  
• workflow.stage.error  

### Recovery
• workflow.retry  
• workflow.fallback  
• workflow.abort  

### Examples
```
workflow.start
workflow.stage.start { stage: "script" }
workflow.stage.success { stage: "script", scriptId: ... }
workflow.end
```

---

# 2. script events

Events emitted by the Scriptwriter Agent.

### Lifecycle
• script.generate.start  
• script.generate.success  
• script.generate.error  

### Auxiliary
• script.variables.inferred  
• script.patterns.referenced  

### Examples
```
script.generate.start { productId: ... }
script.generate.success { scriptId: ... }
script.generate.error { message: "...", stack: "..." }
```

---

# 3. video events

Events emitted by the Editor Agent.

### Lifecycle
• video.render.start  
• video.render.success  
• video.render.error  

### Metadata
• video.assets.created  
• video.assets.uploaded  

### Examples
```
video.render.start { scriptId: ... }
video.render.success { assetId: ... }
```

---

# 4. publish events

Events emitted by the Publisher Agent.

### Lifecycle
• publish.start  
• publish.success  
• publish.error  

### Retry
• publish.retry  
• publish.rate_limited  

### Examples
```
publish.start { experimentId: ... }
publish.success { postId: ..., externalPostId: ... }
```

---

# 5. experiment events

Events related to experiment creation and assignment.

### Lifecycle
• experiment.create.start  
• experiment.create.success  
• experiment.create.error  

### Examples
```
experiment.create.success { experimentId: ... }
```

---

# 6. analytics events

Events related to performance ingestion and analysis.

### Analytics ingestion
• analytics.ingest.start  
• analytics.ingest.success  
• analytics.ingest.error  

### Interpretation
• analytics.evaluate.start  
• analytics.evaluate.success  
• analytics.evaluate.error  

### Examples
```
analytics.ingest.success { postId: ... }
```

---

# 7. trends events

Events emitted by the Trend Research Agent.

### Lifecycle
• trends.refresh.start  
• trends.refresh.success  
• trends.refresh.error  

### Raw ingest
• trends.raw.ingest  
• trends.raw.ingest.error  

### Examples
```
trends.refresh.success { productId: ... }
```

---

# 8. agent events

General purpose agent level events.

### Lifecycle
• agent.start  
• agent.success  
• agent.error  

### Notes
• agent.note.created  

### Examples
```
agent.error { agentName: "Scriptwriter", message: "...", stack: "..." }
```

---

# 9. engine events

Engine wide events not tied to a specific agent.

### Failures
• engine.error  
• engine.critical  

### Maintenance
• engine.heartbeat  
• engine.cleanup  

### Recovery
• engine.retry  
• engine.recovered  

### Examples
```
engine.heartbeat { timestamp: ... }
```

---

# Payload Guidelines

Payloads should always:

• include identifiers (scriptId, productId, postId)  
• include timestamps when relevant  
• include error details when applicable  
• avoid storing large blobs or raw assets  
• use JSON objects only  

Payloads should be consumed by:

• Workflows  
• Watchdog agent  
• Analyst agent  
• Optimization agent  

---

# Required Emission Rules

All agents must emit:

• start event before beginning work  
• success event after completing work  
• error event when something goes wrong  

Workflows must emit:

• workflow.start  
• workflow.end  
• stage related events  

The Watchdog will later enforce these rules.

---

# Summary

This taxonomy provides a unified vocabulary for ACE's autonomous behavior. All agents and workflows must adhere to this event structure to ensure consistent logging, recovery, analytics, and system level reasoning.

This file serves as the canonical reference for event types in ACE.
