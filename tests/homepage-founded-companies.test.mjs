import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { projectRoot, read } from "./helpers/site-files.mjs";

function companiesSection(html) {
  const classIndex = html.indexOf('class="section companies-section"');
  const start = html.lastIndexOf("<section", classIndex);
  const end = html.indexOf('<section class="section roles-section"', start);
  assert.ok(start >= 0 && end > start, "homepage companies section should exist");
  return html.slice(start, end);
}

test("homepage company section presents the three companies BLAKE founded", () => {
  const section = companiesSection(read("index.html"));

  assert.match(section, /三家公司各自專精/);
  assert.match(section, /希均股份有限公司/);
  assert.match(section, /metabiz 用益網路科技/);
  assert.match(section, /tmarsbase 創火星基地/);
  assert.doesNotMatch(section, /TutorABC/);
  assert.equal((section.match(/class="company-card(?:\s|")/g) ?? []).length, 3);
});

test("each founded-company card includes its logo, specialty, value, and highlights", () => {
  const section = companiesSection(read("index.html"));

  for (const asset of [
    "assets/who-is-blake/metabiz-logo.png",
    "assets/who-is-blake/tmarsbase-logo.png",
  ]) {
    assert.ok(existsSync(`${projectRoot}/${asset}`), `${asset} should exist`);
    assert.match(section, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const highlight of [
    "16 年數位入口底蘊",
    "網站設計",
    "跨境電商",
    "會員與內容",
    "AI 研發與資料系統",
    "NVIDIA Inception",
    "逾千萬元種子輪",
    "AI 顧問與人才培育",
    "企業包班",
    "導入治理",
    "教練陪跑",
  ]) {
    assert.match(section, new RegExp(highlight));
  }

  assert.match(section, /href="https:\/\/seedream\.work\/"/);
  assert.match(section, /class="seedream-official-brand"/);
});

test("tmarsbase is presented once with its story integrated into the company card", () => {
  const section = companiesSection(read("index.html"));

  assert.equal((section.match(/tmarsbase-logo\.png/g) ?? []).length, 1);
  assert.doesNotMatch(section, /class="tmarsbase-chapter"/);
  assert.match(section, /把做過的事，變成能傳承的方法/);
  assert.match(section, /商業實戰/);
  assert.match(section, /管理方法/);
  assert.match(section, /AI 落地/);
  assert.match(section, /執行致勝 × 所學傳承/);
});

test("founded-company logos and highlights have responsive presentation rules", () => {
  const html = read("index.html");
  const css = read("assets/who-is-blake.css");

  assert.match(html, /who-is-blake\.css\?v=20260902connect2/);
  assert.match(css, /\.company-logo-frame\s*\{/);
  assert.match(css, /\.company-specialties\s*\{/);
  assert.match(css, /\.company-highlights\s*\{/);
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*\.company-logo-frame\s*\{[^}]*min-height:/s,
  );
});
