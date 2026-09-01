# BLAKE 課程需求問卷：第二階段 Google 設定手冊

本資料夾目前只提供可審查的 Apps Script 原始碼。本機預覽不會登入 Google、不會建立工作表，也不會寫入任何正式回覆。進行以下步驟前，請先取得明確授權；部署與匿名回覆都屬於外部變更。

## 1. 確認帳戶與既有回覆檔案

確認要使用的 Google 帳戶，該帳戶必須擁有或可編輯目前 Google Forms 的回覆試算表。先在該帳戶中開啟既有的試算表檔案；不要修改 Google Forms 管理的回覆工作表。

## 2. 建立容器綁定的 Apps Script 專案

從該既有試算表建立 container-bound Apps Script 專案。將本資料夾的 `Core.gs`、`Code.gs` 與 `appsscript.json` 完整複製到新專案中。程式只會建立或寫入獨立的 `網站問卷回覆` 工作表，不能編輯 Forms 管理的回覆分頁。

## 3. 設定 Script Property

在 Apps Script 的 Script Properties 新增 `SURVEY_SPREADSHEET_ID`，值為同一份既有試算表的檔案 ID。不要將這個值提交到 Git、貼入網站原始碼、文件或聊天訊息。

## 4. 審查權限並部署 Web App

確認 manifest 需要的 `spreadsheets` scope。部署 Web App 時，**執行身分必須是擁有者**；只有在使用者再次明確同意後，才允許匿名受訪者使用端點。部署與權限說明請以官方文件為準：[Web Apps](https://developers.google.com/apps-script/guides/web) 與 [Content Service](https://developers.google.com/apps-script/guides/content)。

## 5. 設定正式網站端點

部署後，僅在再次取得明確批准時，才把回傳的 `/exec` URL 填入正式建置版本的 `data-survey-endpoint`。本機預覽、原始碼與 Git 保持空值，不存放部署 URL。

## 6. 合成資料寫入與回讀驗證

送出一筆清楚標示為測試資料的合成問卷回覆。接著回讀 `網站問卷回覆`，確認 `submission_id`、固定 13 欄順序與每個欄位值都正確。不要讀取或分析 Google Forms 既有的回覆。

## 7. 測試資料保留規則

只有在使用者明確要求刪除時，才刪除該筆合成測試資料；否則保留並清楚標示為測試資料，避免混淆正式回覆與驗證紀錄。

## 8. 回復方式

如需停止串接，先從頁面移除 endpoint，接著停用 Apps Script deployment。這些動作都不得觸碰 Google Forms 管理的回覆分頁。

