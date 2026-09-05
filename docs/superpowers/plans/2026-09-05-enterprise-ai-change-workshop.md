# BLAKE.MBA《AI 變革推動實戰班》網站實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 BLAKE.MBA 新增可供上市櫃及中大型企業 HR 評估與詢問的六小時《AI 變革推動實戰班》頁面，並完成課程總覽、企業顧問頁及既有聯絡表單的站內串接。

**Architecture:** 延續現有純靜態 HTML、CSS 與原生 JavaScript 架構，不新增框架或後端。新課程頁擁有獨立樣式檔，內容、證據連結與 CTA 直接寫入 HTML；站內轉換沿用既有 `/contact/` 表單，只新增 `enterprise-training` 查詢參數到「企業內訓」選項的映射。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js `node:test`、既有 Google Apps Script 聯絡表單

**Spec:** `docs/superpowers/specs/2026-09-05-enterprise-ai-change-workshop-design.md`

## Global Constraints

- 課名固定為《AI 變革推動實戰班》，副標固定為「HR 帶隊 × 主管共識 × 種子員工實作」。
- 教學時間固定為六個單元共 360 分鐘；休息與午餐另行安排。
- 參訓角色固定為 HR、部門主管及種子員工，建議班型為 18 至 30 人。
- 網站須完整呈現七項企業 AI 試行工具包成果，但不得宣稱已完成正式系統、法遵審查或全公司導入。
- 不虛構上市櫃客戶、HR 資格、績效、價格、合作關係或補助條件。
- 不建立新後端、不修改 Google Apps Script 欄位契約、不增加報名或付款功能。
- 主要 CTA 固定使用 `/contact/?inquiry=enterprise-training#contact-form` 並預選「企業內訓」。
- 新頁必須使用繁體中文、尾斜線 canonical URL、既有 favicon、分析腳本、桌機與行動導覽。
- 正式發布前必須另經使用者核准；完成本計畫不等同授權合併或發布。

---

## File Map

- `courses/enterprise-ai-change/index.html`：新課程銷售頁的內容、metadata、結構化資料、證據與 CTA。
- `assets/enterprise-ai-change.css`：新頁專用的版面、流程、課綱、成果、角色與響應式樣式。
- `courses/index.html`：課程總覽新增第六堂企業 AI 課程與數量文案。
- `ai-transform/index.html`：顧問頁新增六小時工作坊入口。
- `assets/site.js`：把 `enterprise-training` 查詢參數映射為既有「企業內訓」選項。
- `sitemap.xml`：新增正式課程 URL。
- `tests/enterprise-ai-change.test.mjs`：驗證課程內容、時間、成果、CTA、證據、安全文案與站內入口。
- `tests/site-integrity.test.mjs`：將新頁加入 canonical、Open Graph、favicon、分析腳本與尾斜線的全站契約。

### Task 1: 建立新課程頁的失敗測試契約

**Files:**
- Create: `tests/enterprise-ai-change.test.mjs`
- Modify: `tests/site-integrity.test.mjs:15-33`
- Test: `tests/enterprise-ai-change.test.mjs`
- Test: `tests/site-integrity.test.mjs`

**Interfaces:**
- Consumes: `tests/helpers/site-files.mjs` 的 `read()`；既有 `indexedPages` 網址契約。
- Produces: 新頁必須通過的內容標記、CTA、metadata、結構化資料與站內入口契約。

- [ ] **Step 1: 寫入課程頁內容與轉換契約測試**

建立 `tests/enterprise-ai-change.test.mjs`：

