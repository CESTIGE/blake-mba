const taxonomy = ['AI 應用', '職涯與選擇', '創業與產品', '團隊與管理'];
const state = { articles: [], filter: 'all', year: 'all', sort: 'newest' };

const formatDate = (value) => value.replaceAll('-', '.');

const articleCard = (article, index) => `
  <article class="article-card" data-category="${article.category}">
    <a class="article-image" href="${article.url}" aria-label="閱讀：${article.title}">
      <img src="${article.image}" alt="${article.alt}" loading="lazy">
      <span>${String(index + 1).padStart(2, '0')}</span>
    </a>
    <div class="article-copy">
      <p><span>${article.category}</span><time datetime="${article.date}">${formatDate(article.date)}</time><small>${article.readingTime}</small></p>
      <h3><a href="${article.url}">${article.title}</a></h3>
      <p>${article.excerpt}</p>
      <a class="read-link" href="${article.url}">閱讀完整文章 ↗</a>
    </div>
  </article>`;

function renderArticles() {
  const grid = document.querySelector('[data-article-grid]');
  const empty = document.querySelector('[data-empty]');
  const visible = state.articles
    .filter((article) => state.filter === 'all' || article.category === state.filter)
    .filter((article) => state.year === 'all' || article.date.startsWith(state.year))
    .sort((a, b) => state.sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  grid.innerHTML = visible.map(articleCard).join('');
  empty.hidden = visible.length > 0;
}

function renderFilters() {
  const filters = document.querySelector('[data-filters]');
  filters.insertAdjacentHTML('beforeend', taxonomy.map((category) => {
    const count = state.articles.filter((article) => article.category === category).length;
    return `<button type="button" data-filter="${category}" aria-pressed="false">${category}<small>${count}</small></button>`;
  }
  ).join(''));
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    filters.querySelectorAll('button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderArticles();
  });
}

function renderArchiveControls() {
  const yearSelect = document.querySelector('[data-year-filter]');
  const sortSelect = document.querySelector('[data-sort]');
  const years = [...new Set(state.articles.map((article) => article.date.slice(0, 4)))].sort().reverse();
  yearSelect.insertAdjacentHTML('beforeend', years.map((year) => `<option value="${year}">${year} 年</option>`).join(''));
  yearSelect.addEventListener('change', () => { state.year = yearSelect.value; renderArticles(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderArticles(); });
}

function renderFeatured() {
  const article = state.articles.find((item) => item.featured) || state.articles[0];
  if (!article) return;
  const image = document.querySelector('[data-featured-image]');
  image.src = article.image;
  image.alt = article.alt;
  document.querySelector('[data-featured-title]').textContent = article.title;
  document.querySelector('[data-featured-excerpt]').textContent = article.excerpt;
  const date = document.querySelector('[data-featured-date]');
  date.dateTime = article.date;
  date.textContent = formatDate(article.date);
  document.querySelector('[data-featured-link]').href = article.url;
}

async function initArticles() {
  try {
    const response = await fetch('../content/articles.json');
    if (!response.ok) throw new Error('Article data unavailable');
    state.articles = (await response.json())
      .filter((article) => article.status === 'published')
      .sort((a, b) => b.date.localeCompare(a.date));
    document.querySelector('[data-article-count]').textContent = String(state.articles.length).padStart(2, '0');
    document.querySelector('[data-category-count]').textContent = String(taxonomy.length).padStart(2, '0');
    renderFeatured();
    renderFilters();
    renderArchiveControls();
    renderArticles();
  } catch (error) {
    document.querySelector('[data-article-grid]').innerHTML = '<p class="load-error">文章資料暫時無法載入，請前往 <a href="https://blake.mba/articles/">完整文章列表</a>。</p>';
  }
}

initArticles();
