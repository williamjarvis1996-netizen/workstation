import { updateLife, today } from './life.mjs';

function mountCapture() {
  const dialog = document.getElementById('capture-dialog');
  const trigger = document.getElementById('capture-open');
  if (!dialog || !trigger) return;
  const controller = new AbortController();
  const form = dialog.querySelector('form');
  const type = form.elements.kind;
  const feedback = document.getElementById('capture-feedback');
  function showFields() {
    for (const section of form.querySelectorAll('[data-kind]')) {
      const visible = section.dataset.kind === type.value;
      section.hidden = !visible;
      section.disabled = !visible;
    }
  }
  function open() {
    if (dialog.open) return;
    form.reset();
    showFields();
    form.elements.workoutDate.value = today();
    dialog.querySelector('[role="status"]').textContent = '';
    dialog.showModal();
    form.elements.title.focus();
  }
  trigger.addEventListener('click', open);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyK') {
      event.preventDefault();
      open();
    }
  }, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => controller.abort(), { once: true });
  type.addEventListener('change', showFields);
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(form);
    const value = name => String(values.get(name) || '').trim();
    const title = value('title');
    if (!title) {
      dialog.querySelector('[role="status"]').textContent = 'Enter a title.';
      return;
    }
    const id = crypto.randomUUID();
    try {
      updateLife(data => {
        if (type.value === 'task') data.tasks.push({ id, title, due: value('due'), priority: value('priority'), project: value('project'), completed: false });
        if (type.value === 'workout') data.workouts.push({ id, title, date: value('workoutDate'), type: value('workoutType'),
          distance: value('distance') ? value('distance') + ' km' : '', duration: value('duration') ? value('duration') + ' min' : '' });
        if (type.value === 'idea') data.ideas.push({ id, title, summary: value('notes'), date: today() });
      });
      feedback.textContent = { task: 'Task saved to Tasks.', workout: 'Workout saved to Training.', idea: 'Idea saved to Creative.' }[type.value];
      dialog.close();
      trigger.focus();
    } catch {
      dialog.querySelector('[role="status"]').textContent = 'Browser storage is unavailable. Your entry was not saved.';
    }
  });
}
document.addEventListener('astro:page-load', mountCapture);
