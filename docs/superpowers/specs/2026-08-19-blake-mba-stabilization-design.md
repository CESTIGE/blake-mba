# BLAKE.MBA 穩定化與優化設計

## 決策狀態

- 使用者於 2026-08-19 核准方案 A。
- 書籍與課程名單的資料用途限定為一次性開課或進度通知，不視為持續寄送的行銷電子報訂閱。
- 本設計只修改本機功能分支 `codex/blake-mba-optimization`；不推送、不部署、不對正式 Apps Script 送出測試資料。

## 背景

BLAKE.MBA 是直接部署於 GitHub Pages 的靜態網站，沒有建置工具、套件管理或既有測試套件。公開站目前有五個主要問題群：

1. 五個書籍／課程表單被共用 `site.js` 攔截，但缺少 Apps Script endpoint、request ID 與回傳 iframe，無法完成送出。
2. GitHub Pages 將非首頁 URL 301 到尾斜線版本，但 sitemap、canonical、OG URL、JSON-LD 與多數內鏈仍指向無尾斜線版本。
3. 手機版的隱私設定按鈕與段落導覽固定於相同底部位置，且段落控制的觸控區過小。
4. 首頁明示 eager 載入八張圖片，合計約 4.77 MB；除 Hero 外都不是首屏必要資源。
5. 書籍頁公開內部工作稿，favicon 未生效，文章社群 metadata 不完整，部分圖片缺少 intrinsic dimensions。

## 目標

本批次交付一個可回滾、可自動驗證的靜態站穩定化版本：

- 五個書籍／課程表單具備與既有聯絡頁一致的前端送出契約，不再顯示「預覽版未連結」錯誤。
- 所有可索引頁面的 canonical URL 直接對應 GitHub Pages 的 200 URL，不再先經過 301。
- 360、390、430 CSS px 手機寬度下，隱私控制與段落導覽不重疊，所有段落控制至少有 44 × 44 CSS px 的互動區。
- 首頁只有 Hero 明示 eager／high priority；其他首頁圖片使用 lazy loading 與 async decoding。
- 全站 raster 內容圖片具有正確的 width／height，降低慢速載入時的版面位移風險。
- 書籍頁不再顯示內部備註；全站使用有效 favicon；文章標示 `og:type=article`。
- 新增零外部依賴的自動稽核，能阻止上述問題再次進入版本庫。

## 非目標

本批次不包含下列工作：

- 修改或重新部署 Apps Script 後端。
- 將一次性通知名單改造成持續行銷電子報、double opt-in 或自動寄送系統。
- 對正式 endpoint 送出測試名單；若日後需要端到端 smoke test，必須在送出前另行取得明確確認。
- 批次產生 AVIF／WebP、`srcset`／`sizes` 或重做完整圖片管線。
- 搬遷 GitHub Pages、設定 CDN、安全回應標頭或長期 immutable cache。
- 虛構課程價格、日期、名額、客戶成果、`dateModified` 或 publisher 資料。
- 推送 GitHub、建立 PR 或部署正式站。

## 架構設計

### 1. 多表單前端控制器

保留既有 Apps Script endpoint，但把 `assets/site.js` 從只處理第一個 `querySelector("[data-contact-form]")` 改為逐一初始化所有 `[data-contact-form]`。

每個可送出的表單必須同時具備：

- `method="post"`
- 合法的 `data-apps-script-endpoint`
- 唯一的 `data-form-name`
- `data-success-message`
- `[data-request-id]`
- `[data-contact-frame]`，且 iframe name 在同頁唯一
- `_gotcha` honeypot
- `[data-form-status]`
- 含 `[data-submit-text]` 的 submit button

書籍與四個課程表單統一使用既有後端已知欄位名稱：

