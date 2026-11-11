# Workstation

Astro dashboard with a compact daily Overview and dedicated Work, Training, Creative and Goals pages. Tasks, Activity and Links have their own pages. Work groups projects by production phase, Training charts logged running distance, Creative supports optional artwork and editable next actions, and Goals includes weekly check-ins and milestone dates.

Use **+ Capture** or **Ctrl/Command + Shift + K** to add tasks, workouts and creative ideas. Captured entries, task completions, creative next actions and goal plans are saved in browser storage for this site. They do not sync to the snapshot, your vault or other devices. The browser uses London time to update date-sensitive information and retrieves weather directly from Open-Meteo.

## Run with your personal snapshot

1. Use Node 20 or later and run `npm ci`.
2. Save your Workstation data module as `src/content/dashboard.local.ts`. Keep the named exports for projects, tasks, calendar events, activity, links and personal tracking. This file is ignored by Git.
3. Run `npm run dev` and open the URL printed by Astro.

The local development server loads the personal snapshot. Production builds use labelled sample data and never include the local snapshot. The GitHub Pages workflow deploys pushes to `main` under `/workstation/`.

## Connect Google Calendar

Enable the Google Calendar API in a Google Cloud project, configure the OAuth consent screen and create a **Web application** client. Add your exact Workstation origin to Authorized JavaScript origins. For local development, use the printed origin, for example `http://localhost:4321`. For GitHub Pages, use `https://williamjarvis1996-netizen.github.io`. For the private preview, add the preview origin.

Open **Settings** from the navigation and enter your client ID. The primary calendar is selected by default. Use comma-separated calendar IDs for additional calendars, then save and connect. Google access is read-only. Live events and access tokens are held in page memory, so an in-site navigation keeps the connection and a browser reload requires reconnecting. The dashboard refreshes the calendar every five minutes while open and calculates the longest remaining free block between 09:00 and 18:00 London time.

Todoist, activity and personal tracking use snapshot data. Google Calendar and weather are live integrations. See [CHANGELOG.md](CHANGELOG.md) for tracked changes.

## Verification

```sh
npm test
npm run build
```
