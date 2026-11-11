import { addDays, londonClock, londonTime } from './time.mjs';
import { planDay, projectRisks } from './planning.mjs';
import { mergedTasks, portfolioProjects, readLife, sampleTasks, today, updateLife } from './life.mjs';
import { syncInfo } from './shared.mjs';
import { make } from './storage.mjs';

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('planner');
  if (!root) return;
  const controller = new AbortController();
  const byId = id => document.getElementById(id);
  const day = today();
  const demo = root.dataset.demo === 'true';
  const tasks = JSON.parse(root.dataset.tasks);
  const projects = JSON.parse(root.dataset.projects);
  const snapshot = JSON.parse(root.dataset.events);
  const feedback = byId('plan-feedback');
  const editable = byId('plan-candidates');
  const restored = readLife().dayPlans[day];
  let order = restored?.order || [];
  let pins = restored?.pins || {};
  let result;
  byId('plan-date').textContent = day;

  function calendar() {
    const live = syncInfo().calendar;
    if (live.events) return { label: 'Google Calendar · ' + live.status, events: live.events };
    const events = snapshot.map(event => {
      const start = londonTime(event.date, event.startTime || '00:00');
      const end = event.endTime ? londonTime(event.date, event.endTime)
        : event.startTime ? start + 1800000 : londonTime(addDays(event.date, 1));
      return { start, end, busy: true };
    });
    if (demo && !Object.keys(readLife().portfolio).length && !events.length) for (const [start, end] of [['11:30','12:30'],['15:00','16:00']]) {
      events.push({ start: londonTime(day, start), end: londonTime(day, end), busy: true });
    }
    return { label: events.length ? demo ? 'Sample schedule' : 'Snapshot · verify before committing'
      : 'Disconnected · assumes your workday is free', events };
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
    if (!plan?.blocks?.length) target.append(make('li', 'No plan committed for today.', 'empty-state-sm'));
  }

  function rerender() {
    const schedule = calendar();
    byId('plan-calendar').textContent = schedule.label;
    const useSample = demo && !Object.keys(readLife().portfolio).length;
    const all = mergedTasks(useSample ? [...tasks, ...sampleTasks(day)] : demo ? [] : tasks);
    const portfolio = projectRisks(portfolioProjects(projects, demo), readLife().projectPlans, day);
    result = planDay({ tasks: all, events: schedule.events, projects: portfolio, day, now: Date.now(), order, pins });
    byId('plan-blocks').replaceChildren(...result.blocks.map(block => blockRow(block)));
    if (!result.blocks.length) byId('plan-blocks').append(make('li', 'No work fits in the remaining windows.', 'empty-state-sm'));
    byId('plan-overflow').replaceChildren(...result.unscheduled.map(({ task, reason }) => {
      const row = make('li', '', 'overflow-item');
      row.append(make('strong', task.title), make('small', [task.due && 'Due ' + task.due, reason].filter(Boolean).join(' · ')));
      return row;
    }));
    if (!result.unscheduled.length) byId('plan-overflow').append(make('li', 'Every candidate fits.', 'empty-state-sm'));
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
    if (!result.blocks.length) return;
    try {
      const committed = { order: result.ranked.map(task => task.id), pins, blocks: result.blocks.map(({task,start,end}) => ({ id: task.id, title: task.title, start, end })), committedAt: new Date().toISOString() };
      updateLife(data => { data.dayPlans[day] = committed; });
      feedback.textContent = 'Today’s plan committed.';
    } catch { feedback.textContent = 'Could not save the plan.'; }
  });
  byId('plan-reset').addEventListener('click', () => { order = []; pins = {}; rerender(); feedback.textContent = 'Draft reset.'; });
  document.addEventListener('workstation:change', rerender, { signal: controller.signal });
  document.addEventListener('workstation:sync', rerender, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  rerender();
});
