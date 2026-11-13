#!/usr/bin/env node
// Fetch active tasks from Todoist and write src/content/sync/tasks.json.
// Requires TODOIST_API_TOKEN in the environment.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'sync');
const OUT_FILE = join(OUT_DIR, 'tasks.json');

const TOKEN = process.env.TODOIST_API_TOKEN;
if (!TOKEN) {
  console.error('TODOIST_API_TOKEN is not set — skipping task sync.');
  process.exit(0);
}

const headers = { Authorization: `Bearer ${TOKEN}` };

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Todoist ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAllTasks() {
  const all = [];
  let cursor = null;
  do {
    const url = cursor
      ? `https://api.todoist.com/api/v1/tasks?cursor=${cursor}`
      : 'https://api.todoist.com/api/v1/tasks';
    const data = await fetchJSON(url);
    if (Array.isArray(data)) {
      return data;
    }
    all.push(...(data.results || data.items || []));
    cursor = data.next_cursor || null;
  } while (cursor);
  return all;
}

async function fetchAllProjects() {
  const url = 'https://api.todoist.com/api/v1/projects';
  const data = await fetchJSON(url);
  if (Array.isArray(data)) return data;
  return data.results || data.items || [];
}

// Map Todoist priority (4=urgent, 1=none) to our model.
function mapPriority(todoistPriority) {
  if (todoistPriority === 4) return 'high';
  if (todoistPriority === 3) return 'medium';
  return 'low';
}

async function main() {
  const tasks = await fetchAllTasks();
  const projects = await fetchAllProjects();
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const mapped = tasks.map(t => ({
    title: t.content,
    project: t.project_id ? projectMap[t.project_id] : undefined,
    priority: mapPriority(t.priority),
    due: t.due?.date || undefined,
    completed: t.is_completed || false,
    todoistId: t.id,
  }));

  // Sort: overdue first, then by due date, then no-date last.
  mapped.sort((a, b) => {
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    return 0;
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(mapped, null, 2) + '\n');
  console.log(`Synced ${mapped.length} tasks from Todoist → ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Todoist sync failed:', err.message);
  process.exit(1);
});