```js
import test from "node:test";
import assert from "node:assert/strict";
import { read } from "./helpers/site-files.mjs";

const page = "courses/enterprise-ai-change/index.html";

test("enterprise AI workshop exposes the approved promise and audience", () => {
  const html = read(page);
  assert.match(html, /AI 變革推動實戰班/);
  assert.match(html, /HR 帶隊 × 主管共識 × 種子員工實作/);
  assert.match(html, /六小時完成企業第一個可試行的 AI 工作流程/);
  for (const role of ["HR", "部門主管", "種子員工"]) assert.match(html, new RegExp(role));
});

test("enterprise AI workshop contains six modules totaling 360 minutes", () => {
  const html = read(page);
  const minutes = [...html.matchAll(/class="workshop-module" data-minutes="(\d+)"/g)]
    .map((match) => Number(match[1]));
  assert.deepEqual(minutes, [40, 65, 75, 90, 45, 45]);
  assert.equal(minutes.reduce((total, value) => total + value, 0), 360);
});

test("enterprise AI workshop contains all seven deliverables", () => {
  const html = read(page);
  for (const output of [
    "AI 導入障礙診斷表",
    "優先流程選題表",
    "AI 工作流程畫布",
    "可操作流程雛形",
    "共用指令與查證範本",
    "AI 使用規範與風險檢查表",
    "30 天部門試行計畫",
  ]) assert.match(html, new RegExp(output));
});

test("enterprise AI workshop routes consultation through the existing enterprise form", () => {
  const html = read(page);
  const cta = /href="\/contact\/\?inquiry=enterprise-training#contact-form"/g;
  assert.ok((html.match(cta) ?? []).length >= 2);
  assert.doesNotMatch(html, /<form\b/i);
});

test("enterprise AI workshop states the sensitive-data and delivery boundaries", () => {
  const html = read(page);
  assert.match(html, /去識別化/);
  assert.match(html, /個資/);
  assert.match(html, /營業秘密/);
  assert.match(html, /不是法律意見|不構成法律意見/);
  assert.match(html, /不是正式系統|不等於正式系統/);
});

test("course and advisory indexes link to the enterprise workshop", () => {
  for (const source of ["courses/index.html", "ai-transform/index.html"]) {
    assert.match(read(source), /href="\/courses\/enterprise-ai-change\/"/, source);
  }
});
```

- [ ] **Step 2: 把新 URL 加入全站索引契約**

在 `tests/site-integrity.test.mjs` 的 `indexedPages` 中，緊接 `/courses/choice-over-effort/` 加入：

```js
["https://blake.mba/courses/enterprise-ai-change/", "courses/enterprise-ai-change/index.html"],
```

- [ ] **Step 3: 執行測試並確認因新頁不存在而失敗**

Run: `node --test tests/enterprise-ai-change.test.mjs tests/site-integrity.test.mjs`

Expected: FAIL，主要錯誤是無法讀取 `courses/enterprise-ai-change/index.html`，並顯示 sitemap 尚缺少新 URL。

- [ ] **Step 4: 提交測試契約**

```bash
git add tests/enterprise-ai-change.test.mjs tests/site-integrity.test.mjs
git diff --cached --check
git commit -m "test: define enterprise AI workshop page contract"
```

### Task 2: 建立完整課程頁與專用視覺系統

**Files:**
- Create: `courses/enterprise-ai-change/index.html`
- Create: `assets/enterprise-ai-change.css`
- Test: `tests/enterprise-ai-change.test.mjs`

**Interfaces:**
- Consumes: `assets/styles.css` 的網站導覽、按鈕、容器及頁尾樣式；既有 BLAKE 照片與公開證據 URL。
- Produces: `/courses/enterprise-ai-change/` 靜態頁及 `enterprise-ai-change.css?v=20260905a1` 樣式入口。

- [ ] **Step 1: 建立最小 HTML 外殼與 metadata**

新增 `courses/enterprise-ai-change/index.html`，head 至少包含：

```html
<script src="/assets/analytics.js?v=20260820flow1"></script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<title>AI 變革推動實戰班｜企業 HR、主管與種子員工共創</title>
<meta name="description" content="HR、主管與種子員工共同參與的六小時企業 AI 工作坊，完成一項可試行的 AI 工作流程與 30 天部門計畫。">
<link rel="canonical" href="https://blake.mba/courses/enterprise-ai-change/">
<meta property="og:title" content="AI 變革推動實戰班｜BLAKE.MBA">
<meta property="og:description" content="六小時完成企業第一個可試行的 AI 工作流程。">
<meta property="og:url" content="https://blake.mba/courses/enterprise-ai-change/">
<meta property="og:image" content="https://blake.mba/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://blake.mba/og.png">
<link rel="stylesheet" href="/assets/styles.css?v=20260815nav4">
<link rel="stylesheet" href="/assets/enterprise-ai-change.css?v=20260905a1">
```

Body 沿用既有 `site-header`、`site-nav`、`skip-link`、`footer` 及 `/assets/site.js?v=20260819finder2`。

- [ ] **Step 2: 寫入九個已核准內容區塊**

依 spec 第 8 節依序建立具唯一 `id` 與 `aria-labelledby` 的區塊：

