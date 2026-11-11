import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, agenda, groupTasks, londonDay, londonTime } from '../src/lib/time.mjs';
import { normalize, safeUrl } from '../src/lib/storage.mjs';
import { fetchCalendar } from '../src/lib/google-calendar.mjs';

test('London day rolls over before UTC midnight in summer and respects both clock changes', () => {
  assert.equal(londonDay(Date.parse('2026-07-08T23:15:00Z')), '2026-07-09');
  assert.equal(londonDay(Date.parse('2026-01-08T23:15:00Z')), '2026-01-08');
  for (const [day, hours] of [['2026-03-29', 23], ['2026-10-25', 25]]) {
    assert.equal((londonTime(addDays(day, 1)) - londonTime(day)) / 3600000, hours);
  }
  assert.equal(new Date(londonTime('2026-07-08', '09:00')).toISOString(), '2026-07-08T08:00:00.000Z');
});

test('tasks separate due and undated work and rank same-day tasks by priority', () => {
  const task = (id, due, priority = 'medium', completed = false) => ({ id, due, priority, completed });
  const groups = groupTasks([
    task('tomorrow', '2026-11-12'), task('low', '2026-11-11', 'low'),
    task('old', '2026-11-10'), task('high', '2026-11-11', 'high'),
    task('undated', ''), task('closed', '2026-11-10', 'high', true),
  ], '2026-11-11');
  assert.deepEqual(Object.fromEntries(Object.entries(groups).map(([label, tasks]) => [label, tasks.map(t => t.id)])),
    { Overdue: ['old'], Today: ['high', 'low'], Upcoming: ['tomorrow'], 'No date': ['undated'], Completed: ['closed'] });
});

test('agenda skips ended meetings, detects overlaps and calculates a free block', () => {
  const day = '2026-11-11';
  const at = time => londonTime(day, time);
  const event = (id, start, end, busy = true) => ({ id, start: at(start), end: at(end), busy });
  const model = agenda([
    event('late', '16:00', '17:00'), event('ended', '09:00', '09:30'),
    event('current', '10:00', '11:00'), event('overlap', '10:45', '11:15'),
    event('transparent', '12:00', '16:00', false),
  ], at('10:30'));
  assert.equal(model.current[0].id, 'current');
  assert.equal(model.next.id, 'overlap');
  assert.deepEqual([...model.overlaps], ['current', 'overlap']);
  assert.deepEqual(model.longest, { start: at('11:15'), end: at('16:00') });
});

test('all-day busy entries can block focus time without becoming a next meeting', () => {
  const day = '2026-11-11';
  const model = agenda([{ id: 'leave', allDay: true, busy: true, start: londonTime(day),
    end: londonTime(addDays(day, 1)) }], londonTime(day, '09:00'));
  assert.equal(model.today.length, 1);
  assert.equal(model.next, undefined);
  assert.equal(model.longest, null);
});

test('snapshot import validates dates, assigns unique IDs and discards unsafe URLs', () => {
  const snapshot = normalize({ tasks: [{ id: 'a', title: 'One', due: '2026-02-31' }, { id: 'a', title: 'Two' }],
    quickLinks: [{ label: 'Invalid', url: 'javascript:alert(1)' }, { label: 'Valid', url: 'https://example.com' }] });
  assert.equal(snapshot.tasks[0].due, '');
  assert.notEqual(snapshot.tasks[0].id, snapshot.tasks[1].id);
  assert.equal(snapshot.quickLinks.length, 1);
  assert.equal(safeUrl('data:text/html,hello'), '');
  assert.throws(() => normalize({ arbitrary: [] }));
});

test('calendar adapter paginates, omits declined events and deduplicates shared events', async t => {
  const item = (id, extra = {}) => ({ id, iCalUID: id, start: { dateTime: '2026-11-11T12:00:00Z' },
    end: { dateTime: '2026-11-11T13:00:00Z' }, ...extra });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const parsed = new URL(url);
    requests.push(parsed);
    assert.equal(options.headers.Authorization, 'Bearer test');
    assert.equal(parsed.searchParams.get('singleEvents'), 'true');
    if (parsed.pathname.includes('/primary/') && !parsed.searchParams.has('pageToken')) {
      return Response.json({ nextPageToken: 'two', items: [item('shared'), item('declined', { attendees: [{ self: true, responseStatus: 'declined' }] })] });
    }
    return Response.json({ items: [item('shared'), item('recurrence', { start: { dateTime: '2026-11-12T12:00:00Z' }, end: { dateTime: '2026-11-12T13:00:00Z' }, iCalUID: 'shared' })] });
  });
  const result = await fetchCalendar('test', ['primary', 'work@example.com'], Date.parse('2026-11-11T09:00:00Z'));
  assert.equal(requests.length, 3);
  assert.deepEqual(result.map(event => event.id), ['primary:shared', 'primary:recurrence']);
});
