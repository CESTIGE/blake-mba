import { incrementLevel, resetCounts, sanitizeCounts } from './agi-levels-state.mjs';

const STORAGE_KEY = 'blake-agi-level-counts-v1';
const LEVEL_NAMES = { L1: 'L1 對話者', L2: 'L2 推理者', L3: 'L3 行動者', L4: 'L4 創新者', L5: 'L5 組織者' };

function loadCounts() {
  try {
    return sanitizeCounts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return sanitizeCounts({});
  }
}

function saveCounts(counts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counts)); } catch { /* Storage can be unavailable. */ }
}

let counts = loadCounts();
const countNodes = [...document.querySelectorAll('[data-count]')];
const leaderNode = document.querySelector('[data-leader]');

function renderCounts() {
  countNodes.forEach((node) => { node.textContent = String(counts[node.dataset.count] || 0); });
  const highest = Math.max(...Object.values(counts));
  if (!leaderNode) return;
  if (highest === 0) {
    leaderNode.textContent = '尚未有人選擇';
    return;
  }
  const leaders = Object.entries(counts).filter(([, count]) => count === highest).map(([level]) => LEVEL_NAMES[level]);
  leaderNode.textContent = leaders.join('、');
}

function addRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('i');
  ripple.className = 'poll-ripple';
  ripple.style.left = `${event.clientX ? event.clientX - rect.left : rect.width / 2}px`;
  ripple.style.top = `${event.clientY ? event.clientY - rect.top : rect.height / 2}px`;
  button.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

document.querySelectorAll('[data-vote]').forEach((button) => {
  button.addEventListener('click', (event) => {
    const level = button.dataset.vote;
    counts = incrementLevel(counts, level);
    saveCounts(counts);
    document.querySelectorAll('[data-vote]').forEach((option) => option.classList.toggle('is-selected', option === button));
    addRipple(button, event);
    renderCounts();
  });
});

const resetButton = document.querySelector('[data-reset-counts]');
const resetStatus = document.querySelector('[data-reset-status]');
resetButton?.addEventListener('click', () => {
  counts = resetCounts();
  saveCounts(counts);
  document.querySelectorAll('[data-vote]').forEach((option) => option.classList.remove('is-selected'));
  renderCounts();
  if (resetStatus) resetStatus.textContent = '本機計數已歸零。';
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const progress = document.querySelector('[data-reading-progress]');
const updateProgress = () => {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
};
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const hero = document.querySelector('[data-hero]');
if (hero && !reducedMotion) {
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    hero.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });
}

renderCounts();
