import { addDays, agenda, groupTasks, londonClock, londonDay, londonHeading, londonTime, minutes } from './time.mjs';
import { externalLink, load, make, normalize, save } from './storage.mjs';
import { authorize, fetchCalendar, prepareIdentity } from './google-calendar.mjs';
import { londonWeather } from './weather.mjs';
import { activityEntry, empty } from './rows.mjs';

const byId = id => document.getElementById(id);
const setText = (id, value) => { byId(id).textContent = value; };
const settingsKey = 'wj-workstation-calendar-v1';
const defaultClient = byId('workstation').dataset.clientId;
const taskForm = byId('task-form');
const taskToggle = byId('task-toggle');
const calendarAction = byId('calendar-action');
const disconnect = byId('calendar-disconnect');
const clientInput = byId('oauth-client');
const idsInput = byId('calendar-ids');
const filters = document.querySelectorAll('[data-task-filter]');
let data = load();
let filter = 'open';
let day;
let settings = { client: defaultClient, ids: ['primary'] };
let identity;
let token;
let events;
let synced;
let request;
let connecting = false;
let calendarError = '';
let weatherDay;
let weatherAt = 0;

try {
  const previous = JSON.parse(localStorage.getItem(settingsKey));
  if (previous?.client && Array.isArray(previous.ids) && previous.ids.length) settings = previous;
} catch {
  // The defaults also work when browser storage is unavailable.
}
clientInput.value = settings.client;
idsInput.value = settings.ids.join(', ');

function persist(updated, statusId, message) {
  try {
    save(updated);
    data = updated;
    setText(statusId, message);
    return true;
  } catch {
    setText(statusId, 'Browser storage is unavailable or full. The change was not saved.');
    return false;
  }
}

function renderTasks(now) {
  const groups = groupTasks(data.tasks, londonDay(now));
  const due = groups.Overdue.length + groups.Today.length;
  const open = data.tasks.length - groups.Completed.length;
  setText('task-value', `${due} due`);
  setText('task-detail', groups.Overdue.length ? `${groups.Overdue.length} overdue · ${groups.Today.length} today` : `${open} open · ${groups.Today.length} today`);
  const target = byId('task-list');
  target.replaceChildren();
  const visible = Object.entries(groups).filter(([label, tasks]) => tasks.length
    && (filter === 'completed' ? label === 'Completed' : label !== 'Completed'));
  if (!visible.length) {
    target.append(empty(filter === 'completed' ? 'No completed tasks.' : 'No open tasks. Add one when you’re ready.'));
    return;
  }
  for (const [label, tasks] of visible) {
    const section = make('section', '', 'task-group');
    section.append(make('h3', label, label === 'Overdue' ? 'overdue' : ''));
    for (const task of tasks) {
      const row = make('div', '', 'item-row');
      const text = make('div', '', 'row-text');
      text.append(make('strong', task.title), make('p', [task.project, `${task.priority} priority`, task.due].filter(Boolean).join(' · '), 'row-meta'));
      const button = make('button', task.completed ? 'Reopen' : 'Done', 'quiet row-action');
      button.type = 'button';
      button.dataset.id = task.id;
      button.setAttribute('aria-label', `${task.completed ? 'Reopen' : 'Complete'} ${task.title}`);
      button.addEventListener('click', () => {
        const tasks = data.tasks.map(item => item.id === task.id ? { ...item, completed: !task.completed } : item);
        if (persist({ ...data, tasks }, 'task-status', task.completed ? 'Task reopened.' : 'Task completed.')) {
          const buttons = [...target.querySelectorAll('button')];
          const index = buttons.indexOf(button);
          renderTasks(Date.now());
          (target.querySelectorAll('button')[index] || document.querySelector('[data-task-filter][aria-pressed="true"]')).focus();
        }
      });
      row.append(text, button);
      section.append(row);
    }
    target.append(section);
  }
}

function renderSnapshot() {
  const projects = data.projects.filter(project => project.status === 'active')
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  setText('project-count', `${projects.length} active`);
  const target = byId('project-list');
  target.replaceChildren();
  for (const project of projects) {
    const row = make('div', '', 'project-row');
    row.append(make('strong', project.name), make('p', [project.code, project.client, `${project.priority} priority`, project.deadline && `Due ${project.deadline}`].filter(Boolean).join(' · '), 'row-meta'));
    if (project.notes) row.append(make('p', project.notes, 'muted'));
    if (project.links.length) {
      const links = make('div', '', 'project-links');
      links.append(...project.links.map(link => externalLink(link.label, link.url)));
      row.append(links);
    }
    target.append(row);
  }
  if (!projects.length) target.append(empty('No active projects. Import a snapshot from Settings.'));
  const activity = byId('activity-list');
  activity.replaceChildren(...data.log.slice(0, 5).map(activityEntry));
  if (!data.log.length) activity.append(empty('No imported activity.'));
  if (data.lastUpdated) activity.append(make('p', `Snapshot dated ${data.lastUpdated}`, 'row-meta snapshot-date'));
}

