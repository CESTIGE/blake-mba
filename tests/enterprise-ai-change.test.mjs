import test from "node:test";
import assert from "node:assert/strict";
import { attribute, read } from "./helpers/site-files.mjs";

const page = "courses/enterprise-ai-change/index.html";

test("enterprise AI workshop exposes the approved promise and audience", () => {
  const html = read(page);
  assert.match(html, /AI 變革推動實戰班/);
  assert.match(html, /HR 帶隊 × 主管共識 × 種子員工實作/);
  assert.match(html, /六小時完成企業第一個可試行的 AI 工作流程/);
  for (const role of ["HR", "部門主管", "種子員工"]) {
    assert.match(html, new RegExp(role));
  }
});

test("enterprise AI workshop contains six modules totaling 360 minutes", () => {
  const html = read(page);
  const minutes = [...html.matchAll(/<[a-z][\w:-]*\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) =>
      (attribute(tag, "class") ?? "").split(/\s+/).includes("workshop-module"),
    )
    .map((tag) => Number(attribute(tag, "data-minutes")));
  assert.deepEqual(minutes, [40, 65, 75, 90, 45, 45]);
  assert.equal(minutes.reduce((total, value) => total + value, 0), 360);
});

test("enterprise AI workshop contains all seven deliverables", () => {
  const html = read(page);
  for (const output of [
    "AI 導入障礙診斷表",
    "優先流程選題表",
    "AI 工作流程畫布",
    "可操作流程雛形",
    "共用指令與查證範本",
    "AI 使用規範與風險檢查表",
    "30 天部門試行計畫",
  ]) {
    assert.match(html, new RegExp(output));
  }
});

test("enterprise AI workshop routes consultation through the existing enterprise form", () => {
  const html = read(page);
  const consultationLinks = [...html.matchAll(/<a\b[^>]*>/gi)]
    .map((match) => attribute(match[0], "href"))
    .filter(
      (href) => href === "/contact/?inquiry=enterprise-training#contact-form",
    );
  assert.ok(consultationLinks.length >= 2);
  assert.doesNotMatch(html, /<form\b/i);
});

test("enterprise AI workshop states the sensitive-data and delivery boundaries", () => {
  const html = read(page);
  assert.match(html, /去識別化/);
  assert.match(html, /個資/);
  assert.match(html, /營業秘密/);
  assert.match(html, /不是法律意見|不構成法律意見/);
  assert.match(html, /不是正式系統|不等於正式系統/);
});

test("course and advisory indexes link to the enterprise workshop", () => {
  for (const source of ["courses/index.html", "ai-transform/index.html"]) {
    assert.match(
      read(source),
      /href="\/courses\/enterprise-ai-change\/"/,
      source,
    );
  }
});
