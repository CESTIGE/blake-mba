import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { projectRoot } from "./helpers/site-files.mjs";

import {
  formatSocialDate,
  getSocialStatusCopy,
  LIVE_FEED_URL,
  loadSocialFeed,
  validateFeed,
} from "../assets/social-wall.js";
import * as socialWall from "../assets/social-wall.js";

const fixture = JSON.parse(await readFile(new URL("./fixtures/instagram-media.json", import.meta.url)));

class FakeElement extends EventTarget {
  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.dataset = {};
    this.hidden = false;
    this.paused = true;
    this.muted = true;
    this.textContent = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  async play() {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  }

  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
}

function installFakeDom() {
  const originalDocument = globalThis.document;
  const originalObserver = globalThis.IntersectionObserver;
  globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };
  globalThis.IntersectionObserver = class {
    observe() {}
  };
  return () => {
    globalThis.document = originalDocument;
    globalThis.IntersectionObserver = originalObserver;
  };
}

test("fixture is explicitly labelled and contains posts without Reels", () => {
  assert.equal(fixture.meta.source, "fixture");
  assert.ok(fixture.items.length > 12);
  assert.deepEqual(
    new Set(fixture.items.map((item) => item.mediaType)),
    new Set(["IMAGE", "CAROUSEL_ALBUM"]),
  );
  assert.ok(fixture.items.every((item) => item.permalink.startsWith("https://www.instagram.com/")));
});

test("validateFeed accepts the contract and rejects unsafe or unknown items", () => {
  assert.equal(validateFeed(fixture).items.length, fixture.items.length);
  assert.equal(validateFeed({ ...fixture, items: [{ ...fixture.items[0], mediaType: "VIDEO" }] }), null);
  assert.equal(validateFeed({ ...fixture, items: [{ ...fixture.items[0], mediaType: "AUDIO" }] }), null);
  assert.equal(validateFeed({ ...fixture, items: [{ ...fixture.items[0], permalink: "javascript:alert(1)" }] }), null);
  assert.equal(validateFeed({ ...fixture, items: [{ ...fixture.items[0], permalink: "/assets/not-a-post.jpg" }] }), null);
  assert.equal(validateFeed({ ...fixture, profile: { username: "", displayName: "Huang Blake" } }), null);
  assert.equal(validateFeed({ ...fixture, profile: { username: "williamblakehuang" } }), null);
  assert.equal(validateFeed({ ...fixture, meta: { ...fixture.meta, source: "external" } }), null);
  assert.equal(validateFeed({ ...fixture, meta: { ...fixture.meta, syncedAt: "not-a-date" } }), null);
  assert.equal(validateFeed({ ...fixture, meta: { ...fixture.meta, stale: "false" } }), null);
  assert.equal(validateFeed({ ...fixture, items: [{ ...fixture.items[0], timestamp: "not-a-date" }] }), null);
});

test("validateFeed reserves local assets for fixtures and recursively validates children", () => {
  const liveItem = {
    ...fixture.items[2],
    mediaUrl: "https://cdn.example.test/cover.jpg",
    children: [{
      id: "child-1",
      mediaType: "IMAGE",
      caption: "",
      mediaUrl: "https://cdn.example.test/child.jpg",
      thumbnailUrl: "",
      permalink: "",
      timestamp: "",
      children: [],
    }],
  };
  const liveFeed = { ...fixture, items: [liveItem], meta: { ...fixture.meta, source: "instagram" } };
  const fixtureWithLocalChild = {
    ...fixture,
    items: [{
      ...fixture.items[2],
      children: [{
        ...liveItem.children[0],
        mediaUrl: "/assets/who-is-blake/proof-founder-team.png",
      }],
    }],
  };

  assert.equal(validateFeed(liveFeed)?.items.length, 1);
  assert.equal(validateFeed(fixtureWithLocalChild)?.items[0].children.length, 1);
  assert.equal(validateFeed({ ...liveFeed, items: [{ ...liveItem, mediaUrl: "/assets/local-only.jpg" }] }), null);
  assert.equal(validateFeed({ ...liveFeed, items: [{ ...liveItem, mediaUrl: "https://" }] }), null);
  assert.equal(validateFeed({
    ...liveFeed,
    items: [{ ...liveItem, children: [{ ...liveItem.children[0], mediaUrl: "javascript:alert(1)" }] }],
  }), null);
  assert.equal(validateFeed({
    ...liveFeed,
    items: [{ ...liveItem, children: [{ ...liveItem.children[0], mediaUrl: "/assets/local-child.jpg" }] }],
  }), null);
  assert.equal(validateFeed({
    ...liveFeed,
    items: [{ ...liveItem, children: [{ ...liveItem.children[0], mediaType: "AUDIO" }] }],
  }), null);
});

