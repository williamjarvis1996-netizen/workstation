import { addDays } from './time.mjs';
import { readLife, updateLife, today, weekStart } from './life.mjs';
import { make } from './storage.mjs';

document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('goals-page') || document.getElementById('training-page');
  if (!root) return;
  const goals = JSON.parse(root.dataset.goals);
  const board = document.getElementById('goal-board');
  const habits = document.getElementById('habit-grid');
  const milestones = document.getElementById('goal-milestones');
  const feedback = document.getElementById('goal-feedback');
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const day = today();
  const week = weekStart(day);
  document.getElementById('habit-week').textContent = 'Week of ' + week;
  const goalId = (goal, index) => JSON.stringify([goal.category, goal.name, index]);

  function saved(change, success) {
    try {
      updateLife(change);
      feedback.textContent = success;
      return true;
    } catch {
      feedback.textContent = 'Browser storage is unavailable. Changes were not saved.';
      return false;
    }
  }

  function renderMilestones() {
    const { goals: plans } = readLife();
    const dated = goals.flatMap((goal, index) => {
      const plan = plans[goalId(goal, index)] || goal;
      return plan.milestoneDate ? [{ goal, plan }] : [];
    }).sort((a, b) => a.plan.milestoneDate.localeCompare(b.plan.milestoneDate));
    milestones.replaceChildren(...dated.map(({goal, plan}) => {
      const item = make('li');
      const date = make('time', plan.milestoneDate);
      date.dateTime = plan.milestoneDate;
      item.append(date, make('strong', goal.name), make('span', plan.nextAction));
      return item;
    }));
    if (!dated.length) milestones.append(make('li', 'Add a milestone date to a goal to see it here.', 'empty-state-sm'));
  }

  const state = readLife();
  for (const [index, goal] of goals.entries()) {
    const id = goalId(goal, index);
    const plan = state.goals[id] || goal;
    const card = make('article', '', 'panel goal-plan');
    card.append(make('span', [goal.category, goal.status].filter(Boolean).join(' · '), 'top-sync'), make('h2', goal.name), make('p', goal.detail));
    const form = make('form');
    for (const [name, label, type] of [['target', 'Measurable target', 'text'], ['nextAction', 'Next action', 'text'], ['milestoneDate', 'Milestone date', 'date']]) {
      const field = make('label', label);
      const input = make('input');
      input.name = name;
      input.type = type;
      input.maxLength = 180;
      input.value = plan[name] || '';
      field.append(input);
      form.append(field);
    }
    const submit = make('button', 'Save goal plan');
    submit.type = 'submit';
    form.append(submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      if (saved(data => { data.goals[id] = values; }, 'Goal plan saved.')) renderMilestones();
    });
    card.append(form);
    board.append(card);

    const row = make('div', '', 'habit-row');
    row.append(make('strong', goal.name));
    for (const [offset, weekday] of weekdays.entries()) {
      const date = addDays(week, offset);
      const button = make('button', weekday);
      button.type = 'button';
      button.disabled = date > day;
      button.setAttribute('aria-label', `${goal.name}, ${weekday} ${date}`);
      const key = JSON.stringify([id, date]);
      button.setAttribute('aria-pressed', String(Boolean(state.habits[key])));
      button.addEventListener('click', () => {
        const checked = button.getAttribute('aria-pressed') !== 'true';
        if (saved(data => { data.habits[key] = checked; }, 'Check-in saved.')) button.setAttribute('aria-pressed', String(checked));
      });
      row.append(button);
    }
    habits.append(row);
  }
  if (!goals.length) board.append(make('p', 'No goals in this snapshot.', 'empty-state-sm'));
  renderMilestones();
});
