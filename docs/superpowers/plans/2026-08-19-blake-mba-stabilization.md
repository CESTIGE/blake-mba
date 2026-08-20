# BLAKE.MBA Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復五個無法送出的通知表單，統一 GitHub Pages URL／SEO 訊號，解決手機固定控制項衝突，並降低首頁非必要 eager 圖片負載。

**Architecture:** 保留純靜態 GitHub Pages 架構與現有 Apps Script endpoint。以一個逐表單初始化的前端控制器處理聯絡與一次性通知表單，並以零依賴 Node 靜態測試鎖定 HTML、CSS、sitemap、JSON-LD 與圖片契約；瀏覽器回歸只連本機伺服器，不向正式 endpoint 送資料。

**Tech Stack:** HTML5、CSS、原生 JavaScript、GitHub Pages、Node.js 24 內建 `node:test`、Python 3 靜態伺服器、Codex in-app browser。

**Spec:** `docs/superpowers/specs/2026-08-19-blake-mba-stabilization-design.md`

## Global Constraints

- 書籍與課程名單只用於一次性開課或進度通知，不作持續行銷電子報訂閱。
- 不修改或重新部署 Apps Script 後端，不向正式 endpoint 送測試資料。
- 不新增 npm runtime／dev dependency；測試只用 Node 24 內建模組。
- 不產生 AVIF／WebP 或 `srcset`／`sizes`，不修改 CDN、DNS、安全標頭或 GitHub Pages 設定。
- 不虛構課程價格、日期、名額、客戶成果、`dateModified` 或 publisher。
- 不推送、不建立 PR、不部署。

---

### Task 1: 建立會抓到現有缺陷的零依賴測試

**Files:**
- Create: `package.json`
- Create: `tests/helpers/site-files.mjs`
- Create: `tests/site-integrity.test.mjs`

**Interfaces:**
- Produces: `read(relativePath) -> string`、`htmlFiles() -> string[]`、`tagWithAttribute(source, tagName, attributeName) -> string`、`attribute(tag, name) -> string | null`。
- Produces: `npm test` 作為後續所有任務的統一驗證入口。

- [ ] **Step 1: 建立 package test 指令**

```json
{
  "name": "blake-mba-static-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  }
}
```

- [ ] **Step 2: 建立靜態檔案測試 helper**

```js
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

export function htmlFiles(directory = projectRoot) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...htmlFiles(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(relative(projectRoot, absolute));
    }
  }
  return results.sort();
}

export function tagWithAttribute(source, tagName, attributeName) {
  const expression = new RegExp(
    `<${tagName}\\b(?=[^>]*\\b${attributeName}(?:=|\\s|>))[^>]*>`,
    "i",
  );
  return source.match(expression)?.[0] ?? "";
}

export function attribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] : null;
}
```

- [ ] **Step 3: 建立表單、SEO、圖片與手機 CSS 契約測試**

`tests/site-integrity.test.mjs` 必須包含下列真實行為斷言：

```js
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
  ["https://blake.mba/courses/career-transition/", "courses/career-transition/index.html"],
  ["https://blake.mba/courses/choice-over-effort/", "courses/choice-over-effort/index.html"],
  ["https://blake.mba/courses/entrepreneurship/", "courses/entrepreneurship/index.html"],
  ["https://blake.mba/courses/software-startup/", "courses/software-startup/index.html"],
  ["https://blake.mba/insights/", "insights/index.html"],
  ["https://blake.mba/articles/ai-career-positioning/", "articles/ai-career-positioning/index.html"],
  ["https://blake.mba/articles/execution-driven-team-building/", "articles/execution-driven-team-building/index.html"],
  ["https://blake.mba/articles/first-principles-idiot-index/", "articles/first-principles-idiot-index/index.html"],
  ["https://blake.mba/articles/pattern-recognition-decision-making/", "articles/pattern-recognition-decision-making/index.html"],
  ["https://blake.mba/articles/taiwan-software-startup-ai-window/", "articles/taiwan-software-startup-ai-window/index.html"],
]);

test("all lead forms expose the complete Apps Script contract", () => {
  for (const page of formPages) {
    const html = read(page);
    const form = tagWithAttribute(html, "form", "data-contact-form");
    assert.equal(attribute(form, "method"), "post", page);
    assert.match(attribute(form, "data-apps-script-endpoint") ?? "", endpointPattern, page);
    assert.ok(attribute(form, "data-form-name"), page);
    assert.ok(attribute(form, "data-success-message"), page);
    assert.match(html, /data-request-id/, page);
    assert.match(html, /name="_gotcha"/, page);
    assert.match(html, /<iframe[^>]*data-contact-frame[^>]*hidden/, page);
    assert.match(html, /data-form-status/, page);
    assert.match(html, /data-submit-text/, page);
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

test("mobile deck controls and analytics UI reserve separate touch regions", () => {
  const deck = read("assets/paged-sections.css");
  const analytics = read("assets/analytics.css");
  assert.match(deck, /\.page-deck-anchor\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(deck, /\.page-deck-button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
  assert.match(analytics, /\.has-page-deck \.analytics-settings\s*\{[^}]*bottom:\s*calc\(/s);
  assert.match(analytics, /\.has-page-deck \.analytics-consent\s*\{[^}]*bottom:\s*calc\(/s);
});
```