- `姓名`：必填。
- `聯絡方式`：必填，內容為 Email。
- `需求類型`：固定為 `個人課程詢問`。
- `目前遇到的問題`：保留各頁原本的課程問題或書籍需求內容。
- `名單來源`：使用頁面專屬名稱，例如 `AI 實戰課程`、`選擇重於努力書籍等候名單`。
- `送單識別碼`：提交前由前端產生 UUID。
- `_gotcha`：必須保持空白。

既有聯絡頁保留目前欄位、需求類型預選與成功文案。每個表單在自己的 closure 中保存 pending request ID、timeout、button 與 iframe；`postMessage` 必須同時通過 origin、iframe window、source、request ID 驗證，避免不同表單互相接收結果。

Analytics 的 `generate_lead` 事件使用表單的 `data-form-name`，並記錄 `inquiry_type` 與 `lead_source`，不再把課程／書籍事件一律記成 `contact` 或 `unspecified`。

### 2. 表單錯誤與資料用途

- 缺少 endpoint、iframe 或 request ID 時，顯示明確的設定錯誤且不傳送資料。
- pending 狀態禁止重複送出。
- 成功才 reset 表單；失敗或 30 秒 timeout 保留使用者輸入並重新啟用按鈕。
- `notificationSent === false` 時仍顯示「資料已保存、通知可能延遲」。
- 書籍與課程文案明確說明「僅用於本次書籍／課程進度通知」，不宣稱週報、電子報或持續行銷。
- 書籍頁的長文問題改為選填；姓名與 Email 保持必填，以降低等候名單阻力。

### 3. URL 與 SEO 正規化

正式站沿用 GitHub Pages 的目錄路由，全面採尾斜線 URL：

- 首頁維持 `https://blake.mba/`。
- 其他頁面使用 `https://blake.mba/path/`。
- query 與 fragment 放在尾斜線之後，例如 `/contact/?inquiry=ai-advisory#contact-form`。

同步修改：

- `sitemap.xml`
- 每個可索引頁面的 canonical 與 `og:url`
- 五篇文章 JSON-LD 的 `mainEntityOfPage`
- HTML、`assets/site.js` 與 `content/articles.json` 產生的站內頁面連結

站內不再連向 soft redirect alias：

- `/about` 改為 `/#story`
- `/results` 與 `/cases` 改為 `/#proof`
- `/articles` 與 `/resources` 改為 `/insights/`

舊的 redirect stub 暫時保留 `noindex`、canonical、meta refresh、JavaScript 與 fallback link，供既有外部連結相容；GitHub Pages 無法在本 repo 內提供真正的 edge 301，因此不假裝已解決伺服器層 redirect。

### 4. 手機固定 UI 與觸控目標

桌機版段落導覽維持現況。`max-width: 760px` 時：

- `.page-deck-anchor` 與 `.page-deck-button` 的互動盒至少為 44 × 44 CSS px。
- `.page-deck-dot` 維持目前 6 px 的視覺尺寸，避免改變設計密度。
- 有 `.has-page-deck` 時，`.analytics-settings` 與初次 consent banner 上移到段落導覽上方，計算 safe-area inset；沒有 page deck 的頁面維持原本底部位置。
- `body` 的底部 padding 同時容納段落導覽與安全區。
- 修改後同步更新所有 `paged-sections.css` 與動態 `analytics.css` 的 query version，避免瀏覽器繼續使用舊 CSS。

不採用只改 z-index 的方式，因為那只會改變誰遮住誰，無法消除幾何重疊。

### 5. 圖片載入與版面穩定

首頁保留 Hero 圖片的：

- `loading="eager"`
- `decoding="sync"`
- `fetchpriority="high"`

其餘七張目前 eager 的首頁圖片改為 `loading="lazy" decoding="async"`，包含四張尚未展開的身分證明圖、全身照、活動照與 QR Code。圖片既有 width／height 保留。

其他頁面缺少尺寸的 raster 圖片，依實際檔案自然尺寸補上 width／height；SVG 只在可可靠確認 viewBox 比例時補尺寸。本批次不新增 responsive variants，避免把 UI／表單修復與大量二進位資產變更綁在同一批。

