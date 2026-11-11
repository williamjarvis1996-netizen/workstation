import { addDays } from './time.mjs';
import { readLife, weekStart, workoutDistance, workoutPace } from './life.mjs';
import { make } from './storage.mjs';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayLabel = day => dateFormat.format(new Date(day + 'T00:00:00Z'));
const kmLabel = km => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(km) + ' km';

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('training-page');
  if (!root) return;
  const controller = new AbortController();
  const snapshot = JSON.parse(root.dataset.sessions);
  const chart = document.getElementById('weekly-distance');
  const workout = document.getElementById('last-workout');
  const log = document.getElementById('workout-list');

  function render() {
    const workouts = readLife().workouts;
    const importedKeys = new Set(workouts.filter(item => item.imported).map(item => JSON.stringify([item.title,item.date])));
    const base = root.dataset.demo === 'true' && importedKeys.size ? [] : snapshot.filter(item => !importedKeys.has(JSON.stringify([item.title,item.date])));
    const sessions = [...workouts.slice().reverse(), ...base].sort((a, b) => b.date.localeCompare(a.date));
    const measured = sessions.filter(session => session.type === 'run' && workoutDistance(session) > 0);
    const mostRecent = sessions[0];
    document.getElementById('workout-count').textContent = `${sessions.length} logged`;
    workout.replaceChildren();
    if (mostRecent) {
      const details = [mostRecent.distance, mostRecent.duration, mostRecent.type === 'run' && workoutPace(mostRecent)].filter(Boolean);
      workout.append(make('span', `${mostRecent.type} · ${dayLabel(mostRecent.date)}`, 'top-sync'), make('h3', mostRecent.title), make('strong', details.join(' · ')));
    } else workout.append(make('p', 'No workouts logged.', 'empty-state-sm'));

    chart.replaceChildren();
    if (measured.length) {
      const latestWeek = weekStart(measured[0].date);
      const firstWeek = weekStart(measured.at(-1).date);
      const weeks = Array.from({ length: 6 }, (_, index) => addDays(latestWeek, (index - 5) * 7)).filter(week => week >= firstWeek);
      const totals = measured.reduce((result, session) => {
        const week = weekStart(session.date);
        result.set(week, (result.get(week) || 0) + workoutDistance(session));
        return result;
      }, new Map());
      const peak = Math.max(1, ...weeks.map(week => totals.get(week) || 0));
      const list = make('ul');
      for (const week of weeks) {
        const total = totals.get(week) || 0;
        const row = make('li');
        const date = make('time', dayLabel(week));
        date.dateTime = week;
        const track = make('span', '', 'run-chart-track');
        track.setAttribute('aria-hidden', 'true');
        const bar = make('span');
        bar.style.setProperty('--run-width', `${total / peak * 100}%`);
        track.append(bar);
        row.append(date, track, make('strong', total ? kmLabel(total) : 'No data'));
        list.append(row);
      }
      chart.append(list);
    } else chart.append(make('p', 'No runs with a recorded distance yet.', 'empty-state-sm'));

    log.replaceChildren(...sessions.map(session => {
      const row = make('div', '', `ex-item ex-item--${session.type}`);
      const copy = make('div', '', 'ex-body');
      const facts = [session.distance, session.duration, session.type === 'run' && workoutPace(session),
        session.avgHR && `HR ${session.avgHR}`, session.volume && `Vol ${session.volume}`].filter(Boolean);
      copy.append(make('strong', session.title), make('span', facts.join(' · '), 'ex-meta'));
      row.append(make('span', session.type, 'ex-type'), copy, make('span', dayLabel(session.date), 'ex-date'));
      return row;
    }));
  }

  document.addEventListener('workstation:change', render, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  render();
});
