import assets from './assets.mjs';

const buckets = new Set(['tasks','workouts','ideas','completed','goals','habits','creativeActions','taskPlans','projectPlans','dayPlans','portfolio']);
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status = 200) => Response.json(value, { status, headers });

async function smallJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Expected JSON');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Expected a body');
  const decoder = new TextDecoder();
  let body = '', length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 128000) { await reader.cancel(); throw new Error('Request is too large'); }
    body += decoder.decode(value, { stream: true });
  }
  return JSON.parse(body + decoder.decode());
}

function validRecord(record) {
  return record && buckets.has(record.bucket) && typeof record.key === 'string'
    && record.key.length > 0 && record.key.length <= 600 && !['__proto__','prototype','constructor'].includes(record.key)
    && Object.hasOwn(record, 'value') && JSON.stringify(record.value).length <= 18000;
}

async function state(request, env, user) {
  if (!env.DB) return json({ error: 'Shared storage is unavailable.' }, 503);
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT bucket, record_key, value_json, updated_at FROM workstation_records WHERE user_id = ?').bind(user).all();
    return json({ records: results.map(row => ({ bucket: row.bucket, key: row.record_key, value: JSON.parse(row.value_json) })), syncedAt: new Date().toISOString() });
  }
  if (request.method !== 'PATCH') return json({ error: 'Method not allowed.' }, 405);
  let body;
  try { body = await smallJson(request); } catch { return json({ error: 'Invalid request body.' }, 400); }
  if (!Array.isArray(body?.records) || !body.records.length || body.records.length > 40 || !body.records.every(validRecord)) {
    return json({ error: 'Invalid record batch.' }, 400);
  }
  const stamp = new Date().toISOString();
  await env.DB.batch(body.records.map(record => env.DB.prepare(
    'INSERT INTO workstation_records (user_id, bucket, record_key, value_json, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, bucket, record_key) DO UPDATE SET value_json=excluded.value_json, updated_at=excluded.updated_at'
  ).bind(user, record.bucket, record.key, JSON.stringify(record.value), stamp)));
  return json({ syncedAt: stamp });
}

async function todoist(request, env) {
  if (!env.TODOIST_TOKEN) return json({ configured: false });
  const api = 'https://api.todoist.com/api/v1/tasks';
  const options = { headers: { Authorization: `Bearer ${env.TODOIST_TOKEN}` }, signal: AbortSignal.timeout(12000) };
  if (request.method === 'POST') {
    let body;
    try { body = await smallJson(request); } catch { return json({ error: 'Invalid task request.' }, 400); }
    if (typeof body?.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(body.id)) return json({ error: 'Invalid task ID.' }, 400);
    const response = await fetch(`${api}/${body.id}/close`, { ...options, method: 'POST' });
    return response.ok ? json({ completed: true }) : json({ error: `Todoist returned ${response.status}. Refresh Todoist before retrying.` }, 502);
  }
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  const tasks = [];
  let cursor;
  for (let i = 0; i < 10; i++) {
    const url = new URL(api);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await fetch(url, options);
    if (!response.ok) return json({ error: `Todoist returned ${response.status}.` }, 502);
    const page = await response.json();
    if (!Array.isArray(page.results)) return json({ error: 'Unexpected Todoist response.' }, 502);
    for (const task of page.results) {
      if (!task.id || typeof task.content !== 'string') continue;
      tasks.push({ id: 'todoist:' + task.id, sourceId: String(task.id), title: task.content, due: task.due?.date || '',
        priority: task.priority >= 4 ? 'high' : task.priority >= 2 ? 'medium' : 'low', completed: false });
    }
    cursor = page.next_cursor;
    if (!cursor) break;
  }
  return json({ configured: true, tasks, partial: Boolean(cursor), syncedAt: new Date().toISOString() });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const user = request.headers.get('oai-authenticated-user-id');
      if (!user || user.length > 200) return json({ error: 'Sign in to sync.' }, 401);
      if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json({ error: 'Origin not allowed.' }, 403);
      try {
        if (url.pathname === '/api/state') return await state(request, env, user);
        if (url.pathname === '/api/todoist') return await todoist(request, env);
      } catch {
        return json({ error: 'The data service could not complete the request.' }, 503);
      }
      return json({ error: 'Unknown endpoint.' }, 404);
    }
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers });
    const route = url.pathname;
    if (!assets[route] && assets[route + '/']) return Response.redirect(url.origin + route + '/' + url.search, 308);
    const asset = Object.hasOwn(assets, route) ? assets[route] : null;
    if (!asset) return new Response('Not found', { status: 404, headers });
    return new Response(request.method === 'HEAD' ? null : asset.body, {
      headers: { ...headers, 'Content-Type': asset.type },
    });
  },
};
