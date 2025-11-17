# **ACE Architecture Overview**

ACE is an autonomous content engine composed of multiple collaborating agents, a unified data backbone, and a structured orchestration layer. This document provides a high level overview of the architecture so that developers and AI collaborators can understand how the system fits together.

---

## **Purpose of ACE**

ACE’s goal is to operate as a self improving creative system that can:

• research cultural signals
• generate high performing scripts
• produce short form video assets
• run controlled creative experiments
• publish automatically
• ingest performance data
• optimize creative strategy
• learn over time

It is designed as an adaptive pipeline rather than a static app.

---

# **Core Layers of the Architecture**

ACE is divided into clear layers. Each layer has a single responsibility and communicates with the layers around it. This separation of concerns ensures stability, maintainability, and observability.

The layers, from bottom to top, are:

1. **Data Backbone (DB Layer)**
2. **Integration Layer (Repositories + Validation)**
3. **Agent Layer (Autonomous Workers)**
4. **Workflow Layer (Orchestration)**
5. **System Intelligence Layer (Learning + Optimization)**

Each layer is described below.

---

# **1. Data Backbone**

ACE’s relational schema lives in Supabase. It stores:

• products
• creative patterns
• agent notes and memory
• embeddings
• raw video ingest
• trend snapshots
• scripts
• video assets
• experiments
• published posts
• performance metrics
• system events

### Responsibilities

• persistent, queryable state
• reproducible history of operations
• structured creative intelligence
• fast lookup and analysis
• index optimized trend and performance data
• capturing every step of the pipeline

The schema ensures that every agent writes to and reads from a consistent, canonical data model.

More detail can be found in `architecture/schema.md`.

---

# **2. Integration Layer**

Agents never touch the database directly.
Instead, they use:

• typed repository modules
• Zod validation schemas
• a typed Supabase client

This layer is the system’s “API surface.”

### Responsibilities

• validating input before writing to the database
• error handling
• mapping camelCase DTOs to snake_case DB fields
• strict typing for inserts, updates, and queries
• helping Codex generate stable code

This creates a clean, safe boundary between intelligent agents and the data backbone.

---

# **3. Agent Layer**

Agents are autonomous functional units that each perform a focused creative or operational task.
They all inherit from the shared BaseAgent class.

### Examples of agents

• Scriptwriter Agent
• Editor or Video Generator Agent
• Publisher Agent
• Trend Research Agent
• Analyst Agent
• Optimization Agent
• Watchdog Agent
• Meta Agent

### Responsibilities

• performing work inside their domain
• reading and writing data through repositories
• emitting system events
• generating notes and reflections
• handling errors gracefully
• participating in workflows

Agents are stateless between runs except for what they store in the database.

---

# **4. Workflow Layer**

Workflows orchestrate multiple agents in sequence. Each workflow represents a meaningful pipeline, such as:

• generating content for a specific product
• running a creative experiment
• updating trends
• reconstructing past performance
• learning from analytics

### Responsibilities

• driving agents through the correct sequence
• managing inputs and outputs
• logging workflow level events
• retry and fallback handling
• ensuring pipelines complete successfully

Future enhancements include:

• directed acyclic graphs for complex flows
• state machines
• concurrency controls
• scheduled execution
• multi product batch workflows

Workflow documentation lives in `architecture/workflows/`.

---

# **5. System Intelligence Layer**

This top layer makes ACE autonomous, strategic, and self improving.

It includes:

• the Optimization Agent
• the Analyst Agent
• the Meta Agent
• trend interpretation
• experiment interpretation
• long term creative strategy

### Responsibilities

• translating raw analytics into actionable strategy
• identifying high performing patterns
• refining prompts and agent behavior
• driving multi week evolution loops
• evaluating creative performance at scale

This is the layer that turns ACE from a pipeline into a creative intelligence.

---

# **Cross Cutting Concepts**

Some subsystems span multiple layers and give ACE its robustness.

### **1. System Events**

All meaningful actions are logged into `system_events`.
This enables:

• observability
• debugging
• workflow reconstruction
• failure detection
• analytics
• self reflection
• automatic recovery

Detailed taxonomy in `architecture/events.md`.

### **2. Agent Notes**

Agents store their reflections, observations, and contextual information.
This builds a persistent knowledge graph within ACE’s memory.

### **3. Embeddings**

Semantic vectors allow:

• similarity search
• trend association
• creative pattern discovery
• content clustering
• long term concept retrieval

### **4. Experiments**

Every piece of content published becomes part of a controlled experiment, which is later analyzed by the Analyst and Optimization agents.

---

# **How the Pieces Fit Together**

A typical content cycle flows like this:

1. Research and trend ingest
2. Product selection
3. Script generation
4. Asset generation
5. Experiment creation
6. Publishing
7. Performance ingestion
8. Trend and pattern update
9. Optimization
10. New cycle with improved strategy

This forms a continuous improvement loop.

---

# **Future Evolution**

Planned features include:

• automated multi agent collaboration
• model based decision making
• cross platform publishing
• synthetic datasets for trend forecasting
• creative pattern meta learning
• reinforcement style optimization
• long term multi week evolution loops

ACE is designed to grow in sophistication without reorganizing the underlying architecture.

---

# **Summary**

The ACE architecture is built around clarity, modularity, and observability.
The separation into layers ensures that each part of the system can evolve independently while still working together through shared data and shared abstractions.

This document serves as the main guide for human and AI collaborators to understand the system at a high level.