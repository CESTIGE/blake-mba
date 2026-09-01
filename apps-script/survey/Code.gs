var SURVEY_SHEET_NAME = "網站問卷回覆";

function handleSurveySubmission(rawBody, services) {
  var payload;
  try {
    payload = parseSurveyBody(rawBody);
  } catch (_error) {
    return { ok: false, code: "INVALID_BODY", message: "無法讀取送出內容。" };
  }

  var normalized = normalizeSurveyPayload(payload);
  if (!normalized.ok) return normalized;
  if (normalized.value.website) {
    return { ok: true, submissionId: services.utilities.getUuid() };
  }
  if (!services.lock.tryLock(5000)) {
    return { ok: false, code: "BUSY", message: "目前送出較繁忙，請稍後再試。" };
  }

  try {
    var cacheKey = "survey:" + normalized.value.requestId;
    var cachedId = services.cache.get(cacheKey);
    if (cachedId) return { ok: true, submissionId: cachedId, duplicate: true };

    var spreadsheetId = services.properties.getProperty("SURVEY_SPREADSHEET_ID");
    if (!spreadsheetId) {
      return { ok: false, code: "CONFIG_ERROR", message: "問卷尚未完成設定。" };
    }

    var workbook = services.spreadsheetApp.openById(spreadsheetId);
    var sheet = workbook.getSheetByName(SURVEY_SHEET_NAME) || workbook.insertSheet(SURVEY_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, SURVEY_HEADERS.length).setValues([SURVEY_HEADERS]);
    } else {
      var existing = sheet.getRange(1, 1, 1, SURVEY_HEADERS.length).getValues()[0];
      if (JSON.stringify(existing) !== JSON.stringify(SURVEY_HEADERS)) {
        return { ok: false, code: "SHEET_SCHEMA_MISMATCH", message: "回覆工作表欄位不一致。" };
      }
    }

    var submissionId = services.utilities.getUuid();
    sheet.appendRow(buildSurveyRow(normalized.value, {
      serverTimestamp: services.now().toISOString(),
      submissionId: submissionId,
    }));
    services.cache.put(cacheKey, submissionId, 600);
    return { ok: true, submissionId: submissionId };
  } catch (_error) {
    return { ok: false, code: "WRITE_ERROR", message: "目前無法儲存回覆，請稍後再試。" };
  } finally {
    services.lock.releaseLock();
  }
}

function doPost(e) {
  var result = handleSurveySubmission(e && e.postData ? e.postData.contents : "", {
    properties: PropertiesService.getScriptProperties(),
    lock: LockService.getScriptLock(),
    cache: CacheService.getScriptCache(),
    spreadsheetApp: SpreadsheetApp,
    utilities: Utilities,
    now: function () { return new Date(); },
  });
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
