import { readLife, updateLife, today, weekStart, workoutDistance, workoutPace } from './life.mjs';
import { annualMileage, mergeTrainingSessions, parseRunningLog, parseStrengthLog } from './training-year.mjs';
import { make } from './storage.mjs';

const dateLabel = new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', timeZone:'UTC' });
const monthLabel = new Intl.DateTimeFormat('en-GB', { month:'short', timeZone:'UTC' });
const km = value => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value) + ' km';
const dateOf = day => new Date(day + 'T00:00:00Z');
const eventWeeks = new Set(['2026-05-17', '2027-04-25'].map(weekStart));

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('training-year');
  if (!root) return;
  const controller = new AbortController();
  const base = JSON.parse(root.dataset.sessions);
  const byId = id => document.getElementById(id);
  const filter = byId('training-year-filter');
  for (const year of new Set([...base, ...readLife().workouts].map(item => item.date?.slice(0, 4)))) {
    if (/^\d{4}$/.test(year) && ![...filter.options].some(option => option.value === year)) filter.add(new Option(year, year));
  }
  const yearNow = Number(today().slice(0, 4));
  if ([...filter.options].some(option => Number(option.value) === yearNow)) filter.value = String(yearNow);
  const form = byId('year-import');

  function row(parent, values) {
    const tr = make('tr');
    for (const value of values) tr.append(make('td', value));
    parent.append(tr);
  }

  function render() {
    const year = Number(filter.value);
    const sessions = mergeTrainingSessions(base, readLife().workouts);
    const hackney = sessions.find(item => item.date === '2026-05-17' && item.title === 'Hackney Half Marathon');
    byId('hackney-finish').textContent = hackney?.duration || 'Import the Running Log to display the recorded time';
    const { weeks, runs, longest, total } = annualMileage(sessions, year);
    const peak = Math.max(1, ...weeks.map(week => week.km));
    const chart = byId('year-chart');
    chart.replaceChildren();
    byId('year-stats').replaceChildren(...[['Logged distance', km(total)], ['Measured runs', String(runs.length)],
      ['Longest recorded', longest ? km(workoutDistance(longest)) : 'No distance']].map(([label, value]) => {
      const card = make('div', '', 'task-stat-card');
      card.append(make('strong', value, 'year-value'), make('span', label, 'task-stat-label'));
      return card;
    }));
    let lastMonth;
    const ledger = byId('year-weeks');
    ledger.replaceChildren();
    for (const week of weeks) {
      const date = dateOf(week.day);
      const cell = make('div', '', 'year-week');
      const bar = make('span', '', 'year-bar');
      bar.style.setProperty('--bar-height', `${week.km / peak * 100}%`);
      bar.classList.toggle('has-mileage', Boolean(week.runs));
      bar.classList.toggle('has-race', eventWeeks.has(week.day));
      bar.title = `${dateLabel.format(date)} · ${week.runs ? km(week.km) : 'No run recorded'}`;
      cell.append(bar);
      if (date.getUTCMonth() !== lastMonth && date.getUTCFullYear() === year) {
        lastMonth = date.getUTCMonth();
        cell.append(make('small', monthLabel.format(date)));
      }
      chart.append(cell);
      row(ledger, [dateLabel.format(date), week.runs ? km(week.km) + (week.flagged ? ' · see run notes' : '') : 'No run recorded', String(week.runs)]);
    }
    const cross = byId('year-cross-training');
    cross.replaceChildren();
    for (const [type, label] of [['gym','Strength'],['swim','Swimming'],['cycle','Cycling'],['row','Rowing']]) {
      const count = sessions.filter(session => session.date.startsWith(String(year)) && session.type === type).length;
      const item = make('div');
      item.append(make('dt', label), make('dd', count ? `${count} logged` : 'No sessions recorded'));
      cross.append(item);
    }
    const strength = byId('year-strength');
    strength.replaceChildren();
    const visits = sessions.filter(item => item.type === 'gym' && item.date.startsWith(String(year)));
    for (const visit of visits) row(strength, [dateLabel.format(dateOf(visit.date)), visit.title, visit.gym || 'Unspecified', visit.duration || 'Unrecorded', visit.sets ? String(visit.sets) : 'Unrecorded', visit.volume || 'Unrecorded']);
    if (!visits.length) row(strength, ['—', 'No strength visits recorded for this year', '—', '—', '—', '—']);
    const runLedger = byId('year-runs');
    runLedger.replaceChildren();
    for (const run of runs) row(runLedger, [dateLabel.format(dateOf(run.date)), [run.title, run.dataNote].filter(Boolean).join(' · '), run.distance, run.duration || 'Unrecorded', run.recordedPace || workoutPace(run) || 'Unrecorded', run.avgHR ? String(run.avgHR) : '—', run.ascent || '—']);
    if (!runs.length) row(runLedger, ['—', 'No measured runs in this year', '—', '—', '—', '—', '—']);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = form.elements.file.files[0];
    const status = byId('year-import-status');
    if (!file || file.size > 1000000) { status.textContent = 'Choose a Markdown or text file under 1 MB.'; return; }
    const year = Number(form.elements.year.value);
    try {
      const text = await file.text();
      const strengthLog = /^#\s+Strength Training Log\s*$/m.test(text);
      const { workouts, excludedHikes, excludedArtefacts } = strengthLog ? parseStrengthLog(text, year) : parseRunningLog(text, year);
      if (controller.signal.aborted) return;
      updateLife(data => {
        data.workouts = [...new Map([...data.workouts, ...workouts].map(item => [item.id, item])).values()];
      });
      if (![...filter.options].some(option => Number(option.value) === year)) filter.add(new Option(String(year), String(year)));
      filter.value = String(year);
      form.elements.file.value = '';
      render();
      status.textContent = strengthLog
        ? `${workouts.length} strength visits imported.${excludedArtefacts ? ' ' + excludedArtefacts + ' watch artefact excluded.' : ''}`
        : `${workouts.length} running entries imported.${excludedHikes ? ' ' + excludedHikes + ' hiking entries excluded.' : ''}`;
    } catch (error) { status.textContent = error.message; }
  });
  filter.addEventListener('change', render);
  document.addEventListener('workstation:change', render, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  render();
});
