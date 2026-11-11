import { addDays } from './time.mjs';

export function productionDates(projects) {
  const entries = [];
  for (const project of projects) {
    if (project.status !== 'active') continue;
    const identity = { code: project.code, project: project.name };
    if (project.nextMilestone && project.nextMilestoneDate) {
      entries.push({ ...identity, date: project.nextMilestoneDate, label: project.nextMilestone, kind: 'milestone' });
    }
    if (project.deadline) {
      entries.push({ ...identity, date: project.deadline, label: 'Delivery deadline', kind: 'deadline' });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.project.localeCompare(b.project));
}

export function timelineWindow(entries, today) {
  const entriesByDate = new Map();
  for (const entry of entries) {
    if (!entriesByDate.has(entry.date)) entriesByDate.set(entry.date, []);
    entriesByDate.get(entry.date).push(entry);
  }

  const days = Array.from({ length: 14 }, (_, offset) => {
    const date = addDays(today, offset);
    const items = entriesByDate.get(date) ?? [];
    const projectCount = new Set(items.map(item => item.code)).size;
    return { date, items, projectCount };
  });
  const lastDay = days.at(-1).date;
  return {
    days,
    clashes: days.filter(day => day.projectCount > 1).length,
    earlier: entries.filter(item => item.date < today),
    later: entries.filter(item => item.date > lastDay),
  };
}