- [ ] **Step 4: 執行測試並確認 RED**

Run: `npm test`

Expected: 測試程序成功啟動，但表單 contract、書籍工作稿、尾斜線 URL、文章 `og:type`、favicon、首頁 eager 數量、raster dimensions 與手機 CSS 斷言失敗。失敗必須對應現有缺陷，而不是語法或 helper 錯誤。

- [ ] **Step 5: 提交 failing tests**

```bash
git add package.json tests/helpers/site-files.mjs tests/site-integrity.test.mjs
git commit -m "test: capture site stabilization regressions"
```

---

### Task 2: 修復多表單送出契約與公開文案

**Files:**
- Modify: `assets/site.js`
- Modify: `contact/index.html`
- Modify: `book/index.html`
- Modify: `courses/ai/index.html`
- Modify: `courses/career-transition/index.html`
- Modify: `courses/entrepreneurship/index.html`
- Modify: `courses/software-startup/index.html`
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**
- Consumes: `data-contact-form` contract from Task 1。
- Produces: `initializeContactForm(form)`；每個表單使用 `data-form-name`、`data-success-message` 與既有 Apps Script postMessage protocol。

- [ ] **Step 1: 確認表單測試目前失敗**

Run: `node --test --test-name-pattern="lead forms|draft-only" tests/site-integrity.test.mjs`

Expected: FAIL，指出五個通知表單缺少 POST contract，且書籍頁含公開工作稿。

- [ ] **Step 2: 將單一表單 handler 改為逐表單初始化**

在 `assets/site.js` 以函式封裝既有邏輯：

```js
const contactForms = document.querySelectorAll("[data-contact-form]");

function initializeContactForm(contactForm) {
  const contactStatus = contactForm.querySelector("[data-form-status]");
  if (!contactStatus) return;

  const formInquirySelect = contactForm.querySelector("[data-inquiry-select]");
  const submitButton = contactForm.querySelector('[type="submit"]');
  const submitText = submitButton?.querySelector("[data-submit-text]");
  const contactFrame = contactForm.querySelector("[data-contact-frame]");
  const requestIdField = contactForm.querySelector("[data-request-id]");
  const defaultSubmitText = submitText?.textContent || "送出需求";
  const successMessage =
    contactForm.dataset.successMessage ||
    "資料已送出，謝謝你的來訊。我收到後會儘快回覆。";
  const formName = contactForm.dataset.formName || "contact";
  let pendingRequestId = "";
  let submissionTimeout = 0;

  // 保留既有 setContactStatus、finishSubmission、message 與 submit 驗證，
  // 所有狀態只引用此 closure 的 contactForm、contactFrame 與 pendingRequestId。
}

contactForms.forEach(initializeContactForm);
```

成功事件改為：

```js
window.blakeAnalytics?.trackEvent("generate_lead", {
  form_name: formName,
  inquiry_type:
    formInquirySelect?.value ||
    contactForm.querySelector('[name="需求類型"]')?.value ||
    "unspecified",
  lead_source:
    contactForm.querySelector('[name="名單來源"]')?.value || "unspecified",
});
setContactStatus(
  message.notificationSent === false
    ? "資料已安全保存；Email 通知可能稍有延遲。"
    : successMessage,
  "success",
);
```

- [ ] **Step 3: 為六個表單補齊一致 contract**

