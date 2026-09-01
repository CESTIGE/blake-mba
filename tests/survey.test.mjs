import test from "node:test";
import assert from "node:assert/strict";
import {
  SurveyTransportError,
  buildSurveyPayload,
  createRequestId,
  submitSurvey,
  validateSurveyValues,
} from "../assets/survey.js";

const validValues = {
  role: "上班族",
  roleOther: "",
  learningTopics: "AI 工作效率",
  currentProblem: "想建立可重複的 AI 工作流程",
  blakeCourseCount: "2",
  aiCourseCount: "3",
  email: "learner@example.com",
  consent: true,
  website: "",
};

test("validateSurveyValues returns field-specific errors", () => {
  assert.deepEqual(validateSurveyValues({
    ...validValues,
    learningTopics: "",
    aiCourseCount: "-1",
    email: "invalid",
    consent: false,
  }), {
    learningTopics: "請填寫最想學的課程主題。",
    aiCourseCount: "請輸入 0 到 999 的整數。",
    email: "請輸入有效的 Email。",
    consent: "請確認資料使用說明。",
  });
});

test("validateSurveyValues requires other role text and enforces server text limits", () => {
  assert.deepEqual(validateSurveyValues({
    ...validValues,
    role: "其他",
    roleOther: "   ",
    learningTopics: "x".repeat(301),
    currentProblem: "y".repeat(2001),
  }), {
    roleOther: "請填寫其他角色。",
    learningTopics: "課程主題請勿超過 300 個字。",
    currentProblem: "目前問題請勿超過 2000 個字。",
  });
});

test("validateSurveyValues accepts optional email and exact text limits", () => {
  assert.deepEqual(validateSurveyValues({
    ...validValues,
    email: "",
    learningTopics: "x".repeat(300),
    currentProblem: "y".repeat(2000),
  }), {});
});

test("buildSurveyPayload keeps only the public contract", () => {
  assert.deepEqual(buildSurveyPayload(validValues, {
    requestId: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
    submittedAtClient: "2026-09-01T01:23:45.000Z",
  }), {
    requestId: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
    ...validValues,
    submittedAtClient: "2026-09-01T01:23:45.000Z",
  });
});

test("createRequestId prefers randomUUID", () => {
  const id = createRequestId({ randomUUID: () => "uuid-from-browser" });
  assert.equal(id, "uuid-from-browser");
});

test("createRequestId uses RFC4122-shaped random bytes when randomUUID is unavailable", () => {
  let usedRandomBytes = false;
  const id = createRequestId({
    getRandomValues(bytes) {
      usedRandomBytes = true;
      bytes.set(Array.from({ length: bytes.length }, (_, index) => index));
      return bytes;
    },
  });
  assert.equal(usedRandomBytes, true);
  assert.equal(id, "00010203-0405-4607-8809-0a0b0c0d0e0f");
});

test("createRequestId retains timestamp and Math.random entropy as the compatibility fallback", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    const first = createRequestId({}, () => 1_725_154_625_000);
    Math.random = () => 0.75;
    const second = createRequestId({}, () => 1_725_154_625_000);
    assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(second, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.notEqual(first, second);
  } finally {
    Math.random = originalRandom;
  }
});

test("submitSurvey posts readable text/plain JSON and returns confirmed success", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true, submissionId: "submission-1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const result = await submitSurvey("https://script.google.com/macros/s/example/exec", { requestId: "id" }, { fetchImpl, timeoutMs: 1000 });
  assert.equal(result.submissionId, "submission-1");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers["Content-Type"], "text/plain;charset=utf-8");
  assert.equal(calls[0].options.redirect, "follow");
  assert.equal(calls[0].options.body, JSON.stringify({ requestId: "id" }));
});

test("submitSurvey permits only Apps Script exec and loopback preview endpoints", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  for (const endpoint of [
    "https://script.google.com/macros/s/example/exec",
    "http://localhost:4173/api/survey",
    "http://127.0.0.1:4173/api/survey",
  ]) {
    await assert.doesNotReject(submitSurvey(endpoint, {}, { fetchImpl, timeoutMs: 1000 }));
  }
  for (const endpoint of [
    "http://script.google.com/macros/s/example/exec",
    "https://example.com/api/survey",
    "http://localhost/api/survey",
    "http://localhost:4173/api/other",
    "https://script.google.com/macros/s/example/exec/extra",
  ]) {
    await assert.rejects(
      submitSurvey(endpoint, {}, { fetchImpl, timeoutMs: 1000 }),
      (error) => error instanceof SurveyTransportError && error.code === "CONFIG_ERROR",
    );
  }
});

test("submitSurvey rejects an Apps Script URL with a nonstandard port", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  await assert.rejects(
    submitSurvey("https://script.google.com:444/macros/s/example/exec", {}, { fetchImpl, timeoutMs: 1000 }),
    (error) => error instanceof SurveyTransportError && error.code === "CONFIG_ERROR",
  );
});

test("submitSurvey rejects an Apps Script URL with a username", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  await assert.rejects(
    submitSurvey("https://user@script.google.com/macros/s/example/exec", {}, { fetchImpl, timeoutMs: 1000 }),
    (error) => error instanceof SurveyTransportError && error.code === "CONFIG_ERROR",
  );
});

test("submitSurvey rejects an Apps Script URL with a password", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  await assert.rejects(
    submitSurvey("https://user:password@script.google.com/macros/s/example/exec", {}, { fetchImpl, timeoutMs: 1000 }),
    (error) => error instanceof SurveyTransportError && error.code === "CONFIG_ERROR",
  );
});

test("submitSurvey converts an aborted request into a timeout error", async () => {
  const fetchImpl = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  });
  await assert.rejects(
    submitSurvey("http://127.0.0.1:4173/api/survey", {}, { fetchImpl, timeoutMs: 10 }),
    (error) => error instanceof SurveyTransportError && error.code === "TIMEOUT",
  );
});

test("submitSurvey exposes readable API errors", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    ok: false,
    code: "WRITE_ERROR",
    message: "目前無法儲存回覆，請稍後再試。",
  }), { status: 200 });
  await assert.rejects(
    submitSurvey("https://script.google.com/macros/s/example/exec", {}, { fetchImpl, timeoutMs: 1000 }),
    (error) => error instanceof SurveyTransportError
      && error.code === "WRITE_ERROR"
      && error.message === "目前無法儲存回覆，請稍後再試。",
  );
});

test("submitSurvey rejects unreadable JSON and non-success HTTP responses", async () => {
  await assert.rejects(
    submitSurvey("https://script.google.com/macros/s/example/exec", {}, {
      fetchImpl: async () => new Response("not json", { status: 200 }),
      timeoutMs: 1000,
    }),
    (error) => error instanceof SurveyTransportError && error.code === "INVALID_RESPONSE",
  );
  await assert.rejects(
    submitSurvey("https://script.google.com/macros/s/example/exec", {}, {
      fetchImpl: async () => new Response("unavailable", { status: 503 }),
      timeoutMs: 1000,
    }),
    (error) => error instanceof SurveyTransportError && error.code === "HTTP_ERROR",
  );
});
