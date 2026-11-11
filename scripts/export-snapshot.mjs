import { readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const destination = process.argv[2];
if (!destination) throw new Error('Usage: node scripts/export-snapshot.mjs /path/to/workstation-snapshot.json');
const source = readFileSync(new URL('../src/content/dashboard.local.ts', import.meta.url), 'utf8');
const { projects, tasks, exerciseSessions } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
writeFileSync(destination, JSON.stringify({ projects, tasks, exerciseSessions }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
