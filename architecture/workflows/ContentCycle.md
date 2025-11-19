# Content Cycle Workflow

## Purpose
Runs the full creative pipeline for a single product from script to publication.

## Steps
1. workflow.start
2. ScriptwriterAgent.generate
3. EditorAgent.render
4. Experiment creation
5. PublisherAgent.publish
6. Analytics ingestion (async)
7. workflow.end

## Inputs
• productId

## Outputs
• script  
• video asset  
• experiment  
• published post  
• performance metrics (later)

## Failure Handling
• retry script or render failures  
• fallback pathways  
• Watchdog monitors stuck workflow