import test from "node:test";
import assert from "node:assert/strict";
import { attribute, htmlFiles, read, tagWithAttribute } from "./helpers/site-files.mjs";

const endpointPattern = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/;
const formPages = [
  "contact/index.html",
  "book/index.html",
  "courses/ai/index.html",
  "courses/career-transition/index.html",
  "courses/entrepreneurship/index.html",
  "courses/software-startup/index.html",
];

const indexedPages = new Map([
  ["https://blake.mba/", "index.html"],
  ["https://blake.mba/ai-action-lab/", "ai-action-lab/index.html"],
  ["https://blake.mba/ai-transform/", "ai-transform/index.html"],
  ["https://blake.mba/book/", "book/index.html"],
  ["https://blake.mba/contact/", "contact/index.html"],
  ["https://blake.mba/courses/", "courses/index.html"],
  ["https://blake.mba/courses/ai/", "courses/ai/index.html"],
  ["https://blake.mba/courses/ai-work-productivity/", "courses/ai-work-productivity/index.html"],
  ["https://blake.mba/courses/career-transition/", "courses/career-transition/index.html"],
  ["https://blake.mba/courses/choice-over-effort/", "courses/choice-over-effort/index.html"],
  ["https://blake.mba/courses/entrepreneurship/", "courses/entrepreneurship/index.html"],
  ["https://blake.mba/courses/software-startup/", "courses/software-startup/index.html"],
  ["https://blake.mba/insights/", "insights/index.html"],
  ["https://blake.mba/articles/ai-career-positioning/", "articles/ai-career-positioning/index.html"],
  ["https://blake.mba/articles/books-grow-old-dreams-dont-rust/", "articles/books-grow-old-dreams-dont-rust/index.html"],
  ["https://blake.mba/articles/execution-driven-team-building/", "articles/execution-driven-team-building/index.html"],
  ["https://blake.mba/articles/first-principles-idiot-index/", "articles/first-principles-idiot-index/index.html"],
  ["https://blake.mba/articles/pattern-recognition-decision-making/", "articles/pattern-recognition-decision-making/index.html"],
  ["https://blake.mba/articles/taiwan-software-startup-ai-window/", "articles/taiwan-software-startup-ai-window/index.html"],
]);

function formBlock(html, page) {
  const form = tagWithAttribute(html, "form", "data-contact-form");
  assert.ok(form, `${page}: missing contact form`);

  const start = html.indexOf(form);
  assert.ok(start >= 0, `${page}: missing contact form start`);

  const end = html.indexOf("</form>", start);
  assert.ok(end >= 0, `${page}: missing contact form end`);

  return html.slice(start, end + "</form>".length);
}

test("all lead forms expose the complete Apps Script contract", () => {
  for (const page of formPages) {
    const html = read(page);
    const form = tagWithAttribute(html, "form", "data-contact-form");
    const block = formBlock(html, page);
    assert.equal(attribute(form, "method"), "post", page);
    assert.match(attribute(form, "data-apps-script-endpoint") ?? "", endpointPattern, page);
    assert.ok(attribute(form, "data-form-name"), page);
    assert.ok(attribute(form, "data-success-message"), page);
    assert.match(block, /data-request-id/, page);
    assert.match(block, /name="_gotcha"/, page);
    assert.match(block, /<iframe[^>]*data-contact-frame[^>]*hidden/, page);
    assert.match(block, /data-form-status/, page);
    assert.match(block, /data-submit-text/, page);
  }
});

test("draft-only book copy is not public", () => {
  const html = read("book/index.html");
  assert.doesNotMatch(html, /電子報命名建議|目前為前端版本|正式名單系統可再串接/);
  assert.match(html, /僅用於本次書籍進度通知/);
});

test("sitemap, canonical and Open Graph URLs use final 200 URLs", () => {
  const sitemapUrls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(sitemapUrls, [...indexedPages.keys()]);
  for (const [url, page] of indexedPages) {
    const html = read(page);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)">/)?.[1];
    assert.equal(canonical, url, page);
    assert.equal(ogUrl, url, page);
  }
});

test("articles identify themselves consistently", () => {
  for (const [url, page] of indexedPages) {
    if (!page.startsWith("articles/") || page === "articles/index.html") continue;
    const html = read(page);
    assert.match(html, /<meta property="og:type" content="article">/, page);
    const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "null");
    assert.equal(json.mainEntityOfPage, url, page);
  }
});

test("internal navigation does not point at soft redirect aliases", () => {
  for (const page of htmlFiles()) {
    if (["about/index.html", "cases/index.html", "results/index.html"].includes(page)) continue;
    assert.doesNotMatch(read(page), /href="\/(?:about|cases|results)(?:[\/#?\"])/, page);
  }
});

test("internal page links use trailing slashes", () => {
  const routePaths = [...indexedPages.keys()]
    .map((url) => new URL(url).pathname)
    .filter((pathname) => pathname !== "/")
    .map((pathname) => pathname.slice(0, -1));
  const sources = [...htmlFiles(), "assets/site.js", "content/articles.json"];
  for (const page of sources) {
    const source = read(page);
    for (const routePath of routePaths) {
      const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.doesNotMatch(source, new RegExp(`${escaped}(?=[#?"'])`), `${page}: ${routePath}`);
    }
  }
});

test("every HTML file uses the shipped favicon", () => {
  for (const page of htmlFiles()) {
    const html = read(page);
    assert.match(html, /<link rel="icon" type="image\/png" href="\/assets\/favicon\.png">/, page);
    assert.doesNotMatch(html, /href="data:,"/, page);
  }
});

test("changed frontend assets use current cache keys", () => {
  for (const page of indexedPages.values()) {
    assert.match(
      read(page),
      /<script src="\/assets\/analytics\.js\?v=20260820flow1"><\/script>/,
      page,
    );
  }

  assert.match(
    read("assets/analytics.js"),
    /\/assets\/analytics\.css\?v=20260820flow1/,
  );
  assert.match(
    read("ai-transform/index.html"),
    /\/assets\/ai-transform\.css\?v=20260820contrast1/,
  );
  assert.match(
    read("courses/choice-over-effort/index.html"),
    /\/assets\/choice-over-effort\.css\?v=20260820contrast1/,
  );
});

test("the hero is the only eager and high-priority image on the home page", () => {
  const html = read("index.html");
  assert.equal((html.match(/loading="eager"/g) ?? []).length, 1);
  assert.equal((html.match(/fetchpriority="high"/g) ?? []).length, 1);
});

test("local raster content images declare intrinsic dimensions", () => {
  for (const page of htmlFiles()) {
    for (const match of read(page).matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const source = attribute(tag, "src") ?? "";
      if (!/^(?:https:\/\/blake\.mba)?\/assets\/.+\.(?:png|jpe?g)$/i.test(source)) continue;
      assert.ok(attribute(tag, "width"), `${page}: ${source}`);
      assert.ok(attribute(tag, "height"), `${page}: ${source}`);
    }
  }
});

test("mobile deck controls keep full touch regions and the consent banner clears the deck", () => {
  const deck = read("assets/paged-sections.css");
  const analytics = read("assets/analytics.css");
  assert.match(deck, /\.page-deck-anchor\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(deck, /\.page-deck-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(analytics, /\.has-page-deck \.analytics-consent\s*\{[^}]*bottom:\s*calc\(/s);
});
