import test from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers/site-files.mjs";

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
