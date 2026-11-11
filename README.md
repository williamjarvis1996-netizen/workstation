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

Activity uses snapshot data. Todoist can sync on the private preview when configured. Google Calendar and weather are live integrations. See [CHANGELOG.md](CHANGELOG.md) for tracked changes.

## Verification

```sh
npm test
npm run build
```

## Planning and private sync

- Open **Day planner** from **Tasks** or use **Plan today** on Overview. Choose **Today** or **Tomorrow**. Suggested blocks use free time between 09:00 and 18:00 London time. Adjust task estimates, link milestones, reorder tasks or pin start times before saving. A missing estimate defaults to 30 minutes. The planner explains what could not fit and labels the calendar source. Connect Google Calendar from **Settings & sync** on Overview. Saved plans stay separate by date and do not create Google Calendar events.
- **Work** handovers hold the deliverable, owner, milestone date, dependencies and anything the project is waiting on. The attention list traces downstream impact.
- **Sync** shows each source and its last successful refresh. The private Sites Worker saves changes by record in D1 using the signed-in Site identity. Public GitHub Pages continues to use browser-only storage. The private build uses `PUBLIC_SHARED_SYNC=1` and the Worker build script with a Sites `DB` binding.
- Export your existing local snapshot with `node scripts/export-snapshot.mjs /path/to/workstation-snapshot.json` (Node 22.13+). Import that file on the private preview's **Sync** page. Only the explicitly selected file is uploaded to your private account storage. Captured data remains separate.
- Todoist needs `TODOIST_TOKEN` as a private runtime secret. Configure it in Site settings. Then use **Sync → Refresh tasks**. Completing a Todoist task writes back only when you click its checkbox. Google Calendar stays read-only.