每個表單 open tag 使用同一 endpoint，並設定頁面專屬 `data-form-name` 與成功訊息：

```html
<form
  class="contact-form"
  method="post"
  data-contact-form
  data-form-name="course_ai_waitlist"
  data-success-message="已完成 AI 實戰課程通知登記；時程確認後會透過 Email 通知你。"
  data-apps-script-endpoint="https://script.google.com/macros/s/AKfycbxDVMkBr0zjyzLYfSOkUVncvGIwKxjv9mnEXjcvm7YrfURPaqYsz5awKy1JVtCkBaJmIw/exec"
>
```

每個表單加入：

```html
<input type="hidden" name="需求類型" value="個人課程詢問">
<input type="hidden" name="送單識別碼" value="" data-request-id>
<div class="contact-honeypot" aria-hidden="true" hidden>
  <label for="FORM-website">請勿填寫此欄位</label>
  <input id="FORM-website" name="_gotcha" tabindex="-1" autocomplete="off">
</div>
<iframe class="contact-submit-frame" name="FORM-submission" title="表單送出結果" data-contact-frame hidden></iframe>
```

將通知表單的 Email 欄位 name 改為 `聯絡方式`，原本第三欄 name 改為 `目前遇到的問題`；button 文字以 `<span data-submit-text>` 包住。六個 `data-form-name` 必須為：

- `contact`
- `book_waitlist`
- `course_ai_waitlist`
- `course_career_transition_waitlist`
- `course_entrepreneurship_waitlist`
- `course_software_startup_waitlist`

- [ ] **Step 4: 清理書籍與通知文案**

刪除 `電子報命名建議` value cloud 與「目前為前端版本」說明。書籍表單 note 改為：

```html
<p class="form-note">你的資料僅用於本次書籍進度通知，不會加入持續行銷電子報；如不需要後續通知，可直接回覆告知。</p>
```

四個課程表單 note 依課名改為同義的一次性通知說明，不再宣稱會開啟 Email 草稿。書籍「目前最想解決的職涯問題」移除 `required`。

- [ ] **Step 5: 執行表單測試並確認 GREEN**

Run: `node --test --test-name-pattern="lead forms|draft-only" tests/site-integrity.test.mjs`

Expected: PASS。

- [ ] **Step 6: 執行全部測試並確認剩餘失敗只屬於後續任務**

Run: `npm test`

Expected: 表單與書籍測試 PASS；SEO、favicon、圖片與手機 CSS 測試仍 FAIL。

- [ ] **Step 7: 提交表單修復**

```bash
git add assets/site.js contact/index.html book/index.html courses/ai/index.html courses/career-transition/index.html courses/entrepreneurship/index.html courses/software-startup/index.html
git commit -m "fix: restore course and book lead forms"
```

---

### Task 3: 統一尾斜線 URL、SEO 與 favicon

**Files:**
- Modify: `sitemap.xml`
- Modify: `index.html`
- Modify: `404.html`
- Modify: all `*/index.html` files
- Modify: `assets/site.js`
- Modify: `content/articles.json`
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**
- Consumes: `indexedPages` URL map from Task 1。
- Produces: sitemap、canonical、`og:url`、Article `mainEntityOfPage` 與站內頁面 link 使用相同 final URL。

- [ ] **Step 1: 確認 SEO 與 favicon 測試目前失敗**

Run: `node --test --test-name-pattern="sitemap|articles identify|soft redirect|favicon" tests/site-integrity.test.mjs`

Expected: FAIL，指出 sitemap/canonical 無尾斜線、文章缺 `og:type`、仍有 soft alias 內鏈與 favicon 缺漏。

- [ ] **Step 2: 更新 sitemap 與可索引頁 head**

`sitemap.xml` 依 Task 1 `indexedPages` 的順序使用 final URL。每個可索引頁同步修改：

```html
<link rel="canonical" href="https://blake.mba/courses/">
<meta property="og:url" content="https://blake.mba/courses/">
```

五篇文章另加入：

```html
<meta property="og:type" content="article">
```

並將 JSON-LD 改為：

```json
"mainEntityOfPage": "https://blake.mba/articles/ARTICLE-SLUG/"
```

- [ ] **Step 3: 更新所有站內頁面連結來源**

HTML、`assets/site.js` 與 `content/articles.json` 的頁面型路徑統一為尾斜線；assets、PDF、mailto、外部 URL 與首頁 `/` 不變。query/hash 格式例如：