function localEvents() {
  return data.calendarEvents.map((item, index) => {
    const start = londonTime(item.date, item.startTime || '00:00');
    const end = item.endTime ? londonTime(item.date, item.endTime)
      : item.startTime ? start + 30 * 60000 : londonTime(addDays(item.date, 1));
    return { id: `snapshot:${index}`, title: item.title, location: item.location, start,
      end: end > start ? end : start + 30 * 60000, allDay: !item.startTime, busy: true };
  });
}

function eventRow(event, model, now, upcoming) {
  const row = make('div', '', 'item-row event-row');
  const time = event.allDay ? 'All day' : londonClock(event.start);
  const when = upcoming ? `${new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).format(event.start)} · ${time}` : time;
  const text = make('div', '', 'row-text');
  text.append(event.url ? externalLink(event.title, event.url) : make('strong', event.title));
  if (event.location) text.append(make('p', event.location, 'row-meta'));
  const state = model.current.includes(event) ? 'In progress' : event.end <= now ? 'Ended' : '';
  const labels = [state, model.overlaps.has(event.id) ? 'Overlaps' : ''].filter(Boolean);
  if (labels.length) text.append(make('p', labels.join(' · '), 'row-meta event-state'));
  row.append(make('span', when, 'event-time'), text);
  return row;
}

function renderAgenda(now) {
  const model = agenda(events ?? localEvents(), now);
  const live = Boolean(events && token);
  const hasSnapshot = data.calendarEvents.length > 0;
  calendarAction.textContent = token ? 'Refresh calendar' : 'Connect Google Calendar';
  calendarAction.disabled = connecting || Boolean(request);
  disconnect.hidden = !token;
  const status = calendarError || (request ? 'Refreshing calendar…'
    : live ? `Google Calendar · refreshed at ${londonClock(synced)}`
    : hasSnapshot ? 'Imported calendar snapshot. Connect Google for live updates.'
    : 'Connect your calendar for meetings, overlaps and free time.');
  if (byId('calendar-status').textContent !== status) setText('calendar-status', status);
  const next = model.next;
  const current = model.current[0];
  setText('next-value', next ? next.title : current ? 'In a meeting' : live || hasSnapshot ? 'Nothing scheduled' : 'Connect calendar');
  setText('next-detail', next ? (londonDay(next.start) === londonDay(now)
    ? `In ${minutes(now, next.start)} min · ${londonClock(next.start)}`
    : londonHeading(next.start) + ' · ' + londonClock(next.start))
    : current ? current.title : live || hasSnapshot ? 'No upcoming timed events' : 'Live agenda');
  const focus = model.longest;
  setText('focus-value', live && focus ? `${Math.floor((focus.end - focus.start) / 60000)} min` : '—');
  setText('focus-detail', live && focus ? `${londonClock(focus.start)}–${londonClock(focus.end)} London`
    : live ? 'No free time left before 18:00' : 'Calculated from your live calendar');
  const target = byId('agenda-list');
  // Leave keyboard focus on a calendar link until the visitor moves away.
  if (target.contains(document.activeElement)) return;
  target.replaceChildren();
  if (model.today.length) target.append(...model.today.map(event => eventRow(event, model, now, false)));
  else if (live || hasSnapshot) target.append(empty('No events today.'));
  if (model.upcoming.length) {
    target.append(make('h3', 'Coming up'));
    target.append(...model.upcoming.slice(0, 5).map(event => eventRow(event, model, now, true)));
  }
}

function expireCalendar(message) {
  request?.abort();
  request = undefined;
  token = undefined;
  events = undefined;
  synced = undefined;
  calendarError = message;
  renderAgenda(Date.now());
}

async function refreshCalendar(now) {
  if (!token || request) return;
  if (token.expires <= now) {
    expireCalendar('Google access expired. Reconnect to refresh.');
    return;
  }
  const controller = new AbortController();
  calendarAttempt = now;
  request = controller;
  calendarError = '';
  renderAgenda(now);
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const fresh = await fetchCalendar(token.value, settings.ids, now, controller.signal);
    if (request === controller) {
      events = fresh;
      synced = Date.now();
    }
  } catch (error) {
    if (request !== controller) return;
    if (error.status === 401) expireCalendar('Google access expired. Reconnect to refresh.');
    else calendarError = error.name === 'AbortError' ? 'Calendar refresh timed out. Try again.' : error.message;
  } finally {
    clearTimeout(timeout);
    if (request === controller) request = undefined;
    renderAgenda(Date.now());
  }
}

function prepareGoogle() {
  if (!settings.client) return;
  prepareIdentity().then(value => { identity = value; }).catch(() => {});
}

