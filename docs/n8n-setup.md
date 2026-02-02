# n8n Integration Setup (ACE Backend)

This document describes how to configure n8n to call ACE backend integration endpoints.

## Required Environment Variables

Set these in your n8n instance:

- `ACE_BACKEND_URL` — Base URL for the ACE backend (for example `https://api.example.com`)
- `ACE_API_KEY` — Service API key used for `x-api-key`

## Required Headers

Every n8n HTTP Request node calling ACE must include:

- `x-api-key: $env.ACE_API_KEY`
- `x-workflow-id: <uuid>`
- `x-correlation-id: <uuid>`

Generate `workflow_id` and `correlation_id` at the start of the workflow and reuse them for all calls.

## Agent Endpoints (n8n Integration API)

All endpoints are relative to `/api`.

### ScriptwriterAgent

`POST /api/agents/scriptwriter/generate`

Body (snake or camel case):

```json
{
  "product_id": "uuid",
  "creative_pattern_id": "uuid",
  "trend_snapshot_id": "uuid"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "script_id": "uuid",
    "product_id": "uuid",
    "title": "string",
    "hook": "string",
    "script_text": "string",
    "workflow_id": "uuid",
    "correlation_id": "uuid",
    "creative_variables": {},
    "created_at": "ISO8601"
  },
  "message": "Script generated successfully",
  "error": null
}
```

### EditorAgent

`POST /api/agents/editor/render`

Body:

```json
{
  "script_id": "uuid",
  "composition": {
    "duration": 60,
    "tone": "balanced",
    "layout": "vertical"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "asset_id": "uuid",
    "script_id": "uuid",
    "storage_url": "https://...",
    "duration": 60,
    "tone": "balanced",
    "layout": "vertical",
    "style_tags": [],
    "metadata": {},
    "created_at": "ISO8601",
    "workflow_id": "uuid",
    "correlation_id": "uuid"
  },
  "message": "Video asset rendered successfully",
  "error": null
}
```

### PublisherAgent

`POST /api/agents/publisher/publish`

Body:

```json
{
  "experiment_id": "uuid",
  "platform": "instagram"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "post_id": "uuid",
    "experiment_id": "uuid",
    "platform": "instagram",
    "external_post_id": "string",
    "published_at": "ISO8601",
    "workflow_id": "uuid",
    "correlation_id": "uuid"
  },
  "message": "Post published successfully",
  "error": null
}
```

## Optional Webhook Callback

`POST /api/webhooks/n8n`

Use this endpoint to send workflow or stage events back to ACE for observability.
The payload must match the system events schema:

```json
{
  "event_type": "workflow.stage.success",
  "event_category": "workflow",
  "severity": "info",
  "message": "stage completed",
  "workflow_id": "uuid",
  "correlation_id": "uuid",
  "agent_name": "ScriptwriterAgent",
  "metadata": {}
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "timestamp": "ISO8601",
    "event_type": "workflow.stage.success",
    "severity": "info"
  },
  "message": "Webhook event received",
  "error": null
}
```
