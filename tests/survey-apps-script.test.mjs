import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

function loadScript(relativePath, seed = {}) {
  const source = readFileSync(
    fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
    "utf8",
  );
  const context = vm.createContext({ JSON, Date, RegExp, String, Number, ...seed });
  vm.runInContext(source, context, { filename: relativePath });
  return context;
}

function loadAppsScript(seed = {}) {
  const context = vm.createContext({ JSON, Date, RegExp, String, Number, ...seed });
  for (const relativePath of ["apps-script/survey/Core.gs", "apps-script/survey/Code.gs"]) {
    const source = readFileSync(
      fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
      "utf8",
    );
    vm.runInContext(source, context, { filename: relativePath });
  }
  return context;
}

const validPayload = {
  requestId: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
  role: "上班族",
  roleOther: "",
  learningTopics: "AI 自動化與工作流程",
  currentProblem: "希望縮短重複行政工作的時間",
  blakeCourseCount: "2",
  aiCourseCount: "3",
  email: "learner@example.com",
  consent: true,
  submittedAtClient: "2026-09-01T01:23:45.000Z",
  website: "",
};

function fakeServices({
  cached = null,
  headers = null,
  sheetExists = true,
  spreadsheetId = "sheet-id",
  lockAcquired = true,
  writeError = null,
} = {}) {
  const state = {
    headers,
    dataRows: [],
    createdSheet: false,
    openedSpreadsheetId: null,
    lockAttempts: [],
    releasedLocks: 0,
    cachePuts: [],
  };
  const cacheValues = new Map(cached ? [[`survey:${validPayload.requestId}`, cached]] : []);
  const sheet = {
    getLastRow: () => (state.headers ? state.dataRows.length + 1 : state.dataRows.length),
    getRange: () => ({
      getValues: () => [state.headers ?? []],
      setValues: (values) => {
        if (writeError === "header") throw new Error("header write failed");
        state.headers = Array.from(values[0]);
      },
    }),
    appendRow: (row) => {
      if (writeError === "append") throw new Error("append failed");
      state.dataRows.push(Array.from(row));
    },
  };
  let currentSheet = sheetExists ? sheet : null;

  return {
    state,
    properties: { getProperty: (key) => key === "SURVEY_SPREADSHEET_ID" ? spreadsheetId : null },
    lock: {
      tryLock: (timeout) => {
        state.lockAttempts.push(timeout);
        return lockAcquired;
      },
      releaseLock() { state.releasedLocks += 1; },
    },
    cache: {
      get: (key) => cacheValues.get(key) ?? null,
      put: (key, value, ttl) => {
        cacheValues.set(key, value);
        state.cachePuts.push({ key, value, ttl });
      },
    },
    spreadsheetApp: {
      openById: (id) => {
        state.openedSpreadsheetId = id;
        if (writeError === "open") throw new Error("open failed");
        return {
          getSheetByName: () => currentSheet,
          insertSheet: () => {
            state.createdSheet = true;
            currentSheet = sheet;
            return sheet;
          },
        };
      },
    },
    utilities: { getUuid: () => "submission-1" },
    now: () => new Date("2026-09-01T02:00:00.000Z"),
  };
}

test("parseSurveyBody parses a valid JSON object", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.parseSurveyBody(JSON.stringify(validPayload));
  assert.equal(result.requestId, validPayload.requestId);
});

test("parseSurveyBody rejects empty invalid json array and oversized bodies", () => {
  const core = loadScript("apps-script/survey/Core.gs");

  assert.throws(() => core.parseSurveyBody(""), /INVALID_BODY/);
  assert.throws(() => core.parseSurveyBody("{"), /INVALID_BODY/);
  assert.throws(() => core.parseSurveyBody("[]"), /INVALID_BODY/);
  assert.throws(() => core.parseSurveyBody("x".repeat(12001)), /INVALID_BODY/);
});

