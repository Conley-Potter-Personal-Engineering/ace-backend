# ACE Data Backbone Schema

This document describes the full data backbone that powers the Autonomous Content Engine (ACE). It includes the purpose of each table, the meaning of each field, the relationships between tables, and how each table is used by agents, workflows, and analytics systems.

This schema reflects the current Supabase structure and is intended as the canonical reference for all developers and AI collaborators.

---

# Table of Contents

1. Products  
2. Creative Patterns  
3. Agent Notes  
4. Embeddings  
5. Raw Videos  
6. Trend Snapshots  
7. Scripts  
8. Video Assets  
9. Experiments  
10. Published Posts  
11. Performance Metrics  
12. System Events  

---

# 1. products

### Purpose
Stores product level information for items ACE creates content about.  
This is the root entity for the entire creative pipeline.

### Fields
• product_id: uuid primary key  
• name: string  
• description: string or null  
• image_url: string or null  
• affiliate_link: string or null  
• source_platform: string  
• category: string or null  
• meta: jsonb or null  
• created_at: timestamp  
• updated_at: timestamp  

### Used By
• ScriptwriterAgent  
• EditorAgent  
• PublisherAgent  
• ResearchAgent  
• OptimizationAgent  

### Notes
Products are the central anchor for experiments, posts, trends, and scripts.

---

# 2. creative_patterns

### Purpose
Stores structured creative patterns identified from high performing content.

### Fields
• pattern_id: uuid primary key  
• product_id: uuid (references products)  
• hook_text: string or null  
• structure: string or null  
• style_tags: text array  
• emotion_tags: text array  
• notes: string or null  
• observed_performance: jsonb or null  
• created_at: timestamp  

### Used By
• ScriptwriterAgent  
• OptimizationAgent  
• AnalystAgent  

---

# 3. agent_notes

### Purpose
Stores agent reflections, observations, and contextual memory.

### Fields
• note_id: uuid primary key  
• agent_name: string  
• topic: string or null  
• content: string  
• importance: number or null  
• embedding: string or null  
• created_at: timestamp  

### Used By
Every agent via BaseAgent.storeNote().

---

# 4. embeddings

### Purpose
Stores semantic embeddings for similarity search and representation learning.

### Fields
• embedding_id: uuid primary key  
• reference_type: string  
• reference_id: uuid  
• embedding: string  
• metadata: jsonb  
• created_at: timestamp  

### Used By
• ResearchAgent  
• AnalystAgent  
• OptimizationAgent  

---

# 5. raw_videos

### Purpose
Stores raw trending video data ingested from external platforms like TikTok.

### Fields
• id: uuid primary key  
• external_id: string  
• platform: string  
• caption: string  
• hashtags: text array  
• author: string  
• view_count: integer  
• like_count: integer  
• share_count: integer  
• comment_count: integer  
• collected_at: timestamp  
• created_at: timestamp  

### Used By
• ResearchAgent  
• TrendAnalysisAgent  

---

# 6. trend_snapshots

### Purpose
Captures trend metrics over time for each product.

### Fields
• snapshot_id: uuid primary key  
• product_id: uuid (references products)  
• popularity_score: number  
• velocity_score: number  
• competition_score: number  
• tiktok_trend_tags: text array  
• raw_source_data: jsonb  
• snapshot_time: timestamp  

### Used By
• ResearchAgent  
• AnalystAgent  
• OptimizationAgent  

---

# 7. scripts

### Purpose
Stores generated scripts for each product or experiment.

### Fields
• script_id: uuid primary key  
• product_id: uuid (references products)  
• script_text: string  
• creative_variables: jsonb or null  
• created_at: timestamp  

### Used By
• EditorAgent  
• PublisherAgent  
• AnalystAgent  

---

# 8. video_assets

### Purpose
Stores video outputs generated from scripts.

### Fields
• asset_id: uuid primary key  
• script_id: uuid (references scripts)  
• product_id: uuid (references products)  
• storage_url: string  
• format: string  
• metadata: jsonb  
• created_at: timestamp  

### Used By
• PublisherAgent  
• AnalystAgent  

---

# 9. experiments

### Purpose
Represents a creative experiment for a product.  
Each experiment typically corresponds to one script and one video asset.

### Fields
• experiment_id: uuid primary key  
• product_id: uuid  
• script_id: uuid  
• asset_id: uuid  
• created_at: timestamp  

### Used By
• PublisherAgent  
• AnalystAgent  
• OptimizationAgent  

---

# 10. published_posts

### Purpose
Stores publishing activity for each experiment.

### Fields
• post_id: uuid primary key  
• experiment_id: uuid (references experiments)  
• platform: string  
• external_post_id: string  
• published_at: timestamp  

### Used By
• PublisherAgent  
• AnalystAgent  

---

# 11. performance_metrics

### Purpose
Stores performance results for posts.

### Fields
• metric_id: uuid primary key  
• post_id: uuid  
• views: integer  
• likes: integer  
• comments: integer  
• shares: integer  
• collected_at: timestamp  

### Used By
• AnalystAgent  
• OptimizationAgent  
• TrendAnalysisAgent  

---

# 12. system_events

### Purpose
Logs every meaningful action inside ACE. Provides the backbone for observability, recovery, and learning.

### Fields
• event_id: uuid primary key  
• agent_name: string  
• event_type: string  
• payload: jsonb  
• created_at: timestamp  

### Used By
Every agent, every workflow, and the Watchdog.

---

# Schema Notes

• All tables include timestamps for temporal analysis.  
• UUIDs are used across the schema for consistent identity management.  
• Embeddings and events provide the backbone for learning and evolution.  
• The schema is intentionally modular to support new agents and workflows.  
• All data access must flow through repository modules for safety and validation.  

---

This file serves as the authoritative description of ACE’s database layer.