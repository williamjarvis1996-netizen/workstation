import { addDays } from './time.mjs';
import { weekStart, workoutDistance } from './life.mjs';

const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export function parseRunningLog(text, year) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Enter the year covered by the running log.');
  const table = text.match(/^##\s+Log\s*\r?\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/m)?.[1];
  if (!table) throw new Error('This file needs the Obsidian Running Log’s “Log” table.');
  const workouts = [];
  let excludedHikes = 0;
  const ids = new Set();
  for (const line of table.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const [rawDay, location, distanceCell, time, pace, hr, ascent] = line.split('|').slice(1).map(cell => cell.replace(/\*\*/g, '').trim());
    const day = /^(\d{1,2})\s+([a-z]{3})$/i.exec(rawDay);
    const distance = /^(\d+(?:\.\d+)?)\s*(km|mi)\b/i.exec(distanceCell || '');
    const duration = /^\d{1,3}:\d{2}(?::\d{2})?/.exec(time || '');
    if (!day || !distance || !duration) continue;
    const month = months.indexOf(day[2].toLowerCase()) + 1;
    if (!month) continue;
    const date = `${year}-${String(month).padStart(2, '0')}-${day[1].padStart(2, '0')}`;
    const actual = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(actual.getTime()) || actual.toISOString().slice(0, 10) !== date) continue;
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
  return { workouts, excludedHikes };
}

export function mergeTrainingSessions(snapshot, captured, demo = false) {
  const imports = captured.filter(item => item.imported);
  const sameRun = (a, b) => a.type === 'run' && b.type === 'run' && a.date === b.date
    && a.duration === b.duration && Math.abs(workoutDistance(a) - workoutDistance(b)) < 0.05;
  const matched = item => imports.some(entry => entry.date === item.date && (entry.title === item.title || sameRun(entry, item)));
  const local = captured.filter(item => item.source !== 'obsidian-run'
    ? !imports.some(entry => entry.source === 'obsidian-run' && entry.id !== item.id && sameRun(item, entry))
    : true);
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
    const week = { day, runs: 0, km: 0, flagged: 0 };
    weeks.push(week);
    byWeek.set(day, week);
  }
  const runs = sessions.filter(item => item.type === 'run' && item.date >= yearStart && item.date <= yearEnd && workoutDistance(item) > 0);
  for (const run of runs) {
    const week = byWeek.get(weekStart(run.date));
    week.km += workoutDistance(run);
    week.runs++;
    if (run.dataNote) week.flagged++;
  }
  const longest = runs.reduce((best, run) => workoutDistance(run) > workoutDistance(best || {}) ? run : best, null);
  return { weeks, runs, longest, total: runs.reduce((sum, run) => sum + workoutDistance(run), 0) };
}
