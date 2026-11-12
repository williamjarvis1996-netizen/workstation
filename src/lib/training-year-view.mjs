import { readLife, updateLife, today, weekStart, workoutDistance, workoutPace } from './life.mjs';
import { annualMileage, annualStrength, mergeTrainingSessions, parseRunningLog, parseStrengthLog, runningMilestones, strengthExercises } from './training-year.mjs';
import { make } from './storage.mjs';

const dateLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
const km = value => number.format(value) + ' km';
const dateOf = day => new Date(day + 'T00:00:00Z');
const eventWeeks = new Set(['2026-05-17', '2027-04-25'].map(weekStart));

function row(parent, values) {
  const tr = make('tr');
  for (const value of values) tr.append(make('td', value));
  parent.append(tr);
}

function renderChart(chart, weeks, year, running) {
  const peak = Math.max(1, ...weeks.map(week => running ? week.km : week.visits));
  let lastMonth;
  chart.replaceChildren();
  for (const week of weeks) {
    const value = running ? week.km : week.visits;
    const date = dateOf(week.day);
    const cell = make('div', '', 'year-week');
    const bar = make('span', '', 'year-bar');
    bar.style.setProperty('--bar-height', `${value / peak * 100}%`);
    bar.classList.toggle('has-mileage', Boolean(value));
    bar.classList.toggle('has-race', running && eventWeeks.has(week.day));
    bar.title = `${dateLabel.format(date)} · ${value ? running ? km(value) : value + ' logged visits' : 'No sessions recorded'}`;
    cell.append(bar);
    if (date.getUTCMonth() !== lastMonth && date.getUTCFullYear() === year) {
      lastMonth = date.getUTCMonth();
      cell.append(make('small', monthLabel.format(date)));
    }
    chart.append(cell);
  }
}