test("date formatting is stable for Traditional Chinese", () => {
  assert.equal(formatSocialDate("2026-08-30T10:00:00Z", "zh-TW"), "2026年8月30日");
  assert.equal(formatSocialDate("bad-date", "zh-TW"), "");
});

test("social route opens directly on the complete post wall", () => {
  for (const path of ["social/index.html", "assets/social-wall.css"]) {
    assert.equal(existsSync(join(projectRoot, path)), true, `${path} should exist`);
  }
  const html = readFileSync(join(projectRoot, "social/index.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /data-feed-status[^>]*role="status"[^>]*aria-live="polite"/);
  assert.equal((html.match(/data-filter=/g) ?? []).length, 0);
  assert.doesNotMatch(html, /Reels|data-hero|social-hero|data-scroll-hint|把現場|可以被驗證的觀點/);
  assert.match(html, /<main[^>]*>\s*<section class="social-feed"/s);
  assert.match(html, /<h1 id="feed-title">全部貼文<\/h1>/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /social-wall\.css\?v=20260902a/);
  assert.match(html, /social-wall\.js\?v=20260902b/);
});

test("the initial viewport reserves post-wall geometry below the fixed header", () => {
  const html = readFileSync(join(projectRoot, "social/index.html"), "utf8");
  const css = readFileSync(join(projectRoot, "assets/social-wall.css"), "utf8");
  assert.equal((html.match(/data-feed-skeleton/g) ?? []).length, 3);
  assert.match(css, /\.social-card-skeleton/);
  assert.match(css, /\.social-feed\s*\{[^}]*min-height:\s*100svh/s);
  assert.match(css, /\.social-feed\s*\{[^}]*padding:\s*clamp\(/s);
});

test("renderRail starts with one batch and loads remaining posts on demand", () => {
  const restore = installFakeDom();
  try {
    const skeleton = new FakeElement("article");
    const rail = new FakeElement("div");
    rail.children = [skeleton];

    const manyPosts = Array.from({ length: 12 }, (_, index) => ({
      ...fixture.items[index % fixture.items.length],
      id: `post-${index}`,
    }));
    socialWall.renderRail(rail, manyPosts, { batchSize: 6 });

    assert.equal(rail.children.length, 7);
    const card = rail.children[0];
    assert.equal(card.tagName, "A");
    assert.equal(card.href, fixture.items[0].permalink);
    assert.equal(card.target, "_blank");
    assert.equal(card.rel, "noopener noreferrer");
    assert.equal(card.children.some((child) => child.tagName === "A"), false);
    const loadMore = rail.children[6];
    assert.equal(loadMore.tagName, "BUTTON");
    assert.equal(loadMore.textContent, "載入更多貼文");
    loadMore.dispatchEvent(new Event("click"));
    assert.equal(rail.children.length, 12);
    assert.equal(rail.getAttribute("aria-busy"), "false");
  } finally {
    restore();
  }
});

test("social styles include brand, touch, responsive, focus, motion and auto RWD grid contracts", () => {
  const css = readFileSync(join(projectRoot, "assets/social-wall.css"), "utf8");
  assert.match(css, /--social-navy:\s*#07192f/i);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.social-rail\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(/s);
  assert.match(css, /\.social-card:nth-child\(6n \+ 1\)/);
  assert.doesNotMatch(css, /grid-auto-flow:\s*column/);
  assert.doesNotMatch(css, /overflow-x:\s*auto/);
});

test("live feed wins when the Worker returns a valid contract", async () => {
  const requests = [];
  const liveFeed = {
    ...fixture,
    items: fixture.items.map((item, index) => ({
      ...item,
      mediaUrl: `https://cdn.example.test/media-${index}.jpg`,
      thumbnailUrl: "",
    })),
    meta: { ...fixture.meta, source: "instagram" },
  };
  const result = await loadSocialFeed({
    fetchImpl: async (url) => {
      requests.push(url);
      return new Response(JSON.stringify(liveFeed), { status: 200 });
    },
    hostname: "blake.mba",
  });
  assert.equal(result.meta.source, "instagram");
  assert.equal(requests[0], LIVE_FEED_URL);
  assert.equal(LIVE_FEED_URL, "https://blake-instagram-feed.cestige.workers.dev/api/instagram");
});

test("localhost may fall back to the labelled fixture", async () => {
  const requests = [];
  const result = await loadSocialFeed({
    fetchImpl: async (url) => {
      requests.push(url);
      if (url === LIVE_FEED_URL) return new Response("unavailable", { status: 503 });
      return new Response(JSON.stringify(fixture), { status: 200 });
    },
    hostname: "localhost",
  });
  assert.equal(result.meta.source, "fixture");
  assert.equal(requests[1], "/tests/fixtures/instagram-media.json?v=20260902a");
});

test("production never falls back to fixture content", async () => {
  await assert.rejects(
    loadSocialFeed({ fetchImpl: async () => new Response("unavailable", { status: 503 }), hostname: "blake.mba" }),
    /instagram_unavailable/,
  );
});

test("runtime uses safe DOM APIs and contains no hero or video playback path", () => {
  const source = readFileSync(join(projectRoot, "assets/social-wall.js"), "utf8");
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /textContent\s*=/);
  assert.doesNotMatch(source, /renderHero|data-hero|createElement\("video"\)|video\.play\(\)|video\.pause\(\)/);
});

test("error status copy clearly reports that Instagram is unavailable", () => {
  const copy = getSocialStatusCopy("error");
  assert.match(copy.feed, /Instagram/);
});

test("renderSocialWall presents every post without filter controls", () => {
  const restore = installFakeDom();
  try {
    const rail = new FakeElement("div");
    const empty = new FakeElement("div");
    const status = new FakeElement("p");
    const nodes = new Map([
      ["[data-feed-rail]", rail],
      ["[data-empty-state]", empty],
      ["[data-feed-status]", status],
    ]);
    const root = {
      defaultView: { matchMedia: () => ({ matches: false }) },
      querySelector: (selector) => nodes.get(selector),
      querySelectorAll: () => [],
    };
    const liveFeed = { ...fixture, meta: { ...fixture.meta, source: "instagram" } };

    socialWall.renderSocialWall(root, liveFeed);
    assert.equal(status.textContent, `近即時更新｜通常於 15 分鐘內同步｜已顯示 9 / ${fixture.items.length}`);
    assert.equal(rail.hidden, false);
    assert.equal(rail.children.length, 10);
    assert.equal(empty.hidden, true);
  } finally {
    restore();
  }
});

test("initialiseSocialWall preserves the rendered visible count in the status", async () => {
  const restore = installFakeDom();
  const originalLocation = globalThis.location;
  const originalFetch = globalThis.fetch;
  try {
    const status = new FakeElement("p");
    const rail = new FakeElement("div");
    const empty = new FakeElement("div");
    const nodes = new Map([
      ["[data-feed-status]", status],
      ["[data-feed-rail]", rail],
      ["[data-empty-state]", empty],
    ]);
    globalThis.location = { hostname: "localhost" };
    globalThis.fetch = async (url) => {
      if (url === LIVE_FEED_URL) return new Response("unavailable", { status: 503 });
      return new Response(JSON.stringify(fixture), { status: 200 });
    };
    globalThis.document = {
      documentElement: { dataset: {} },
      createElement: (tagName) => new FakeElement(tagName),
      querySelector: (selector) => nodes.get(selector),
      querySelectorAll: () => [],
    };

    await socialWall.initialiseSocialWall();

    assert.equal(status.textContent, `示範資料｜尚未連接 Instagram API｜已顯示 9 / ${fixture.items.length}`);
    assert.equal(globalThis.document.documentElement.dataset.socialStatus, "fixture");
  } finally {
    globalThis.location = originalLocation;
    globalThis.fetch = originalFetch;
    restore();
  }
});
