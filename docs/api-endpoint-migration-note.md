# PRISM Frontend API Endpoint Migration Note

Date: 2026-03-04
Scope: Frontend-only API/client/forms/page/guard updates for latest backend contract under `/api/v1`.

## Old -> New endpoint mappings

1. Auth registration
- Old: `POST /api/v1/auth/register`
- New: removed (disabled in backend)
- Frontend action: removed register API usage and store register action.

2. Epic close (legacy issue route)
- Old: `POST /api/v1/issues/:epicId/close`
- New: `POST /api/v1/epics/:id/close`
- Frontend action: removed issue-level close-epic usage.

3. Project attachments legacy alias
- Old: `/api/v1/projects/:id/attachments` (legacy alias)
- New canonical project files routes:
  - `GET /api/v1/projects/:projectId/files`
  - `POST /api/v1/projects/:projectId/files`
  - `GET /api/v1/projects/:projectId/files/:fileId/download`
  - `DELETE /api/v1/projects/:projectId/files/:fileId`
- Frontend action: project file browser + API client now use canonical `/files` routes.

4. Notifications bulk mark read
- Old pattern: `PUT /api/v1/notifications/:id/read` with synthetic `id=all`
- New: `PUT /api/v1/notifications/read-all`
- Frontend action: added dedicated `markAllAsRead()` API method and updated callers.

5. Milestones route shape
- Old: project milestone aliases/non-canonical route usage
- New:
  - `GET /api/v1/milestones/projects/:projectId/milestones`
  - `POST /api/v1/milestones/projects/:projectId/milestones`
  - `PATCH /api/v1/milestones/:id`
  - `DELETE /api/v1/milestones/:id`
- Frontend action: projects milestones client methods and dashboard callers aligned.

6. Time summary
- Old: non-canonical summary usage
- New: `GET /api/v1/time/time-entries/summary/:period` where `period in {daily, weekly, monthly}`
- Frontend action: added `timeApi.getSummary(period)` and wired employee time tracking page to daily/weekly/monthly summary calls.

7. Issues vs Epics hierarchy rule
- Old behavior: issue create/update could attempt `type=EPIC`
- New rule:
  - `POST/PUT /api/v1/issues` must not include `type=EPIC`
  - Epics managed via `/api/v1/epics`
  - Story creation remains `POST /api/v1/issues/create-story`
- Frontend action:
  - runtime + type guard to block `EPIC` in issue create/update payloads
  - actionable error message normalized to: `Use Epics module`
  - story modal now loads epic list from `epicsApi`.

8. Analytics admin-only endpoints
- Endpoints: `/api/v1/analytics/system`, `/api/v1/analytics/db`
- Frontend action: admin analytics page explicitly blocks non-ADMIN access and avoids calling these endpoints for non-admin users.

## Error handling normalization

API client normalization now maps:
- `400/422` -> validation-style message
- `401` -> refresh flow then login redirect on failure
- `403` -> forbidden message
- `404` -> not found message

## Turbopack build diagnostics (performance/stability)

- Explicitly pinned workspace root in Next config:
  - `turbopack.root = process.cwd()`
  - `outputFileTracingRoot = process.cwd()`
- Removed build-time font processing:
  - removed `next/font/local` and `next/font/google` usage entirely
  - fonts loaded at runtime via CSS `@import` from `fonts.googleapis.com`
  - no local woff2 font files required
- Added debug build command:
  - `npm run build:turbo:debug`

Expected behavior after this change:
- no incorrect workspace root warning caused by parent lockfile detection
- no font-related fetch or file processing during production build
- runtime font loading via Google Fonts CDN (browser-side)
- deterministic Turbopack diagnostics path via debug script
