# Editor Agent Specification

## Purpose
Produces video assets given a script. May use generative models, templates, or editing rules.

## Inputs
• scriptId  
• script text  
• creative variables  

## Outputs
• video asset record  
• storage URL  
• metadata  

## Responsibilities
• transform script into video output  
• upload video asset  
• create video_assets entry  
• emit system events  

## Event Emission
• video.render.start  
• video.render.success  
• video.render.error