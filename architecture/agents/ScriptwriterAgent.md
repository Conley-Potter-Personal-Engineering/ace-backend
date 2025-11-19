# Scriptwriter Agent Specification

## Purpose
Generates high quality scripts for products using product info, creative patterns, trend signals, and agent notes.

## Inputs
• productId  
• validated DTO from schemas  
• creative patterns  
• trend snapshot summaries  

## Outputs
• script record in scripts table  
• system events  
• agent notes  

## Responsibilities
• generate script text  
• incorporate creative patterns  
• embed creative variables  
• produce system event logs  
• store notes on discoveries  

## Event Emission
• script.generate.start  
• script.generate.success  
• script.generate.error