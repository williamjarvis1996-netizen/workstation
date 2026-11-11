import { londonClock, londonTime } from './time.mjs';
import { externalLink, make } from './storage.mjs';

export function renderAgenda(target, model, day, now, available) {
  const allDay = model.today.filter(event => event.allDay);
  const timed = model.today.filter(event => !event.allDay);
  const start = Math.min(londonTime(day, '09:00'), ...timed.map(event => event.start));
  const end = Math.max(londonTime(day, '18:00'), ...timed.map(event => event.end));
  const scale = Math.max(1, (end - start) / 3600000);
  const label = make('p', '', 'empty-state-sm');
  if (!available) {
    label.textContent = 'Connect Google Calendar in Settings to see your schedule.';
    target.replaceChildren(label);
    return;
  }
  const axis = make('div', '', 'agenda-axis');
  axis.style.setProperty('--hours', String(Math.min(14, scale)));
  const place = (element, startTime, endTime = startTime) => {
    element.style.setProperty('--axis-top', (startTime - start) / (end - start) * 100 + '%');
    element.style.setProperty('--axis-size', (endTime - startTime) / (end - start) * 100 + '%');
    axis.append(element);
  };
  for (let hour = start; hour < end; hour += 3600000) place(make('div', londonClock(hour), 'axis-hour'), hour);
  if (model.longest) {
    const gap = make('div', '', 'axis-focus');
    gap.append(make('strong', 'Focus window'), make('small', `${londonClock(model.longest.start)}–${londonClock(model.longest.end)}`));
    place(gap, model.longest.start, model.longest.end);
  }
  const laneEnds = [];
  const placements = timed.map(event => {
    let lane = laneEnds.findIndex(endTime => endTime <= event.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = event.end;
    return { event, lane };
  });
  axis.style.setProperty('--lanes', String(Math.max(1, laneEnds.length)));
  for (const { event, lane } of placements) {
    const block = make('div', '', `axis-event${model.current.includes(event) ? ' is-current' : ''}`);
    block.style.setProperty('--lane', String(lane));
    block.append(event.url ? externalLink(event.title, event.url) : make('strong', event.title));
    const details = [`${londonClock(event.start)}–${londonClock(event.end)}`, event.location, model.overlaps.has(event.id) && 'Overlaps'].filter(Boolean).join(' · ');
    block.append(make('small', details));
    place(block, event.start, event.end);
  }
  if (now >= start && now < end) place(make('div', londonClock(now), 'axis-now'), now);
  const strips = allDay.map(event => {
    const row = make('div', '', 'all-day-event');
    row.append(make('small', 'All day'), event.url ? externalLink(event.title, event.url) : make('strong', event.title));
    return row;
  });
  target.replaceChildren(...strips, axis);
}
