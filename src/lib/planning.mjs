import { londonTime } from './time.mjs';

export function projectRisks(projects, plans, day) {
  const byCode = new Map(projects.map(project => [project.code, {
    ...project, ...plans[project.code],
  }]));
  const direct = new Map();
  for (const [code, project] of byCode) {
    const notes = [];
    const date = project.milestoneDate || project.nextMilestoneDate || project.deadline;
    if (project.status !== 'completed') {
      if (project.health === 'blocked') notes.push('Marked blocked');
      if (project.health === 'at-risk') notes.push('Marked at risk');
      if (date && date < day) notes.push('Milestone overdue');
      if (project.waitingOn?.trim()) notes.push('Waiting on ' + project.waitingOn.trim());
      if (project.deadline && date && date > project.deadline) notes.push('Milestone falls after delivery');
    }
    direct.set(code, notes);
  }
  const downstream = new Map([...byCode.keys()].map(code => [code, new Set()]));
  const results = [...byCode].map(([code, project]) => {
    const visited = new Set([code]);
    const blockedBy = [];
    let cycle = false;
    function visit(dependency, trail) {
      if (trail.has(dependency)) { cycle = true; return; }
      if (visited.has(dependency) || !byCode.has(dependency)) return;
      visited.add(dependency);
      const source = byCode.get(dependency);
      if (source.status === 'completed') return;
      downstream.get(dependency).add(code);
      const upstreamDate = source.milestoneDate || source.nextMilestoneDate || source.deadline;
      const ownDate = project.milestoneDate || project.nextMilestoneDate || project.deadline;
      if (direct.get(dependency).length || (ownDate && upstreamDate && upstreamDate > ownDate)) blockedBy.push(dependency);
      for (const parent of source.dependsOn || []) visit(parent, new Set([...trail, dependency]));
    }
    for (const dependency of project.dependsOn || []) visit(dependency, new Set([code]));
    const reasons = [...direct.get(code)];
    if (cycle) reasons.push('Circular project dependency');
    for (const dependency of blockedBy) reasons.push('Depends on ' + byCode.get(dependency).name);
    const blocked = cycle || project.health === 'blocked' || Boolean(project.waitingOn?.trim())
      || blockedBy.some(dependency => byCode.get(dependency).health === 'blocked' || byCode.get(dependency).waitingOn?.trim());
    return { ...project, reasons, blocked, risk: reasons.length > 0 };
  });
  return results.map(project => ({ ...project, impacts: [...downstream.get(project.code)].map(code => byCode.get(code).name) }));
}

export function freeWindows(events, day, now) {
  const minute = 60000;
  const start = Math.max(londonTime(day, '09:00'), Math.ceil(now / (5 * minute)) * 5 * minute);
  const end = londonTime(day, '18:00');
  if (start >= end) return [];
  const blocks = events.filter(event => event.busy && event.end > start && event.start < end)
    .sort((a, b) => a.start - b.start);
  const windows = [];
  let cursor = start;
  for (const event of blocks) {
    if (event.start > cursor) windows.push({ start: cursor, end: event.start });
    cursor = Math.max(cursor, event.end);
  }
  if (cursor < end) windows.push({ start: cursor, end });
  return windows;
}

export function planDay({ tasks, events, projects, day, now, order = [], pins = {} }) {
  const byProject = new Map(projects.flatMap(project => [[project.code, project], [project.name, project]]));
  const priority = { high: 3, medium: 2, low: 1 };
  const ranks = new Map(order.map((id, index) => [id, index]));
  const candidates = tasks.filter(task => !task.completed && (!task.due || task.due <= day || ranks.has(task.id) || Object.hasOwn(pins, task.id)));
  function decorate(task) {
    const project = byProject.get(task.milestone) || byProject.get(task.project);
    const due = task.due && task.due <= day;
    const milestoneDate = project?.milestoneDate || project?.nextMilestoneDate;
    const urgentMilestone = milestoneDate && milestoneDate <= day;
    const minutes = Number(task.minutes);
    const estimated = Number.isInteger(minutes) && minutes >= 5 && minutes <= 480;
    const why = [
      due && (task.due === day ? 'Due today' : 'Overdue'),
      project && ('Milestone: ' + (project.milestone || project.nextMilestone || project.name)),
      task.priority === 'high' && 'High priority',
      project?.risk && 'Project at risk',
      !estimated && '30 min assumed',
    ].filter(Boolean);
    return { ...task, project, minutes: estimated ? minutes : 30, reason: why.join(' · ') || 'Open task', score: (due ? 100 : 0) + (urgentMilestone ? 20 : 0) + (priority[task.priority] || 0) };
  }
  const sorted = candidates.map(decorate).sort((a, b) =>
    (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity) || b.score - a.score || (a.due || '9999').localeCompare(b.due || '9999'));
  const windows = freeWindows(events, day, now);
  const blocks = [];
  const unscheduled = sorted.filter(task => task.project?.blocked).map(task => ({
    task, reason: 'Blocked milestone: ' + task.project.reasons.join(' · '),
  }));
  const schedulable = sorted.filter(task => !task.project?.blocked);
  function reserve(task, start, index) {
    const window = windows[index];
    const end = start + task.minutes * 60000;
    const replacement = [];
    if (start > window.start) replacement.push({ start: window.start, end: start });
    if (end < window.end) replacement.push({ start: end, end: window.end });
    windows.splice(index, 1, ...replacement);
    blocks.push({ task, start, end });
  }
  for (const task of schedulable.filter(task => Object.hasOwn(pins, task.id))) {
    const pin = pins[task.id];
    const start = typeof pin === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(pin) ? londonTime(day, pin) : NaN;
    const index = windows.findIndex(window => start >= window.start && start + task.minutes * 60000 <= window.end);
    if (index < 0) unscheduled.push({ task, reason: 'Pinned time conflicts with the calendar or work hours' });
    else reserve(task, start, index);
  }
  for (const task of schedulable.filter(task => !Object.hasOwn(pins, task.id))) {
    const index = windows.findIndex(window => window.end - window.start >= task.minutes * 60000);
    if (index < 0) unscheduled.push({ task, reason: 'No uninterrupted window long enough' });
    else reserve(task, windows[index].start, index);
  }
  return { blocks: blocks.sort((a, b) => a.start - b.start), unscheduled, ranked: sorted };
}
