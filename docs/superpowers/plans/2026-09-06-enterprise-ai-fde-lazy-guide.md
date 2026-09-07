# Enterprise AI FDE Lazy-Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將企業 AI 課程頁改造成上市櫃公司 HR 一眼看懂的問題型懶人包，以國外成功案例與 FDE 落地方法說明如何讓 AI 從上課走向全員生產力。

**Architecture:** 保留既有靜態 HTML／CSS 與表單入口，不新增前端框架。頁面依「現況問題 → 失敗循環 → 目標成果 → 國外案例 → FDE → BLAKE 解法 → 課程／陪跑 → CTA」單向敘事；所有外部案例以來源卡呈現，並把第三方成果與 BLAKE 服務承諾清楚分開。

**Tech Stack:** Semantic HTML5、CSS3、Node.js `node:test`、既有 GitHub Pages 發布流程、瀏覽器響應式驗收。

**Spec:** `docs/superpowers/specs/2026-09-06-enterprise-ai-fde-lazy-guide-design.md`

## Global Constraints

- 全站使用繁體中文；英文只保留 FDE、AI、公司與產品專名。
- 不虛構導入數字、客戶關係、SLA、系統整合能力或成果保證。
- 國外案例數據必須直接連回官方一手來源，且標示為外部案例成果。
- BLAKE 服務稱為「FDE 式落地陪跑」；正式系統串接、資安、法遵與維運需另案評估。
- 保留既有六小時課程、六個模組、七項成果包、講師與諮詢表單路徑。
- 390 × 844 手機首屏需完整看到四項關鍵事實與主要 CTA；Cookie／同意提示不得遮住 CTA。
- 每個任務先寫失敗測試，再寫最小實作，最後執行完整測試與提交。

## Task 1: 鎖定懶人包敘事順序與首屏承諾

**Files:**
- Modify: `tests/enterprise-ai-change.test.mjs`
- Modify: `courses/enterprise-ai-change/index.html`

**Interfaces:**
- Section IDs: `overview`, `barriers`, `failure-loop`, `outcome`
- Hero facts: `上市櫃企業 HR`、`6 小時工作坊`、`30 天落地衝刺`、`FDE 式陪跑`
- Primary CTA: `預約企業 AI 落地診斷`

- [ ] **Step 1: 新增會失敗的敘事順序測試**

在 `tests/enterprise-ai-change.test.mjs` 新增：

```js
test("企業 AI 頁採問題型懶人包順序", () => {
  const ids = ["overview", "barriers", "failure-loop", "outcome"];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("首屏交代受眾、形式、期間與主要行動", () => {
  for (const phrase of [
    "上市櫃企業 HR",
    "6 小時工作坊",
    "30 天落地衝刺",
    "FDE 式陪跑",
    "預約企業 AI 落地診斷",
  ]) assert.match(html, new RegExp(phrase));
});
```

- [ ] **Step 2: 執行測試並確認紅燈**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: FAIL，缺少 `failure-loop`、`outcome` 或新首屏文案。

- [ ] **Step 3: 改寫頁面 metadata 與 Hero**

在 `courses/enterprise-ai-change/index.html`：

- 更新 `<title>`、description、Open Graph 與 JSON-LD 課程描述，主題聚焦「企業 AI 落地」與 HR 推動角色。
- Hero 主標採白話問題句，例如「AI 課上完了，為什麼公司還是沒變？」
- Hero 加入四個短標籤：受眾、工作坊、落地期、方法。
- 主 CTA 統一為「預約企業 AI 落地診斷」，沿用 `/contact/?topic=enterprise-training`。
- 保留次要站內導覽，但不要與主要 CTA 同視覺權重。

- [ ] **Step 4: 建立問題、失敗循環與目標成果區塊**

依序加入：

1. `#barriers`：員工怕被取代、主管只看工具、資料不能亂丟、上課後沒人陪跑。
2. `#failure-loop`：買工具 → 辦課 → 回到原流程 → 看不到成果 → 認為 AI 無用。
3. `#outcome`：把目標改為「全員在安全邊界內，用 AI 改善真實工作」。

每個區塊只保留一句主張、三至五個短句與一個下一段引導。

- [ ] **Step 5: 更新舊測試中的定位文字並跑綠燈**

舊測試若鎖定過時的精確 Hero 句，改為檢查核准規格中的四項事實與 CTA，不降低六模組、七成果包及敏感資料邊界的既有覆蓋。

