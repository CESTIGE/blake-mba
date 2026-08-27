export const LEVEL_KEYS = Object.freeze(['L1', 'L2', 'L3', 'L4', 'L5']);

export function createEmptyCounts() {
  return Object.fromEntries(LEVEL_KEYS.map((level) => [level, 0]));
}

export function sanitizeCounts(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(
    LEVEL_KEYS.map((level) => {
      const parsed = Math.floor(Number(source[level]));
      return [level, Number.isFinite(parsed) && parsed >= 0 ? parsed : 0];
    }),
  );
}

export function incrementLevel(current, selectedLevel) {
  const next = sanitizeCounts(current);
  if (LEVEL_KEYS.includes(selectedLevel)) next[selectedLevel] += 1;
  return next;
}

export function resetCounts() {
  return createEmptyCounts();
}
