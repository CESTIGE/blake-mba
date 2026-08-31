import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { projectRoot, read } from "./helpers/site-files.mjs";

const cards = [
  { slug: "tmarsbase", brand: "TMarsBase", role: "創辦人" },
  { slug: "metabiz", brand: "MetaBiz", role: "共同創辦人" },
  { slug: "seedream", brand: "seedream", role: "商務聯絡" },
];

test("each approved brand has its own root-level business-card page", () => {
  for (const { slug, brand } of cards) {
    const page = `${slug}/index.html`;
    assert.ok(existsSync(join(projectRoot, page)), `${page} should exist`);
    const html = read(page);
    assert.match(html, new RegExp(`<h1[^>]*>${brand}</h1>`), page);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://blake\\.mba/${slug}/">`), page);
    assert.match(html, new RegExp(`<meta property="og:url" content="https://blake\\.mba/${slug}/">`), page);
  }
});

test("every business card offers the same complete contact and sharing actions", () => {
  for (const { slug, role } of cards) {
    const page = `${slug}/index.html`;
    const html = read(page);
    assert.match(html, /<body data-business-card=/, page);
    assert.match(html, /BLAKE 黃大成/, page);
    assert.match(html, new RegExp(role), page);
    assert.match(html, /src="\/assets\/who-is-blake\/blake-hero\.jpg"[^>]*width="901"[^>]*height="941"/, page);
    assert.match(html, /href="mailto:hi@blake\.mba/, page);
    assert.match(html, /href="\/contact\/\?inquiry=/, page);
    assert.match(html, new RegExp(`href="/${slug}/blake-huang\\.vcf" download`), page);
    assert.match(html, /data-share-card/, page);
    assert.match(html, /data-copy-card/, page);
    assert.match(html, /data-card-status[^>]*aria-live="polite"/, page);
    assert.match(html, /\/assets\/business-card\.css\?v=20260830card1/, page);
    assert.match(html, /\/assets\/business-card\.js\?v=20260830card1/, page);
    assert.doesNotMatch(html, /\/assets\/analytics\.js/, `${page} should open without a consent overlay`);

    const vcard = read(`${slug}/blake-huang.vcf`);
    assert.match(vcard, /FN:BLAKE 黃大成/);
    assert.match(vcard, /EMAIL;TYPE=INTERNET:hi@blake\.mba/);
    assert.match(vcard, new RegExp(`URL:https://blake\\.mba/${slug}/`));
  }
});

test("business-card assets include accessible mobile and sharing behavior", () => {
  assert.ok(existsSync(join(projectRoot, "assets/business-card.css")), "business-card CSS should exist");
  assert.ok(existsSync(join(projectRoot, "assets/business-card.js")), "business-card JavaScript should exist");
  const css = read("assets/business-card.css");
  const script = read("assets/business-card.js");
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(script, /navigator\.share/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /aria-live/);
});
