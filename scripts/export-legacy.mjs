import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const revision = 'abb0f2bd2869162c251a4ec5251a19060208ae30';
const destination = process.argv[2];
if (!destination) throw new Error('Usage: node scripts/export-legacy.mjs /path/to/workstation-snapshot.json');
const source = execFileSync('git', ['show', `${revision}:src/content/dashboard.ts`], { encoding: 'utf8' });
const legacy = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
writeFileSync(destination, JSON.stringify(legacy, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
