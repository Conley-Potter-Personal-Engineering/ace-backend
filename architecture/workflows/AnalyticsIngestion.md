# Analytics Ingestion Workflow

## Purpose
Collects post performance data and stores metrics for analysis.

## Steps
1. analytics.ingest.start
2. fetch post performance
3. write performance_metrics
4. analytics.ingest.success

## Inputs
• postId or experimentId

## Outputs
• performance_metrics entries

## Failure Handling
• retry with exponential backoff
• mark stale posts if unreachable