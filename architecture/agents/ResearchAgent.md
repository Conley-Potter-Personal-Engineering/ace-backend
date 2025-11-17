# Research Agent Specification

## Purpose
Collects and processes trending content and raw video signals from external sources.

## Inputs
• platform API responses  
• trending topics  
• raw videos  

## Outputs
• raw_videos entries  
• trend_snapshots  
• agent notes  

## Responsibilities
• ingest raw trending content  
• normalize metadata  
• compute trend snapshots  
• trigger embeddings  

## Event Emission
• trends.raw.ingest  
• trends.refresh.start  
• trends.refresh.success  
• trends.refresh.error