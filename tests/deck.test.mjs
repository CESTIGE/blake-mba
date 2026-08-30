import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { projectRoot, read } from "./helpers/site-files.mjs";
import * as deck from "../assets/deck.js";

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test("DECK route ships with its page, styles, and interaction module", () => {
  for (const path of [
    "deck/index.html",
    "assets/deck.css",
    "assets/deck.js",
  ]) {
    assert.equal(existsSync(join(projectRoot, path)), true, `${path} should exist`);
  }
});

test("DECK stays an unindexed standalone route with one clear page identity", () => {
  const html = read("deck/index.html");
  const sitemap = read("sitemap.xml");

  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /<h1[^>]*>DECK<\/h1>/);
  assert.match(html, /href="\/"[^>]*>返回首頁/);
  assert.doesNotMatch(sitemap, /\/deck\/?/);
});

test("DECK hero and skip target expose valid accessible labels", () => {
  const html = read("deck/index.html");

  assert.match(html, /<main id="main" tabindex="-1">/);
  assert.match(html, /<section class="deck-hero" aria-labelledby="deck-title">[\s\S]*?<h1 id="deck-title">DECK<\/h1>/);
});

test("DECK presents three source-linked interactive concept modules", () => {
  const html = read("deck/index.html");

  assert.equal((html.match(/data-deck-module=/g) ?? []).length, 3);
  assert.equal((html.match(/data-option=/g) ?? []).length, 11);
  for (const route of ["/technology-milestones/", "/agi-levels/", "/ai-future-of-work/"]) {
    assert.match(html, new RegExp(`href="${route.replaceAll("/", "\\/")}"`));
  }
  assert.match(html, /科技改變可能性，AGI 擴張能力，工作重新分配責任。/);
  assert.match(html, /aria-live="polite"/);
});

test("DECK tabs identify their shared live panels", () => {
  const html = read("deck/index.html");
  const controls = [...html.matchAll(/role="tab"[^>]*aria-controls="([^"]+)"/g)].map((match) => match[1]);

  assert.equal(controls.length, 11);
  assert.deepEqual([...new Set(controls)].sort(), ["agi-panel", "technology-panel", "work-panel"]);
  for (const panel of new Set(controls)) {
    assert.match(html, new RegExp(`<article[^>]*id="${panel}"[^>]*role="tabpanel"[^>]*aria-atomic="true"`));
  }
  assert.match(read("assets/deck.js"), /panel\.setAttribute\("aria-labelledby",\s*button\.id\)/);
});

test("DECK remains useful when JavaScript is unavailable", () => {
  const html = read("deck/index.html");
  const css = read("assets/deck.css");
  const js = read("assets/deck.js");

  assert.match(html, /<noscript>[\s\S]*?預設摘要[\s\S]*?<\/noscript>/);
  assert.match(css, /\.option-rail,\s*\.work-switch\s*{[^}]*display:\s*none/s);
  assert.match(css, /\.deck-ready\s+\.option-rail\s*{[^}]*display:\s*flex/s);
  assert.match(css, /\.deck-ready\s+\.work-switch\s*{[^}]*display:\s*grid/s);
  assert.match(js, /document\.documentElement\.classList\.add\("deck-ready"\)/);
});

test("DECK action colors and light-surface focus meet WCAG contrast", () => {
  const css = read("assets/deck.css");
  const action = css.match(/--deck-coral-action:\s*(#[a-f\d]{6})/i)?.[1];
  const lightFocus = css.match(/--deck-light-focus:\s*(#[a-f\d]{6})/i)?.[1];

  assert.ok(action);
  assert.ok(lightFocus);
  assert.ok(contrast(action, "#ffffff") >= 4.5, `white on ${action} must reach 4.5:1`);
  assert.ok(contrast(lightFocus, "#faf7f1") >= 3, `${lightFocus} focus on paper must reach 3:1`);
  assert.match(css, /\.technology-options button\[aria-selected="true"\] span\s*{[^}]*color:\s*#fff/s);
});

test("DECK styles preserve keyboard, touch, responsive, and reduced-motion behavior", () => {
  const css = read("assets/deck.css");

  assert.match(css, /--deck-ink:\s*#0b1d2a/i);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*1020px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*340px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("DECK clips its oversized hero map instead of widening the mobile document", () => {
  const css = read("assets/deck.css");

  assert.match(css, /\.deck-hero\s*{[^}]*overflow:\s*hidden/s);
});

test("DECK keeps the two-column fallback through narrow desktop widths", () => {
  const css = read("assets/deck.css");

  assert.match(css, /@media\s*\(max-width:\s*1280px\)\s*{[\s\S]*?\.technology-layout,[\s\S]*?grid-template-columns:\s*minmax\(360px,\s*1fr\)\s+minmax\(230px,\s*\.7fr\)/);
});

test("DECK resists text zoom, sticky-header overlap, and undersized brand targets", () => {
  const css = read("assets/deck.css");

  assert.match(css, /html\s*{[^}]*scroll-padding-top:\s*80px/s);
  assert.match(css, /\.deck-brand,\s*\.deck-footer a\s*{[^}]*min-height:\s*44px/s);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.agi-options button span\s*{[^}]*white-space:\s*normal/s);
});

test("DECK metadata and asset cache keys stay synchronized", () => {
  const html = read("deck/index.html");
  const cssKey = html.match(/deck\.css\?v=([^"']+)/)?.[1];
  const jsKey = html.match(/deck\.js\?v=([^"']+)/)?.[1];

  assert.equal(cssKey, "20260830c");
  assert.equal(jsKey, "20260830c");
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta property="og:description"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/blake\.mba\/deck\/">/);
  assert.match(html, /<meta property="og:type" content="website">/);
});

test("DECK interaction state starts on the approved featured options", () => {
  assert.equal(typeof deck.createDeckState, "function");
  assert.deepEqual(deck.createDeckState(), {
    technology: "2007",
    agi: "L3",
    work: "ai",
  });
});

test("selectDeckOption changes one valid module without mutating prior state", () => {
  assert.equal(typeof deck.selectDeckOption, "function");
  const current = deck.createDeckState();
  const next = deck.selectDeckOption(current, "agi", "L5");

  assert.deepEqual(next, { technology: "2007", agi: "L5", work: "ai" });
  assert.deepEqual(current, { technology: "2007", agi: "L3", work: "ai" });
  assert.deepEqual(deck.selectDeckOption(next, "work", "robot"), next);
});

test("getDeckContent returns the user-facing story for a selected option", () => {
  assert.equal(typeof deck.getDeckContent, "function");
  assert.deepEqual(deck.getDeckContent("technology", "1977"), {
    kicker: "個人電腦｜1977",
    title: "運算走上個人桌面",
    copy: "微處理器與個人電腦降低運算門檻，軟體第一次能面向大規模個人市場。",
    points: ["微處理器", "個人軟體", "桌面生態"],
    visualLevel: "1977",
    visualWord: "桌面",
  });
  assert.equal(deck.getDeckContent("agi", "L5").title, "協調整個組織");
  assert.equal(deck.getDeckContent("work", "human").kicker, "人類承擔的狀態");
  assert.equal(deck.getDeckContent("technology", "1900"), null);
});
