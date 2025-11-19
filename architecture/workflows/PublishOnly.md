# Publish Only Workflow

## Purpose
Publishes an existing asset without generating new content.

## Steps
1. publish.start
2. PublisherAgent.publish
3. publish.success

## Inputs
• experimentId  
• assetId

## Outputs
• published_posts entry

## Failure Handling
• handle rate limits  
• retry publish attempts  
• escalate to Watchdog