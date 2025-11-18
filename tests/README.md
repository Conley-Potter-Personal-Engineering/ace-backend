# ACE Test Suite

This directory hosts the ACE testing foundation.

## Structure
- `unit/` – fast tests with full mocking.
  - `agents/` – agent orchestration tests.
  - `services/` – pure service logic and validation.
  - `repos/` – repository behavior with mocked Supabase.
  - `schemas/` – Zod schema validation.
- `integration/` – slower tests that talk to real Supabase instances when credentials are present.
  - `agents/`, `services/`, `db/`, `workflows/` are reserved for future coverage.
- `utils/` – shared factories and mocks for test data and clients.

Unit tests run under `vitest.unit.config.ts`, while integration tests use `vitest.integration.config.ts` with safeguards to skip when Supabase credentials are absent.
