# Workstation

See [README.md](README.md) for local snapshot setup and OAuth, and [CHANGELOG.md](CHANGELOG.md) for tracked changes.

The Astro site deploys to public GitHub Pages on pushes to `main`. Only the local development server reads `src/content/dashboard.local.ts`. Keep personal data and service tokens out of source and production builds.

Use `npm test` and `npm run build` to verify changes.
