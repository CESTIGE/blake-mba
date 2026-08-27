import test from "node:test";
import assert from "node:assert/strict";
import {
  cinemaOffset,
  evidenceCounterLabel,
  evidenceForCategory,
  sceneIndex,
  scrollProgress,
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
