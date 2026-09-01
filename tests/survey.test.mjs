import test from "node:test";
import assert from "node:assert/strict";
import { attribute, read, tagWithAttribute } from "./helpers/site-files.mjs";
import {
  SurveyTransportError,
  buildSurveyPayload,
  createRequestId,
  initializeSurveyPage,
  submitSurvey,
  validateSurveyValues,
} from "../assets/survey.js";

test("survey page exposes the approved accessible contract", () => {
  const html = read("survey/index.html");
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /data-survey-form/);
  assert.match(html, /你目前的角色/);
  assert.match(html, /你今天最想學哪些課程主題？/);
  assert.match(html, /你目前最想解決的一個問題是什麼？/);
  assert.match(html, /上過幾次我的課？/);
  assert.match(html, /上過幾次 AI 的課？/);
  assert.match(html, /如果願意收到後續課程資訊/);
  assert.match(html, /data-survey-status[^>]*aria-live="polite"/);
  assert.match(html, /data-survey-success/);
  assert.match(html, /name="website"[^>]*tabindex="-1"/);
  assert.match(html, /\/assets\/survey\.css\?v=20260901survey1/);
  assert.match(html, /\/assets\/survey\.js\?v=20260901survey1/);
});

test("survey page loads the analytics bootstrap before its controller", () => {
  const html = read("survey/index.html");
  const analyticsIndex = html.indexOf('<script src="/assets/analytics.js"></script>');
  const controllerIndex = html.indexOf('<script type="module" src="/assets/survey.js?v=20260901survey1"></script>');
  assert.ok(analyticsIndex >= 0, "survey page loads the existing analytics bootstrap");
  assert.ok(controllerIndex > analyticsIndex, "analytics bootstrap loads before the survey controller");
});

function tagById(html, tagName, id) {
  return html.match(new RegExp(`<${tagName}\\b(?=[^>]*\\bid="${id}")[^>]*>`, "i"))?.[0] ?? "";
}

