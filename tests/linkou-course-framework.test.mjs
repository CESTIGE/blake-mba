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
  assert.match(css, /@media \(max-width: 760px\)[^]*\.course-open-badge/s);
  assert.match(
    css,
    /@media \(max-width: 1020px\)[^]*\.course-catalog-grid > \.course-catalog-card\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
  );
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
    /\/assets\/courses-editorial\.css\?v=20260822grid1/,
  );
  assert.match(
    read("index.html"),
    /\/assets\/who-is-blake\.css\?v=20260821linkou1/,
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