```html
<main id="main" class="enterprise-workshop-page">
  <section class="workshop-hero" aria-labelledby="workshop-title">…</section>
  <section id="barriers" aria-labelledby="barriers-title">…</section>
  <section id="method" aria-labelledby="method-title">…</section>
  <section id="curriculum" aria-labelledby="curriculum-title">…</section>
  <section id="deliverables" aria-labelledby="deliverables-title">…</section>
  <section id="fit" aria-labelledby="fit-title">…</section>
  <section id="instructor" aria-labelledby="instructor-title">…</section>
  <section id="arrangement" aria-labelledby="arrangement-title">…</section>
  <section id="consultation" aria-labelledby="consultation-title">…</section>
</main>
```

首屏放入核准主標、副標、四個事實標籤與兩個 CTA。課綱六卡依序使用 `class="workshop-module" data-minutes="40"`、`65`、`75`、`90`、`45`、`45`，每張卡含時間、問題、活動及產出。頁尾 CTA 與首屏 CTA 都使用 `/contact/?inquiry=enterprise-training#contact-form`。

- [ ] **Step 3: 加入可查證的講師證據與保守映射**

講師區只使用下列既有來源：

```html
<a href="https://www.liteonplus.com/zh-tw/news-stories/connecting-the-dreams-of-all-things" target="_blank" rel="noopener noreferrer">TutorABC 管理與創業歷程</a>
<a href="https://money.udn.com/money/story/5635/9369958" target="_blank" rel="noopener noreferrer">metabiz 企業 AI 與產品經驗</a>
<a href="https://dbc.gov.taipei/Consultant?categoryId=3&amp;page=2" target="_blank" rel="noopener noreferrer">台北數位企業發展中心顧問名錄</a>
<a href="https://culture.finearts.fju.edu.tw/archives/2525" target="_blank" rel="noopener noreferrer">輔仁大學 AI 課程紀錄</a>
```

可使用 `/assets/who-is-blake/blake-hero.jpg` 或 `/assets/who-is-blake/proof-teaching.png`，每張 raster 圖片必須保留既有實際 `width`、`height`、具體 `alt`、`loading="lazy"` 與 `decoding="async"`。

- [ ] **Step 4: 加入 Course 結構化資料**

在頁面 head 放入下列 JSON-LD，不加入價格、評分或未確認場次：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "AI 變革推動實戰班",
  "description": "HR、主管與種子員工共同參與的六小時企業 AI 工作坊，完成可試行的 AI 工作流程與 30 天部門計畫。",
  "provider": {
    "@type": "Person",
    "name": "William Blake Huang 黃大成",
    "url": "https://blake.mba/"
  },
  "url": "https://blake.mba/courses/enterprise-ai-change/",
  "inLanguage": "zh-Hant"
}
</script>
```

- [ ] **Step 5: 建立課程專用 CSS**

新增 `assets/enterprise-ai-change.css`，以 scoped selector `.enterprise-workshop-page` 為根。定義：

```css
.enterprise-workshop-page {
  --workshop-ink: #10253f;
  --workshop-paper: #f4efe5;
  --workshop-orange: #e8682a;
  --workshop-blue: #dce9f1;
  color: var(--workshop-ink);
  background: var(--workshop-paper);
}

