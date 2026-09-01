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