Run: `npm test`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add tests/enterprise-ai-change.test.mjs courses/enterprise-ai-change/index.html
git commit -m "feat: reshape enterprise AI page as lazy guide"
```

## Task 2: 加入五個國外案例與來源邊界

**Files:**
- Modify: `tests/enterprise-ai-change.test.mjs`
- Modify: `courses/enterprise-ai-change/index.html`

**Interfaces:**
- Section ID: `cases`
- Case cards: OpenAI × Crete、Palantir AIP Bootcamp、Palantir × Beyond Meat、Anthropic × ServiceNow、Microsoft × KOHLER
- Source attributes: `href`, `target="_blank"`, `rel="noopener noreferrer"`

- [ ] **Step 1: 新增五案例與官方來源測試**

```js
test("列出五個國外企業 AI 落地案例與官方來源", () => {
  const cases = [
    ["OpenAI × Crete", "https://openai.com/index/building-self-improving-tax-agents-with-codex/"],
    ["Palantir AIP Bootcamp", "https://investors.palantir.com/files/2025%20FY%20PLTR%2010-K.pdf"],
    ["Palantir × Beyond Meat", "https://www.palantir.com/assets/xrfr7uokpv1b/4rM2L8TANQGcPsLKOzdMJ0/6795f2b89327a87361743319836f0c42/AIPCon_Mar_-24_-_Bootcamp_One-Pager_-_Beyond_Meat.pdf"],
    ["Anthropic × ServiceNow", "https://www.anthropic.com/news/servicenow-anthropic-claude"],
    ["Microsoft × KOHLER", "https://www.microsoft.com/en/customers/story/26948-kohler-company-microsoft-365-copilot"],
  ];
  for (const [name, source] of cases) {
    assert.ok(html.includes(name), name);
    assert.ok(html.includes(source), source);
  }
  assert.match(html, /外部案例成果[^<]*不代表 BLAKE 對客戶的成果保證/);
});
```

- [ ] **Step 2: 執行測試並確認紅燈**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: FAIL，`cases` 與案例來源尚未存在。

- [ ] **Step 3: 實作案例懶人卡**

每張卡固定四欄語意：

- 情境：企業原本遇到的工作問題。
- 做法：如何從真實工作切入，而非只教工具。
- 可借鏡原則：HR 可複製的推動方式。
- 官方來源：可核對的原始連結。

案例內只採用官方來源能直接支持的事實；不確定數字就不寫。所有數字旁標示「國外案例公開成果」，區塊底部加上「不代表 BLAKE 對個別企業的成果保證」。

- [ ] **Step 4: 驗證外部連結安全屬性**

新增測試，解析 `#cases` 內所有 `https://` 連結，要求同時具有 `target="_blank"` 與 `rel="noopener noreferrer"`。

Run: `npm test`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add tests/enterprise-ai-change.test.mjs courses/enterprise-ai-change/index.html
git commit -m "feat: add sourced global AI adoption cases"
```

## Task 3: 將 FDE 方法轉成可理解的六步驟

**Files:**
- Modify: `tests/enterprise-ai-change.test.mjs`
- Modify: `courses/enterprise-ai-change/index.html`

**Interfaces:**
- Section ID: `fde`
- Full term: `Forward Deployed Engineer`
- Steps: 診斷、選題、共創、評估、試行、交接

- [ ] **Step 1: 新增 FDE 定義與順序測試**

```js
test("FDE 以六步驟說明企業落地方法", () => {
  assert.match(html, /Forward Deployed Engineer/);
  const steps = ["診斷", "選題", "共創", "評估", "試行", "交接"];
  const section = html.slice(html.indexOf('id="fde"'), html.indexOf('id="solution"'));
  const positions = steps.map((step) => section.indexOf(step));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});
