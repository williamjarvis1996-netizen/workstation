# Workstation

Personal dashboard built with Astro. It runs in the browser and uses deterministic rules for the London clock, task deadlines, meeting overlaps and focus time.

## Run locally

Use Node 20 or later.

```sh
npm ci
npm run dev
npm test
npm run build
```

The existing GitHub Pages workflow deploys pushes to `main`. The site is served under `/workstation/`.

## Connect Google Calendar

1. In a Google Cloud project, enable the Google Calendar API and configure the OAuth consent screen. Add your Google account as a test user if the app is in testing.
2. Create a **Web application** OAuth client. Add `https://williamjarvis1996-netizen.github.io` to Authorized JavaScript origins for GitHub Pages. For Astro's local development server, also add `http://localhost:4321`. Origins exclude the route and trailing slash.
3. Open Workstation Settings and enter the **client ID**. The ID is public configuration. Leave the calendar IDs as `primary`, or paste a comma-separated list from Google Calendar's settings. Save and click **Connect Google Calendar** to grant read-only access.
4. If publishing with a preconfigured client ID, set `PUBLIC_GOOGLE_CALENDAR_CLIENT_ID` in the build environment. Never enter an OAuth client secret or a personal access token in Workstation.

The calendar refreshes every five minutes while the tab is active. Google access tokens and live events stay in page memory. Reloading the page, expiration or disconnecting requires reconnecting. Workspace administrators may restrict OAuth access. The focus card uses the longest free block left between 09:00 and 18:00 London time.

## Import the old dashboard

The previous hard-coded snapshot is available in the repository's history. Export it with Node 22.13+ or Node 24 and a full clone, then use **Settings → Import JSON**.

```sh
node scripts/export-legacy.mjs ~/Downloads/workstation-snapshot.json
```

The import replaces the browser snapshot. Export first to keep a backup. Tasks and imported entries are stored per browser and site origin. Avoid importing work data on shared browsers. Live Google Calendar data is excluded from snapshot exports. Historical commits and previously deployed copies are outside the scope of this migration. GitHub Pages access and repository visibility are separate settings.

Todoist remains a quick link. A private service is needed for unattended Todoist sync and persistent cross-device access.

See [CHANGELOG.md](CHANGELOG.md) for the rebuild details.
