import { addDays } from './time.mjs';
import { weekStart, workoutDistance } from './life.mjs';

const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function logDate(raw, year) {
  const day = /^(\d{1,2})\s+([a-z]{3})$/i.exec(raw);
  if (!day) return '';
  const month = months.indexOf(day[2].toLowerCase()) + 1;
  if (!month) return '';
  const date = `${year}-${String(month).padStart(2, '0')}-${day[1].padStart(2, '0')}`;
  const actual = new Date(date + 'T00:00:00Z');
  return Number.isFinite(actual.getTime()) && actual.toISOString().slice(0, 10) === date ? date : '';
}

function tableRows(text, heading, year) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Enter the year covered by the training log.');
  const pattern = new RegExp(String.raw`^##[ \t]+${heading}[ \t]*\r?\n([\s\S]*?)(?=^##\s|$(?![\s\S]))`, 'm');
  const table = text.match(pattern)?.[1];
  if (!table) throw new Error('This file needs the Obsidian log’s “' + heading + '” table.');
  return table.split(/\r?\n/).filter(line => line.startsWith('|')).flatMap(line => {
    const [rawDate, ...cells] = line.split('|').slice(1).map(cell => cell.replace(/\*\*/g, '').trim());
    const date = logDate(rawDate, year);
    return date ? [[date, ...cells]] : [];
  });
}