function statCards(stats) {
  return stats.map(([label, value, note]) => {
    const card = make('div', '', 'task-stat-card');
    card.append(make('strong', value, 'year-value'), make('span', label, 'task-stat-label'));
    if (note) card.append(make('small', note));
    return card;
  });
}

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('training-year');
  if (!root) return;
  const controller = new AbortController();
  const base = JSON.parse(root.dataset.sessions);
  const running = root.dataset.discipline === 'running';
  const type = running ? 'run' : 'gym';
  const byId = id => document.getElementById(id);
  const filter = byId('training-year-filter');
  const gym = byId('training-gym-filter');
  const search = byId('training-ledger-search');
  const form = byId('year-import');
  const sessions = () => mergeTrainingSessions(base, readLife().workouts.filter(item => item.type === type));
  const currentYear = today().slice(0, 4);
  function addYear(year) {
    if (/^\d{4}$/.test(year) && ![...filter.options].some(option => option.value === year)) filter.add(new Option(year, year));
  }
  addYear(currentYear);
  form.elements.year.value = currentYear;
  for (const item of sessions()) addYear(item.date.slice(0, 4));
  filter.value = currentYear;

  function render() {
    const data = sessions();
    for (const item of data) addYear(item.date.slice(0, 4));
    const year = Number(filter.value);
    const ledger = byId('year-weeks');
    const history = byId('year-session-ledger');
    const query = search.value.trim().toLowerCase();
    let records;
    let weeks;
    let stats;
    ledger.replaceChildren();
    history.replaceChildren();
    if (running) {
      const result = annualMileage(data, year);
      ({ runs: records, weeks } = result);
      stats = [['Logged distance', km(result.total)], ['Measured runs', String(records.length)],
        ['Longest recorded', result.longest ? km(workoutDistance(result.longest)) : '—']];
      for (const week of weeks) row(ledger, [dateLabel.format(dateOf(week.day)),
        week.runs ? km(week.km) + (week.flagged ? ' · see run notes' : '') : '—', String(week.runs), week.longest ? km(week.longest) : '—']);
      const progress = byId('year-progression');
      progress.replaceChildren(...runningMilestones(records).map(run => {
        const item = make('li');
        item.append(make('time', dateLabel.format(dateOf(run.date))), make('strong', km(workoutDistance(run))), make('span', run.title));
        return item;
      }));
      if (!progress.childElementCount) progress.append(make('li', 'No measured runs in the selected year.'));
      const hackney = data.find(item => item.date === '2026-05-17' && item.title === 'Hackney Half Marathon');
      byId('hackney-finish').textContent = hackney?.duration || 'Time unrecorded';
    } else {
      const selected = gym.value;
      const gyms = [...new Set(data.filter(item => item.date.startsWith(year + '-')).map(item => item.gym || 'Unspecified'))].sort();
      gym.replaceChildren(new Option('All gyms', ''), ...gyms.map(name => new Option(name, name)));
      if (gyms.includes(selected)) gym.value = selected;
      const result = annualStrength(data, year, gym.value);
      ({ visits: records, weeks } = result);
      stats = [['Gym visits', String(records.length)], ['Recorded sets', String(result.sets), `${result.measured} visits with a set count`],
        ['Active weeks', String(weeks.filter(week => week.visits).length)]];
      for (const week of weeks) row(ledger, [dateLabel.format(dateOf(week.day)), week.measured ? number.format(week.sets) : '—',
        String(week.visits), [...week.splits].map(([label, count]) => label + ' ' + count).join(' · ') || '—']);
      byId('year-splits').replaceChildren(...[...result.splits].map(([label, count]) => {
        const pair = make('div');
        pair.append(make('dt', label), make('dd', String(count)));
        return pair;
      }));
    }
    renderChart(byId('year-chart'), weeks, year, running);
    byId('year-stats').replaceChildren(...statCards(stats));
    const matches = records.map(item => {
      const lifts = running || !query ? [] : strengthExercises(item.breakdown)
        .filter(lift => lift.name.toLowerCase().includes(query));
      return { item, lifts };
    }).filter(({ item, lifts }) => lifts.length ||
      [item.title, !running ? item.gym || 'Unspecified' : '', item.date]
        .some(value => value?.toLowerCase().includes(query)));
    for (const { item, lifts } of matches) {
      const date = dateLabel.format(dateOf(item.date));
      const fields = running ? [date, [item.title, item.dataNote].filter(Boolean).join(' · '), item.distance, item.duration || '—',
        item.recordedPace || workoutPace(item) || '—', item.avgHR ? String(item.avgHR) : '—', item.ascent || '—']
        : [date, item.title, item.gym || 'Unspecified', item.duration || '—', item.sets ? String(item.sets) : '—', item.volume || '—'];
      const tr = make('tr');
      fields.forEach((field, index) => {
        const cell = make('td', index === 1 ? '' : field);
        if (index === 1) {
          const details = make('details', '', 'workout-breakdown');
          details.append(make('summary', item.title));
          const metrics = make('dl');
          const labels = running ? ['Date', 'Run', 'Distance', 'Duration', 'Pace', 'Avg HR', 'Ascent']
            : ['Date', 'Workout', 'Gym', 'Duration', 'Sets', 'Volume'];
          fields.forEach((value, fieldIndex) => {
            if (fieldIndex === 1 || value === '—' || !value) return;
            metrics.append(make('dt', labels[fieldIndex]), make('dd', value));
          });
          details.append(metrics);
          for (const note of [item.dataNote, item.notes]) {
            if (note) details.append(make('p', note));
          }
          if (item.breakdown) details.append(make('div', item.breakdown, 'workout-source-detail'));
          else details.append(make('p', 'Import the original log to see any recorded lap or exercise details.'));
          cell.append(details);
          if (lifts.length) {
            const summary = make('ul');
            for (const lift of lifts) {
              summary.append(make('li', [lift.name, lift.reps, lift.weight].filter(Boolean).join(' · ')));
            }
            cell.append(summary);
          }
        }
        tr.append(cell);
      });
      history.append(tr);
    }
    if (!matches.length) {
      const tr = make('tr');
      const cell = make('td', records.length ? 'No sessions match that search.' : 'No sessions recorded for this selection.');
      cell.colSpan = running ? 7 : 6;
      tr.append(cell);
      history.append(tr);
    }
    byId('training-ledger-count').textContent = `${matches.length} of ${records.length} ${running ? 'runs' : 'visits'}`;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = form.elements.file.files[0];
    const status = byId('year-import-status');
    if (!file || file.size > 1000000) { status.textContent = 'Choose a Markdown or text file under 1 MB.'; return; }
    const year = Number(form.elements.year.value);
    try {
      const text = await file.text();
      const isStrength = /^#\s+Strength Training Log\s*$/m.test(text);
      if (isStrength === running) throw new Error(running ? 'Use the Strength tab for this log.' : 'Use the Running tab for this log.');
      const result = running ? parseRunningLog(text, year) : parseStrengthLog(text, year);
      if (controller.signal.aborted) return;
      updateLife(data => {
        data.workouts = [...new Map([...data.workouts, ...result.workouts].map(item => [item.id, item])).values()];
      });
      addYear(String(year));
      filter.value = String(year);
      form.elements.file.value = '';
      render();
      const excluded = running ? result.excludedHikes : result.excludedArtefacts;
      status.textContent = `${result.workouts.length} ${running ? 'runs' : 'gym visits'} imported.${excluded ? ` ${excluded} ${running ? 'hiking entries' : 'watch artefact entries'} excluded.` : ''}`;
    } catch (error) { status.textContent = error.message; }
  });
  filter.addEventListener('change', render);
  gym?.addEventListener('change', render);
  search.addEventListener('input', render);
  document.addEventListener('workstation:change', render, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  render();
});
