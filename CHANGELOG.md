# Changelog

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
