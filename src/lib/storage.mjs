const key = 'wj-workstation-v2';
const priorities = new Set(['high', 'medium', 'low']);
const sources = new Set(['slack', 'email', 'todoist', 'obsidian', 'manual']);
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const empty = { tasks: [], projects: [], log: [], quickLinks: [], calendarEvents: [] };

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function string(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function date(value) {
  if (typeof value !== 'string' || !dayPattern.test(value)) return '';
  const time = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : '';
}

function time(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
}

function list(value, map) {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object').map(map).filter(Boolean) : [];
}

function link(item) {
  const label = string(item.label);
  const url = safeUrl(item.url);
  return label && url ? { label, url, category: string(item.category) || 'Imported' } : null;
}

export function normalize(data) {
  if (!data || typeof data !== 'object' || !Object.keys(empty).some(key => Array.isArray(data[key]))) {
    throw new Error('Choose a Workstation JSON file.');
  }
  const usedIds = new Set();
  return {
    tasks: list(data.tasks, item => {
      const title = string(item.title);
      if (!title) return null;
      let id = string(item.id);
      if (!id || usedIds.has(id)) id = crypto.randomUUID();
      usedIds.add(id);
      return { id, title, project: string(item.project), priority: priorities.has(item.priority) ? item.priority : 'medium',
        due: date(item.due), completed: item.completed === true };
    }),
    projects: list(data.projects, item => {
      const name = string(item.name);
      if (!name) return null;
      return { name, code: string(item.code), client: string(item.client), notes: string(item.notes),
        status: ['active', 'paused', 'completed'].includes(item.status) ? item.status : 'active',
        priority: priorities.has(item.priority) ? item.priority : 'medium', deadline: date(item.deadline),
        links: list(item.links, link) };
    }),
    log: list(data.log, item => {
      const title = string(item.title);
      const day = date(item.date);
      return title && day ? { title, date: day, content: string(item.content),
        source: sources.has(item.source) ? item.source : 'manual' } : null;
    }).sort((a, b) => b.date.localeCompare(a.date)),
    quickLinks: list(data.quickLinks, link),
    calendarEvents: list(data.calendarEvents, item => {
      const title = string(item.title);
      const day = date(item.date);
      return title && day ? { title, date: day, startTime: time(item.startTime), endTime: time(item.endTime),
        location: string(item.location) } : null;
    }),
    lastUpdated: date(data.lastUpdated),
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return normalize(JSON.parse(raw));
  } catch (error) {
    console.warn('Workstation data could not be read', error);
  }
  return normalize(empty);
}

export function save(data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function make(tag, value, className) {
  const element = document.createElement(tag);
  if (value) element.textContent = value;
  if (className) element.className = className;
  return element;
}

export function emptyState(message, symbol, variant) {
  const state = make('div', '', `dashboard-empty ${variant}`);
  const icon = make('span', symbol, 'empty-state-icon');
  icon.setAttribute('aria-hidden', 'true');
  state.append(icon, make('p', message));
  return state;
}

export function externalLink(label, url) {
  const a = make('a', label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
