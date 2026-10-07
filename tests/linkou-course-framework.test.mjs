import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("course directory separates learning content from planning and teaching evidence", () => {
 const html = read("courses/index.html");
 assert.equal((html.match(/class="course-directory-row"/g) ?? []).length, 10);
 assert.equal((html.match(/data-course-filter=/g) ?? []).length, 4);
 assert.match(html, /可洽詢課程方案/);
 assert.match(html, /10 門課程介紹/);
 assert.doesNotMatch(html, /已確認授課的十門|授課課程 · 10/);
 assert.match(html, /教材已完成/);
 assert.match(html, /id="teaching-history"/);
 assert.match(html, /可洽詢/);
 assert.doesNotMatch(html.slice(0, html.indexOf('id="course-programs"')), /course-partner|course-hero-photo/);
});

test("home page omits the Linkou promotional banner", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /class="home-course-alert"/);
  assert.match(html, /class="hero-actions"/);
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
    /\/assets\/courses-editorial\.css\?v=20260927verified1/,
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