```text
/courses/
/courses/#course-list
/contact/?inquiry=ai-advisory#contact-form
/articles/ai-career-positioning/
```

把正式內容中的 alias 連結改為：

```text
/about      -> /#story
/results    -> /#proof
/cases      -> /#proof
/articles   -> /insights/
/resources  -> /insights/
```

- [ ] **Step 4: 統一 favicon**

每份 HTML 的 `<head>` 加入：

```html
<link rel="icon" type="image/png" href="/assets/favicon.png">
```

移除首頁與 choice-over-effort 的 `<link rel="icon" href="data:,">`。

- [ ] **Step 5: 讓五個 redirect stub 的 fallback 一致**

`about`、`cases`、`results` 的 meta refresh、JavaScript 與 fallback anchor 對應 `/#story` 或 `/#proof`；`articles`、`resources` 統一到 `/insights/`。保留 `noindex`。

- [ ] **Step 6: 執行 SEO 測試並確認 GREEN**

Run: `node --test --test-name-pattern="sitemap|articles identify|soft redirect|favicon" tests/site-integrity.test.mjs`

Expected: PASS。

- [ ] **Step 7: 執行全部測試並確認只剩圖片與手機 CSS 失敗**

Run: `npm test`

Expected: 表單與 SEO 測試 PASS；圖片與手機 CSS 測試仍 FAIL。

- [ ] **Step 8: 提交 URL 與 metadata 修正**

```bash
git add sitemap.xml index.html 404.html assets/site.js content/articles.json about cases results articles resources ai-action-lab ai-transform book contact courses insights
git commit -m "fix: align GitHub Pages URLs and metadata"
```

---

### Task 4: 修復手機固定 UI 與首頁圖片載入

**Files:**
- Modify: `assets/analytics.css`
- Modify: `assets/analytics.js`
- Modify: `assets/paged-sections.css`
- Modify: `index.html`
- Modify: `ai-transform/index.html`
- Modify: `articles/ai-career-positioning/index.html`
- Modify: `articles/execution-driven-team-building/index.html`
- Modify: `articles/pattern-recognition-decision-making/index.html`
- Modify: `articles/taiwan-software-startup-ai-window/index.html`
- Modify: `courses/ai/index.html`
- Modify: `courses/entrepreneurship/index.html`
- Modify: `courses/index.html`
- Modify: `courses/software-startup/index.html`
- Modify: `insights/index.html`
- Modify: `ai-action-lab/index.html`, `book/index.html`, `contact/index.html`, `courses/career-transition/index.html`, `courses/choice-over-effort/index.html` for `paged-sections.css` query versions
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**
- Consumes: CSS selectors asserted by Task 1。
- Produces: 44 × 44 px page-deck hit areas；`.has-page-deck` analytics avoidance rules；首頁單一 eager/high image。

- [ ] **Step 1: 確認圖片與手機 CSS 測試目前失敗**

Run: `node --test --test-name-pattern="hero is the only|raster content|mobile deck" tests/site-integrity.test.mjs`

Expected: FAIL，指出首頁八張 eager 圖、缺尺寸 raster 圖與 20–30 px 手機控制。

- [ ] **Step 2: 擴大手機段落控制並保留 dot 視覺尺寸**

在 `assets/paged-sections.css` 的 mobile media query 使用：

```css
.page-deck-anchor {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
}

.page-deck-button {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
}
```

`.page-deck-dot` 的 6 px 視覺尺寸不變。調整 track gap／status 後仍須讓 360 px viewport 可水平捲動所有 anchors。

- [ ] **Step 3: 讓 analytics UI 避開 mobile page deck**

在 `assets/analytics.css` 的 mobile media query 加入：

```css
.has-page-deck .analytics-settings {
  bottom: calc(72px + env(safe-area-inset-bottom));
}

.has-page-deck .analytics-consent {
  bottom: calc(72px + env(safe-area-inset-bottom));
}
```

在 `assets/paged-sections.css` 將 mobile body padding 增加到足以容納 44 px 控制列、上下 padding 與 safe area，至少為：

```css
.has-page-deck body {
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}
```

- [ ] **Step 4: 將首頁非首屏圖片改為 lazy/async**

`index.html` 只保留 Hero 的 eager／sync／high。其他七張目前 eager 圖改為：

