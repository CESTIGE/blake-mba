import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmptyCounts,
  incrementLevel,
  resetCounts,
  sanitizeCounts,
} from '../assets/agi-levels-state.mjs';

test('incrementLevel increases only the selected AGI level', () => {
  const current = { L1: 2, L2: 1, L3: 0, L4: 0, L5: 0 };

  assert.deepEqual(incrementLevel(current, 'L3'), {
    L1: 2,
    L2: 1,
    L3: 1,
    L4: 0,
    L5: 0,
  });
  assert.deepEqual(current, { L1: 2, L2: 1, L3: 0, L4: 0, L5: 0 });
});

test('incrementLevel ignores an unknown level', () => {
  const current = { L1: 1, L2: 0, L3: 0, L4: 0, L5: 0 };

  assert.deepEqual(incrementLevel(current, 'L6'), current);
});

test('sanitizeCounts replaces malformed local data with safe non-negative integers', () => {
  assert.deepEqual(
    sanitizeCounts({ L1: '4', L2: -2, L3: 1.8, L4: null, extra: 99 }),
    { L1: 4, L2: 0, L3: 1, L4: 0, L5: 0 },
  );
});

test('resetCounts returns five zeroed levels', () => {
  const empty = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };

  assert.deepEqual(createEmptyCounts(), empty);
  assert.deepEqual(resetCounts(), empty);
});