test("normalizeSurveyPayload accepts the confirmed six-question contract", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload(validPayload);
  assert.equal(result.ok, true);
  assert.equal(result.value.role, "上班族");
  assert.equal(result.value.email, "learner@example.com");
});

test("normalizeSurveyPayload rejects raw learning topic and problem values over their limits", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    learningTopics: `${" ".repeat(2)}${"x".repeat(301)}${" ".repeat(2)}`,
    currentProblem: `${" ".repeat(2)}${"y".repeat(2001)}${" ".repeat(2)}`,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(Array.from(result.fields), ["learningTopics", "currentProblem"]);
});

test("normalizeSurveyPayload enforces role required text counts email and consent", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    role: "未知角色",
    learningTopics: "",
    currentProblem: "",
    blakeCourseCount: "-1",
    aiCourseCount: "1000",
    email: "not-an-email",
    consent: false,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(
    Array.from(result.fields),
    ["role", "learningTopics", "currentProblem", "blakeCourseCount", "aiCourseCount", "email", "consent"],
  );
});

test("other role requires roleOther", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({ ...validPayload, role: "其他", roleOther: "" });
  assert.equal(result.ok, false);
  assert.deepEqual(Array.from(result.fields), ["roleOther"]);
});

test("website honeypot does not invalidate a legitimate payload", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    website: "  trap value  ",
  });
  assert.equal(result.ok, true);
});

test("normalizeSurveyPayload preserves a capped website honeypot value", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    website: `  ${"w".repeat(250)}  `,
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.website.length, 200);
  assert.equal(result.value.website, "w".repeat(200));
});

test("normalizeSurveyPayload caps roleOther at 100 characters", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    role: "其他",
    roleOther: `  ${"r".repeat(140)}  `,
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.roleOther.length, 100);
  assert.equal(result.value.roleOther, "r".repeat(100));
});

test("normalizeSurveyPayload caps submittedAtClient at 40 characters", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const result = core.normalizeSurveyPayload({
    ...validPayload,
    submittedAtClient: `  ${"2".repeat(60)}  `,
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.submittedAtClient.length, 40);
  assert.equal(result.value.submittedAtClient, "2".repeat(40));
});

test("buildSurveyRow preserves the fixed spreadsheet column order", () => {
  const core = loadScript("apps-script/survey/Core.gs");
  const normalized = core.normalizeSurveyPayload(validPayload).value;
  const row = core.buildSurveyRow(normalized, {
    serverTimestamp: "2026-09-01T02:00:00.000Z",
    submissionId: "submission-1",
  });
  assert.deepEqual(Array.from(core.SURVEY_HEADERS), [
    "server_timestamp", "client_timestamp", "role", "role_other",
    "learning_topics", "current_problem", "blake_course_count",
    "ai_course_count", "email", "consent", "request_id",
    "submission_id", "source",
  ]);
  assert.deepEqual(Array.from(row), [
    "2026-09-01T02:00:00.000Z", "2026-09-01T01:23:45.000Z", "上班族", "",
    "AI 自動化與工作流程", "希望縮短重複行政工作的時間", "2", "3",
    "learner@example.com", true, validPayload.requestId, "submission-1", "blake_mba_survey",
  ]);
});

test("handleSurveySubmission appends one fixed-order row", () => {
  const app = loadAppsScript();
  const services = fakeServices({ headers: Array.from(app.SURVEY_HEADERS) });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, submissionId: "submission-1" });
  assert.deepEqual(services.state.dataRows, [[
    "2026-09-01T02:00:00.000Z", "2026-09-01T01:23:45.000Z", "上班族", "",
    "AI 自動化與工作流程", "希望縮短重複行政工作的時間", "2", "3",
    "learner@example.com", true, validPayload.requestId, "submission-1", "blake_mba_survey",
  ]]);
  assert.deepEqual(services.state.cachePuts, [{
    key: `survey:${validPayload.requestId}`, value: "submission-1", ttl: 600,
  }]);
  assert.deepEqual(services.state.lockAttempts, [5000]);
  assert.equal(services.state.releasedLocks, 1);
});