calendarAction.addEventListener('click', async () => {
  if (token) {
    await refreshCalendar(Date.now());
    return;
  }
  if (!settings.client) {
    byId('settings').open = true;
    clientInput.focus();
    setText('settings-status', 'Enter your Google OAuth web client ID to connect Calendar.');
    return;
  }
  if (!identity) {
    calendarError = 'Loading Google sign-in…';
    renderAgenda(Date.now());
    try {
      identity = await prepareIdentity();
      calendarError = 'Google sign-in is ready. Choose Connect Google Calendar.';
    } catch (error) {
      calendarError = error.message;
    }
    renderAgenda(Date.now());
    return;
  }
  connecting = true;
  calendarError = 'Waiting for Google sign-in…';
  renderAgenda(Date.now());
  const requestedSettings = settings;
  try {
    const access = await authorize(identity, settings.client);
    if (settings === requestedSettings) {
      token = access;
      await refreshCalendar(Date.now());
    }
  } catch (error) {
    if (settings === requestedSettings) calendarError = error.message;
  } finally {
    connecting = false;
    renderAgenda(Date.now());
  }
});

disconnect.addEventListener('click', () => {
  const access = token?.value;
  expireCalendar('Google Calendar disconnected.');
  if (access) identity?.revoke(access, () => {});
  calendarAction.focus();
});

byId('calendar-settings').addEventListener('submit', event => {
  event.preventDefault();
  const client = clientInput.value.trim() || defaultClient;
  if (client && !/^[\w-]+\.apps\.googleusercontent\.com$/.test(client)) {
    setText('settings-status', 'Enter a Google OAuth web client ID ending in .apps.googleusercontent.com.');
    return;
  }
  const ids = [...new Set(idsInput.value.split(',').map(value => value.trim()).filter(Boolean))];
  const updated = { client, ids: ids.length ? ids : ['primary'] };
  try {
    localStorage.setItem(settingsKey, JSON.stringify(updated));
    settings = updated;
    expireCalendar('');
    prepareGoogle();
    setText('settings-status', 'Calendar settings saved.');
  } catch {
    setText('settings-status', 'Browser storage is unavailable. Settings were not saved.');
  }
});

function toggleForm(open) {
  taskForm.hidden = !open;
  taskToggle.setAttribute('aria-expanded', String(open));
  (open ? taskForm.elements.namedItem('title') : taskToggle).focus();
}
taskToggle.addEventListener('click', () => toggleForm(taskForm.hidden));
byId('task-cancel').addEventListener('click', () => toggleForm(false));
taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(taskForm);
  const task = { id: crypto.randomUUID(), title: String(form.get('title')).trim(),
    due: String(form.get('due')), priority: String(form.get('priority')), project: String(form.get('project')).trim(), completed: false };
  if (!task.title) {
    setText('task-status', 'Enter a task name.');
    return;
  }
  if (persist({ ...data, tasks: [...data.tasks, task] }, 'task-status', 'Task added.')) {
    taskForm.reset();
    toggleForm(false);
    showFilter('open');
  }
});
function showFilter(selected) {
  filter = selected;
  for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.taskFilter === filter));
  renderTasks(Date.now());
}
for (const button of filters) button.addEventListener('click', () => showFilter(button.dataset.taskFilter));

const fileInput = byId('snapshot-file');
byId('import-data').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  try {
    const updated = normalize(JSON.parse(await file.text()));
    if (persist(updated, 'settings-status', 'Snapshot imported.')) {
      renderSnapshot();
      renderTasks(Date.now());
      renderAgenda(Date.now());
    }
  } catch {
    setText('settings-status', 'Could not import that file. Choose a valid Workstation JSON snapshot.');
  }
});
byId('export-data').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
  const link = make('a');
  link.href = url;
  link.download = `workstation-${londonDay(Date.now())}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function openSettings() {
  if (location.hash === '#settings') byId('settings').open = true;
}
window.addEventListener('hashchange', openSettings);
document.querySelector('.settings-link').addEventListener('click', () => { byId('settings').open = true; });
openSettings();

async function refreshWeather(now) {
  weatherAt = now;
  weatherDay = londonDay(now);
  try {
    const weather = await londonWeather(AbortSignal.timeout(12000));
    setText('weather-main', weather.headline);
    setText('weather-details', weather.details);
  } catch {
    setText('weather-main', 'Weather unavailable');
    setText('weather-details', 'The forecast will retry automatically.');
  }
}

let calendarAttempt = 0;
function tick() {
  const now = Date.now();
  const today = londonDay(now);
  const changed = day !== today;
  day = today;
  setText('day-label', `${londonHeading(now)} · ${londonClock(now)} London`);
  if (changed) renderTasks(now);
  if (token?.expires <= now) expireCalendar('Google access expired. Reconnect to refresh.');
  if (token && (changed || now - calendarAttempt >= 5 * 60000)) {
    calendarAttempt = now;
    refreshCalendar(now);
  }
  if (weatherDay !== today || now - weatherAt >= 15 * 60000) refreshWeather(now);
  renderAgenda(now);
}

window.addEventListener('storage', event => {
  if (event.key === settingsKey) return;
  data = load();
  renderSnapshot();
  renderTasks(Date.now());
  renderAgenda(Date.now());
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});
prepareGoogle();
renderSnapshot();
tick();
setInterval(tick, 30000);
