import { addDays, londonClock, londonDay, londonHeading, londonTime } from './time.mjs';
import { planDay, projectRisks } from './planning.mjs';
import { mergedTasks, portfolioProjects, readLife, sampleTasks, today, updateLife } from './life.mjs';
import { syncInfo } from './shared.mjs';
import { make } from './storage.mjs';

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('planner');
  if (!root) return;
  const controller = new AbortController();
  const byId = id => document.getElementById(id);
  let currentDay = today();
  let day = currentDay;
  let offset = 0;
  const drafts = new Map();
  const dayButtons = [...root.querySelectorAll('[data-plan-offset]')];
  const demo = root.dataset.demo === 'true';
  const tasks = JSON.parse(root.dataset.tasks);
  const projects = JSON.parse(root.dataset.projects);
  const snapshot = JSON.parse(root.dataset.events);
  const feedback = byId('plan-feedback');
  const editable = byId('plan-candidates');
  function savedDraft(date) {
    const plan = readLife().dayPlans[date];
    return { order: plan?.order || [], pins: plan?.pins || {} };
  }

  let { order, pins } = savedDraft(day);
  let result;

  function selectDay(nextOffset) {
    drafts.set(day, { order, pins });
    offset = nextOffset;
    currentDay = today();
    day = addDays(currentDay, offset);
    ({ order, pins } = drafts.get(day) || savedDraft(day));
    for (const button of dayButtons) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.planOffset) === offset));
    }
    feedback.textContent = '';
    rerender();
  }

  function calendar() {
    const live = syncInfo().calendar;
    const syncedAt = Date.parse(live.syncedAt);
    if (live.events && Number.isFinite(syncedAt)) {
      const fetchedDay = londonDay(syncedAt);
      if (day >= fetchedDay && day < addDays(fetchedDay, 8)) {
        const stale = Date.now() - syncedAt > 15 * 60000 || live.status.startsWith('Stale');
        return {
          label: stale ? 'Google Calendar · last refresh ' + londonClock(syncedAt) + ' · verify before saving'
            : 'Google Calendar · updated ' + londonClock(syncedAt),
          events: live.events,
        };
      }
    }
    const events = snapshot.flatMap(event => {
      const start = londonTime(event.date, event.startTime || '00:00');
      const end = event.endTime ? londonTime(event.date, event.endTime)
        : event.startTime ? start + 1800000 : londonTime(addDays(event.date, 1));
      return Number.isFinite(start) && Number.isFinite(end) && end > start
        ? [{ start, end, title: event.title, allDay: !event.startTime, busy: true }] : [];
    });
    if (demo && !Object.keys(readLife().portfolio).length && !events.length) for (const [start, end] of [['11:30','12:30'],['15:00','16:00']]) {
      events.push({ start: londonTime(day, start), end: londonTime(day, end), title: 'Sample commitment', busy: true });
    }
    return { label: events.length ? demo ? 'Sample schedule' : 'Calendar snapshot · verify before saving'
      : 'Calendar disconnected · free time is unverified', events };
  }

  function blockRow(block, committed = false) {
    const item = make('li');
    const title = committed ? block.title : block.task.title;
    item.append(make('span', `${londonClock(block.start)}–${londonClock(block.end)}`, 'plan-time'), make('strong', title));
    const reason = committed ? '' : block.task.reason;
    if (reason) item.append(make('small', reason));
    return item;
  }

  function renderCommitted() {
    const plan = readLife().dayPlans[day];
    const target = byId('plan-committed');
    target.replaceChildren(...(plan?.blocks || []).map(block => blockRow(block, true)));
    if (!plan?.blocks?.length) target.append(make('li', 'No saved plan for this day.', 'empty-state-sm'));
  }

  function renderEvents(events) {
    const start = londonTime(day);
    const end = londonTime(addDays(day, 1));
    const rows = events.filter(event => event.start < end && event.end > start)
      .sort((a, b) => a.start - b.start).map(event => {
        const row = make('li', '', event.busy ? 'is-busy' : '');
        const time = event.allDay ? 'All day'
          : `${londonClock(Math.max(start, event.start))}–${event.end >= end ? '24:00' : londonClock(event.end)}`;
        row.append(make('span', time, 'plan-time'), make('strong', event.title || 'Calendar event'));
        if (!event.busy) row.append(make('small', 'Does not block planning time'));
        return row;
      });
    byId('plan-events').replaceChildren(...(rows.length ? rows : [make('li', 'No commitments in this calendar data.', 'empty-state-sm')]));
  }

  function rerender() {
    byId('plan-date').textContent = londonHeading(londonTime(day));
    const schedule = calendar();
    byId('plan-calendar').textContent = schedule.label;
    renderEvents(schedule.events);
    const useSample = demo && !Object.keys(readLife().portfolio).length;
    const all = mergedTasks(useSample ? [...tasks, ...sampleTasks(currentDay)] : demo ? [] : tasks);
    const portfolio = projectRisks(portfolioProjects(projects, demo), readLife().projectPlans, day);
    result = planDay({ tasks: all, events: schedule.events, projects: portfolio, day, now: Date.now(), order, pins });
    byId('plan-blocks').replaceChildren(...result.blocks.map(block => blockRow(block)));
    if (!result.blocks.length) {
      const message = day === currentDay && londonClock(Date.now()) >= '18:00'
        ? 'Today’s planning window has ended. Switch to Tomorrow to plan ahead.'
        : 'No work fits in the remaining windows.';
      byId('plan-blocks').append(make('li', message, 'empty-state-sm'));
    }
    byId('plan-overflow').replaceChildren(...result.unscheduled.map(({ task, reason }) => {
      const row = make('li', '', 'overflow-item');
      row.append(make('strong', task.title), make('small', [task.due && 'Due ' + task.due, reason].filter(Boolean).join(' · ')));
      return row;
    }));
    if (!result.unscheduled.length) byId('plan-overflow').append(make('li', result.ranked.length ? 'Every candidate fits.' : 'No tasks considered for this day.', 'empty-state-sm'));
    byId('plan-save').disabled = !result.blocks.length;
    if (!editable.contains(document.activeElement)) renderCandidates(all, portfolio);
    renderCommitted();
  }

  function renderCandidates(all, portfolio) {
    const ranked = result.ranked;
    const rankedIds = new Set(ranked.map(task => task.id));
    const future = all.filter(task => !task.completed && !rankedIds.has(task.id));
    editable.replaceChildren();
    for (const [index, task] of ranked.entries()) {
      const item = make('section', '', 'plan-candidate');
      item.append(make('strong', task.title));
      const controls = make('div', '', 'plan-controls');
      const form = make('form', '', 'plan-controls');
      function field(label, input) {
        const wrapper = make('label', label);
        wrapper.append(input);
        form.append(wrapper);
      }
      const estimate = make('input'); estimate.type = 'number'; estimate.min = '5'; estimate.max = '480'; estimate.value = task.minutes; estimate.required = true;
      field('Minutes', estimate);
      const milestone = make('select');
      milestone.add(new Option('No milestone', ''));
      for (const project of portfolio) milestone.add(new Option(project.name, project.code));
      milestone.value = task.milestone || '';
      field('Milestone', milestone);
      const pin = make('input'); pin.type = 'time'; pin.value = pins[task.id] || '';
      field('Pin time', pin);
      const save = make('button', 'Apply', 'action-button'); save.type = 'submit'; form.append(save);
      form.addEventListener('submit', event => {
        event.preventDefault();
        try {
          if (pin.value) pins = { ...pins, [task.id]: pin.value };
          else delete pins[task.id];
          updateLife(data => { data.taskPlans[task.id] = { minutes: Number(estimate.value), milestone: milestone.value }; });
          feedback.textContent = 'Task estimate and draft updated.';
          rerender();
        } catch { feedback.textContent = 'Could not save the task settings.'; }
      });
      for (const [delta, label] of [[-1, 'Move up'], [1, 'Move down']]) {
        const button = make('button', label, 'action-button'); button.type = 'button';
        const next = index + delta;
        button.disabled = next < 0 || next >= ranked.length;
        button.addEventListener('click', () => {
          order = ranked.map(item => item.id);
          [order[index], order[next]] = [order[next], order[index]];
          button.blur();
          rerender();
          editable.querySelectorAll('.plan-candidate')[next]?.querySelector('button')?.focus();
        });
        controls.append(button);
      }
      item.append(form, controls);
      editable.append(item);
    }
    if (future.length) {
      const row = make('div', '', 'plan-controls');
      const select = make('select');
      select.setAttribute('aria-label', 'Task to pull forward');
      for (const task of future) select.add(new Option(task.title, task.id));
      const add = make('button', 'Pull forward', 'action-button');
      add.addEventListener('click', () => {
        order = [...ranked.map(task => task.id), select.value];
        add.blur();
        rerender();
      });
      row.append(select, add);
      editable.append(row);
    }
    if (!ranked.length && !future.length) editable.append(make('p', 'No open tasks.', 'empty-state-sm'));
  }

  byId('plan-save').addEventListener('click', () => {
    if (today() !== currentDay) { selectDay(offset); return; }
    const blocksToSave = () => result.blocks.map(({ task, start, end }) => ({ id: task.id, title: task.title, start, end }));
    const previous = blocksToSave();
    rerender();
    const blocks = blocksToSave();
    if (JSON.stringify(previous) !== JSON.stringify(blocks)) {
      feedback.textContent = 'The suggested blocks changed. Review the updated draft before saving.';
      return;
    }
    if (!blocks.length) return;
    try {
      const committed = { order: result.ranked.map(task => task.id), pins, blocks, committedAt: new Date().toISOString() };
      updateLife(data => { data.dayPlans[day] = committed; });
      feedback.textContent = 'Plan saved for ' + londonHeading(londonTime(day)) + '.';
    } catch { feedback.textContent = 'Could not save the plan.'; }
  });
  byId('plan-reset').addEventListener('click', () => { order = []; pins = {}; rerender(); feedback.textContent = 'Draft reset.'; });
  document.addEventListener('workstation:change', rerender, { signal: controller.signal });
  document.addEventListener('workstation:sync', rerender, { signal: controller.signal });
  for (const button of dayButtons) button.addEventListener('click', () => selectDay(Number(button.dataset.planOffset)));
  function checkDay() { if (today() !== currentDay) selectDay(offset); }
  const timer = window.setInterval(checkDay, 60000);
  document.addEventListener('visibilitychange', checkDay, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => {
    controller.abort();
    window.clearInterval(timer);
  }, { once: true });
  rerender();
});
