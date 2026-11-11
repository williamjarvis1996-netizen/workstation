const enabled = import.meta.env?.PUBLIC_SHARED_SYNC === '1';
const cacheKey = 'workstation-life-v1';
const queueKey = 'workstation-outbox-v1';
const seededKey = 'workstation-shared-seeded-v1';
const lists = new Set(['tasks', 'workouts', 'ideas']);
const buckets = [...lists, 'completed','goals','habits','creativeActions','taskPlans','projectPlans','dayPlans','portfolio'];
let work;
let shared = { status: enabled ? 'Connecting' : 'Browser only', syncedAt: '' };
let todoist = { status: enabled ? 'Checking' : 'Unavailable on this build', syncedAt: '', tasks: [] };
let calendar = { status: 'Disconnected', syncedAt: '', events: null };
let providerWork;

function announce(type = 'workstation:sync') { document.dispatchEvent(new Event(type)); }
export const syncInfo = () => ({ shared, todoist, calendar });
export function setCalendarStatus(value) {
  calendar = { ...calendar, ...value };
  announce();
}

function get(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function flatten(data) {
  return buckets.flatMap(bucket => lists.has(bucket)
    ? (data[bucket] || []).filter(item => item?.id).map(value => ({ bucket, key: value.id, value }))
    : Object.entries(data[bucket] || {}).map(([key, value]) => ({ bucket, key, value })));
}
const recordId = record => JSON.stringify([record.bucket, record.key]);
function merge(base, records) {
  const current = new Map(flatten(base).map(record => [recordId(record), record]));
  for (const record of records) {
    if (!buckets.includes(record.bucket)) continue;
    if (record.value === null) current.delete(recordId(record));
    else current.set(recordId(record), record);
  }
  const next = Object.fromEntries(buckets.map(bucket => [bucket, lists.has(bucket) ? [] : {}]));
  for (const { bucket, key, value } of current.values()) {
    if (lists.has(bucket)) next[bucket].push(value);
    else Object.defineProperty(next[bucket], key, { value, enumerable: true, configurable: true, writable: true });
  }
  return next;
}

function queue() { return get(queueKey, []); }
function saveQueue(records) { localStorage.setItem(queueKey, JSON.stringify(records)); }

export function queueChanges(before, after) {
  if (!enabled) return;
  const current = new Map(flatten(before).map(record => [recordId(record), record]));
  const pending = new Map(queue().map(record => [recordId(record), record]));
  for (const record of flatten(after)) {
    const id = recordId(record);
    if (JSON.stringify(current.get(id)?.value) !== JSON.stringify(record.value)) pending.set(id, record);
    current.delete(id);
  }
  for (const [id, record] of current) pending.set(id, { ...record, value: null });
  saveQueue([...pending.values()]);
  void refreshShared();
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(18000),
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  let value;
  try { value = await response.json(); } catch { throw new Error('The service returned an invalid response.'); }
  if (!response.ok) throw new Error(value.error || 'The service is unavailable.');
  return value;
}

async function pull() {
  const response = await api('/api/state');
  const old = get(cacheKey, {});
  if (!localStorage.getItem(seededKey)) {
    const remote = new Set(response.records.map(recordId));
    const pending = new Map(flatten(old).filter(record => !remote.has(recordId(record))).map(record => [recordId(record), record]));
    for (const record of queue()) pending.set(recordId(record), record);
    saveQueue([...pending.values()]);
    localStorage.setItem(seededKey, 'yes');
  }
  const next = merge({}, [...response.records, ...queue()]);
  if (JSON.stringify(old) !== JSON.stringify(next)) {
    localStorage.setItem(cacheKey, JSON.stringify(next));
    announce('workstation:change');
  }
  shared = { status: queue().length ? 'Changes queued' : 'Synced', syncedAt: response.syncedAt };
}

export function refreshShared() {
  if (!enabled || work) return work;
  work = (async () => {
    try {
      await pull();
      while (queue().length) {
        const batch = [];
        let size = 0;
        for (const record of queue().slice(0, 30)) {
          const length = new TextEncoder().encode(JSON.stringify(record)).length;
          if (batch.length && size + length > 105000) break;
          batch.push(record);
          size += length;
        }
        await api('/api/state', { method: 'PATCH', body: JSON.stringify({ records: batch }) });
        const sent = new Map(batch.map(record => [recordId(record), JSON.stringify(record)]));
        saveQueue(queue().filter(record => sent.get(recordId(record)) !== JSON.stringify(record)));
      }
      await pull();
    } catch (error) {
      shared = { ...shared, status: queue().length ? 'Offline · changes queued' : error.message };
    } finally {
      work = undefined;
      announce();
    }
  })();
  return work;
}

export function refreshTodoist() {
  if (!enabled || providerWork) return providerWork;
  providerWork = (async () => {
    try {
      const value = await api('/api/todoist');
      todoist = value.configured
        ? { status: value.partial ? 'Synced · first 1,000 tasks' : 'Synced', syncedAt: value.syncedAt, tasks: value.tasks }
        : { status: 'Connect in hosting settings', syncedAt: '', tasks: [] };
      announce('workstation:change');
    } catch (error) {
      todoist = { ...todoist, status: todoist.syncedAt ? 'Stale · refresh failed' : error.message };
    } finally {
      providerWork = undefined;
      announce();
    }
  })();
  return providerWork;
}

export async function completeTodoist(id) {
  await api('/api/todoist', { method: 'POST', body: JSON.stringify({ id }) });
  todoist = { ...todoist, tasks: todoist.tasks.filter(task => task.sourceId !== id) };
  announce('workstation:change');
  void refreshTodoist();
}

if (typeof document !== 'undefined' && enabled) {
  document.addEventListener('astro:page-load', () => { void refreshShared(); if (!todoist.syncedAt && todoist.status === 'Checking') void refreshTodoist(); });
  window.addEventListener('online', () => { void refreshShared(); void refreshTodoist(); });
  setInterval(() => { if (!document.hidden) void refreshShared(); }, 20000);
  setInterval(() => { if (!document.hidden) void refreshTodoist(); }, 120000);
}
