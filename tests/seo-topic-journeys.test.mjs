import test from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers/site-files.mjs";

function anchors(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

function assertContextualLink(page, href, phrase) {
  const links = anchors(read(page));
  assert.ok(
    links.some((link) => link.href === href && link.text.includes(phrase)),
    `${page}: missing contextual link "${phrase}" to ${href}`,
  );
}

test("home search and social titles explain the brand's AI value", () => {
  const html = read("index.html");
  for (const title of [
    html.match(/<title>([^<]+)<\/title>/)?.[1],
    html.match(/<meta property="og:title" content="([^"]+)">/)?.[1],
    html.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1],
  ]) {
    assert.match(title ?? "", /William Blake Huang 黃大成/);
    assert.match(title ?? "", /AI 實戰教育與企業導入/);
  }
});

test("home hero offers a direct journey to the AI practice course", () => {
  assertContextualLink("index.html", "/courses/ai/", "AI 實戰課程");
});

test("editorial articles offer direct contextual journeys to relevant courses", () => {
  const expectedJourneys = [
    ["articles/ai-career-positioning/index.html", "/courses/career-transition/", "AI 職涯轉型課程"],
    ["articles/ai-career-positioning/index.html", "/courses/choice-over-effort/", "職涯選擇與個人定位"],
    ["articles/taiwan-software-startup-ai-window/index.html", "/courses/software-startup/", "AI 軟體新創驗證與 MVP"],
    ["articles/taiwan-software-startup-ai-window/index.html", "/courses/entrepreneurship/", "問題驗證開始的創業實戰課程"],
    ["articles/first-principles-idiot-index/index.html", "/courses/entrepreneurship/", "問題驗證開始的創業實戰課程"],
    ["articles/first-principles-idiot-index/index.html", "/courses/software-startup/", "第一性原理驗證軟體產品"],
    ["articles/pattern-recognition-decision-making/index.html", "/courses/ai/", "AI 研究、判斷與驗證工作流程"],
    ["articles/pattern-recognition-decision-making/index.html", "/courses/choice-over-effort/", "職涯選擇與個人定位"],
    ["articles/books-grow-old-dreams-dont-rust/index.html", "/courses/career-transition/", "職涯方向與能力證據"],
  ];

  for (const [page, href, phrase] of expectedJourneys) {
    assertContextualLink(page, href, phrase);
  }
});