.workshop-hero { min-height: min(780px, calc(100svh - 72px)); }
.workshop-method-flow { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.workshop-modules { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.workshop-deliverables { counter-reset: deliverable; }

@media (max-width: 760px) {
  .workshop-method-flow,
  .workshop-modules { grid-template-columns: 1fr; }
  .workshop-hero { min-height: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .enterprise-workshop-page * { scroll-behavior: auto !important; }
}
```

補齊焦點樣式、最小 44px 操作區、文字行長、流程連線、適合／不適合對照及講師證據版面。不得以 `outline: none` 移除焦點，也不得用 CSS 製作具象 AI 人物插圖。

- [ ] **Step 6: 執行新頁測試並修正至只剩站內入口與 sitemap 失敗**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: 課程頁本身的承諾、單元、成果、CTA 與安全邊界測試 PASS；`courses/index.html` 與 `ai-transform/index.html` 的入口測試仍 FAIL。

- [ ] **Step 7: 提交完整課程頁**

```bash
git add courses/enterprise-ai-change/index.html assets/enterprise-ai-change.css
git diff --cached --check
git commit -m "feat: add enterprise AI change workshop page"
```

### Task 3: 串接既有企業內訓聯絡表單

**Files:**
- Modify: `assets/site.js:145-153`
- Modify: `tests/enterprise-ai-change.test.mjs`
- Test: `tests/enterprise-ai-change.test.mjs`

**Interfaces:**
- Consumes: `URLSearchParams(window.location.search).get("inquiry")` 與 `[data-inquiry-select]`。
- Produces: `enterprise-training` → `企業內訓` 的穩定映射；未知值仍維持未選擇。

- [ ] **Step 1: 在測試加入 JavaScript 映射契約**

附加至 `tests/enterprise-ai-change.test.mjs`：

```js
test("enterprise training query maps to the existing contact option", () => {
  const script = read("assets/site.js");
  const contact = read("contact/index.html");
  assert.match(script, /"enterprise-training": "企業內訓"/);
  assert.match(contact, /<option>企業內訓<\/option>/);
});
```

- [ ] **Step 2: 執行映射測試並確認失敗**

Run: `node --test --test-name-pattern="query maps" tests/enterprise-ai-change.test.mjs`

Expected: FAIL，顯示 `assets/site.js` 缺少 `enterprise-training`。

- [ ] **Step 3: 加入最小查詢參數映射**

將 `inquiryPresetValues` 改為：

```js
const inquiryPresetValues = {
  "ai-advisory": "AI 應用或創業顧問",
  "enterprise-training": "企業內訓",
};
```

- [ ] **Step 4: 執行映射與既有表單測試**

Run: `node --test tests/enterprise-ai-change.test.mjs tests/site-integrity.test.mjs`

Expected: 映射測試 PASS；既有 Apps Script 表單契約 PASS；站內入口或 sitemap 測試仍可能失敗。

- [ ] **Step 5: 提交表單預選功能**

```bash
git add assets/site.js tests/enterprise-ai-change.test.mjs
git diff --cached --check
git commit -m "feat: preselect enterprise training inquiries"
```

### Task 4: 完成課程總覽與企業顧問頁導流

**Files:**
- Modify: `courses/index.html:8-81`
- Modify: `ai-transform/index.html:82-113`
- Modify: `assets/ai-transform.css`
- Test: `tests/enterprise-ai-change.test.mjs`

**Interfaces:**
- Consumes: 新頁固定 URL `/courses/enterprise-ai-change/`。
- Produces: 課程總覽第六張卡片及企業顧問頁工作坊入口。

- [ ] **Step 1: 更新課程總覽的數量與比較文案**

將「五堂」改為「六堂」，並將 AI 路徑說明改成同時涵蓋個人 AI 實戰與企業變革。更新下列可見位置：title description、Open Graph description、hero lead、`THREE DIRECTIONS` 旁的堂數、`ALL COURSES` 標題及頁尾比較 CTA。

- [ ] **Step 2: 新增第六張企業課程卡**

在既有 AI 實戰課程卡後加入：

```html
<article class="course-catalog-card is-enterprise">
  <span class="course-catalog-index">06</span>
  <p class="path-kicker">ENTERPRISE AI CHANGE</p>
  <h3>AI 變革推動實戰班</h3>
  <p>讓 HR、主管與種子員工共同完成一項可試行的 AI 工作流程，而不是上完課各自回到原本做法。</p>
  <div class="course-output"><span>帶走成果</span><strong>流程雛形、使用規範與 30 天部門試行計畫</strong></div>
  <a class="button" href="/courses/enterprise-ai-change/">查看企業課程頁</a>
</article>
```

- [ ] **Step 3: 在企業顧問頁加入不搶主定位的工作坊入口**

在 `method-section` 後、`funding-section` 前加入：

```html
<section class="transform-section workshop-entry" aria-labelledby="workshop-entry-title">
  <div class="transform-container workshop-entry-layout">
    <div><span class="transform-eyebrow">TEAM WORKSHOP · 6 HOURS</span><h2 id="workshop-entry-title">先讓一個流程成功，再決定是否擴大。</h2><p>由 HR 帶隊，主管確認邊界，種子員工完成流程雛形與 30 天試行計畫。</p></div>
    <a class="transform-button transform-button-primary" href="/courses/enterprise-ai-change/">查看 AI 變革推動實戰班 <span aria-hidden="true">↗</span></a>
  </div>
</section>
```

在 `assets/ai-transform.css` 以既有 token 補上 `.workshop-entry` 與 `.workshop-entry-layout`，行動版改為單欄；若 CSS 有修改，將該頁 cache key 更新為 `v=20260905workshop1`，並同步更新完整性測試期望值。

- [ ] **Step 4: 執行新頁與全站完整性測試**

Run: `node --test tests/enterprise-ai-change.test.mjs tests/site-integrity.test.mjs`

Expected: 兩個站內入口測試 PASS；sitemap 測試仍因尚未加入新 URL 而 FAIL。

- [ ] **Step 5: 提交站內導流**

```bash
git add courses/index.html ai-transform/index.html assets/ai-transform.css tests/site-integrity.test.mjs
git diff --cached --check
git commit -m "feat: link enterprise workshop across BLAKE.MBA"
```

### Task 5: 加入 sitemap、完成全站驗證與交付檢查

**Files:**
- Modify: `sitemap.xml`
- Modify: `tests/site-integrity.test.mjs`
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: `https://blake.mba/courses/enterprise-ai-change/` canonical URL。
- Produces: 搜尋索引、完整測試證據與待使用者核准的本機網站成果。

- [ ] **Step 1: 將新 URL 插入 sitemap 的課程區段**

在 `/courses/choice-over-effort/` 與其他課程 URL 同一區段加入：

```xml
<url>
  <loc>https://blake.mba/courses/enterprise-ai-change/</loc>
</url>
```

保持 sitemap URL 順序與 `indexedPages` 完全一致。

- [ ] **Step 2: 加入課程結構化資料測試**

附加至 `tests/enterprise-ai-change.test.mjs`：

```js
test("enterprise AI workshop publishes conservative Course structured data", () => {
  const html = read(page);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const course = blocks.map((match) => JSON.parse(match[1])).find((item) => item["@type"] === "Course");
  assert.equal(course.name, "AI 變革推動實戰班");
  assert.equal(course.url, "https://blake.mba/courses/enterprise-ai-change/");
  assert.equal(course.inLanguage, "zh-Hant");
  assert.equal(course.provider.name, "William Blake Huang 黃大成");
  assert.equal(course.offers, undefined);
  assert.equal(course.aggregateRating, undefined);
});
```

- [ ] **Step 3: 執行完整自動化測試**

Run: `npm test`

Expected: 所有 Node.js 測試 PASS，包含新課程頁、canonical、Open Graph、sitemap、favicon、圖片尺寸、聯絡表單及現有網站回歸測試。

- [ ] **Step 4: 執行靜態品質檢查**

Run: `git diff --check`

Expected: 無輸出、exit code 0。

Run: `rg -n "正式系統已完成|保證合規|上市櫃客戶" courses/enterprise-ai-change/index.html assets/enterprise-ai-change.css`

Expected: 無未核准宣稱或待補內容；若 `rg` 因無匹配回傳 exit code 1，視為通過。

- [ ] **Step 5: 啟動本機網站並檢查主要路徑**

Run: `python3 -m http.server 4173`

檢查：

- `http://localhost:4173/courses/enterprise-ai-change/` 桌機與手機寬度均無水平捲動。
- 首屏可見主標、六小時、三種角色及主要 CTA。
- 六個單元、七項成果、適合／不適合、講師證據與資料邊界可讀。
- 兩個 CTA 均開啟 `/contact/?inquiry=enterprise-training#contact-form`，且需求類型顯示「企業內訓」。
- `/courses/` 顯示六堂課；`/ai-transform/` 顯示工作坊入口。
- 鍵盤操作時所有連結焦點可見，44px 觸控區及分析同意提示沒有互相遮擋。

若使用者沒有明確要求瀏覽器視覺測試，僅保留本機伺服器供使用者查看，不擅自執行截圖或瀏覽器自動操作。

- [ ] **Step 6: 提交 sitemap 與最終測試**

```bash
git add sitemap.xml tests/enterprise-ai-change.test.mjs tests/site-integrity.test.mjs
git diff --cached --check
git commit -m "test: verify enterprise workshop site integration"
```

- [ ] **Step 7: 確認工作樹與提交範圍**

Run: `git status --short`

Expected: 沒有本計畫造成的未提交變更；若有使用者原有變更，保持原狀並逐項列出。

Run: `git log --oneline -6`

Expected: 可看到本計畫的測試、課程頁、表單映射、站內導流及整合驗證提交。

## 發布 Gate

完成上述任務後，回報本機成果、測試與預覽網址，等待使用者核准。未取得明確發布指示前，不合併至 `main`、不 push 正式發布分支，也不宣稱公開網站已更新。
