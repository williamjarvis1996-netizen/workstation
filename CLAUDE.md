# Workstation

See [README.md](README.md) for local snapshot setup and OAuth, and [CHANGELOG.md](CHANGELOG.md) for tracked changes.

The Astro site deploys to public GitHub Pages on pushes to `main`. Only the local development server reads `src/content/dashboard.local.ts`. Keep personal data and service tokens out of source and production builds.

Use `npm test` and `npm run build` to verify changes.

## Automated Data Sync

A GitHub Actions workflow (`.github/workflows/sync.yml`) runs daily at 06:42 UTC and on manual dispatch. It fetches live data from external APIs and commits the results to `main`, which triggers a fresh deploy.

### Data flow

```
sync scripts → src/content/sync/*.json → dashboard.ts imports JSON → Astro SSG build
```

### Sync scripts

- `scripts/sync-todoist.mjs` — Todoist API v1 with cursor-based pagination. Writes `src/content/sync/tasks.json`.
- `scripts/sync-calendar.mjs` — Google Calendar OAuth refresh token flow, 14-day window, multiple calendars. Writes `src/content/sync/calendar.json`.
- `scripts/google-auth-helper.mjs` — One-time local helper to generate a Google OAuth refresh token.

Scripts exit cleanly (code 0) when their API tokens are missing, so the workflow never fails due to unconfigured secrets.

### Fallback pattern

`dashboard.ts` imports the sync JSON files. When they contain data, it uses them; when empty (no tokens configured), it falls back to inline manual arrays:

```typescript
tasks: (syncedTasks as Task[]).length > 0 ? syncedTasks as Task[] : manualTasks,
```

### Required GitHub secrets

| Secret | Source |
|--------|--------|
| `TODOIST_API_TOKEN` | Todoist Settings → Integrations → Developer |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console OAuth client |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Cloud Console OAuth client |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | Run `scripts/google-auth-helper.mjs` locally |

Optional repository variable: `GOOGLE_CALENDAR_IDS` (comma-separated calendar IDs; defaults to `primary`).