test("duplicate requestId returns the cached submission without appending", () => {
  const app = loadAppsScript();
  const services = fakeServices({
    cached: "submission-existing",
    headers: Array.from(app.SURVEY_HEADERS),
  });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    ok: true, submissionId: "submission-existing", duplicate: true,
  });
  assert.deepEqual(services.state.dataRows, []);
  assert.deepEqual(services.state.cachePuts, []);
  assert.equal(services.state.openedSpreadsheetId, null);
  assert.equal(services.state.releasedLocks, 1);
});

test("missing spreadsheet configuration returns CONFIG_ERROR without opening a workbook", () => {
  const app = loadAppsScript();
  const services = fakeServices({ spreadsheetId: null });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    ok: false, code: "CONFIG_ERROR", message: "問卷尚未完成設定。",
  });
  assert.equal(services.state.openedSpreadsheetId, null);
  assert.deepEqual(services.state.dataRows, []);
  assert.equal(services.state.releasedLocks, 1);
});

test("lock timeout returns BUSY before reading workbook state", () => {
  const app = loadAppsScript();
  const services = fakeServices({ lockAcquired: false });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    ok: false, code: "BUSY", message: "目前送出較繁忙，請稍後再試。",
  });
  assert.deepEqual(services.state.lockAttempts, [5000]);
  assert.equal(services.state.openedSpreadsheetId, null);
  assert.equal(services.state.releasedLocks, 0);
});

test("honeypot submissions succeed without acquiring a lock or writing", () => {
  const app = loadAppsScript();
  const services = fakeServices();
  const result = app.handleSurveySubmission(JSON.stringify({ ...validPayload, website: "bot" }), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, submissionId: "submission-1" });
  assert.deepEqual(services.state.lockAttempts, []);
  assert.equal(services.state.openedSpreadsheetId, null);
  assert.deepEqual(services.state.dataRows, []);
});

test("absent dedicated worksheet is created before the response is appended", () => {
  const app = loadAppsScript();
  const services = fakeServices({ sheetExists: false });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.equal(result.ok, true);
  assert.equal(services.state.createdSheet, true);
  assert.deepEqual(services.state.headers, Array.from(app.SURVEY_HEADERS));
  assert.equal(services.state.dataRows.length, 1);
});

test("empty dedicated worksheet receives headers before its first response", () => {
  const app = loadAppsScript();
  const services = fakeServices({ headers: null });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.equal(result.ok, true);
  assert.equal(services.state.createdSheet, false);
  assert.deepEqual(services.state.headers, Array.from(app.SURVEY_HEADERS));
  assert.equal(services.state.dataRows.length, 1);
});

test("mismatched worksheet headers return SHEET_SCHEMA_MISMATCH without appending", () => {
  const app = loadAppsScript();
  const services = fakeServices({ headers: ["unexpected header"] });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    ok: false, code: "SHEET_SCHEMA_MISMATCH", message: "回覆工作表欄位不一致。",
  });
  assert.deepEqual(services.state.dataRows, []);
  assert.deepEqual(services.state.cachePuts, []);
  assert.equal(services.state.releasedLocks, 1);
});

test("worksheet write errors return WRITE_ERROR without a partial response row", () => {
  const app = loadAppsScript();
  const services = fakeServices({ headers: Array.from(app.SURVEY_HEADERS), writeError: "append" });
  const result = app.handleSurveySubmission(JSON.stringify(validPayload), services);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    ok: false, code: "WRITE_ERROR", message: "目前無法儲存回覆，請稍後再試。",
  });
  assert.deepEqual(services.state.dataRows, []);
  assert.deepEqual(services.state.cachePuts, []);
  assert.equal(services.state.releasedLocks, 1);
});
