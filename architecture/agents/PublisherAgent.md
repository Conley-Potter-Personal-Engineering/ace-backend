# Publisher Agent Specification

## Purpose
Publishes experiments and videos to external social platforms.

## Inputs
• experimentId  
• assetId  
• video URL  

## Outputs
• published_posts entry  
• external platform post ID  

## Responsibilities
• authenticate and upload content  
• manage rate limits  
• handle publish errors  
• retry if needed  
• emit system events  

## Event Emission
• publish.start  
• publish.success  
• publish.error  
• publish.retry