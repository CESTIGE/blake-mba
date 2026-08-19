# Task 1 工作報告

## 完成內容

- 新增 `package.json`，把 `npm test` 統一成 `node --test tests/*.test.mjs`。
- 新增零相依測試 helper：`tests/helpers/site-files.mjs`。
- 新增主測試：`tests/site-integrity.test.mjs`，覆蓋表單 contract、book 文案、canonical / sitemap / OG URL、article JSON-LD、內部導覽、favicon、首頁 eager 圖片數量、raster 圖片尺寸、手機 CSS 契約。
- 為了同時照顧任務摘要的字面檔名，我另外補了兩個輕量 alias：
  - `tests/helper.js`
  - `tests/site.test.js`
- 沒有修改任何 production 檔案。

## 測試結果

執行命令：

```bash
npm test
```

結果：

- 測試成功啟動。
- 共 10 個測試，全部失敗，且失敗原因都對應到現有 production 缺陷，而不是語法或 runner 問題。
- 失敗重點包含：
  - 表單缺少完整 Apps Script contract
  - book 頁面仍含不應公開的 draft 文案
  - sitemap / canonical / og:url 與 final 200 URL 不一致
  - article JSON-LD / og:type 不一致
  - soft redirect alias 與 trailing slash 連結仍混用
  - favicon 未在所有 HTML 頁面上完整出現
  - 首頁 eager / high priority 圖片數量過多
  - 內嵌 raster 圖片缺少 intrinsic dimensions
  - mobile deck / analytics CSS touch region 契約未達標

補充語法檢查：

```bash
node --check tests/helper.js
node --check tests/site.test.js
```

兩個 alias 檔都通過語法檢查。

## Git 狀態與 Diff

目前已 stage 的變更如下：

```text
A  package.json
A  tests/helper.js
A  tests/helpers/site-files.mjs
A  tests/site-integrity.test.mjs
A  tests/site.test.js
```

Diff 統計：

```text
5 files changed, 181 insertions(+)
```

## 自我檢查

- 已確認只新增測試與報告，沒有碰 production 原始檔。
- 已確認 `npm test` 的失敗是來自真實內容差異，不是 parser / import / helper 錯誤。
- 已確認 helper 只使用 Node 內建模組，符合 zero-dependency 要求。
- 已確認沒有 push、deploy 或嘗試送出任何外部資料。

## 風險

- 這組測試刻意鎖定目前已知缺陷，後續 Task 2 到 Task 4 修 production 時，若 HTML 結構或資源路徑調整，部分正規表示式斷言可能需要同步微調。
- `tests/helper.js` 與 `tests/site.test.js` 只是相容性 alias，真正的執行契約仍在 `.mjs` 測試檔。
- 目前只能證明靜態契約與本機驗證流程，尚未涵蓋任何正式 endpoint 的端到端送出。
