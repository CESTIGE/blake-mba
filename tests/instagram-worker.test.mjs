import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeInstagramPayload,
  normalizeMediaItem,
  createInstagramHandler,
} from "../workers/instagram-feed/src/index.js";

function memoryCache(initial = null) {
  let stored = initial;
  return {
    async match() { return stored ? new Response(JSON.stringify(stored)) : undefined; },
    async put(_key, response) { stored = await response.json(); },
    read() { return stored; },
  };
}

const env = {
  INSTAGRAM_ACCESS_TOKEN: "secret-token",
  INSTAGRAM_USER_ID: "17841400000000000",
  INSTAGRAM_API_VERSION: "v25.0",
  ALLOWED_ORIGINS: "http://localhost:4173,https://blake.mba",
};

const syncedAt = "2026-08-31T00:00:00.000Z";

test("normalizeMediaItem keeps safe display fields and carousel children", () => {
  const item = normalizeMediaItem({
    id: "carousel-1",
    media_type: "CAROUSEL_ALBUM",
    caption: "政大創客松",
    media_url: "https://cdn.example.test/cover.jpg",
    permalink: "https://www.instagram.com/p/example/",
    timestamp: "2026-08-30T10:00:00+0000",
    children: {
      data: [
        { id: "child-1", media_type: "IMAGE", media_url: "https://cdn.example.test/one.jpg" },
        { id: "child-2", media_type: "AUDIO", media_url: "https://cdn.example.test/two.mp3" },
      ],
    },
  });

  assert.equal(item.mediaType, "CAROUSEL_ALBUM");
  assert.equal(item.children.length, 1);
  assert.equal(item.children[0].mediaType, "IMAGE");
  assert.equal(item.caption, "政大創客松");
});

test("normalizeMediaItem rejects unknown types and non-HTTPS permalinks", () => {
  assert.equal(normalizeMediaItem({ id: "1", media_type: "AUDIO" }), null);
  assert.equal(normalizeMediaItem({
    id: "reel-1",
    media_type: "VIDEO",
    media_url: "https://cdn.example.test/reel.mp4",
    permalink: "https://www.instagram.com/reel/example/",
  }), null);
  assert.equal(normalizeMediaItem({
    id: "2",
    media_type: "IMAGE",
    media_url: "javascript:alert(1)",
    permalink: "http://example.test/post",
  }), null);
});

test("normalizeInstagramPayload drops malformed top-level permalinks but keeps permalink-less children", () => {
  const feed = normalizeInstagramPayload(
    { username: "williamblakehuang", name: "Huang Blake" },
    { data: [
      {
        id: "unsafe-top-level",
        media_type: "IMAGE",
        media_url: "https://cdn.example.test/unsafe.jpg",
        permalink: "http://www.instagram.com/p/unsafe/",
      },
      {
        id: "safe-carousel",
        media_type: "CAROUSEL_ALBUM",
        media_url: "https://cdn.example.test/cover.jpg",
        permalink: "https://www.instagram.com/p/safe/",
        timestamp: "2026-08-30T10:00:00Z",
        children: { data: [{
          id: "child-without-permalink",
          media_type: "IMAGE",
          media_url: "https://cdn.example.test/child.jpg",
        }] },
      },
    ] },
    syncedAt,
  );

  assert.deepEqual(feed.items.map((item) => item.id), ["safe-carousel"]);
  assert.equal(feed.items[0].children.length, 1);
  assert.equal(feed.items[0].children[0].permalink, "");
});

test("normalizeInstagramPayload returns a complete stable contract", () => {
  const feed = normalizeInstagramPayload(
    { username: "williamblakehuang", name: "Huang Blake" },
    { data: [{
      id: "1",
      media_type: "IMAGE",
      media_url: "https://cdn.example.test/one.jpg",
      permalink: "https://www.instagram.com/p/one/",
    }] },
    syncedAt,
  );

  assert.deepEqual(feed.profile, { username: "williamblakehuang", displayName: "Huang Blake" });
  assert.equal(feed.items.length, 1);
  assert.deepEqual(feed.meta, { source: "instagram", syncedAt, stale: false });
});

