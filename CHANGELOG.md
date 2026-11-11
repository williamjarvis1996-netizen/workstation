# Changelog

## Live dashboard rebuild

- Replaced the static dashboard with a responsive overview, an agenda, task groups, active project deadlines and expandable activity. Preserved the dashboard, activity and links routes.
- Recalculate the London date, overdue tasks and agenda in the browser. Account for British Summer Time and refresh the view after the tab becomes visible.
- Fetch current London weather and the day's high, low and precipitation probability from Open-Meteo. Refresh every 15 minutes and report errors.
- Added Google Calendar read-only OAuth and support for multiple calendar IDs. Fetch an eight-day window, follow pagination, expand recurring events, deduplicate shared copies and skip declined or cancelled meetings.
- Show events in progress, upcoming meetings, overlapping busy events and the longest remaining free block in the 09:00–18:00 London workday.
- Added browser-local tasks with due dates, priority, completion, reopening and filtering. Added source filters and search to the Activity page.
- Removed the personal snapshot from new build outputs. Added browser-local import and export plus a migration script for the old snapshot. The original snapshot remains in Git history.
- Added error and empty states, keyboard focus styles, semantic headings and light/dark colour schemes.
- Added deterministic checks for London time, task grouping, calendar windows and local snapshot validation. Pull requests run tests and builds without publishing.
