import { make } from './storage.mjs';

export function activityEntry(entry) {
  const row = make('details', '', 'activity-row');
  const title = make('summary', entry.title);
  title.append(make('span', `${entry.source} · ${entry.date}`, 'row-meta'));
  row.append(title, make('p', entry.content, 'muted'));
  return row;
}

export function empty(text) {
  return make('p', text, 'empty');
}
