import assert from "node:assert/strict";
import test from "node:test";

import { read } from "./helpers/site-files.mjs";

function sectionById(html, id) {
  const marker = `id="${id}"`;
  const markerIndex = html.indexOf(marker);
  const start = html.lastIndexOf("<section", markerIndex);
  const end = html.indexOf("</section>", markerIndex);

  assert.ok(markerIndex >= 0, `homepage section #${id} should exist`);
  assert.ok(start >= 0 && end > markerIndex, `homepage section #${id} should be complete`);
  return html.slice(start, end + "</section>".length);
}

test("homepage removes the BLAKE method chapter and keeps the remaining chapter order continuous", () => {
  const html = read("index.html");

  assert.doesNotMatch(html, /id="method"|THE BLAKE METHOD|選擇、轉譯、驗證、落地/);
  assert.match(sectionById(html, "teaching-records"), /06 · TEACHING &amp; EXPERIENCE/);
  assert.doesNotMatch(html, /<section[^>]*id="proof"/);
  assert.match(sectionById(html, "class-feedback"), /07 · YOUR TURN/);
  assert.match(sectionById(html, "connect"), /08 · STAY CONNECTED/);
  assert.ok(
    html.indexOf('id="class-feedback"') < html.indexOf('id="connect"'),
    "the connection hub should follow the survey",
  );
});

test("the final connection hub exposes the four approved destinations", () => {
  const section = sectionById(read("index.html"), "connect");
  const links = [...section.matchAll(/<a\b([^>]*)>/g)].map((match) => match[1]);

  assert.equal(links.length, 4);
  assert.equal((section.match(/class="connect-card connect-card-/g) ?? []).length, 4);
  assert.equal((section.match(/class="connect-card-icon"/g) ?? []).length, 4);
  assert.equal((section.match(/<svg\b[^>]*aria-hidden="true"/g) ?? []).length, 4);
  assert.match(links[0], /href="\/social\/"/);
  assert.match(links[1], /href="https:\/\/www\.facebook\.com\/williamblakehuang\/"/);
  assert.match(links[2], /href="https:\/\/line\.me\/R\/ti\/p\/@512snprg"/);
  assert.match(links[3], /href="\/contact\/"/);
  assert.match(section, /Instagram 動態牆/);
  assert.match(section, /查看最新貼文/);
  assert.match(section, /Facebook 粉絲團/);
  assert.match(section, /追蹤粉絲團/);
  assert.match(section, /LINE 官方帳號/);
  assert.match(section, /加入 LINE @512snprg/);
  assert.match(section, /聯絡表單/);
  assert.match(section, /填寫聯絡表單/);
});

test("connection cards preserve accessible external-link and responsive layout behavior", () => {
  const html = read("index.html");
  const section = sectionById(html, "connect");
  const css = read("assets/who-is-blake.css");

  assert.match(html, /who-is-blake\.css\?v=20260902connect2/);
  assert.equal((section.match(/target="_blank"/g) ?? []).length, 2);
  assert.equal((section.match(/rel="noreferrer"/g) ?? []).length, 2);
  assert.match(css, /\.connect-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(240px,\s*1fr\)\);/s);
  assert.match(css, /\.connect-card\s*\{[^}]*min-height:\s*320px;/s);
  assert.match(css, /\.connect-card-icon\s*\{[^}]*position:\s*absolute;[^}]*opacity:/s);
  assert.match(css, /@media \(max-width: 1020px\)[^]*\.connect-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /@media \(max-width: 760px\)[^]*\.connect-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