function sessionDetails(text, section, year) {
  const content = text.split(new RegExp('^## ' + section + '\\s*$', 'm'))[1]?.split(/^## /m)[0] || '';
  const entries = new Map();
  for (const block of content.split(/^### /m).slice(1)) {
    const [heading, ...lines] = block.split(/\r?\n/);
    const match = /^(\d{1,2} [a-z]{3})[a-z]*(?:\s+(\d{4}))?\b/i.exec(heading);
    const date = match && (!match[2] || Number(match[2]) === year) && logDate(match[1], year);
    if (!date) continue;
    const detail = lines.join('\n').replace(/\n---\s*$/, '').trim();
    if (entries.has(date)) entries.set(date, '');
    else entries.set(date, detail);
  }
  return entries;
}

export function parseRunningLog(text, year) {
  const workouts = [];
  const details = sessionDetails(text, 'Lap Detail', year);
  let excludedHikes = 0;
  const ids = new Set();
  for (const [date, location, distanceCell, time, pace, hr, ascent] of tableRows(text, 'Log', year)) {
    const distance = /^(\d+(?:\.\d+)?)\s*(km|mi)\b/i.exec(distanceCell || '');
    const duration = /^\d{1,3}:\d{2}(?::\d{2})?/.exec(time || '');
    if (!location || !distance || !duration) continue;
    if (/lake district.*\((ascent|descent)\)/i.test(location)) { excludedHikes++; continue; }
    const id = `obsidian-run:${date}:${location.toLowerCase()}:${duration[0]}`;
    if (ids.has(id)) continue;
    ids.add(id);
    const dataNote = /over-read|recalibrated/i.test(distanceCell) ? distanceCell : '';
    workouts.push({
      id, date, title: /\(race\)/i.test(location) ? 'Hackney Half Marathon' : location, type: 'run', imported: true,
      source: 'obsidian-run', duration: duration[0], distance: `${distance[1]} ${distance[2].toLowerCase()}`,
      ...(dataNote ? { dataNote } : {}),
      ...(pace ? { recordedPace: pace } : {}),
      ...(/^\d+$/.test(hr || '') ? { avgHR: Number(hr) } : {}),
      ...(/^\d+\s*m$/.test(ascent || '') ? { ascent } : {}),
    });
  }
  if (!workouts.length) throw new Error('No running rows with a date, distance and time were found.');
  for (const workout of workouts) {
    if (details.get(workout.date) && workouts.filter(item => item.date === workout.date).length === 1) workout.breakdown = details.get(workout.date);
  }
  return { workouts, excludedHikes };
}

export function strengthExercises(breakdown = '') {
  const exercises = [];
  let columns;
  for (const line of breakdown.split(/\r?\n/)) {
    if (!line.startsWith('|')) {
      columns = undefined;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map(cell => cell.replaceAll('**', '').trim());
    const name = cells.findIndex(cell => /^exercise\b/i.test(cell));
    if (name !== -1 && cells.some(cell => /sets|reps/i.test(cell))) {
      columns = { name, reps: cells.findIndex(cell => /sets|reps/i.test(cell)), weight: cells.findIndex(cell => /^weight|^load/i.test(cell)) };
    } else if (columns && cells[columns.name] && !/^[-: ]+$/.test(cells[columns.name])) {
      exercises.push({ name: cells[columns.name], reps: cells[columns.reps], weight: cells[columns.weight] });
    }
  }
  return exercises;
}

export function parseStrengthLog(text, year) {
  const workouts = [];
  const dates = new Set();
  const details = sessionDetails(text, 'Session Detail', year);
  let excludedArtefacts = 0;
  for (const [date, split, duration, rawSets, rawVolume, detail] of tableRows(text, 'Quick Reference', year)) {
    if (/watch artefact|false start|accidental record/i.test(detail || '') || /^[—–-]$/.test(split)) {
      excludedArtefacts++;
      continue;
    }
    const sets = Number(rawSets);
    if (!split || !Number.isInteger(sets) || sets < 1 || dates.has(date)) continue;
    dates.add(date);
    const weight = /^([\d,]+(?:\.\d+)?)\s*kg\b/i.exec(rawVolume || '');
    const gym = /new gym/i.test(split) ? 'New gym' : /old gym/i.test(split) ? 'Old gym' : /hotel/i.test(split) ? 'Hotel gym' : '';
    workouts.push({ id: 'obsidian-strength:' + date, date, title: split, type: 'gym', source: 'obsidian-strength',
      imported: true, sets, ...(details.get(date) ? { breakdown: details.get(date) } : {}), ...(duration ? { duration } : {}), ...(gym ? { gym } : {}),
      ...(weight ? { volume: weight[1] + ' kg', volumeKg: Number(weight[1].replaceAll(',', '')) } : {}) });
  }
  if (!workouts.length) throw new Error('No strength visits with a date and set count were found.');
  return { workouts, excludedArtefacts };
}

export function mergeTrainingSessions(snapshot, captured, demo = false) {
  const imports = captured.filter(item => item.imported);
  const sameRun = (a, b) => a.type === 'run' && b.type === 'run' && a.date === b.date
    && a.duration === b.duration && Math.abs(workoutDistance(a) - workoutDistance(b)) < 0.05;
  const sameStrength = (a, b) => a.type === 'gym' && b.type === 'gym' && a.date === b.date && a.volume && a.volume === b.volume;
  const matched = item => imports.some(entry => entry.date === item.date && entry.type === item.type
    && (entry.title === item.title || sameRun(entry, item) || sameStrength(entry, item)));
  const local = captured.filter(item => !imports.some(entry => entry.id !== item.id
    && ((item.source !== 'obsidian-run' && entry.source === 'obsidian-run' && sameRun(item, entry))
      || (item.source !== 'obsidian-strength' && entry.source === 'obsidian-strength' && sameStrength(item, entry)))));
  const base = demo && imports.length ? [] : snapshot.filter(item => !matched(item));
  return [...local.slice().reverse(), ...base].sort((a, b) => b.date.localeCompare(a.date));
}

export function annualMileage(sessions, year) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const firstWeek = weekStart(yearStart);
  const weeks = [];
  const byWeek = new Map();
  for (let day = firstWeek; day <= yearEnd; day = addDays(day, 7)) {
    const week = { day, runs: 0, km: 0, flagged: 0, longest: 0 };
    weeks.push(week);
    byWeek.set(day, week);
  }
  const runs = sessions.filter(item => item.type === 'run' && item.date >= yearStart && item.date <= yearEnd && workoutDistance(item) > 0);
  for (const run of runs) {
    const week = byWeek.get(weekStart(run.date));
    const distance = workoutDistance(run);
    week.km += distance;
    week.longest = Math.max(week.longest, distance);
    week.runs++;
    if (run.dataNote) week.flagged++;
  }
  const longest = runs.reduce((best, run) => workoutDistance(run) > workoutDistance(best || {}) ? run : best, null);
  return { weeks, runs, longest, total: runs.reduce((sum, run) => sum + workoutDistance(run), 0) };
}

export function runningMilestones(runs) {
  let best = 0;
  return [...runs].sort((a, b) => a.date.localeCompare(b.date)).filter(run => {
    const distance = workoutDistance(run);
    if (distance <= best) return false;
    best = distance;
    return true;
  });
}

export function strengthSplit(title) {
  if (/^push\b/i.test(title)) return 'Push';
  if (/^pull\b/i.test(title)) return 'Pull';
  if (/^mixed\b/i.test(title)) return 'Mixed';
  return 'Other / unclassified';
}

export function annualStrength(sessions, year, gym = '') {
  const visits = sessions.filter(item => item.type === 'gym' && item.date.startsWith(year + '-')
    && (!gym || (item.gym || 'Unspecified') === gym));
  const splits = new Map(['Push', 'Pull', 'Mixed', 'Other / unclassified'].map(label => [label, 0]));
  const weeks = annualMileage([], year).weeks.map(({day}) => ({ day, visits: 0, sets: 0, measured: 0, splits: new Map() }));
  const byWeek = new Map(weeks.map(week => [week.day, week]));
  let sets = 0;
  let measured = 0;
  for (const visit of visits) {
    const split = strengthSplit(visit.title);
    splits.set(split, splits.get(split) + 1);
    const week = byWeek.get(weekStart(visit.date));
    week.visits++;
    week.splits.set(split, (week.splits.get(split) || 0) + 1);
    if (Number.isInteger(visit.sets) && visit.sets > 0) {
      week.sets += visit.sets;
      week.measured++;
      sets += visit.sets;
      measured++;
    }
  }
  return { visits, weeks, sets, measured, splits };
}
