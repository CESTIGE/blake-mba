# TMarsBase 網站

此資料夾保存 2026-10-10 驗收後的 Sites 版本，對應來源提交 `49c93caae00051901f1e24989b3273478d0bfd55`。

- 中文首頁：`dist/tmarsbase/index.html`
- 英文首頁：`dist/tmarsbase/en/index.html`
- Sites 根目錄：`dist/index.html` 直接顯示首頁，沒有自動跳轉。
- 合作方案與講師詳細頁目前保留繁體中文。
- `.openai/hosting.json` 指向既有 TMarsBase Sites 專案。

## 重建及檢查

在本資料夾執行：

```sh
node scripts/build-english.mjs
python3 scripts/check-site.py
python3 -m http.server 8789 --directory dist
```

`scripts/home.zh.html` 與 `scripts/mars.base.css` 是中文首頁及基礎樣式來源。英文翻譯與語言切換由 `scripts/build-english.mjs` 產生。修改後需檢查英文互動模組與手機版面。

儲存庫根目錄的 `tmarsbase/`、`tmarsbase-concepts/` 及相關 `assets/` 同步此版本，供既有網站路徑使用。此專案的根首頁只位於 `sites/tmarsbase/dist/index.html`；儲存庫根目錄的 Blake 首頁保留原有內容。

GitHub 同步不會自行重新發布 Sites。Sites 發版應使用此專案的既有版本與部署流程，保持當下存取設定。
