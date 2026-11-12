import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productionDates, timelineWindow } from '../src/lib/work-timeline.mjs';

test('production timeline includes only recorded milestone and deadline dates for active projects', () => {
  const dates = productionDates([
    { status: 'active', code: 'A', name: 'Film', nextMilestone: 'Review', nextMilestoneDate: '2026-11-11', deadline: '2026-11-15' },
    { status: 'active', code: 'B', name: 'Series', nextMilestone: 'Write pilot' },
    { status: 'paused', code: 'C', name: 'Spot', deadline: '2026-11-12' },
  ]);
  assert.deepEqual(dates.map(({ code, kind, date }) => [code, kind, date]), [
    ['A', 'milestone', '2026-11-11'], ['A', 'deadline', '2026-11-15'],
  ]);
});

test('the rolling window counts only dates shared by distinct projects as clashes', () => {
  const dates = productionDates([
    { status: 'active', code: 'A', name: 'Film', nextMilestone: 'Review', nextMilestoneDate: '2026-12-31', deadline: '2026-12-31' },
    { status: 'active', code: 'B', name: 'Series', nextMilestone: 'Lock', nextMilestoneDate: '2026-12-30', deadline: '2027-01-13' },
    { status: 'active', code: 'C', name: 'Spot', nextMilestone: 'Review', nextMilestoneDate: '2027-01-14', deadline: '2026-12-31' },
  ]);
  const result = timelineWindow(dates, '2026-12-31');
  assert.equal(result.days.length, 14);
  assert.equal(result.days.at(-1).date, '2027-01-13');
  assert.equal(result.days[0].items.length, 3);
  assert.equal(result.days[0].projectCount, 2);
  assert.equal(result.clashes, 1);
  assert.deepEqual(result.earlier.map(item => item.date), ['2026-12-30']);
  assert.deepEqual(result.later.map(item => item.date), ['2027-01-14']);
  assert.equal(timelineWindow(dates.filter(item => item.code === 'A'), '2026-12-31').clashes, 0);
});

test('a saved handover replaces the snapshot milestone and updates the date clash', () => {
  const projects = [
    { code: 'A', name: 'Film', status: 'active', nextMilestone: 'Old edit', nextMilestoneDate: '2026-11-12' },
    { code: 'B', name: 'Series', status: 'active', deadline: '2026-11-14' },
  ];
  const entries = productionDates(projects, { A: { milestone: 'New edit', milestoneDate: '2026-11-14' } });
  assert.equal(entries.find(item => item.code === 'A').label, 'New edit');
  assert.equal(timelineWindow(entries, '2026-11-12').clashes, 1);
  assert.equal(timelineWindow(entries, '2026-11-12').days[0].items.length, 0);
});
