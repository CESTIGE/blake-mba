import test from "node:test";
import assert from "node:assert/strict";
import { attribute, read } from "./helpers/site-files.mjs";

const page = "courses/enterprise-ai-change/index.html";

test("enterprise AI guide presents the approved problem-first story in order", () => {
  const html = read(page);
  const ids = ["overview", "barriers", "failure-loop", "outcome"];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("enterprise AI hero gives HR the four decision facts and one primary action", () => {
  const html = read(page);

  for (const phrase of [
    "上市櫃企業 HR",
    "6 小時工作坊",
    "30 天落地衝刺",
    "FDE 式陪跑",
    "預約企業 AI 落地診斷",
  ]) {
    assert.match(html, new RegExp(phrase));
  }
});

test("enterprise AI guide presents five sourced overseas adoption cases", () => {
  const html = read(page);
  const cases = [
    [
      "OpenAI × Crete",
      "https://openai.com/index/building-self-improving-tax-agents-with-codex/",
    ],
    [
      "Palantir AIP Bootcamp",
      "https://investors.palantir.com/files/2025%20FY%20PLTR%2010-K.pdf",
    ],
    [
      "Palantir × Beyond Meat",
      "https://www.palantir.com/assets/xrfr7uokpv1b/4rM2L8TANQGcPsLKOzdMJ0/6795f2b89327a87361743319836f0c42/AIPCon_Mar_-24_-_Bootcamp_One-Pager_-_Beyond_Meat.pdf",
    ],
    [
      "Anthropic × ServiceNow",
      "https://www.anthropic.com/news/servicenow-anthropic-claude",
    ],
    [
      "Microsoft × KOHLER",
      "https://www.microsoft.com/en/customers/story/26948-kohler-company-microsoft-365-copilot",
    ],
  ];

  const start = html.indexOf('id="cases"');
  const end = html.indexOf('id="fde"');
  const section = html.slice(start, end);
  assert.ok(start >= 0 && end > start);

  for (const [name, href] of cases) {
    assert.ok(section.includes(name), name);
    const link = [...section.matchAll(/<a\b[^>]*>/gi)]
      .map((match) => match[0])
      .find((tag) => attribute(tag, "href") === href);
    assert.ok(link, href);
    assert.equal(attribute(link, "target"), "_blank");
    assert.equal(attribute(link, "rel"), "noopener noreferrer");
  }

  assert.match(
    section,
    /外部案例公開成果[^<]*不代表 BLAKE 對個別企業的成果保證/,
  );
});

test("enterprise AI guide explains the six-step FDE adoption loop in order", () => {
  const html = read(page);
  const start = html.indexOf('id="fde"');
  const end = html.indexOf('id="solution"');
  const section = html.slice(start, end);
  const steps = ["診斷", "選題", "共創", "評估", "試行", "交接"];
  const positions = steps.map((step) => section.indexOf(`>${step}<`));

  assert.ok(start >= 0 && end > start);
  assert.match(section, /Forward Deployed Engineer/);
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(section, /正式系統整合、資安測試與維運需另案評估/);
});

test("enterprise AI offer connects 1 by 3 by 30 to workshop and sprint", () => {
  const html = read(page);

  for (const phrase of [
    "1 × 3 × 30＋FDE 企業 AI 落地法",
    "6 小時工作坊",
    "30 天落地衝刺",
    "七項成果包",
    "正式系統整合需另案評估",
  ]) {
    assert.ok(html.includes(phrase), phrase);
  }

  const ids = ["solution", "curriculum", "deliverables", "sprint", "fit"];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("enterprise AI lazy-guide components stack safely on small screens", () => {
  const css = read("assets/enterprise-ai-change.css");

  for (const selector of [
    ".failure-loop",
    ".case-grid",
    ".case-card",
    ".fde-steps",
    ".solution-grid",
    ".sprint-timeline",
  ]) {
    assert.ok(css.includes(selector), selector);
  }

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(
    css,
    /@media \(max-width: 430px\)[^]*\.workshop-hero\s*\{[^}]*min-height:\s*auto;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 430px\)[^]*\.fde-steps\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  );
});

test("enterprise AI in-page destinations clear the fixed site header", () => {
  const css = read("assets/enterprise-ai-change.css");

  assert.match(
    css,
    /\.enterprise-workshop-page > section\s*\{[^}]*scroll-margin-top:\s*88px;/s,
  );
});

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

test("enterprise training query maps to the existing contact option", () => {
  const script = read("assets/site.js");
  const contact = read("contact/index.html");
  assert.match(script, /"enterprise-training": "企業內訓"/);
  assert.match(contact, /<option>企業內訓<\/option>/);
});

test("enterprise AI workshop publishes conservative Course structured data", () => {
  const html = read(page);
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  const course = blocks
    .map((match) => JSON.parse(match[1]))
    .find((item) => item["@type"] === "Course");
  assert.equal(course.name, "AI 變革推動實戰班");
  assert.equal(course.url, "https://blake.mba/courses/enterprise-ai-change/");
  assert.equal(course.inLanguage, "zh-Hant");
  assert.equal(course.provider.name, "William Blake Huang 黃大成");
  assert.equal(course.offers, undefined);
  assert.equal(course.aggregateRating, undefined);
});

test("enterprise AI workshop keeps first-visit consent controls clear of the mobile CTA", () => {
  const css = read("assets/enterprise-ai-change.css");

  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="enterprise-workshop"\] \.analytics-consent__copy\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="enterprise-workshop"\] \.analytics-consent__actions\s*\{[^}]*flex-direction:\s*row;/s,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[^]*body\[data-page="enterprise-workshop"\] \.analytics-consent__button\s*\{[^}]*width:\s*auto;/s,
  );
});
