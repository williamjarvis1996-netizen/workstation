import { addDays, agenda, groupTasks, londonClock, londonDay, londonTime, minutes } from './time.mjs';
import { authorize, fetchCalendar, prepareIdentity } from './google-calendar.mjs';
import { make } from './storage.mjs';
import { mergedTasks, priorityToday, sampleTasks, taskRow } from './life.mjs';
import { renderAgenda } from './agenda-view.mjs';
import { londonWeather } from './weather.mjs';

const byId = id => document.getElementById(id);
let identity;
let token;
let liveEvents;
let synced = 0;

function mountOverview() {
  const root = byId('blue-dashboard');
  if (!root) return;
  const lifecycle = new AbortController();
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
  const taskFilters = [...root.querySelectorAll('[data-filter]')];
  let taskFilter = 'Priority';
  let dirtyTasks = true;
  const form = byId('calendar-form');
  const connect = byId('calendar-connect');
  const disconnect = byId('calendar-disconnect');
  const status = byId('calendar-status');
  const key = 'wj-workstation-calendar-v1';
  let settings = { client: root.dataset.clientId || '', ids: ['primary'] };
  let attempt = synced;
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

  function renderTasks(groups) {
    const target = byId('today-tasks');
    const count = groups.Today.length;
    const selected = taskFilter === 'Priority' ? priorityToday(groups) : groups[taskFilter];
    target.replaceChildren(...selected.slice(0, 3).map(task => taskRow(task, [task.project, task.due].filter(Boolean).join(' · '))));
    if (!selected.length) target.append(make('p', 'No tasks in this view.', 'empty-state-sm'));
    byId('due-today').textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
  }

  for (const button of taskFilters) button.addEventListener('click', () => {
    taskFilter = button.dataset.filter;
    taskFilters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    dirtyTasks = true;
    render(Date.now());
  });
  document.addEventListener('workstation:change', () => {
    dirtyTasks = true;
    render(Date.now());
  }, { signal: lifecycle.signal });

  function render(now) {
    const day = londonDay(now);
    byId('overview-clock').textContent = londonClock(now);
    const groups = groupTasks(mergedTasks(demo ? [...tasks, ...sampleTasks(day)] : tasks), day);
    const demoEvents = demo && !liveEvents ? [
      ['Project check-in', '09:30', '10:15'], ['Edit review', '11:30', '12:30'], ['Production planning', '15:00', '16:00'],
    ].map(([title, start, end], index) => ({
      id: `sample:${index}`, title, start: londonTime(day, start), end: londonTime(day, end), busy: true,
    })) : [];
    const model = agenda(liveEvents ?? (demo ? demoEvents : snapshot), now);
    const active = Boolean(token && liveEvents);
    const usableSchedule = active || demo;
    if (londonDate !== day) {
      londonDate = day;
      const parts = Object.fromEntries(dayFormat.formatToParts(now).map(({type, value}) => [type, value]));
      byId('day-name').textContent = parts.weekday;
      byId('day-number').textContent = parts.day;
      byId('day-month').textContent = `${parts.month} ${parts.year}`;
      dirtyTasks = true;
    }

    if (dirtyTasks) { renderTasks(groups); dirtyTasks = false; }

    const next = model.next;
    byId('next-meeting').textContent = !usableSchedule ? 'Calendar disconnected' : next
      ? `${londonDay(next.start) === day ? `In ${minutes(now, next.start)} min` : upcomingFormat.format(next.start) + " at " + londonClock(next.start)} · ${next.title}`
      : 'Nothing scheduled';
    const focus = model.longest;
    byId('focus-window').textContent = !usableSchedule ? 'Calendar disconnected' : focus
      ? `${londonClock(focus.start)}–${londonClock(focus.end)}` : 'No free time before 18:00';

    const current = model.current[0];
    const nextTask = priorityToday(groups)[0];
    const clock = londonClock(now);
    const focusNow = usableSchedule && focus && focus.start <= now + 60000 && focus.end > now;
    const brief = current ? ['In progress', `${current.title} · ends ${londonClock(current.end)}`]
      : usableSchedule && next && (clock < '10:00' || next.start - now <= 30 * 60000)
        ? ['Coming up', `${londonClock(next.start)} · ${next.title}`]
        : focusNow && nextTask ? ['Focus now', `${nextTask.title} · free until ${londonClock(focus.end)}`]
        : nextTask ? ['Next task', nextTask.title]
        : usableSchedule && focus ? ['Focus window', `${londonClock(focus.start)}–${londonClock(focus.end)}`]
        : ['Your day', 'No priority tasks due'];
    byId('day-brief-label').textContent = brief[0];
    byId('day-brief-text').textContent = brief[1];
    const signature = JSON.stringify([model.today, model.current, focus, clock, active]);
    if (lastTimeline !== signature && !timeline.contains(document.activeElement)) {
      lastTimeline = signature;
      renderAgenda(timeline, model, day, now, usableSchedule || Boolean(snapshot.length));
    }
  }

  function renderConnection() {
    connect.disabled = Boolean(request || connecting);
    connect.textContent = token ? 'Refresh Google Calendar' : 'Connect Google Calendar';
    disconnect.hidden = !token;
    byId('calendar-connection').textContent = request ? 'Refreshing calendar…'
      : liveEvents ? `Calendar updated ${londonClock(synced)}` : token ? 'Calendar refresh needed' : demo ? 'Sample schedule' : snapshot.length ? 'Calendar snapshot' : 'Calendar disconnected';
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
      if (!lifecycle.signal.aborted) {
        renderConnection();
        render(Date.now());
      }
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
      if (!lifecycle.signal.aborted && pending === settings) {
        token = access;
        await syncCalendar(Date.now());
      }
    } catch (error) {
      if (pending === settings) status.textContent = error.message;
    } finally {
      connecting = false;
      if (!lifecycle.signal.aborted) renderConnection();
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
      const result = await londonWeather(AbortSignal.any([lifecycle.signal, AbortSignal.timeout(12000)]));
      if (lifecycle.signal.aborted) return;
      weather.textContent = result.headline;
      byId('weather-forecast').textContent = result.details;
    } catch {
      if (lifecycle.signal.aborted) return;
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
  const settingsPanel = byId('settings');
  function openSettings() { if (location.hash === '#settings') settingsPanel.open = true; }
  window.addEventListener('hashchange', openSettings, { signal: lifecycle.signal });
  byId('settings-link').addEventListener('click', () => { settingsPanel.open = true; });
  openSettings();
  warmIdentity();
  renderConnection();
  tick();
  const timer = setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); }, { signal: lifecycle.signal });
  document.addEventListener('astro:before-swap', () => {
    const pending = request;
    request = undefined;
    pending?.abort();
    lifecycle.abort();
    clearInterval(timer);
  }, { once: true });
}

document.addEventListener('astro:page-load', mountOverview);
