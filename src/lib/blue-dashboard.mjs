import { addDays, agenda, groupTasks, londonClock, londonDay, londonTime, minutes } from './time.mjs';
import { authorize, fetchCalendar, prepareIdentity } from './google-calendar.mjs';
import { make, externalLink } from './storage.mjs';
import { londonWeather } from './weather.mjs';

const byId = id => document.getElementById(id);
const root = byId('blue-dashboard');
const tasks = JSON.parse(root.dataset.tasks);
const demo = root.dataset.demo === 'true';
const snapshot = JSON.parse(root.dataset.calendar).map((event, index) => {
  const start = londonTime(event.date, event.startTime || '00:00');
  const end = event.endTime ? londonTime(event.date, event.endTime)
    : event.startTime ? start + 30 * 60000 : londonTime(addDays(event.date, 1));
  return { id: `snapshot:${index}`, start, end: end > start ? end : start + 30 * 60000,
    title: event.title, location: event.location, allDay: !event.startTime, busy: true };
});
const dayFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const upcomingFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' });
const timeline = byId('today-timeline');
const upcoming = byId('upcoming-tasks');
const alerts = byId('alert-items');
const form = byId('calendar-form');
const connect = byId('calendar-connect');
const disconnect = byId('calendar-disconnect');
const status = byId('calendar-status');
const key = 'wj-workstation-calendar-v1';
let settings = { client: root.dataset.clientId || '', ids: ['primary'] };
let identity;
let token;
let liveEvents;
let synced = 0;
let attempt = 0;
let weatherAt = 0;
let request;
let connecting = false;
let londonDate;
let lastTimeline = '';

try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && typeof saved.client === 'string' && Array.isArray(saved.ids) && saved.ids.length) settings = saved;
} catch {
  // Use the default settings when storage is unavailable.
}
form.elements.client.value = settings.client;
form.elements.ids.value = settings.ids.join(', ');

function alertItem(text, variant) {
  const item = make('span', '', `alert-item alert-item--${variant}`);
  item.append(make('span', '', 'alert-pip'), document.createTextNode(text));
  return item;
}

function timelineItem(type, time, label, detail, url) {
  const item = make('div', '', `tl-item tl-item--${type}`);
  const body = make('div', '', 'tl-body');
  const title = url ? externalLink(label, url) : make('span', label);
  title.className = 'tl-label';
  body.append(title);
  if (detail) body.append(make('span', detail, 'tl-detail'));
  item.append(make('div', time, 'tl-time'), make('div', '', `tl-dot tl-dot--${type}`), body);
  return item;
}

function renderUpcoming(groups, day) {
  const limit = addDays(day, 5);
  const sections = new Map();
  for (const task of [...groups.Upcoming.filter(task => task.due <= limit), ...groups['No date']]) {
    const key = task.due || 'No date';
    if (!sections.has(key)) {
      const section = make('div', '', 'upcoming-day');
      section.append(make('div', task.due ? upcomingFormat.format(londonTime(task.due)) : key, 'upcoming-day-label'));
      sections.set(key, section);
    }
    const row = make('div', '', 'upcoming-task');
    row.append(make('div', '', `upcoming-dot upcoming-dot--${task.priority}`), make('span', task.title, 'upcoming-title'));
    if (task.project) row.append(make('span', task.project, 'upcoming-project'));
    sections.get(key).append(row);
  }
  upcoming.replaceChildren(...sections.values());
  if (!sections.size) upcoming.append(make('div', 'Nothing due in the next five days.', 'empty-state-sm'));
}

function render(now) {
  const day = londonDay(now);
  const visibleTasks = demo ? [
    ...tasks,
    { title: 'Review first edit', project: 'Social Series', priority: 'high', due: addDays(day, -1) },
    { title: 'Confirm locations', project: 'Brand Film', priority: 'medium', due: day },
    { title: 'Share budget', project: 'Studio Launch', priority: 'medium', due: addDays(day, 2) },
  ] : tasks;
  const groups = groupTasks(visibleTasks, day);
  const model = agenda(liveEvents ?? snapshot, now);
  const active = Boolean(token && liveEvents);
  if (londonDate !== day) {
    londonDate = day;
    const parts = Object.fromEntries(dayFormat.formatToParts(now).map(({type, value}) => [type, value]));
    byId('day-name').textContent = parts.weekday;
    byId('day-number').textContent = parts.day;
    byId('day-month').textContent = `${parts.month} ${parts.year}`;
    const race = byId('weeks-to-race');
    if (race && /^\d{4}-\d{2}-\d{2}$/.test(race.dataset.raceDate)) {
      const weeks = Math.ceil((Date.parse(race.dataset.raceDate) - Date.parse(day)) / (7 * 86400000));
      race.textContent = weeks > 0 ? `${weeks}w to race` : weeks === 0 && race.dataset.raceDate === day ? 'Race day' : 'Race date passed';
    }
    renderUpcoming(groups, day);
  }

  const items = [];
  if (groups.Overdue.length) items.push(alertItem(`${groups.Overdue.length} overdue`, 'danger'));
  if (groups.Today.length) items.push(alertItem(`${groups.Today.length} due today`, 'warn'));
  if (active && model.next) items.push(alertItem(londonDay(model.next.start) === day
    ? `Next meeting in ${minutes(now, model.next.start)} min`
    : `Next meeting ${upcomingFormat.format(model.next.start)} at ${londonClock(model.next.start)}`, 'info'));
  if (active && model.longest) items.push(alertItem(`Focus time ${londonClock(model.longest.start)}–${londonClock(model.longest.end)}`, 'info'));
  alerts.replaceChildren(...items);
  const alert = byId('dashboard-alert');
  alert.hidden = !items.length;
  alert.classList.toggle('alert--danger', groups.Overdue.length > 0);
  alert.classList.toggle('alert--info', groups.Overdue.length === 0);

  const rows = groups.Overdue.map(task => ['overdue', 'OVERDUE', task.title, [task.project, `due ${task.due}`].filter(Boolean).join(' · ')]);
  const planned = model.today.map(event => ({
    time: event.start,
    values: ['event', event.allDay ? 'All day' : londonClock(event.start), event.title,
      [event.location, model.current.includes(event) && 'In progress', model.overlaps.has(event.id) && 'Overlaps'].filter(Boolean).join(' · '), event.url],
  }));
  for (const task of groups.Today) planned.push({time: Infinity, values: ['task', 'TODAY', task.title, task.project]});
  rows.push(...planned.sort((a, b) => a.time - b.time).map(item => item.values));
  const signature = JSON.stringify([rows, active]);
  if (lastTimeline !== signature && !timeline.contains(document.activeElement)) {
    lastTimeline = signature;
    timeline.replaceChildren(...rows.map(row => timelineItem(...row)));
    if (!rows.length) timeline.append(make('p', active ? 'Nothing scheduled for today.' : 'No items in the snapshot for today.', 'empty-state'));
    byId('timeline-count').textContent = `${rows.length} ${rows.length === 1 ? 'item' : 'items'}`;
  }
}