```

- [ ] **Step 2: 執行測試並確認紅燈**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: FAIL，FDE 區塊或完整六步驟不存在。

- [ ] **Step 3: 實作 FDE 解說區**

新增一句白話定義：「FDE 不是把工具交給企業，而是和第一線一起把真實工作做出來。」

六步驟各包含：

1. 一個二至四字動詞。
2. 一句 HR 看得懂的行動。
3. 一個可觀察產物。

在區塊末端加入服務邊界：BLAKE 採 FDE 式工作方法；正式開發、系統整合、資安測試與維運另案評估。

- [ ] **Step 4: 完整測試與提交**

Run: `npm test`

Expected: PASS。

```bash
git add tests/enterprise-ai-change.test.mjs courses/enterprise-ai-change/index.html
git commit -m "feat: explain the six-step FDE adoption loop"
```

## Task 4: 串接 1 × 3 × 30、課程與 30 天陪跑

**Files:**
- Modify: `tests/enterprise-ai-change.test.mjs`
- Modify: `courses/enterprise-ai-change/index.html`

**Interfaces:**
- Section IDs: `solution`, `curriculum`, `deliverables`, `sprint`, `fit`, `instructor`, `consultation`
- Method label: `1 × 3 × 30＋FDE 企業 AI 落地法`
- Existing course contract: 6 modules / 360 minutes / 7 deliverables

- [ ] **Step 1: 新增方案銜接與服務邊界測試**

```js
test("方案把工作坊、FDE 與三十天衝刺串成同一條路徑", () => {
  for (const phrase of [
    "1 × 3 × 30＋FDE 企業 AI 落地法",
    "6 小時工作坊",
    "30 天落地衝刺",
    "七項成果包",
    "正式系統整合需另案評估",
  ]) assert.ok(html.includes(phrase), phrase);
});
```

- [ ] **Step 2: 執行測試並確認紅燈**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: FAIL，尚未出現完整新方法與 30 天陪跑敘事。

- [ ] **Step 3: 實作解法總覽**

在 `#solution` 以三張卡呈現：

- `1`：鎖定一個對營運有價值的工作場景。
- `3`：讓主管、HR／推動者、第一線共同參與。
- `30`：用三十天完成試行、量測與交接。

補一句 FDE 的角色：「陪團隊一起診斷、共創與修正，不讓課程停在示範。」

- [ ] **Step 4: 重排既有課程與成果包**

- 保留六模組總計 360 分鐘。
- 模組描述改成「課堂中會完成什麼」，避免抽象能力詞。
- 保留七項成果包名稱與數量。
- 新增 `#sprint`，以 Week 1 到 Week 4 說明選題、共創、試行、交接。
- `#fit` 清楚列出適合與不適合對象。
- `#instructor` 僅使用已可證實的經歷，不新增無來源頭銜或客戶成果。
- `#consultation` 重申唯一主要 CTA 與企業諮詢路徑。

- [ ] **Step 5: 完整測試與提交**

Run: `npm test`

Expected: PASS，既有六模組、360 分鐘、七成果包、表單路徑與敏感資料護欄測試仍通過。

```bash
git add tests/enterprise-ai-change.test.mjs courses/enterprise-ai-change/index.html
git commit -m "feat: connect workshop curriculum to FDE sprint"
```

## Task 5: 建立手機優先的懶人包視覺系統

**Files:**
- Modify: `tests/enterprise-ai-change.test.mjs`
- Modify: `assets/enterprise-ai-change.css`

**Interfaces:**
- Components: `.hero-facts`, `.failure-loop`, `.case-grid`, `.case-card`, `.fde-steps`, `.solution-grid`, `.sprint-timeline`
- Breakpoints: desktop default、`max-width: 760px`、`max-width: 430px`

- [ ] **Step 1: 新增必要元件與手機規則測試**

```js
test("懶人包元件具有手機版樣式與首屏壓縮規則", () => {
  for (const selector of [
    ".hero-facts",
    ".failure-loop",
    ".case-grid",
    ".fde-steps",
    ".sprint-timeline",
  ]) assert.ok(css.includes(selector), selector);
  assert.match(css, /@media\s*\(max-width:\s*430px\)/);
  assert.match(css, /\.hero[^}]*min-height:\s*auto/s);
});
```

- [ ] **Step 2: 執行測試並確認紅燈**

Run: `node --test tests/enterprise-ai-change.test.mjs`

Expected: FAIL，新元件 CSS 尚未完成。

- [ ] **Step 3: 實作桌機與手機版樣式**

- 以單欄閱讀為主，桌機只在案例、方案與成果卡使用二至三欄。
- 每段標題左側加入小型序號或標籤，幫助快速掃讀。
- 失敗循環使用可換行箭頭，手機版轉為垂直流程。
- FDE 六步驟在手機版為垂直時間軸，避免橫向捲動。
- 官方來源連結使用一致的小字樣式，不讓案例數字搶過方法重點。
- CTA 按鈕至少 44px 高；焦點、hover 與高對比狀態可辨識。
- 390px 寬度取消 Hero 固定高度並壓縮上下留白，確保四項事實與 CTA 同屏。
- 沿用既有 Cookie／同意提示的手機避讓規則。

- [ ] **Step 4: 完整測試與提交**

Run: `npm test`

Expected: PASS。