function hasBooleanAttribute(tag, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|>|=)`, "i").test(tag);
}

function blockForTag(html, startTag, closingTag) {
  const start = html.indexOf(startTag);
  assert.ok(start >= 0, `missing block start: ${startTag}`);
  const end = html.indexOf(closingTag, start);
  assert.ok(end >= 0, `missing block end: ${closingTag}`);
  return html.slice(start, end + closingTag.length);
}

test("survey page preserves exact field names states and standalone boundaries", () => {
  const html = read("survey/index.html");
  const form = tagWithAttribute(html, "form", "data-survey-form");
  assert.equal(attribute(form, "data-survey-endpoint"), "");
  assert.doesNotMatch(html, /data-site-nav/);
  assert.doesNotMatch(html, /assets\/site\.js/);
  assert.match(html, />目前為預覽模式，尚未開放送出</);
  assert.match(html, /\/assets\/survey\.css\?v=20260901survey1/);
  assert.match(html, /\/assets\/survey\.js\?v=20260901survey1/);

  for (const field of [
    "role", "roleOther", "learningTopics", "currentProblem",
    "blakeCourseCount", "aiCourseCount", "email", "consent",
  ]) {
    assert.match(html, new RegExp(`data-field-error="${field}"`), field);
  }

  const roleFieldset = tagWithAttribute(html, "fieldset", "data-role-group");
  assert.equal(attribute(roleFieldset, "aria-describedby"), "role-error");
  for (const [id, value, label] of [
    ["role-student", "學生", "學生"],
    ["role-worker", "上班族", "上班族"],
    ["role-manager", "主管／管理者", "主管／管理者"],
    ["role-founder", "創業者／自由工作者", "創業者／自由工作者"],
    ["role-other", "其他", "其他"],
  ]) {
    const input = tagById(html, "input", id);
    assert.equal(attribute(input, "name"), "role", id);
    assert.equal(attribute(input, "value"), value, id);
    assert.match(html, new RegExp(`<label\\b[^>]*for="${id}"[^>]*>\\s*${label}\\s*</label>`), id);
  }
  assert.equal(hasBooleanAttribute(tagById(html, "input", "role-student"), "required"), true);

  assert.equal(attribute(tagById(html, "input", "role-other-text"), "name"), "roleOther");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "role-other-text"), "required"), false);
  assert.equal(attribute(tagById(html, "input", "learning-topics"), "name"), "learningTopics");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "learning-topics"), "required"), true);
  assert.equal(attribute(tagById(html, "textarea", "current-problem"), "name"), "currentProblem");
  assert.equal(hasBooleanAttribute(tagById(html, "textarea", "current-problem"), "required"), true);
  assert.equal(attribute(tagById(html, "input", "blake-course-count"), "name"), "blakeCourseCount");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "blake-course-count"), "required"), false);
  assert.equal(attribute(tagById(html, "input", "ai-course-count"), "name"), "aiCourseCount");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "ai-course-count"), "required"), false);
  assert.equal(attribute(tagById(html, "input", "email"), "name"), "email");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "email"), "required"), false);
  assert.equal(attribute(tagById(html, "input", "survey-consent"), "name"), "consent");
  assert.equal(hasBooleanAttribute(tagById(html, "input", "survey-consent"), "required"), true);
  assert.match(html, /<label\b[^>]*for="survey-consent"[^>]*>/);
  assert.equal(attribute(tagById(html, "input", "website"), "name"), "website");
  assert.equal(attribute(tagById(html, "input", "website"), "tabindex"), "-1");
});

test("survey role fieldset avoids an unnamed redundant radiogroup", () => {
  const html = read("survey/index.html");
  const roleFieldset = tagWithAttribute(html, "fieldset", "data-role-group");
  assert.equal(attribute(roleFieldset, "aria-describedby"), "role-error");
  const roleBlock = blockForTag(html, roleFieldset, "</fieldset>");
  assert.doesNotMatch(roleBlock, /\srole="radiogroup"/);
});

test("survey CSS preserves BLAKE tokens and accessibility states", () => {
  const css = read("assets/survey.css");
  for (const token of ["#0b1d2a", "#f3eee5", "#ff6534", "#3153d8", "#a8d9cf"]) {
    assert.match(css, new RegExp(token));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test("survey CSS locks the approved responsive and state contract", () => {
  const css = read("assets/survey.css");
  for (const width of ["1020", "760", "430", "340"]) {
    assert.match(css, new RegExp(`@media\\s*\\(max-width:\\s*${width}px\\)`), width);
  }
  assert.match(css, /grid-template-columns:\s*minmax\(240px,\s*0\.72fr\)\s*minmax\(0,\s*1\.28fr\)/);
  assert.match(css, /border-radius:\s*28px/);
  assert.match(css, /\.is-invalid/);
  assert.match(css, /\[aria-invalid="true"\]/);
  assert.match(css, /disabled/);
  assert.match(css, /is-loading/);
  assert.match(css, /is-success/);
});


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

function createFakeElement({ name = "", value = "", checked = false } = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();
  return {
    name,
    value,
    checked,
    disabled: false,
    hidden: false,
    textContent: "",
    dataset: {},
    focusCount: 0,
    classList: {
      add(...names) { names.forEach((className) => classes.add(className)); },
      remove(...names) { names.forEach((className) => classes.delete(className)); },
      contains(name) { return classes.has(name); },
    },
    setAttribute(name, attributeValue) { attributes.set(name, String(attributeValue)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    focus() { this.focusCount += 1; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    async emit(type, event = {}) { return listeners.get(type)?.({ target: this, ...event }); },
  };
}

function createSurveyFixture({ endpoint = "", values = validValues } = {}) {
  const controls = Object.fromEntries(Object.entries(values).map(([name, value]) => [
    name,
    createFakeElement({ name, value: typeof value === "boolean" ? "true" : value, checked: value === true }),
  ]));
  const roleChoices = ["學生", "上班族", "主管／管理者", "創業者／自由工作者", "其他"].map((value) =>
    createFakeElement({ name: "role", value, checked: values.role === value }),
  );
  const fieldErrors = Object.fromEntries([
    "role", "roleOther", "learningTopics", "currentProblem", "blakeCourseCount", "aiCourseCount", "email", "consent",
  ].map((name) => [name, createFakeElement()]));
  const submitButton = createFakeElement();
  const submitLabel = createFakeElement();
  const status = createFakeElement();
  status.textContent = "目前為預覽模式，尚未開放送出";
  const successPanel = createFakeElement();
  successPanel.hidden = true;
  const roleOtherWrap = createFakeElement();
  roleOtherWrap.hidden = true;
  const listeners = new Map();
  const form = createFakeElement();
  form.dataset.surveyEndpoint = endpoint;
  form.elements = {
    namedItem(name) {
      if (name === "role") {
        return { get value() { return roleChoices.find((choice) => choice.checked)?.value ?? ""; } };
      }
      return controls[name] ?? null;
    },
  };
  form.addEventListener = (type, listener) => listeners.set(type, listener);
  form.submit = async () => listeners.get("submit")?.({ preventDefault() {} });
  form.changeRole = async (value) => {
    roleChoices.forEach((choice) => { choice.checked = choice.value === value; });
    return listeners.get("change")?.({ target: roleChoices.find((choice) => choice.checked) });
  };
  const root = {
    querySelector(selector) {
      if (selector === "[data-survey-form]") return form;
      if (selector === "[data-role-other-wrap]") return roleOtherWrap;
      if (selector === "[data-survey-status]") return status;
      if (selector === "[data-survey-success]") return successPanel;
      if (selector === "[data-submit-label]") return submitLabel;
      if (selector === "button[type=submit]") return submitButton;
      const match = selector.match(/^\[data-field-error="(.+)"\]$/);
      return match ? fieldErrors[match[1]] ?? null : null;
    },
  };
  form.querySelector = root.querySelector;
  form.querySelectorAll = (selector) => {
    const match = selector.match(/^\[name="(.+)"\]$/);
    if (match?.[1] === "role") return roleChoices;
    return match?.[1] && controls[match[1]] ? [controls[match[1]]] : [];
  };
  return { root, form, controls, roleChoices, fieldErrors, submitButton, submitLabel, status, successPanel, roleOtherWrap };
}

test("controller reveals other role then clears it and its error when switching away", async () => {
  const fixture = createSurveyFixture({ values: { ...validValues, role: "其他", roleOther: "顧問" } });
  initializeSurveyPage(fixture.root, { now: () => new Date("2026-09-01T01:23:45.000Z") });

  await fixture.form.changeRole("其他");
  assert.equal(fixture.roleOtherWrap.hidden, false);
  await fixture.form.changeRole("上班族");

  assert.equal(fixture.controls.roleOther.value, "");
  assert.equal(fixture.roleOtherWrap.hidden, true);
  assert.equal(fixture.fieldErrors.roleOther.textContent, "");
  assert.equal(fixture.controls.roleOther.getAttribute("aria-invalid"), null);
});

test("controller renders invalid fields and focuses the first error without submitting", async () => {
  let fetchCalls = 0;
  const fixture = createSurveyFixture({ values: { ...validValues, learningTopics: "", consent: false } });
  initializeSurveyPage(fixture.root, {
    fetchImpl: async () => { fetchCalls += 1; return new Response(JSON.stringify({ ok: true })); },
    now: () => new Date("2026-09-01T01:23:45.000Z"),
  });

  await fixture.form.submit();

  assert.equal(fixture.controls.learningTopics.getAttribute("aria-invalid"), "true");
  assert.equal(fixture.fieldErrors.learningTopics.textContent, "請填寫最想學的課程主題。");
  assert.equal(fixture.controls.learningTopics.focusCount, 1);
  assert.equal(fetchCalls, 0);
});

test("controller retains preview mode and exposes CONFIG_ERROR without a request", async () => {
  let fetchCalls = 0;
  const fixture = createSurveyFixture();
  initializeSurveyPage(fixture.root, {
    fetchImpl: async () => { fetchCalls += 1; return new Response(JSON.stringify({ ok: true })); },
    now: () => new Date("2026-09-01T01:23:45.000Z"),
  });

  await fixture.form.submit();

  assert.equal(fixture.status.hidden, false);
  assert.match(fixture.status.textContent, /預覽模式/);
  assert.equal(fixture.status.dataset.statusCode, "CONFIG_ERROR");
  assert.equal(fixture.form.hidden, false);
  assert.equal(fetchCalls, 0);
});

test("controller clears the preview notice when a configured form starts idle", () => {
  const fixture = createSurveyFixture({ endpoint: "http://localhost:4173/api/survey" });
  initializeSurveyPage(fixture.root, { now: () => new Date("2026-09-01T01:23:45.000Z") });

  assert.equal(fixture.form.dataset.surveyState, "idle");
  assert.equal(fixture.status.hidden, true);
  assert.equal(fixture.status.textContent, "");
  assert.equal(fixture.status.getAttribute("role"), null);
});

test("controller shows pending state and prevents a duplicate request", async () => {
  let resolveFetch;
  let fetchCalls = 0;
  const fixture = createSurveyFixture({ endpoint: "http://localhost:4173/api/survey" });
  initializeSurveyPage(fixture.root, {
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Promise((resolve) => { resolveFetch = resolve; });
    },
    cryptoObject: { randomUUID: () => "request-1" },
    now: () => new Date("2026-09-01T01:23:45.000Z"),
  });

  const pending = fixture.form.submit();
  assert.equal(fixture.form.getAttribute("aria-busy"), "true");
  assert.equal(fixture.submitButton.disabled, true);
  assert.equal(fixture.submitLabel.textContent, "正在送出…");
  await fixture.form.submit();
  assert.equal(fetchCalls, 1);
  resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  await pending;
});

test("controller reveals success and tracks only approved lead metadata after confirmed success", async () => {
  const originalAnalytics = globalThis.blakeAnalytics;
  const events = [];
  globalThis.blakeAnalytics = { trackEvent: (name, data) => events.push({ name, data }) };
  const fixture = createSurveyFixture({ endpoint: "http://localhost:4173/api/survey" });
  try {
    initializeSurveyPage(fixture.root, {
      fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      cryptoObject: { randomUUID: () => "request-1" },
      now: () => new Date("2026-09-01T01:23:45.000Z"),
    });
    await fixture.form.submit();

    assert.equal(fixture.form.hidden, true);
    assert.equal(fixture.successPanel.hidden, false);
    assert.equal(fixture.successPanel.focusCount, 1);
    assert.deepEqual(events, [{
      name: "generate_lead",
      data: { form_name: "course survey", inquiry_type: "learning needs", lead_source: "survey page" },
    }]);
    assert.deepEqual(Object.keys(events[0].data), ["form_name", "inquiry_type", "lead_source"]);
  } finally {
    globalThis.blakeAnalytics = originalAnalytics;
  }
});

test("controller preserves values and request id after API failure or timeout so retry can succeed", async () => {
  const bodies = [];
  let attempt = 0;
  const fixture = createSurveyFixture({ endpoint: "http://localhost:4173/api/survey" });
  initializeSurveyPage(fixture.root, {
    fetchImpl: async (_url, options) => {
      bodies.push(JSON.parse(options.body));
      attempt += 1;
      if (attempt === 1) throw new SurveyTransportError("TIMEOUT", "timed out");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
    cryptoObject: { randomUUID: () => "retry-request" },
    now: () => new Date("2026-09-01T01:23:45.000Z"),
  });

  await fixture.form.submit();
  assert.equal(fixture.controls.learningTopics.value, validValues.learningTopics);
  assert.equal(fixture.submitButton.disabled, false);
  assert.equal(fixture.status.getAttribute("role"), "alert");
  assert.match(fixture.status.textContent, /尚未確認/);
  await fixture.form.submit();

  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].requestId, "retry-request");
  assert.equal(bodies[1].requestId, "retry-request");
  assert.equal(fixture.successPanel.hidden, false);
  assert.equal(fixture.status.hidden, true);
  assert.equal(fixture.status.textContent, "");
  assert.equal(fixture.status.getAttribute("role"), null);
});

test("controller keeps values and restores retry controls after an API failure", async () => {
  const fixture = createSurveyFixture({ endpoint: "http://localhost:4173/api/survey" });
  initializeSurveyPage(fixture.root, {
    fetchImpl: async () => new Response(JSON.stringify({ ok: false, code: "WRITE_ERROR" }), { status: 200 }),
    cryptoObject: { randomUUID: () => "failed-request" },
    now: () => new Date("2026-09-01T01:23:45.000Z"),
  });

  await fixture.form.submit();

  assert.equal(fixture.controls.currentProblem.value, validValues.currentProblem);
  assert.equal(fixture.submitButton.disabled, false);
  assert.equal(fixture.submitLabel.textContent, "送出回覆");
  assert.equal(fixture.status.getAttribute("role"), "alert");
  assert.match(fixture.status.textContent, /沒有送出成功/);
  assert.equal(fixture.successPanel.hidden, true);
});

test("survey lead analytics call excludes every survey field and identifier", () => {
  const source = read("assets/survey.js");
  const trackingCall = source.match(/trackEvent\("generate_lead",\s*\{([\s\S]*?)\}\s*\);/);
  assert.ok(trackingCall, "confirmed lead tracking call is present");
  for (const disallowedKey of ["role", "learningTopics", "currentProblem", "blakeCourseCount", "aiCourseCount", "email", "requestId", "submissionId"]) {
    assert.doesNotMatch(trackingCall[1], new RegExp(`\\b${disallowedKey}\\b`, "i"), disallowedKey);
  }
});

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
