const zone = 'Europe/London';
const dateParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeStyle: 'short' });
const heading = new Intl.DateTimeFormat('en-GB', { timeZone: zone, dateStyle: 'full' });

function parts(time) {
  return Object.fromEntries(dateParts.formatToParts(time).map(({type, value}) => [type, value]));
}

export function londonDay(time) {
  const { year, month, day } = parts(time);
  return `${year}-${month}-${day}`;
}

export const londonClock = time => clock.format(time);
export const londonHeading = time => heading.format(time);
export const minutes = (start, end) => Math.ceil((end - start) / 60000);

export function addDays(day, count) {
  const utc = new Date(day + 'T00:00:00Z');
  utc.setUTCDate(utc.getUTCDate() + count);
  return utc.toISOString().slice(0, 10);
}

export function londonTime(day, time = '00:00') {
  const target = Date.parse(`${day}T${time}:00Z`);
  let instant = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = parts(instant);
    const local = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    if (local === target) break;
    instant += target - local;
  }
  return instant;
}

export function groupTasks(tasks, day) {
  const priority = { high: 0, medium: 1, low: 2 };
  const groups = { Overdue: [], Today: [], Upcoming: [], 'No date': [], Completed: [] };
  for (const task of tasks) {
    const group = task.completed ? 'Completed'
      : !task.due ? 'No date'
      : task.due < day ? 'Overdue'
      : task.due === day ? 'Today' : 'Upcoming';
    groups[group].push(task);
  }
  for (const group of Object.values(groups)) {
    group.sort((a, b) => (a.due || '').localeCompare(b.due || '') || priority[a.priority] - priority[b.priority]);
  }
  return groups;
}

export function agenda(events, now) {
  const day = londonDay(now);
  const start = londonTime(day);
  const end = londonTime(addDays(day, 1));
  const ordered = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const today = ordered.filter(event => event.start < end && event.end > start);
  const current = today.filter(event => !event.allDay && event.start <= now && event.end > now);
  const next = ordered.find(event => !event.allDay && event.start > now);
  const upcoming = ordered.filter(event => event.start >= end);
  const workEnd = londonTime(day, '18:00');
  let cursor = Math.max(now, londonTime(day, '09:00'));
  let longest = null;
  const overlaps = new Set();
  const busy = today.filter(event => event.busy);
  for (let i = 0; i < busy.length; i++) {
    const event = busy[i];
    for (let j = i + 1; j < busy.length && busy[j].start < event.end; j++) {
      if (busy[j].end > Math.max(event.start, now)) {
        overlaps.add(event.id);
        overlaps.add(busy[j].id);
      }
    }
  }
  const blockers = busy.filter(event => event.end > cursor && event.start < workEnd);
  blockers.push({ start: workEnd, end: workEnd });
  for (const event of blockers) {
    const gap = Math.min(event.start, workEnd) - cursor;
    if (gap >= 60000 && (!longest || gap > longest.end - longest.start)) {
      longest = { start: cursor, end: Math.min(event.start, workEnd) };
    }
    cursor = Math.max(cursor, event.end);
  }
  return { today, current, next, upcoming, longest, overlaps };
}
