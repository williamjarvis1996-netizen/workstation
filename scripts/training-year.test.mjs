import test from 'node:test';
import assert from 'node:assert/strict';
import { annualMileage, mergeTrainingSessions, parseRunningLog } from '../src/lib/training-year.mjs';

test('imports the summary table, preserves units and calibration, and excludes hikes and laps', () => {
  const md = [
    '## Log',
    '| 3 Nov | Treadmill | **4.12 km** (recalibrated from 4.49) | 30:20 | **7:22/km** | 138 | — |',
    '| 17 May | Hackney (Race) | 13.24 mi | 1:58:10 | 8:56/mi | 177 | 94m |',
    '| 2 May | Lake District (ascent) | 2.41 mi | 1:32:11 | 38:15/mi | 127 | 580m |',
    '## Lap Detail',
    '| 1 May | Ignore this | 1 km | 06:00 | | | |',
  ].join('\n');
  const { workouts, excludedHikes } = parseRunningLog(md, 2026);
  assert.equal(excludedHikes, 1);
  assert.equal(workouts.length, 2);
  assert.equal(workouts[0].distance, '4.12 km');
  assert.match(workouts[0].dataNote, /recalibrated/);
  assert.equal(workouts[1].distance, '13.24 mi');
  assert.equal(workouts[1].title, 'Hackney Half Marathon');
});

test('prefers the imported record for a run already in the snapshot and groups kilometres by week', () => {
  const archived = { date: '2026-01-01', title: 'Snapshot name', type: 'run', distance: '5 km', duration: '25:00' };
  const imported = { ...archived, title: 'Vault name', imported: true, source: 'obsidian-run' };
  const other = { date: '2026-01-02', title: 'Other run', type: 'run', distance: '2 mi' };
  const merged = mergeTrainingSessions([archived, other], [imported]);
  const year = annualMileage(merged, 2026);
  assert.equal(year.runs.length, 2);
  assert.equal(year.weeks[0].day, '2025-12-29');
  assert.equal(year.weeks[0].runs, 2);
  assert(Math.abs(year.total - 8.218688) < 0.00002);
});

test('imports real strength visits, skips artefacts and preserves missing volume', async () => {
  const { parseStrengthLog } = await import('../src/lib/training-year.mjs');
  const log = ['## Quick Reference',
    '| 9 Nov | Pull (new gym) | 40 min | 15 | 4,000 kg | Corrected |',
    '| 8 Nov | — | 1:50 | 2 | — | Watch artefact |',
    '| 7 Nov | Mixed | 35 min | 12 | — | No weight data |',
    '## Session Detail', '| 6 Nov | Skip | 15 min | 5 | 100 kg | — |'].join('\n');
  const result = parseStrengthLog(log, 2026);
  assert.equal(result.excludedArtefacts, 1);
  assert.deepEqual(result.workouts.map(item => [item.sets, item.volumeKg, item.gym]), [[15, 4000, 'New gym'], [12, undefined, undefined]]);
  const existing = { date: '2026-11-09', title: 'Snapshot lift', volume: '4,000 kg', type: 'gym' };
  assert.equal(mergeTrainingSessions([existing], result.workouts).length, 2);
});
