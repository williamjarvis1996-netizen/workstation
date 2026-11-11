import { londonClock, londonTime } from './time.mjs';
import { externalLink, make } from './storage.mjs';

export function renderAgenda(target, model, day, now, available) {
  const allDay = model.today.filter(event => event.allDay);
  const timed = model.today.filter(event => !event.allDay);

  if (!available) {
    target.replaceChildren(make('p', 'Connect Google Calendar in Settings to see your schedule.', 'empty-state-sm'));
    return;
  }

  if (timed.length <= 3 && !model.current.length) {
    const list = make('div', '', 'agenda-compact');
    if (!timed.length && !allDay.length) {
      list.append(make('p', 'No events today', 'empty-state-sm'));
    }
    for (const event of allDay) {
      const row = make('div', '', 'agenda-row agenda-row--allday');
      row.append(make('span', 'All day', 'agenda-row-time'));
      row.append(event.url ? externalLink(event.title, event.url) : make('strong', event.title));
      list.append(row);
    }
    for (const event of timed) {
      const row = make('div', '', 'agenda-row');
      row.append(make('span', `${londonClock(event.start)}–${londonClock(event.end)}`, 'agenda-row-time'));
      const body = make('div', '', 'agenda-row-body');
      body.append(event.url ? externalLink(event.title, event.url) : make('strong', event.title));
      if (event.location) body.append(make('small', event.location));
      row.append(body);
      list.append(row);
    }
    if (model.longest) {
      const row = make('div', '', 'agenda-row agenda-row--focus');
      row.append(make('span', `${londonClock(model.longest.start)}–${londonClock(model.longest.end)}`, 'agenda-row-time'));
      row.append(make('strong', 'Focus window'));
      list.append(row);
    }
    if (model.upcoming.length) {
      list.append(make('p', 'Coming up', 'agenda-upcoming-label'));
      for (const event of model.upcoming.slice(0, 3)) {
        const row = make('div', '', 'agenda-row agenda-row--upcoming');
        const dateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).format(event.start);
        row.append(make('span', event.allDay ? dateStr : `${dateStr} ${londonClock(event.start)}`, 'agenda-row-time'));
        row.append(event.url ? externalLink(event.title, event.url) : make('strong', event.title));
        list.append(row);
      }
    }
    target.replaceChildren(list);
    return;
  }

  const start = Math.min(londonTime(day, '09:00'), ...timed.map(event => event.start));
  const end = Math.max(londonTime(day, '18:00'), ...timed.map(event => event.end));
  const scale = Math.max(1, (end - start) / 3600000);
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
