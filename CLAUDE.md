# Will Jarvis Workstation

Personal dashboard and command centre. Built with Astro 5.x, deployed to GitHub Pages.

**URL**: https://williamjarvis1996-netizen.github.io/workstation/
**Repo**: williamjarvis1996-netizen/workstation

## Tech Stack

- **Framework**: Astro 5.x (static site generation)
- **Deployment**: GitHub Pages via Actions (`.github/workflows/deploy.yml`)
- **Fonts**: Inter (body) + JetBrains Mono (labels, code), from Google Fonts
- **Base path**: `/workstation` (set in astro.config.mjs)

## Project Structure

```
src/
  content/dashboard.ts     # All site data: projects, tasks, log entries, quick links
  layouts/Base.astro       # Site-wide layout, header, footer
  styles/global.css        # CSS custom properties, tokens, utility classes
  pages/
    index.astro            # Main dashboard
    log/index.astro        # Full activity log
    links/index.astro      # Quick links page
public/
  robots.txt               # Disallow all indexing (public but not discoverable)
```

## How to Update Content

All dynamic content lives in `src/content/dashboard.ts`. Edit the exported arrays:

- **projects**: Add/update active projects with name, code, client, status, priority, notes, links
- **tasks**: Add open tasks with title, optional project, priority, optional due date
- **log**: Add entries with date (YYYY-MM-DD), title, source, content
- **quickLinks**: Add links with label, url, category
- **lastUpdated**: Set to today's date when making changes

After editing, commit and push to `main`. GitHub Actions builds and deploys automatically.

## Pulling from Connected Services

When asked to update the workstation, Claude should pull from these sources using MCP tools. Always update `lastUpdated` in dashboard.ts after making changes.

### Slack (mcp__Slack__*)

Key channels to monitor:
- `#2491-iktva-2027-off-the-scale` for IKTVA project updates
- `#general` for company-wide updates

Use `slack_read_channel` to pull recent messages. Summarise relevant updates as log entries with `source: 'slack'`.

### Gmail (mcp__Gmail__*)

Use `search_threads` to find recent work emails. Look for:
- Client correspondence and briefs
- Project status updates
- Meeting invitations and follow-ups

Summarise relevant threads as log entries with `source: 'email'`.

### Todoist (mcp__Todoist__*)

Use `find-tasks` to pull open tasks. Sync them into the `tasks` array in dashboard.ts. Map Todoist priority levels (p1/p2/p3/p4) to high/medium/low.

### Obsidian Vault (obsidian-vault MCP)

When connected via Claude Desktop, read from the vault at:
`/Users/will/Library/Mobile Documents/iCloud~md~obsidian/Documents/Master Vault`

Key locations:
- `🎬 RD/` for active project notes
- `👤 Will Jarvis/` for personal projects
- `❗️ Daily/` for daily notes

Pull project status updates and log relevant changes with `source: 'obsidian'`.

**Note**: Obsidian MCP is only available from Claude Desktop, not Claude Code web sessions.

## Conventions

- Never use em dashes in file content
- Dates: YYYY-MM-DD format in data, displayed as-is on the site
- Links: Use `${import.meta.env.BASE_URL}pagename/` format (no double slash)
- `trailingSlash: 'always'` is set in astro.config.mjs, so all internal paths end with `/`
- robots.txt blocks all crawlers. The site is public but not meant to be searchable.
- Dark theme is the primary design. Light theme is supported via `prefers-color-scheme`.

## Deployment

Push to `main` triggers the GitHub Actions workflow which builds and deploys to Pages.
The repo needs GitHub Pages enabled: Settings > Pages > Source: GitHub Actions.