```bash
git add tests/enterprise-ai-change.test.mjs assets/enterprise-ai-change.css
git commit -m "style: add responsive enterprise AI lazy-guide system"
```

## Task 6: 本機內容、視覺與互動驗收

**Files:**
- Verify: `courses/enterprise-ai-change/index.html`
- Verify: `assets/enterprise-ai-change.css`
- Verify: `tests/enterprise-ai-change.test.mjs`

- [ ] **Step 1: 執行完整自動化測試**

Run: `npm test`

Expected: 全部 PASS，無 skipped 或 flaky 測試。

- [ ] **Step 2: 啟動本機站點**

Run: `python3 -m http.server 4173`

Expected: `http://127.0.0.1:4173/courses/enterprise-ai-change/` 回傳頁面。

- [ ] **Step 3: 桌機視覺驗收**

以 1280 × 900 檢查：

- 懶人包順序與規格一致。
- 案例來源皆可點擊且開新分頁。
- 六模組與七成果包沒有缺漏。
- CTA 指向 `/contact/?topic=enterprise-training`。
- 無水平捲動、文字截斷、卡片高度異常或簡體中文。

- [ ] **Step 4: 手機視覺驗收**

以 390 × 844 與 430 × 932 檢查：

- 在 `scrollY = 0` 可見完整四項 Hero facts 與主要 CTA。
- Cookie／同意提示不遮住 CTA。
- 失敗循環與 FDE 步驟為垂直可掃讀。
- 案例來源、按鈕與導覽均可點擊。
- 無水平捲動或過小字級。

- [ ] **Step 5: 內容證據複核**

逐張案例對照五個官方來源：公司名稱、方法、公開成果與限定語都能被原文支持；若來源未支持某數字，刪除該數字而非推測。

- [ ] **Step 6: 修正後重跑驗收並提交**

Run: `npm test && git diff --check`

Expected: PASS，且 `git diff --check` 無輸出。

```bash
git add courses/enterprise-ai-change/index.html assets/enterprise-ai-change.css tests/enterprise-ai-change.test.mjs
git commit -m "test: verify enterprise FDE lazy-guide experience"
```

## Task 7: PR、發布與正式站回讀

**Files:**
- Verify: Git history and deployment workflow
- Verify URL: `https://blake.mba/courses/enterprise-ai-change/`

- [ ] **Step 1: 確認工作樹與提交歷史**

Run: `git status --short && git log --oneline --decorate -8`

Expected: 工作樹乾淨；提交依任務順序存在。

- [ ] **Step 2: 推送功能分支並建立 PR**

Run: `git push -u origin codex/enterprise-fde-lazy-guide`

Expected: 推送成功。

建立 PR 時摘要需包含：問題型懶人包、五個官方國外案例、FDE 六步驟、1 × 3 × 30、手機首屏與測試結果。

- [ ] **Step 3: 檢查 PR diff 與 CI**

Run: `gh pr diff --check`（若 CLI 不支援此子命令，改用 `git diff --check origin/main...HEAD`）

Expected: 無 whitespace error；CI 全綠。

- [ ] **Step 4: 依既有流程合併與發布**

只有在 PR 與發布權限有效、CI 通過時執行；保留平台產生的部署記錄，不以本機成功取代正式發布證據。

- [ ] **Step 5: 正式站 fresh readback**

開啟 `https://blake.mba/courses/enterprise-ai-change/`，強制重新載入後確認：

- HTTP 與頁面載入正常。
- 新 Hero、五案例、FDE 六步驟與 30 天衝刺已出現。
- CTA 實際導向企業訓練表單。
- 390 × 844 首屏與同意提示符合規格。
- 正式站版本可由新文案與部署提交辨識，不把快取頁誤認為新版。

- [ ] **Step 6: 記錄可追溯交付證據**

最終回報需列出：PR／合併提交、正式網址、自動化測試結果、桌機與手機回讀結果；若任一步未完成，明確標示為 partial 或 blocked，不宣稱已發布。

## Final Verification Checklist

- [ ] `npm test` 全部通過。
- [ ] `git diff --check` 無輸出。
- [ ] 頁面順序完整覆蓋規格的八段核心敘事。
- [ ] 五個案例各有官方來源與外部成果限定語。
- [ ] FDE 六步驟名稱、順序與服務邊界正確。
- [ ] 六小時、六模組、七成果包與 30 天落地衝刺一致。
- [ ] 390 × 844 首屏含四項事實與 CTA，且同意提示不重疊。
- [ ] 正式站已 fresh readback 後，才可回報發布完成。
