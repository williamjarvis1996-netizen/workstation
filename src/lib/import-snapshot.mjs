import { normalize } from './storage.mjs';
import { updateLife } from './life.mjs';

const string = (value, limit = 180) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) ? value : '';
const safeKey = key => !['__proto__','prototype','constructor'].includes(key);
const allowedWorkouts = new Set(['run','gym','swim','row','cycle']);

export function importSnapshot(input) {
  if (!input || !['projects','tasks','exerciseSessions'].some(key => Array.isArray(input[key]))) throw new Error('Choose a Workstation snapshot with projects, tasks or workouts.');
  const { projects, tasks } = normalize({ projects: input.projects, tasks: input.tasks });
  const originals = new Map((Array.isArray(input.projects) ? input.projects : []).filter(item => item && typeof item === 'object').map(item => [string(item.code), item]));
  const portfolio = projects.flatMap(project => {
    const code = string(project.code);
    if (!code || !safeKey(code)) return [];
    const raw = originals.get(code) || {};
    return [{ ...project, code, name: string(project.name), client: string(project.client), phase: string(raw.phase), statusSummary: string(raw.statusSummary, 1000),
      nextMilestone: string(raw.nextMilestone), nextMilestoneDate: date(raw.nextMilestoneDate),
      health: ['on-track','at-risk','blocked'].includes(raw.health) ? raw.health : 'on-track',
      notes: string(project.notes, 1000), links: project.links.slice(0, 8).map(link => ({ label: string(link.label), url: link.url.slice(0, 600) })) }];
  });
  const id = (kind, item, i) => 'import:' + JSON.stringify([kind, item.title, item.project, item.date || item.due, i]).slice(0, 570);
  const importedTasks = tasks.map((task, index) => {
    const item = { ...task, title: string(task.title), project: string(task.project), imported: true };
    return { ...item, id: id('task', item, index) };
  });
  const workouts = (Array.isArray(input.exerciseSessions) ? input.exerciseSessions : []).flatMap((raw, i) => {
    if (!raw || !allowedWorkouts.has(raw.type) || !date(raw.date) || !string(raw.title)) return [];
    const item = { title: string(raw.title), date: raw.date, type: raw.type, distance: string(raw.distance), duration: string(raw.duration), volume: string(raw.volume), imported: true,
      avgHR: typeof raw.avgHR === 'number' ? raw.avgHR : undefined };
    return [{ ...item, id: id('workout', item, i) }];
  });
  if (portfolio.length + importedTasks.length + workouts.length > 500) throw new Error('Import at most 500 records at once.');
  if (!portfolio.length && !importedTasks.length && !workouts.length) throw new Error('No valid records found.');
  const merge = (current, entries) => [...new Map([...current, ...entries].map(item => [item.id, item])).values()];
  updateLife(data => {
    data.portfolio = { ...data.portfolio, ...Object.fromEntries(portfolio.map(project => [project.code, project])) };
    data.tasks = merge(data.tasks, importedTasks);
    data.workouts = merge(data.workouts, workouts);
  });
  return `${portfolio.length} projects, ${importedTasks.length} tasks and ${workouts.length} workouts imported.`;
}
