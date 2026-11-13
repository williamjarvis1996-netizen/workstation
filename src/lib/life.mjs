import { addDays, londonDay } from './time.mjs';
import { queueChanges, syncInfo, completeTodoist } from './shared.mjs';
import { make } from './storage.mjs';

const lifePattern = /^(personal|shopping|home|admin|finance|life|family|health|errands|chores)$/i;
const trainingPattern = /^(training|fitness|running|gym|marathon|exercise|swimming|cycling)$/i;
const creativePattern = /^(creative|film|screenplay|writing|script|theatre|novel|poetry|music)$/i;

export function taskCategory(project) {
  if (!project) return 'work';
  if (lifePattern.test(project)) return 'life';
  if (trainingPattern.test(project)) return 'training';
  if (creativePattern.test(project)) return 'creative';
  return 'work';
}

const key = 'workstation-life-v1';
const empty = () => ({ tasks: [], workouts: [], ideas: [], completed: {}, goals: {}, habits: {}, creativeActions: {}, taskPlans: {}, projectPlans: {}, dayPlans: {}, portfolio: {} });

export function readLife() {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(key)) };
  } catch {
    return empty();
  }
}

export function updateLife(change) {
  const data = readLife();
  const before = structuredClone(data);
  change(data);
  localStorage.setItem(key, JSON.stringify(data));
  queueChanges(before, data);
  document.dispatchEvent(new Event('workstation:change'));
}

export function mergedTasks(tasks) {
  const data = readLife();
  const duplicates = new Map();
  const snapshot = tasks.map(task => {
    const signature = JSON.stringify([task.title, task.project, task.due]);
    const occurrence = duplicates.get(signature) || 0;
    duplicates.set(signature, occurrence + 1);
    return { ...task, id: task.id || `snapshot:${signature}:${occurrence}` };
  });
  const { todoist } = syncInfo();
  const providerKeys = new Set(todoist.tasks.map(task => JSON.stringify([task.title, task.due])));
  const importedKeys = new Set(data.tasks.filter(task => task.imported).map(task => JSON.stringify([task.title, task.due || ''])));
  const unique = snapshot.filter(task => {
    const signature = JSON.stringify([task.title, task.due || '']);
    return !providerKeys.has(signature) && !importedKeys.has(signature) && !data.completed['todoist-closed:' + signature];
  });
  const local = data.tasks.filter(task => {
    const signature = JSON.stringify([task.title, task.due || '']);
    return !task.imported || (!providerKeys.has(signature) && !data.completed['todoist-closed:' + signature]);
  });
  return [...unique, ...local, ...todoist.tasks].map(task => ({
    ...task, ...data.taskPlans[task.id], completed: Object.hasOwn(data.completed, task.id) ? data.completed[task.id] : task.completed,
  }));
}

export function taskRow(task, detail) {
  const row = make('label', '', 'action-task');
  const check = make('input');
  check.type = 'checkbox';
  if (['high', 'medium', 'low'].includes(task.priority)) {
    row.dataset.priority = task.priority;
  }
  row.dataset.category = taskCategory(task.project);
  check.checked = Boolean(task.completed);
  check.addEventListener('change', async () => {
    try {
      if (task.sourceId) {
        check.disabled = true;
        await completeTodoist(task.sourceId);
        try {
          updateLife(data => { data.completed['todoist-closed:' + JSON.stringify([task.title, task.due || ''])] = true; });
        } catch { /* The upstream completion succeeded. */ }
      } else updateLife(data => { data.completed[task.id] = check.checked; });
      (document.getElementById('task-feedback') || row).textContent = check.checked ? 'Task completed.' : 'Task reopened.';
      document.querySelector('.task-tabs [aria-pressed="true"]')?.focus();
    } catch (error) {
      check.checked = !check.checked;
      check.disabled = false;
      (document.getElementById('task-feedback') || row).textContent = task.sourceId ? error.message : 'Browser storage is unavailable.';
    }
  });
  const text = make('span', '', 'action-task-copy');
  text.append(make('strong', task.title));
  if (row.dataset.priority) text.append(make('span', task.priority + ' priority', 'loading-label'));
  if (task.sourceId) detail = [detail, 'Todoist'].filter(Boolean).join(' · ');
  if (detail) text.append(make('small', detail));
  row.append(check, text);
  return row;
}

export function weekStart(day) {
  const weekday = new Date(day + 'T00:00:00Z').getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

export function sampleTasks(day) {
  return [
    { id: 'demo-overdue', title: 'Review first edit', project: 'Social Series', priority: 'high', due: addDays(day, -1) },
    { id: 'demo-today', title: 'Confirm locations', project: 'Brand Film', priority: 'medium', due: day },
    { id: 'demo-upcoming', title: 'Share budget', project: 'Studio Launch', priority: 'medium', due: addDays(day, 2) },
  ];
}

export function priorityToday(groups) {
  return [...groups.Today, ...groups.Overdue].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });
}

export function workoutDistance(session) {
  const match = session.distance?.match(/^([0-9]+(?:\.[0-9]+)?)\s*(km|mi)$/i);
  return match ? Number(match[1]) * (match[2].toLowerCase() === 'mi' ? 1.609344 : 1) : 0;
}

export function workoutPace(session) {
  const raw = session.duration?.trim() || '';
  const units = raw.match(/^(?:(\d+)h\s*)?(?:(\d+)\s*m(?:in)?)?(?:\s*(\d+)\s*s)?$/i);
  const clock = /^\d{1,3}:\d{2}(?::\d{2})?$/.test(raw) ? raw.split(':').map(Number) : [];
  const elapsed = clock.length ? clock.reduce((total, part) => total * 60 + part, 0)
    : units ? Number(units[1] || 0) * 3600 + Number(units[2] || 0) * 60 + Number(units[3] || 0) : 0;
  const distance = workoutDistance(session);
  if (!elapsed || !distance) return '';
  const seconds = Math.round(elapsed / distance);
  return seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} /km` : '';
}

export function today() { return londonDay(Date.now()); }

export function portfolioProjects(snapshot, demo) {
  const imported = Object.values(readLife().portfolio);
  return imported.length ? [...new Map([...(demo ? [] : snapshot), ...imported].map(project => [project.code, project])).values()] : snapshot;
}