### 6. Metadata 與公開文案

- 移除書籍頁的「電子報命名建議」、「目前為前端版本」與「正式名單系統可再串接」等內部工作稿。
- 所有 HTML 使用 `/assets/favicon.png`，移除 `data:,` favicon；404 頁也使用相同圖示。
- 五篇文章加入 `og:type=article`。
- 不新增無可靠來源的 `dateModified`。

## 測試設計

新增零外部依賴的 Node 測試，使用 Node 24 內建 `node:test`、`assert`、`fs` 與 `path`。`package.json` 只定義測試指令，不引入 runtime 或 dev dependency。

### 靜態契約測試

- 五個書籍／課程表單與聯絡表單都具備完整 POST contract。
- 表單欄位名稱、一次性通知文案、唯一 iframe name、request ID、honeypot、status 與 submit text 正確。
- 不存在公開工作稿文字。
- Sitemap URL 唯一且除首頁外都以 `/` 結尾。
- canonical、`og:url` 與 sitemap URL 一致；文章 `mainEntityOfPage` 等於 canonical。
- 文章具 `og:type=article`。
- 站內不再引用 `/about`、`/cases`、`/results`。
- 所有 HTML 指向存在的 favicon，且不存在 `href="data:,"`。
- 首頁只有 Hero 明示 eager／high priority。
- 所有 raster 內容圖具 width／height。
- 手機 CSS 的段落互動盒至少 44 × 44，且 analytics fixed UI 具有 page-deck 專用避讓規則。

### 本機瀏覽器回歸

以本機靜態伺服器測試首頁、課程、文章、顧問、書籍與聯絡頁：

- 桌機預設 viewport。
- 360 × 800、390 × 844、430 × 932。
- 用不同 localhost port 建立新的 origin，分別測試未選擇、允許分析與僅必要功能狀態，不讀取或刪除使用者既有 browser storage。
- 量測 `.analytics-settings`／consent banner 與 `.page-deck-nav` 的 bounding rectangles，必須不相交。
- 驗證段落按鈕尺寸、hash、active 狀態、上一段／下一段與水平 track。
- 驗證書籍與課程表單的 required、Email validation、busy、timeout 與錯誤文案；測試使用本機攔截或測試替身，不 POST 到正式 Apps Script。
- 冷載首頁時確認 Hero 是唯一明示 eager／high priority 圖片；捲動與展開卡片後不得出現破圖。
- 檢查 console error、水平 overflow 與主要頁面視覺回歸。

## 驗收條件

只有在下列條件全部成立時，才能宣稱本批次完成：

1. 新增測試先在未修改 production code 的狀態下因對應缺陷而失敗。
2. 修正後全部自動測試通過且沒有未解釋警告。
3. Git diff 不包含未規劃的內容、二進位大檔或第三方套件。
4. 主要頁面桌機與三種手機尺寸回歸通過。
5. 首頁 eager 宣告從八張降為一張。
6. 本機工作樹中的剩餘變更與未驗證項目有明確說明。
7. 不推送、不部署；正式 endpoint 未收到測試資料。

## 風險與回滾

- Repo 不包含 Apps Script 原始碼，因此本批次只能確保前端符合現有聯絡表單的已知契約，不能聲稱後端已端到端驗證。若正式 smoke test 未獲授權，交付時必須保留這項限制。
- 尾斜線改動範圍廣，必須由自動測試覆蓋 sitemap、head、JSON-LD、HTML、JS 與 JSON 連結，避免只修部分來源。
- lazy loading 可能讓使用者首次展開證明卡時看到短暫解碼延遲；既有尺寸與 async decoding 可降低跳動，若仍不理想再於第二階段增加小尺寸 WebP。
- 所有修改都位於單一功能分支；若回歸失敗，可逐項 revert 對應 commit，不需要重寫歷史或 force push。

