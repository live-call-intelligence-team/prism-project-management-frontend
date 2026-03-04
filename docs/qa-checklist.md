# QA Checklist (API Contract Migration)

Date: 2026-03-04

## Completed checks

- [x] Removed endpoint references scan
  - Verified no frontend references to:
    - `/api/v1/auth/register`
    - `/api/v1/issues/:epicId/close`
    - `/api/v1/projects/:id/attachments`

- [x] Notifications contract
  - Verified single mark-read uses `PUT /notifications/:id/read`
  - Verified bulk mark-read uses `PUT /notifications/read-all`

- [x] Milestones contract
  - Verified project milestone methods use `/milestones/projects/:projectId/milestones`
  - Verified milestone update/delete use `/milestones/:id`

- [x] Time summary contract
  - Verified frontend calls `GET /time/time-entries/summary/:period`
  - Verified periods are constrained to `daily|weekly|monthly`

- [x] Issue/epic rule guard
  - Verified issue create/update client blocks `type=EPIC`
  - Verified EPIC-related 400 maps to actionable message: `Use Epics module`

- [x] Analytics role gating
  - Verified admin analytics page blocks non-ADMIN users from system/db analytics actions.

- [x] Project files UI migration
  - Verified project file browser uses canonical `/projects/:projectId/files` endpoints for list/upload/download/delete.

## Not executed in this run (manual browser validation pending)

- [ ] Open `/login` and verify signin flow works end-to-end against live backend
- [ ] Open project details -> Files tab and verify upload/download/delete behavior in browser
- [ ] Open notifications UI and verify mark single + mark all behavior in browser
- [ ] Open employee time tracking and verify API-based summary values render
- [ ] Verify non-admin account cannot access admin analytics system/db content in UI

## Turbopack stability checks

- [ ] Run `npm run build`
  - Confirm no wrong-workspace-root warning from Turbopack.
  - Confirm build does not stall at `Creating an optimized production build ...`.
- [ ] Run `npm run build:turbo:debug`
  - Confirm debug diagnostics are available and command exits cleanly.
- [ ] Run `rg -n "next/font" app`
  - Expect no matches (neither `next/font/google` nor `next/font/local`).
- [ ] Verify runtime Google Fonts
  - Confirm `globals.css` has `@import url('https://fonts.googleapis.com/...')`.
  - Confirm `body` uses `font-family: 'Inter', ...` and `code, pre` uses `'JetBrains Mono', ...`.

## Tooling note

- `npm run lint` currently fails due broad pre-existing repository lint debt unrelated to this migration.
- Fonts are loaded at runtime via Google Fonts CDN; an internet connection is required for correct typography.