function renderConnection() {
  connect.disabled = Boolean(request || connecting);
  connect.textContent = token ? 'Refresh Google Calendar' : 'Connect Google Calendar';
  disconnect.hidden = !token;
}

function clearCalendar(message) {
  request?.abort();
  request = undefined;
  token = undefined;
  liveEvents = undefined;
  synced = 0;
  status.textContent = message;
  renderConnection();
  render(Date.now());
}

function warmIdentity() {
  if (settings.client) prepareIdentity().then(value => { identity = value; }).catch(() => {});
}

async function syncCalendar(now) {
  if (!token || request) return;
  attempt = now;
  const controller = new AbortController();
  request = controller;
  status.textContent = 'Refreshing Google Calendar…';
  renderConnection();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const events = await fetchCalendar(token.value, settings.ids, now, controller.signal);
    if (request !== controller) return;
    liveEvents = events;
    synced = Date.now();
    status.textContent = `Google Calendar updated at ${londonClock(synced)} London.`;
  } catch (error) {
    if (request !== controller) return;
    if (error.status === 401) clearCalendar('Google access expired. Reconnect to refresh.');
    else status.textContent = (error.name === 'AbortError' ? 'Calendar refresh timed out.' : error.message)
      + (synced ? ` Showing the ${londonClock(synced)} update.` : ' Showing the snapshot.');
  } finally {
    clearTimeout(timeout);
    if (request === controller) request = undefined;
    renderConnection();
    render(Date.now());
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const client = form.elements.client.value.trim() || root.dataset.clientId;
  if (client && !/^[\w-]+\.apps\.googleusercontent\.com$/.test(client)) {
    status.textContent = 'Enter a Google OAuth web client ID ending in .apps.googleusercontent.com.';
    return;
  }
  const ids = [...new Set(form.elements.ids.value.split(',').map(id => id.trim()).filter(Boolean))];
  const updated = { client, ids: ids.length ? ids : ['primary'] };
  try {
    localStorage.setItem(key, JSON.stringify(updated));
    settings = updated;
    clearCalendar('Calendar settings saved.');
    warmIdentity();
  } catch {
    status.textContent = 'Browser storage is unavailable.';
  }
});

connect.addEventListener('click', async () => {
  if (token) return syncCalendar(Date.now());
  if (!settings.client) {
    status.textContent = 'Enter and save your Google OAuth web client ID first.';
    form.elements.client.focus();
    return;
  }
  connecting = true;
  renderConnection();
  const pending = settings;
  try {
    if (!identity) {
      identity = await prepareIdentity();
      status.textContent = 'Google sign-in is ready. Select Connect Google Calendar again.';
      return;
    }
    const access = await authorize(identity, settings.client);
    if (pending === settings) {
      token = access;
      await syncCalendar(Date.now());
    }
  } catch (error) {
    if (pending === settings) status.textContent = error.message;
  } finally {
    connecting = false;
    renderConnection();
  }
});

disconnect.addEventListener('click', () => {
  const access = token?.value;
  clearCalendar('Google Calendar disconnected.');
  if (access) identity?.revoke(access, () => {});
  connect.focus();
});

async function refreshWeather(now) {
  weatherAt = now;
  const weather = byId('weather-inline');
  try {
    const result = await londonWeather(AbortSignal.timeout(12000));
    weather.textContent = `${result.headline} · London`;
    byId('weather-forecast').textContent = result.details;
  } catch {
    weather.textContent = 'London weather unavailable';
    byId('weather-forecast').textContent = '';
  }
}

function tick() {
  const now = Date.now();
  const dayChanged = londonDate !== londonDay(now);
  if (token && token.expires <= now) clearCalendar('Google access expired. Reconnect to refresh.');
  if (token && (dayChanged || now - attempt >= 5 * 60000)) syncCalendar(now);
  if (dayChanged || now - weatherAt >= 15 * 60000) refreshWeather(now);
  render(now);
}
warmIdentity();
tick();
setInterval(tick, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
