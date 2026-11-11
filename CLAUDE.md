# Workstation

See [README.md](README.md) for setup, OAuth and snapshot migration, and [CHANGELOG.md](CHANGELOG.md) for tracked changes.

The Astro site deploys to public GitHub Pages on pushes to `main`. Personal snapshots belong in the browser, and live service tokens and calendar responses belong in page memory. Keep them out of source files and build output.

Dashboard calculations live in `src/lib/time.mjs`. Browser storage and snapshot validation live in `src/lib/storage.mjs`. Check changes with `npm test` and `npm run build`.
