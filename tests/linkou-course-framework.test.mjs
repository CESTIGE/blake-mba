import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("course overview presents Linkou as the first of six full course cards", () => {
  const html = read("courses/index.html");
  const cards = html.match(/class="course-catalog-card[^"]*"/g) ?? [];

  assert.equal(cards.length, 6);
  assert.match(html, /六堂課/);
  assert.match(
    html,
    /class="course-catalog-card is-open-course"[^]*?跨界 AI 提升職場生產力[^]*?2026\/08\/25[^]*?href="\/courses\/ai-work-productivity\/"/,
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

  assert.match(html, /六堂課，從你現在的問題開始選。/);
  assert.doesNotMatch(html, /六堂課，一次比較清楚。/);
  assert.match(html, /alt="AI 從研究、判斷、產出到驗證的工作流程"/);
  for (const label of ["研究", "判斷", "產出", "驗證"]) assert.match(visual, new RegExp(`>${label}<`));
  assert.match(visual, />從問題到可驗證成果</);
});

test("course promotion stays readable and accurate after the registration deadline", () => {
  const globalCss = read("assets/styles.css");
  const overview = read("courses/index.html");
  const career = read("courses/career-transition/index.html");
  const startup = read("courses/software-startup/index.html");

  assert.match(globalCss, /\.finder-callout strong\s*\{[^}]*color:\s*var\(--ink\);/s);
  for (const html of [overview, career, startup]) {
    assert.doesNotMatch(html, /OPEN NOW|目前開放報名|目前有開放報名/);
    assert.match(html, /2026\/08\/25/);
  }
});

test("AI course points visitors to the available Linkou course", () => {
  const html = read("courses/ai/index.html");
  const heroEnd = html.indexOf("</section>");
  const hero = html.slice(0, heroEnd);

  assert.match(hero, /class="finder-callout"/);
  assert.match(hero, /林口社大 16 週 AI 實作課/);
  assert.match(hero, /href="\/courses\/ai-work-productivity\/"/);
});

test("career choice course avoids promising a guaranteed employment outcome", () => {
  const html = read("courses/choice-over-effort/index.html");

  assert.match(html, /用 AI 提升職涯選擇力/);
  assert.doesNotMatch(html, /用 AI 拿到理想工作/);
});

test("heavy course artwork uses optimized WebP assets", () => {
  const pages = [
    read("courses/index.html"),
    read("courses/ai-work-productivity/index.html"),
    read("courses/choice-over-effort/index.html"),
    read("courses/software-startup/index.html"),
  ].join("\n");
  const assets = [
    "courses/ai-work-productivity/assets/course-cover-ai-productivity-v2.webp",
    ...["01", "02", "04", "10", "13", "16", "22", "30"].map(
      (number) => `assets/choice-over-effort/course-slide-${number}.webp`,
    ),
    "assets/ai-operations-dashboard.webp",
  ];

  assert.doesNotMatch(pages, /course-cover-ai-productivity-v2\.png|choice-over-effort\/course-slide-[0-9]+\.png|ai-operations-dashboard\.png/);
  for (const asset of assets) {
    const file = new URL(`../${asset}`, import.meta.url);
    assert.ok(fs.existsSync(file), asset);
    assert.ok(fs.statSync(file).size < 500_000, `${asset} should stay below 500 KB`);
  }
});

test("home page links to the currently open Linkou course above the fold", () => {
  const html = read("index.html");
  const heroEnd = html.indexOf("</section>");
  const hero = html.slice(0, heroEnd);

  assert.match(hero, /class="home-course-alert"/);
  assert.match(hero, /林口社大 16 週 AI 實作課/);
  assert.match(hero, /2026\/08\/25/);
  assert.match(hero, /href="\/courses\/ai-work-productivity\/"/);
  assert.ok(
    hero.indexOf('class="home-course-alert"') < hero.indexOf('class="hero-actions"'),
    "the open course entry must appear before secondary hero actions",
  );
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
    /\/assets\/courses-editorial\.css\?v=20260823coursefix2/,
  );
  assert.match(
    read("index.html"),
    /\/assets\/who-is-blake\.css\?v=20260821linkou1/,
  );
});

test("mobile analytics consent stays compact enough to leave the course entry visible", () => {
  const css = read("assets/courses-editorial.css");
  const homeCss = read("assets/who-is-blake.css");

  const mobileCss = css.slice(css.indexOf("@media (max-width: 760px)"));
  for (const page of ["courses", "career", "startup"]) {
    for (const component of [
      "analytics-consent__copy",
      "analytics-consent__copy p",
      "analytics-consent__actions",
      "analytics-consent__button",
    ]) {
      assert.ok(
        mobileCss.includes(`body[data-page="${page}"] .${component}`),
        `${page} should include the compact ${component} rule`,
      );
    }
  }
  assert.match(mobileCss, /\.analytics-consent__copy\s*\{[^}]*display:\s*none;/s);
  assert.match(mobileCss, /\.analytics-consent__copy p\s*\{[^}]*display:\s*none;/s);
  assert.match(mobileCss, /\.analytics-consent__actions\s*\{[^}]*flex-direction:\s*row;/s);
  assert.match(mobileCss, /\.analytics-consent__button\s*\{[^}]*width:\s*auto;/s);
  assert.match(
    homeCss,
    /@media \(max-width: 760px\)[^]*body\[data-page="home"\] \.analytics-consent__copy\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    homeCss,
    /@media \(max-width: 760px\)[^]*body\[data-page="home"\] \.analytics-consent__actions\s*\{[^}]*flex-direction:\s*row;/s,
  );
});
