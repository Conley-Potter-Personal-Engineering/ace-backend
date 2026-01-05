# API Reference

This document outlines the API endpoints available in the ACE Backend. The API is built using Next.js API usage and is organized by domain.

## Base URL
All endpoints are relative to `/api`.

## Agents API

Endpoints for interacting with ACE Agents.

### List Agent Statuses
Returns a list of all registered agents and their current status.

- **Endpoint**: `GET /api/agents`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "name": "ScriptwriterAgent",
        "status": "idle" | "running" | "error",
        "lastRun": "ISO8601",
        "lastEvent": "event.type"
      },
      ...
    ]
  }
  ```

### Run Agent (Generic)
Manually triggers a specific agent run.

- **Endpoint**: `POST /api/agents/[name]/run`
- **Path Parameters**:
  - `name`: The name of the agent (e.g., `ScriptwriterAgent`, `EditorAgent`).
- **Body**:
  ```json
  {
    "input": { ... } // Agent-specific input
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Agent [name] started",
    "data": { ... } // Agent execution result
  }
  ```

### Generate Script (Scriptwriter)
Triggers the Scriptwriter Agent to generate a video script using a specific product, creative pattern, and trend.

- **Endpoint**: `POST /api/agents/scriptwriter/generate`
- **Body**:
  ```json
  {
    "product_id": "uuid",
    "creative_pattern_id": "uuid",
    "trend_snapshot_id": "uuid",
    "workflow_id": "uuid",   // Optional
    "correlation_id": "uuid" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "script_id": "uuid",
      "product_id": "uuid",
      "script_text": "...",
      "hook": "...",
      "creative_variables": { ... },
      "created_at": "ISO8601",
      "workflow_id": "...",
      "correlation_id": "..."
    }
  }
  ```

### Render Video (Editor)
Triggers the Editor Agent to render a video asset from a script.

- **Endpoint**: `POST /api/agents/editor/render`
- **Body**:
  ```json
  {
    "scriptId": "uuid",
    "styleTemplateId": "uuid", // Optional
    "composition": {
      "duration": number,
      "tone": "balanced" | "dramatic" | "minimal",
      "layout": "vertical" | "horizontal" | "square"
    },
    "renderBackend": "local" | "s3" | "supabase", // Optional (default: supabase)
    "workflow_id": "uuid",            // Optional
    "correlation_id": "uuid"          // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "asset_id": "uuid",
      "script_id": "uuid",
      "storage_url": "...",
      "duration": number,
      "tone": "...",
      "layout": "...",
      "style_tags": ["..."],
      "metadata": { ... },
      "created_at": "ISO8601",
      "workflow_id": "...",
      "correlation_id": "..."
    }
  }
  ```

### Publish Post (Publisher)
Triggers the Publisher Agent to publish an experiment post.

- **Endpoint**: `POST /api/agents/publisher/publish`
- **Body**:
  ```json
  {
    "experiment_id": "uuid",
    "platform": "instagram" | "tiktok" | "youtube",
    "workflow_id": "uuid",   // Optional
    "correlation_id": "uuid" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "post_id": "uuid",
      "experiment_id": "uuid",
      "platform": "...",
      "external_post_id": "...",
      "published_at": "ISO8601",
      "workflow_id": "...",
      "correlation_id": "..."
    }
  }
  ```

## Workflows API

Endpoints for managing workflows.

### List Workflow Statuses
Returns the status of defined workflows (e.g., `content-cycle`, `trend-refresh`).

- **Endpoint**: `GET /api/workflows`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "content-cycle",
        "status": "idle" | "running" | "error",
        "lastRun": "ISO8601",
        "lastEvent": "workflow.start"
      },
      ...
    ]
  }
  ```

### Start Workflow
Initiates a specific workflow.

- **Endpoint**: `POST /api/workflows/[id]/start`
- **Path Parameters**:
  - `id`: The ID of the workflow (e.g., `content-cycle`).
- **Body**:
  ```json
  {
    "input": { ... } // Optional initial input for the workflow
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "workflow": "content-cycle",
    "status": "started"
  }
  ```

## Authentication API

Endpoints for user authentication using Supabase.

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token",
      "user": { "id": "uuid", ... }
    }
  }
  ```

### Signup
- **Endpoint**: `POST /api/auth/signup`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "..." },
      "message": "Sign-up successful..."
    }
  }
  ```

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Body**: `{}` (Empty)
- **Response**:
  ```json
  {
    "success": true
  }
  ```

## Artifacts API

Endpoints for retrieving generated artifacts.

### List Artifacts
- **Endpoint**: `GET /api/artifacts`
- **Query Parameters**:
  - `limit`: number (default: 50)
  - `type`: filter by artifact type
- **Response**:
  ```json
  {
    "success": true,
    "data": [ ... ]
  }
  ```

### Get Artifact Details
- **Endpoint**: `GET /api/artifacts/[id]`
- **Response**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

## System API

System-level utility endpoints.

### Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "ACE API alive"
  }
  ```

### System Events
List recent system logs and events.
- **Endpoint**: `GET /api/system-events`
- **Query Parameters**:
  - `limit`: number (default: 100)
- **Response**:
  ```json
  {
    "success": true,
    "data": [ ... ]
  }
  ```

### Record Feedback
Submit user feedback.
- **Endpoint**: `POST /api/feedback`
- **Body**:
  ```json
  {
    "score": number,
    "comment": "string",
    "entityId": "uuid", // Optional
    "entityType": "string" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    ...
  }
  ```
