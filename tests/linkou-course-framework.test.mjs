import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("course overview presents Linkou as the first of seven full course cards", () => {
  const html = read("courses/index.html");
  const cards = html.match(/class="course-catalog-card[^"]*"/g) ?? [];

  assert.equal(cards.length, 7);
  assert.match(html, /七堂課/);
  assert.match(
    html,
    /class="course-catalog-card is-open-course"[^]*?跨界 AI 提升職場生產力[^]*?2026\/09\/05[^]*?href="\/courses\/ai-work-productivity\/"/,
  );
  assert.match(
    html,
    /class="course-open-badge"[^]*?href="\/courses\/ai-work-productivity\/"/,
  );
  assert.doesNotMatch(html, /class="finder-callout"/);
});

test("course overview styling gives the open course strong contrast and responsive layout", () => {
  const css = read("assets/courses-editorial.css");

  assert.match(css, /\.course-open-badge\s*\{/);
  assert.match(css, /\.course-open-badge[^}]*color:\s*#fff;[^}]*background:/s);
  assert.match(css, /\.course-catalog-card\.is-open-course\s*\{/);
  assert.match(css, /\.open-course-cover\s*\{/);
  assert.match(css, /\.open-course-cover img\s*\{[^}]*object-fit:\s*contain;/s);
  assert.match(css, /@media \(max-width: 760px\)[^]*\.course-open-badge/s);
  assert.match(
    css,
    /@media \(max-width: 1020px\)[^]*\.course-catalog-grid > \.course-catalog-card\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
  );
});

test("course direction navigation uses separate desktop and mobile components", () => {
  const html = read("courses/index.html");
  const css = read("assets/courses-editorial.css");
  const mobileNav = html.match(/<nav class="course-path-mobile"[^]*?<\/nav>/)?.[0] ?? "";
  const heroStart = html.indexOf('<section class="page-hero course-index-hero">');
  const hero = html.slice(heroStart, html.indexOf("</section>", heroStart));

  assert.match(html, /class="course-path-visual course-path-visual--desktop"/);
  assert.equal((mobileNav.match(/class="course-path-mobile-link/g) ?? []).length, 3);
  assert.ok(hero.indexOf('class="course-path-mobile"') < hero.indexOf('class="hero-actions"'));
  assert.match(css, /\.course-path-mobile\s*\{[^}]*display:\s*none;/s);
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*\.course-path-visual--desktop\s*\{[^}]*display:\s*none;[^]*\.course-path-mobile\s*\{[^}]*display:\s*grid;/s,
  );
});

test("course comparison copy and AI workflow visual explain how to choose", () => {
  const html = read("courses/index.html");
  const visual = read("assets/visual-ai-implementation.svg");

  assert.match(html, /七堂課，從你現在的問題開始選。/);
  assert.doesNotMatch(html, /六堂課，一次比較清楚。/);
  assert.match(html, /alt="AI 從研究、判斷、產出到驗證的工作流程"/);
  for (const label of ["研究", "判斷", "產出", "驗證"]) assert.match(visual, new RegExp(`>${label}<`));
  assert.match(visual, />從問題到可驗證成果</);
});

test("home page preserves Linkou course in consolidated teaching records", () => {
  const html = read("index.html");
  assert.match(html, /林口社區大學/);
  assert.match(html, /跨界 AI/);
  assert.doesNotMatch(html, /class="home-course-alert"/);
  assert.match(html, /<body data-page="home">/);
});

test("Linkou course is discoverable in the sitemap", () => {
  assert.match(
    read("sitemap.xml"),
    /<loc>https:\/\/blake\.mba\/courses\/ai-work-productivity\/<\/loc>/,
  );
});

test("updated pages reference fresh CSS cache keys", () => {
  assert.match(
    read("courses/index.html"),
    /\/assets\/courses-editorial\.css\?v=20260906enterprise1/,
  );
  assert.match(
    read("index.html"),
    /\/assets\/who-is-blake\.css\?v=20260902connect2/,
  );
});

test("mobile analytics consent stays compact enough to leave the course entry visible", () => {
  const css = read("assets/courses-editorial.css");
  const homeCss = read("assets/who-is-blake.css");

  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="courses"\] \.analytics-consent__copy p\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="courses"\] \.analytics-consent__copy\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="courses"\] \.analytics-consent__actions\s*\{[^}]*flex-direction:\s*row;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="courses"\] \.analytics-consent__button\s*\{[^}]*width:\s*auto;/s,
  );
  assert.match(
    homeCss,
    /@media \(max-width: 760px\)[^]*body\[data-page="home"\] \.analytics-consent__copy\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    homeCss,
    /@media \(max-width: 760px\)[^]*body\[data-page="home"\] \.analytics-consent__actions\s*\{[^}]*flex-direction:\s*row;/s,
  );
});
