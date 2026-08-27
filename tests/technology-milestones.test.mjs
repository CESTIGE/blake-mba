import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { projectRoot, read } from "./helpers/site-files.mjs";

test("technology milestones preserves the reference and expands it to ten sourced modules", () => {
  const html = read("technology-milestones/index.html");
  assert.equal((html.match(/data-milestone=/g) ?? []).length, 10);
  for (const era of ["1977–1981", "1995–1998", "2004", "2007–2010", "2018–2021", "2022–2025"]) {
    assert.match(html, new RegExp(era));
  }
  assert.match(html, /Microsoft/);
  assert.match(html, /Adobe/);
  assert.match(html, /Netflix/);
  assert.match(html, /Spotify/);
  assert.equal((html.match(/data-dividend-toggle/g) ?? []).length, 10);
  assert.equal((html.match(/class="milestone-sources"/g) ?? []).length, 10);
});

test("technology milestones uses ten unique accessible reveal relationships", () => {
  const html = read("technology-milestones/index.html");
  const controls = [...html.matchAll(/aria-controls="(dividend-\d{2})"/g)].map((match) => match[1]);
  const panels = [...html.matchAll(/id="(dividend-\d{2})" data-dividend-panel/g)].map((match) => match[1]);
  assert.equal(new Set(controls).size, 10);
  assert.deepEqual(controls, panels);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 10);
});

test("technology milestones remains a standalone unindexed showcase", () => {
  const sitemap = read("sitemap.xml");
  const siteJs = read("assets/site.js");
  assert.doesNotMatch(sitemap, /technology-milestones/);
  assert.doesNotMatch(siteJs, /technology-milestones/);
});

test("dividend state updates the panel, accessibility state and visible label", async () => {
  const { setDividendState } = await import(pathToFileURL(join(projectRoot, "assets/technology-milestones.js")));
  const attributes = new Map();
  const label = { textContent: "" };
  const toggle = {
    setAttribute(name, value) { attributes.set(name, value); },
    querySelector(selector) { return selector === "[data-toggle-label]" ? label : null; },
  };
  const panel = { hidden: true };

  setDividendState(toggle, panel, true);
  assert.equal(attributes.get("aria-expanded"), "true");
  assert.equal(panel.hidden, false);
  assert.equal(label.textContent, "收起紅利");

  setDividendState(toggle, panel, false);
  assert.equal(attributes.get("aria-expanded"), "false");
  assert.equal(panel.hidden, true);
  assert.equal(label.textContent, "展開紅利");
});

test("milestone styles include responsive, focus and reduced-motion contracts", () => {
  const css = read("assets/technology-milestones.css");
  assert.match(css, /--milestone-ink:\s*#0b1d2a/i);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("desktop milestone modules use the approved large editorial format", () => {
  const css = read("assets/technology-milestones.css");
  assert.match(css, /\.milestone-card\s*{[^}]*width:\s*76%/s);
  assert.match(css, /\.milestone-story p\s*{[^}]*font-size:\s*17px/s);
  assert.match(css, /\.founder img,[^{]*\.founder-monogram\s*{[^}]*width:\s*68px[^}]*height:\s*80px/s);
  assert.match(css, /@media\s*\(max-width:\s*1020px\)[\s\S]*?\.milestone-card,[\s\S]*?width:\s*auto/s);
});

test("the final milestone includes Elon Musk, xAI and SpaceX with sources", () => {
  const html = read("technology-milestones/index.html");
  const finalModule = html.match(/<article[^>]+id="era-10"[\s\S]*?<\/article>/)?.[0] ?? "";
  assert.match(finalModule, /xAI/);
  assert.match(finalModule, /SpaceX/);
  assert.match(finalModule, /Elon Musk/);
  assert.match(finalModule, /https:\/\/x\.ai\/company/);
  assert.match(finalModule, /https:\/\/(?:new\.)?spacex\.com\/mission/);
  assert.match(finalModule, /elon-musk\.jpg/);
});
