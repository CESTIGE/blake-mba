(() => {
  const directory = document.querySelector('#verified-courses');
  if (!directory) return;
  const filters = Array.from(directory.querySelectorAll('[data-course-filter]'));
  const rows = Array.from(directory.querySelectorAll('.course-directory-row'));
  const paths = Array.from(document.querySelectorAll('[data-path-filter]'));
  const count = directory.querySelector('.course-directory-count');
  const title = directory.querySelector('#directory-title');
  const categories = new Set(filters.map(button => button.dataset.courseFilter));
  const labels = { all: '', career: '職涯選擇 · ', startup: '創業驗證 · ', ai: 'AI 實戰 · ' };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyFilter(category, { updateUrl = false, moveToDirectory = false } = {}) {
    const selected = categories.has(category) ? category : 'all';
    let visible = 0;
    for (const row of rows) {
      row.hidden = selected !== 'all' && row.dataset.category !== selected;
      if (!row.hidden) visible += 1;
    }
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.courseFilter === selected));
    for (const path of paths) {
      if (path.dataset.pathFilter === selected) path.setAttribute('aria-current', 'true');
      else path.removeAttribute('aria-current');
    }
    count.textContent = `${labels[selected]}${visible} 門課程介紹`;
    if (updateUrl) {
      const hash = selected === 'all' ? '#verified-courses' : `#courses-${selected}`;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
    if (moveToDirectory) {
      title.focus({ preventScroll: true });
      directory.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  for (const button of filters) button.addEventListener('click', () => applyFilter(button.dataset.courseFilter, { updateUrl: true }));
  for (const path of paths) path.addEventListener('click', event => {
    event.preventDefault();
    applyFilter(path.dataset.pathFilter, { updateUrl: true, moveToDirectory: true });
  });
  function restoreFromHash() {
    const match = window.location.hash.match(/^#courses-(career|startup|ai)$/);
    if (match) applyFilter(match[1], { moveToDirectory: true });
    else if (window.location.hash === '#verified-courses' || !window.location.hash) applyFilter('all');
  }
  window.addEventListener('hashchange', restoreFromHash);
  restoreFromHash();
})();
