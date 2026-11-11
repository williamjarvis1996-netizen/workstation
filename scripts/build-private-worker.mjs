import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const manifest = JSON.parse(await readFile('.openai/hosting.json', 'utf8'));
if (manifest.d1 !== 'DB' || manifest.static) throw new Error('The private deployment requires a DB binding and Worker hosting.');
const assets = {};
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
async function add(directory, relative = '') {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const path = join(directory, item.name);
    const route = relative + '/' + item.name;
    if (item.isDirectory()) { await add(path, route); continue; }
    const type = types[extname(item.name)];
    if (!type) throw new Error('Unsupported private build asset: ' + item.name);
    const asset = { type, body: await readFile(path, 'utf8') };
    assets[item.name === 'index.html' ? relative + '/' : route] = asset;
  }
}
await add('dist');
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
const worker = await readFile('worker/index.mjs', 'utf8');
await writeFile('dist/server/index.js', worker.replace("import assets from './assets.mjs';", () => 'const assets = ' + JSON.stringify(assets) + ';'));
await cp('.openai/hosting.json', 'dist/.openai/hosting.json');
