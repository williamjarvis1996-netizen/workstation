# Changelog

## Multi-calendar sync — 13 November 2026

- Synced all four Google Calendars into `calendar.json` via the Claude connector: work (Office days, scheduling meetings), personal (subscription payment reminders), fitness (gym sessions, runs) and create.
- Previously only the work calendar synced because the OAuth token is scoped to the work Google account. Personal, fitness and create calendars live on the personal Gmail account and returned 404 from the automated sync.
- The automated daily sync (`sync.yml`) continues to pull the work calendar via OAuth. Cross-account calendars are supplemented via the Claude connector when this session runs.

## Automated data sync, creative enrichment and snapshot sync — 12-13 November 2026

- Added a GitHub Actions workflow (`.github/workflows/sync.yml`) that runs daily at 06:42 UTC to sync external data and commit the results to `main`, which triggers a fresh deploy.
- Created `scripts/sync-todoist.mjs` — fetches active tasks from the Todoist API v1 (cursor-based pagination), maps priorities and project names, sorts by due date (overdue first), and writes `src/content/sync/tasks.json`. Exits cleanly if no token is configured.
- Created `scripts/sync-calendar.mjs` — uses a Google Calendar OAuth refresh token to fetch a 14-day event window across multiple calendars, filters cancelled/declined events, converts times to London timezone, deduplicates, and writes `src/content/sync/calendar.json`. Exits cleanly if credentials are missing.
- Created `scripts/google-auth-helper.mjs` — one-time helper to generate a Google OAuth refresh token. Starts a local HTTP server, walks through the consent flow, and prints the token with `gh secret set` instructions.
- Refactored `src/content/dashboard.ts` to import synced JSON files and use them when populated, falling back to the manual snapshot when the sync arrays are empty (i.e. before API tokens are configured).
- Made `lastUpdated` dynamic — now uses the build date instead of a hardcoded string, so it automatically reflects when the site was last deployed.
- Fixed `google-auth-helper.mjs` secret naming mismatch — output now uses `GOOGLE_CALENDAR_*` names matching the sync workflow instead of the shorter `GOOGLE_*` names.
- Documented the sync pipeline architecture in CLAUDE.md (data flow, fallback pattern, required secrets).
- Enriched all six creative projects with vault data: loglines, themes, characters with suggested actors, collaborators, recognition, references, links, festival strategies and collective tags. Added The Master Plan and GGG as new entries.
- Synced snapshot against live Todoist and Google Calendar: fixed drifted due dates, added missing tasks and corrected calendar events.
- **Setup required**: add `TODOIST_API_TOKEN`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, and `GOOGLE_CALENDAR_REFRESH_TOKEN` as GitHub repository secrets. Optionally set `GOOGLE_CALENDAR_IDS` as a repository variable (comma-separated calendar IDs; defaults to `primary`). Run `scripts/google-auth-helper.mjs` to generate the refresh token.

## Day planner in Tasks

- Added Today and Tomorrow planning, calendar source labels, suggested blocks, unscheduled work and saved plans inside Tasks.
- Linked the planner from Overview and kept saved plans separate by London date.

## Training navigation

- Split Training into Overview, Running and Strength, with shared tabs and the old Full-year URL redirecting to Running.
- Added year and gym filters, running distance milestones, weekly gym visits, split counts and searchable ledgers.

## Planning, project dependencies and shared data

- Added an explainable Day plan with task estimates, milestone links, reorder/pin controls, calendar-aware time blocks and committed plans.
- Added project handovers, milestone deadlines and dependency risk that traces downstream impacts.
- Added signed-in private record sync, an offline queue, snapshot import and visible source status. Added optional Todoist reads and explicit task completion write-back.

## Dashboard redesign and quick capture

- Rebuilt Today as a time-based agenda with overlapping lanes, a live now marker and a highlighted focus block. Added a daily brief that changes with calendar and task state.
- Turned Work into a phase-based production board with an attention strip, prominent milestones and dates.
- Gave Work, Training, Creative and Goals distinct accent colours within the navy shell.
- Rebuilt Training around the race countdown, next long run, weekly distance, last workout and pace where distance and duration are recorded.
- Added a Creative poster slate, list view, optional artwork and browser-local next actions.
- Added editable goal targets, next actions, milestone dates and a seven-day check-in grid.
- Added a three-item task preview, filters, quick completion, a dedicated Tasks page and a keyboard-accessible capture dock for tasks, workouts and ideas.
- Added stronger panel contrast, a clock glow and reduced-motion-aware transitions. Demo builds continue to use labelled sample data.

## Daily overview and life pages

- Added Work, Training, Creative and Goals pages with a desktop sidebar and wrapping mobile navigation. Kept Activity and Links.
- Added a prominent London clock and a weather card on Overview. Training now shows session totals and a distance chart based on logged runs.
- Added next meeting, due today and focus-window summaries. Separated the Today agenda from a compact to-do panel with overdue tasks grouped by project and upcoming tasks grouped by date.
- Moved calendar setup into Settings, preserved the live calendar session during in-site navigation and added a connection label to Today.
- Added an Activity expand indicator and enabled wrapping for long titles.

## Blue dashboard revision

- Restored the supplied navy layout, quick links, Today timeline, project health and milestones, marathon, exercise, creative projects, goals, Upcoming and Activity.
- Moved date, overdue and upcoming calculations into the browser. Added London weather and forecast, marathon countdown, read-only Google Calendar, overlaps and the longest remaining focus window.
- Restored the dedicated Log and Links views. Local development reads the supplied snapshot from an ignored file. Production and preview builds use labelled sample data.
- Superseded the earlier green overview and its browser-local task editing and JSON import/export. The richer snapshot is maintained in the local data module.

## Initial draft (superseded)

- Replaced the static dashboard with a responsive overview, an agenda, task groups, active project deadlines and expandable activity. Preserved the dashboard, activity and links routes.
- Recalculate the London date, overdue tasks and agenda in the browser. Account for British Summer Time and refresh the view after the tab becomes visible.
- Fetch current London weather and the day's high, low and precipitation probability from Open-Meteo. Refresh every 15 minutes and report errors.
- Added Google Calendar read-only OAuth and support for multiple calendar IDs. Fetch an eight-day window, follow pagination, expand recurring events, deduplicate shared copies and skip declined or cancelled meetings.
- Show events in progress, upcoming meetings, overlapping busy events and the longest remaining free block in the 09:00–18:00 London workday.
- Added browser-local tasks with due dates, priority, completion, reopening and filtering. Added source filters and search to the Activity page.
- Removed the personal snapshot from new build outputs. Added browser-local import and export plus a migration script for the old snapshot. The original snapshot remains in Git history.
- Added error and empty states, keyboard focus styles, semantic headings and light/dark colour schemes.
- Added deterministic checks for London time, task grouping, calendar windows and local snapshot validation. Pull requests run tests and builds without publishing.
