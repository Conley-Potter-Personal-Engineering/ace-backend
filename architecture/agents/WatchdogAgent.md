# Watchdog Agent Specification

## Purpose
Monitors system events to ensure ACE workflows run reliably.

## Inputs
• system_events timeline  
• workflow state  

## Outputs
• recovery actions  
• retry events  
• alerts  

## Responsibilities
• detect failures  
• trigger retries  
• resolve stuck workflows  
• validate lifecycle events  

## Event Emission
• system.retry  
• system.recovered  
• system.error