test("wrangler allows both localhost loopback spellings used by local HTTP QA", async () => {
  const config = JSON.parse(await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../workers/instagram-feed/wrangler.jsonc", import.meta.url), "utf8")));
  const origins = config.vars.ALLOWED_ORIGINS.split(",");
  assert.ok(origins.includes("http://localhost:4173"));
  assert.ok(origins.includes("http://127.0.0.1:4173"));
  assert.ok(origins.includes("http://127.0.0.1:4174"));
  assert.ok(origins.includes("https://blake-mba-cestige.pages.dev"));
});

test("wrangler uses current production compatibility and observability settings", async () => {
  const config = JSON.parse(await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../workers/instagram-feed/wrangler.jsonc", import.meta.url), "utf8")));
  assert.equal(config.compatibility_date, "2026-09-02");
  assert.ok(config.compatibility_flags.includes("nodejs_compat"));
  assert.equal(config.observability.enabled, true);
  assert.equal(config.observability.head_sampling_rate, 1);
});

test("fresh cache avoids Instagram and returns the allowed origin", async () => {
  const cached = {
    profile: { username: "williamblakehuang", displayName: "Huang Blake" },
    items: [],
    meta: { source: "instagram", syncedAt: "2026-08-31T00:00:00.000Z", stale: false },
  };
  let calls = 0;
  const handler = createInstagramHandler({
    fetchImpl: async () => { calls += 1; throw new Error("unexpected"); },
    cache: memoryCache(cached),
    now: () => Date.parse("2026-08-31T00:10:00.000Z"),
  });
  const response = await handler(new Request("https://worker.test/api/instagram", {
    headers: { Origin: "http://localhost:4173" },
  }), env);
  assert.equal(response.status, 200);
  assert.equal(calls, 0);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:4173");
});

test("expired cache follows cursor pagination and returns every non-video post", async () => {
  const cache = memoryCache({
    profile: { username: "old", displayName: "Old" }, items: [],
    meta: { source: "instagram", syncedAt: "2026-08-30T00:00:00.000Z", stale: false },
  });
  const requests = [];
  const handler = createInstagramHandler({
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), authorization: options.headers.Authorization });
      if (!String(url).includes("/media?")) {
        return new Response(JSON.stringify({ username: "williamblakehuang", name: "Huang Blake" }), { status: 200 });
      }
      const cursor = new URL(String(url)).searchParams.get("after");
      return new Response(JSON.stringify(cursor === "page-2"
        ? { data: [{
          id: "older",
          media_type: "CAROUSEL_ALBUM",
          media_url: "https://cdn.example.test/older.jpg",
          permalink: "https://www.instagram.com/p/older/",
        }] }
        : { data: [{
          id: "new",
          media_type: "IMAGE",
          media_url: "https://cdn.example.test/new.jpg",
          permalink: "https://www.instagram.com/p/new/",
        }, {
          id: "reel",
          media_type: "VIDEO",
          media_url: "https://cdn.example.test/reel.mp4",
          permalink: "https://www.instagram.com/reel/new/",
        }], paging: { cursors: { after: "page-2" } } }), { status: 200 });
    },
    cache,
    now: () => Date.parse("2026-08-31T00:20:00.000Z"),
  });
  const response = await handler(new Request("https://worker.test/api/instagram", {
    headers: { Origin: "https://blake.mba" },
  }), env);
  const body = await response.json();
  assert.deepEqual(body.items.map((item) => item.id), ["new", "older"]);
  assert.equal(requests.length, 3);
  const mediaRequests = requests.filter((entry) => entry.url.includes("/media?"));
  assert.equal(new URL(mediaRequests[0].url).searchParams.get("limit"), "100");
  assert.equal(new URL(mediaRequests[1].url).searchParams.get("after"), "page-2");
  assert.ok(requests.every((entry) => entry.authorization === "Bearer secret-token"));
  assert.ok(requests.every((entry) => !entry.url.includes("secret-token")));
});

test("Instagram failure serves stale cache without leaking secrets", async () => {
  const cached = {
    profile: { username: "williamblakehuang", displayName: "Huang Blake" }, items: [],
    meta: { source: "instagram", syncedAt: "2026-08-28T00:00:00.000Z", stale: false },
  };
  const handler = createInstagramHandler({
    fetchImpl: async () => new Response("upstream token secret-token", { status: 500 }),
    cache: memoryCache(cached),
    now: () => Date.parse("2026-08-31T00:20:00.000Z"),
  });
  const response = await handler(new Request("https://worker.test/api/instagram"), env);
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(text).meta.stale, true);
  assert.doesNotMatch(text, /secret-token/);
});

test("handler rejects writes, unknown origins, and missing configuration", async () => {
  const handler = createInstagramHandler({ fetchImpl: fetch, cache: memoryCache(), now: Date.now });
  assert.equal((await handler(new Request("https://worker.test/api/instagram", { method: "POST" }), env)).status, 405);
  assert.equal((await handler(new Request("https://worker.test/api/instagram", {
    headers: { Origin: "https://evil.example" },
  }), env)).status, 403);
  const response = await handler(new Request("https://worker.test/api/instagram"), {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "instagram_not_configured" });
});

test("OPTIONS exposes explicit CORS methods and headers", async () => {
  const handler = createInstagramHandler({ fetchImpl: fetch, cache: memoryCache(), now: Date.now });
  const response = await handler(new Request("https://worker.test/api/instagram", {
    method: "OPTIONS", headers: { Origin: "https://blake.mba" },
  }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
  assert.equal(response.headers.get("Access-Control-Allow-Headers"), "Accept, Content-Type");
});

test("handler returns not found for paths outside the public route", async () => {
  const handler = createInstagramHandler({ fetchImpl: fetch, cache: memoryCache(), now: Date.now });
  const response = await handler(new Request("https://worker.test/other", { headers: { Origin: "https://blake.mba" } }), env);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "not_found" });
  const postResponse = await handler(new Request("https://worker.test/other", { method: "POST" }), env);
  assert.equal(postResponse.status, 404);
  assert.deepEqual(await postResponse.json(), { error: "not_found" });
});

test("cache read failures return an unavailable response instead of escaping", async () => {
  const handler = createInstagramHandler({
    fetchImpl: async () => new Response("upstream down", { status: 500 }),
    cache: { async match() { throw new Error("cache broken"); } },
    now: Date.now,
  });
  const response = await handler(new Request("https://worker.test/api/instagram"), env);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "instagram_unavailable" });
});

test("cache older than seven days is not served as stale fallback", async () => {
  const cache = memoryCache({
    profile: { username: "old", displayName: "Old" }, items: [],
    meta: { source: "instagram", syncedAt: "2026-08-20T00:00:00.000Z", stale: false },
  });
  const handler = createInstagramHandler({
    fetchImpl: async () => new Response("upstream down", { status: 500 }),
    cache,
    now: () => Date.parse("2026-08-31T00:00:00.000Z"),
  });
  const response = await handler(new Request("https://worker.test/api/instagram"), env);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "instagram_unavailable" });
});
