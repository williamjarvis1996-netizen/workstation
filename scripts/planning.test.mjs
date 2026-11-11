import test from 'node:test';
import assert from 'node:assert/strict';
import { projectRisks, planDay, freeWindows } from '../src/lib/planning.mjs';
import { londonTime } from '../src/lib/time.mjs';

const day = '2026-11-11';
const at = time => londonTime(day, time);

test('planner merges busy meetings, preserves pins and flags time overflow', () => {
  const events = [{ start: at('10:00'), end: at('16:00'), busy: true }, { start: at('15:00'), end: at('17:00'), busy: true }];
  assert.deepEqual(freeWindows(events, day, at('09:00')), [{ start: at('09:00'), end: at('10:00') }, { start: at('17:00'), end: at('18:00') }]);
  const tasks = [{ id: 'pinned', due: day, minutes: 30 }, { id: 'fits', due: day, minutes: 60 }, { id: 'overflow', due: day, minutes: 45 }];
  const result = planDay({ tasks, events, projects: [], day, now: at('09:00'), pins: { pinned: '09:15' } });
  assert.deepEqual(result.blocks.map(block => [block.task.id, block.start]), [['pinned', at('09:15')], ['fits', at('17:00')]]);
  assert.equal(result.unscheduled[0].task.id, 'overflow');
});

test('upstream blockers propagate across projects and prevent automated scheduling', () => {
  const projects = ['A','B','C'].map(code => ({ code, name: code, status: 'active' }));
  const risks = projectRisks(projects, { A: { waitingOn: 'client approval' }, B: { dependsOn: ['A'] }, C: { dependsOn: ['B'] } }, day);
  assert.deepEqual(risks[0].impacts, ['B','C']);
  assert.equal(risks[2].blocked, true);
  const result = planDay({ tasks: [{ id: 'c', due: day, milestone: 'C' }], events: [], projects: risks, day, now: at('09:00') });
  assert.equal(result.blocks.length, 0);
  assert.match(result.unscheduled[0].reason, /Blocked milestone.*Depends on A/);
});

test('circular dependencies and milestone-to-delivery conflicts are flagged', () => {
  const projects = [{ code: 'A', name: 'A', status: 'active', deadline: day }, { code: 'B', name: 'B', status: 'active' }];
  const risks = projectRisks(projects, { A: { dependsOn: ['B'], milestoneDate: '2026-11-12' }, B: { dependsOn: ['A'] } }, day);
  assert(risks.every(project => project.reasons.includes('Circular project dependency')));
  assert(risks[0].reasons.includes('Milestone falls after delivery'));
});

test('after hours, tomorrow starts at opening time and skips its own commitments', () => {
  const tomorrow = '2026-11-12';
  const meeting = { start: londonTime(tomorrow, '09:00'), end: londonTime(tomorrow, '10:00'), busy: true };
  const tasks = [{ id: 'due-tomorrow', due: tomorrow, minutes: 30 }];
  const now = at('22:00');
  assert.deepEqual(planDay({ tasks, events: [meeting], projects: [], day, now }).blocks, []);
  const plan = planDay({ tasks, events: [meeting], projects: [], day: tomorrow, now });
  assert.equal(plan.blocks[0].start, londonTime(tomorrow, '10:00'));
  assert.equal(plan.blocks[0].end, londonTime(tomorrow, '10:30'));
});
