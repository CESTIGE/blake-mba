import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  cinemaOffset,
  evidenceCounterLabel,
  evidenceForCategory,
  movieTechnologyFor,
  nextStorySectionIndex,
  storyNavigationTarget,
  sceneIndex,
  scrollProgress,
  storySectionIndex,
} from "../assets/ai-future-of-work.mjs";

test("evidence filter returns only the requested category and keeps source URLs public", () => {
  const customerService = evidenceForCategory("客服");

  assert.ok(customerService.length >= 2);
  assert.ok(customerService.every((item) => item.category === "客服"));
  assert.ok(customerService.every((item) => /^https:\/\//.test(item.sourceUrl)));
  assert.ok(customerService.some((item) => item.company === "Klarna"));
});

test("evidence counter is formatted independently from the story card", () => {
  assert.equal(evidenceCounterLabel(0, 2), "1 / 2");
  assert.equal(evidenceCounterLabel(1, 2), "2 / 2");
});

test("scroll progress clamps before and after an animated scene", () => {
  assert.equal(scrollProgress(400, 500, 1000), 0);
  assert.equal(scrollProgress(1000, 500, 1000), 0.5);
  assert.equal(scrollProgress(1800, 500, 1000), 1);
});

test("scene index advances automatically across the scroll story", () => {
  assert.equal(sceneIndex(0, 5), 0);
  assert.equal(sceneIndex(0.39, 5), 1);
  assert.equal(sceneIndex(0.8, 5), 4);
  assert.equal(sceneIndex(1, 5), 4);
});

test("cinema rail moves through every real poster without a manual scrollbar", () => {
  assert.equal(cinemaOffset(0, 8), 0);
  assert.equal(cinemaOffset(0.5, 8), -350);
  assert.equal(cinemaOffset(1, 8), -700);
});

test("hero uses a dedicated AI replacement film while the 2022 evidence keeps its source image", async () => {
  const html = await readFile(new URL("../ai-future-of-work/index.html", import.meta.url), "utf8");
  const heroSource = html.match(/class="hero-real-image"[^>]+src="([^"]+)"/)?.[1];
  const firstEvidenceSource = html.match(/class="evolution-frame is-active">\s*<img src="([^"]+)"/)?.[1];

  assert.equal(heroSource, "/assets/ai-future-of-work-real/hero-ai-replacement.png");
  assert.equal(firstEvidenceSource, "/assets/ai-future-of-work-real/hero-youtube.jpg");
  assert.notEqual(heroSource, firstEvidenceSource);
});

test("every cinema future opens a distinct sourced real-world technology", () => {
  const expectations = [
    ["terminator", "Tesla Optimus", "發展中"],
    ["irobot", "Figure 03＋Helix 02", "示範／部署中"],
    ["matrix", "Neuralink N1 腦機介面", "臨床研究"],
    ["ready-player-one", "Meta Orion AR 眼鏡", "產品原型"],
    ["her", "GPT-Live／ChatGPT Voice", "已推出"],
    ["big-hero-6", "Moxi 2.0", "醫院部署中"],
    ["walle", "Glacier AI 回收機器人", "回收場部署中"],
    ["interstellar", "SpaceX Starship", "飛行測試／任務規劃中"],
  ];

  for (const [movieId, technologyName, maturity] of expectations) {
    const technology = movieTechnologyFor(movieId);
    assert.equal(technology?.name, technologyName);
    assert.equal(technology?.maturity, maturity);
    assert.match(technology?.sourceUrl ?? "", /^https:\/\//);
    assert.ok((technology?.summary ?? "").length >= 30);
    assert.ok((technology?.realityCheck ?? "").length >= 15);
  }

  assert.equal(movieTechnologyFor("unknown-movie"), null);
});

test("story page controls move one section at a time without crossing either end", () => {
  assert.equal(nextStorySectionIndex(0, -1, 7), 0);
  assert.equal(nextStorySectionIndex(0, 1, 7), 1);
  assert.equal(nextStorySectionIndex(3, -1, 7), 2);
  assert.equal(nextStorySectionIndex(3, 1, 7), 4);
  assert.equal(nextStorySectionIndex(6, 1, 7), 6);
});

test("story status follows the section occupying the viewport midpoint", () => {
  const offsets = [0, 1710, 6750, 12150, 14400, 21600, 22590];

  assert.equal(storySectionIndex(0, 900, offsets), 0);
  assert.equal(storySectionIndex(1710, 900, offsets), 1);
  assert.equal(storySectionIndex(7000, 900, offsets), 2);
  assert.equal(storySectionIndex(99999, 900, offsets), 6);
});

test("story controls jump immediately so rapid presses advance from the selected target", () => {
  assert.deepEqual(storyNavigationTarget(0, 1, 7), { index: 1, behavior: "auto" });
  assert.deepEqual(storyNavigationTarget(1, 1, 7), { index: 2, behavior: "auto" });
});

test("technology sources use reachable official hosts and mobile dialog content can scroll", async () => {
  const css = await readFile(new URL("../assets/ai-future-of-work.css", import.meta.url), "utf8");

  assert.equal(movieTechnologyFor("interstellar")?.sourceUrl, "https://www.spacex.com/humanspaceflight/mars");
  assert.match(css, /\.movie-tech-dialog\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.doesNotMatch(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.story-page-nav\s*\{[^}]*display:\s*none;/);
});

test("cinema cards expose eight keyboard-accessible technology dialogs", async () => {
  const html = await readFile(new URL("../ai-future-of-work/index.html", import.meta.url), "utf8");
  const triggers = html.match(/<button class="poster-card[^>]+data-movie-id="[^"]+"[^>]*>/g) ?? [];

  assert.equal(triggers.length, 8);
  assert.ok(triggers.every((trigger) => /aria-haspopup="dialog"/.test(trigger)));
  assert.match(html, /<dialog class="movie-tech-dialog"[^>]+data-movie-tech-dialog/);
  assert.match(html, /data-movie-tech-source[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
});

test("story ships one fixed section controller with accessible previous and next actions", async () => {
  const html = await readFile(new URL("../ai-future-of-work/index.html", import.meta.url), "utf8");

  assert.match(html, /<nav class="story-page-nav"[^>]+aria-label="頁面段落導覽"/);
  assert.match(html, /data-story-previous[^>]+aria-label="上一頁"/);
  assert.match(html, /data-story-next[^>]+aria-label="下一頁"/);
  assert.match(html, /data-story-status[^>]+aria-live="polite"/);
});