```html
loading="lazy"
decoding="async"
```

- [ ] **Step 5: 依自然尺寸補齊 local raster 圖片 width/height**

使用 `sips -g pixelWidth -g pixelHeight FILE` 讀取檔案尺寸，不改寫圖片。對測試列出的每個 local PNG/JPEG `<img>` 加入對應整數 width／height；不得猜測尺寸，也不得修改外部圖片 URL。

- [ ] **Step 6: 更新 CSS query version**

將動態 analytics CSS 版本從 `20260804gtm1` 改為 `20260819gtm2`。將所有 HTML 的 paged-sections CSS 版本從 `20260801deck1` 改為 `20260819deck2`，JS 版本保持不變，因本任務未修改 `paged-sections.js`。

- [ ] **Step 7: 執行 targeted 與完整測試**

Run: `node --test --test-name-pattern="hero is the only|raster content|mobile deck" tests/site-integrity.test.mjs`

Expected: PASS。

Run: `npm test`

Expected: 全部 PASS，沒有 warning 或 skipped test。

- [ ] **Step 8: 提交手機與圖片修正**

```bash
git add assets/analytics.css assets/analytics.js assets/paged-sections.css index.html ai-action-lab ai-transform articles book courses insights
git commit -m "perf: improve mobile controls and image loading"
```

---

### Task 5: 本機瀏覽器回歸與交付驗證

**Files:**
- Modify only if a regression is reproduced: the smallest file responsible for that regression
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**
- Consumes: `npm test` and the completed local static site。
- Produces: desktop/mobile browser evidence and a clean, reviewable local feature branch。

- [ ] **Step 1: 執行全套靜態測試與 Git hygiene**

```bash
npm test
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: tests PASS；diff check 無輸出；工作樹乾淨。

- [ ] **Step 2: 啟動不會寫入 repo 的本機伺服器**

Run: `python3 -m http.server 8765 --bind 127.0.0.1`

Expected: server 在 `http://127.0.0.1:8765/` 提供目前分支內容。

- [ ] **Step 3: 桌機 smoke test**

用 Codex in-app browser 開啟本機站，檢查 `/`、`/courses/`、`/insights/`、一篇 article、`/ai-transform/`、`/book/`、`/contact/`：

- HTTP 內容可見且沒有 console error。
- 主要導覽不經 slashless URL。
- 表單 required 與 Email validation 可用。
- 不按 submit，不向正式 Apps Script 送資料。

- [ ] **Step 4: 手機 responsive test**

分別設為 360 × 800、390 × 844、430 × 932：

- `document.documentElement.scrollWidth <= innerWidth`。
- `.page-deck-anchor` 與 `.page-deck-button` bounding box 皆至少 44 × 44。
- `.analytics-settings`／`.analytics-consent` 與 `.page-deck-nav` rectangles 不相交。
- 點擊第一、中間、最後 anchor 與上一段／下一段，hash、aria-current 與捲動位置正確。
- 書籍頁不顯示內部工作稿。

使用不同 localhost port 取得新的 origin 來測未選擇、允許分析、僅必要功能狀態；不讀取或刪除使用者現有 browser storage。

- [ ] **Step 5: 圖片與載入 smoke test**

- 首頁 DOM 僅一張 `loading="eager"` 且僅一張 `fetchpriority="high"`。
- 捲動首頁並展開四張身分卡，所有圖片載入成功且無 layout overflow。
- 主要頁面 local raster 圖的 `naturalWidth`、`naturalHeight` 都大於 0。

- [ ] **Step 6: 若發現回歸，重現後先新增或收緊失敗測試**

Run: `npm test`

Expected: 新測試因該回歸 FAIL；只修改根因檔案後重新執行並 PASS。不得在沒有失敗測試的情況下直接修正。

- [ ] **Step 7: 最終驗證與本機交付**

```bash
npm test
git diff --check origin/main...HEAD
git status --short --branch
git log --oneline --decorate origin/main..HEAD
```

Expected: tests PASS；diff check 無輸出；工作樹乾淨；log 只包含設計、測試、表單、SEO、UI／效能與必要回歸修正 commits。

- [ ] **Step 8: 停止本機伺服器並回復瀏覽器 viewport**

停止 `python3 -m http.server` process，將 in-app browser 回到預設 viewport。保留本機分支，不推送、不部署。
