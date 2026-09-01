const ROLES = new Set(["學生", "上班族", "主管／管理者", "創業者／自由工作者", "其他"]);
const COUNT_PATTERN = /^(0|[1-9][0-9]{0,2})$/;
const APPS_SCRIPT_PATH_PATTERN = /^\/macros\/s\/[^/?#]+\/exec$/i;
const LOCAL_PREVIEW_PATH = "/api/survey";

function cleanText(value) {
  return String(value ?? "").trim();
}

function isAllowedEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch (_error) {
    return false;
  }

  if (url.search || url.hash || url.username || url.password) return false;
  if (url.protocol === "https:" && url.hostname === "script.google.com") {
    return !url.port && APPS_SCRIPT_PATH_PATTERN.test(url.pathname);
  }
  if (url.protocol !== "http:" || !url.port || url.pathname !== LOCAL_PREVIEW_PATH) return false;
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return false;
  const port = Number(url.port);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

function randomHex(length) {
  return Math.floor(Math.random() * (16 ** length)).toString(16).padStart(length, "0");
}

export class SurveyTransportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveyTransportError";
    this.code = code;
  }
}

export function validateSurveyValues(values) {
  const errors = {};
  const role = cleanText(values.role);
  const roleOther = cleanText(values.roleOther);
  const learningTopics = cleanText(values.learningTopics);
  const currentProblem = cleanText(values.currentProblem);
  const email = cleanText(values.email);

  if (!ROLES.has(role)) errors.role = "請選擇目前的角色。";
  if (role === "其他" && !roleOther) errors.roleOther = "請填寫其他角色。";
  if (!learningTopics) errors.learningTopics = "請填寫最想學的課程主題。";
  else if (learningTopics.length > 300) errors.learningTopics = "課程主題請勿超過 300 個字。";
  if (!currentProblem) errors.currentProblem = "請填寫目前最想解決的問題。";
  else if (currentProblem.length > 2000) errors.currentProblem = "目前問題請勿超過 2000 個字。";
  for (const field of ["blakeCourseCount", "aiCourseCount"]) {
    const value = cleanText(values[field]);
    if (value && !COUNT_PATTERN.test(value)) errors[field] = "請輸入 0 到 999 的整數。";
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    errors.email = "請輸入有效的 Email。";
  }
  if (values.consent !== true) errors.consent = "請確認資料使用說明。";
  return errors;
}

export function createRequestId(cryptoObject = globalThis.crypto, now = Date.now) {
  if (typeof cryptoObject?.randomUUID === "function") return cryptoObject.randomUUID();
  if (typeof cryptoObject?.getRandomValues === "function") {
    const bytes = cryptoObject.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  const timestamp = Math.floor(now()).toString(16).padStart(12, "0").slice(-12);
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-4${randomHex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${randomHex(3)}-${randomHex(12)}`;
}

export function buildSurveyPayload(values, { requestId, submittedAtClient }) {
  return {
    requestId,
    role: cleanText(values.role),
    roleOther: cleanText(values.roleOther).slice(0, 100),
    learningTopics: cleanText(values.learningTopics),
    currentProblem: cleanText(values.currentProblem),
    blakeCourseCount: cleanText(values.blakeCourseCount),
    aiCourseCount: cleanText(values.aiCourseCount),
    email: cleanText(values.email),
    consent: values.consent === true,
    submittedAtClient: cleanText(submittedAtClient).slice(0, 40),
    website: cleanText(values.website).slice(0, 200),
  };
}

export async function submitSurvey(endpoint, payload, {
  fetchImpl = globalThis.fetch,
  timeoutMs = 15_000,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
} = {}) {
  if (!isAllowedEndpoint(endpoint) || typeof fetchImpl !== "function" || !Number.isFinite(timeoutMs) || timeoutMs <= 0
    || typeof setTimeoutImpl !== "function" || typeof clearTimeoutImpl !== "function") {
    throw new SurveyTransportError("CONFIG_ERROR", "問卷送出設定無效。");
  }

  const controller = new AbortController();
  let timer;
  let timedOut = false;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeoutImpl(() => {
        timedOut = true;
        controller.abort();
        reject(new SurveyTransportError("TIMEOUT", "送出逾時，尚未確認是否完成。"));
      }, timeoutMs);
    });
    const response = await Promise.race([
      fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
        signal: controller.signal,
      }),
      timeout,
    ]);
    if (!response || typeof response.ok !== "boolean") {
      throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
    }
    if (!response.ok) {
      throw new SurveyTransportError("HTTP_ERROR", `伺服器回應錯誤（${response.status}）。`);
    }

    let result;
    try {
      result = await response.json();
    } catch (_error) {
      throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
    }
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
    }
    if (result.ok !== true) {
      throw new SurveyTransportError(
        typeof result.code === "string" && result.code ? result.code : "API_ERROR",
        typeof result.message === "string" && result.message ? result.message : "送出未完成，請稍後再試。",
      );
    }
    if (typeof result.submissionId !== "string" || !result.submissionId.trim()) {
      throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
    }
    return result;
  } catch (error) {
    if (error instanceof SurveyTransportError) throw error;
    if (timedOut || (controller.signal.aborted && error?.name === "AbortError")) {
      throw new SurveyTransportError("TIMEOUT", "送出逾時，尚未確認是否完成。");
    }
    throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
  } finally {
    clearTimeoutImpl(timer);
  }
}

function fieldControl(form, name) {
  return form.elements?.namedItem(name) ?? null;
}

function controlsForField(form, name) {
  const controls = form.querySelectorAll?.(`[name="${name}"]`);
  if (controls?.length) return Array.from(controls);
  const control = fieldControl(form, name);
  return control && typeof control.setAttribute === "function" ? [control] : [];
}

export function readSurveyValues(form) {
  const valueFor = (name) => fieldControl(form, name)?.value ?? "";
  return {
    role: valueFor("role"),
    roleOther: valueFor("roleOther"),
    learningTopics: valueFor("learningTopics"),
    currentProblem: valueFor("currentProblem"),
    blakeCourseCount: valueFor("blakeCourseCount"),
    aiCourseCount: valueFor("aiCourseCount"),
    email: valueFor("email"),
    consent: fieldControl(form, "consent")?.checked === true,
    website: valueFor("website"),
  };
}

export function renderFieldErrors(form, errors) {
  for (const name of ["role", "roleOther", "learningTopics", "currentProblem", "blakeCourseCount", "aiCourseCount", "email", "consent"]) {
    const message = errors[name] ?? "";
    const errorElement = form.querySelector?.(`[data-field-error="${name}"]`);
    if (errorElement) errorElement.textContent = message;
    for (const control of controlsForField(form, name)) {
      if (message) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }
  }
}

export function initializeSurveyPage(root = document, dependencies = {}) {
  const form = root?.querySelector?.("[data-survey-form]");
  if (!form) return;

  const roleOtherWrap = root.querySelector("[data-role-other-wrap]");
  const roleOtherInput = fieldControl(form, "roleOther");
  const status = root.querySelector("[data-survey-status]");
  const successPanel = root.querySelector("[data-survey-success]");
  const submitButton = root.querySelector("button[type=submit]");
  const submitLabel = root.querySelector("[data-submit-label]");
  const now = dependencies.now ?? (() => new Date());
  const baseState = form.dataset.surveyEndpoint?.trim() ? "idle" : "preview";
  let pending = false;
  let pendingRequestId = "";

  const setState = (state) => {
    form.dataset.surveyState = state;
  };
  const setStatus = (message, type = "status", code = "") => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.dataset.statusCode = code;
    status.setAttribute("role", type === "error" ? "alert" : "status");
  };
  const clearStatus = () => {
    if (!status) return;
    status.hidden = true;
    status.textContent = "";
    delete status.dataset.statusCode;
    status.removeAttribute("role");
  };
  const setSubmitting = (isSubmitting) => {
    form.setAttribute("aria-busy", String(isSubmitting));
    if (submitButton) submitButton.disabled = isSubmitting;
    if (submitLabel) submitLabel.textContent = isSubmitting ? "正在送出…" : "送出回覆";
    form.classList?.toggle?.("is-loading", isSubmitting);
  };
  const updateRoleOther = () => {
    const isOther = fieldControl(form, "role")?.value === "其他";
    if (roleOtherWrap) roleOtherWrap.hidden = !isOther;
    if (roleOtherInput) roleOtherInput.disabled = !isOther;
    if (!isOther && roleOtherInput) {
      roleOtherInput.value = "";
      const errorElement = form.querySelector?.('[data-field-error="roleOther"]');
      if (errorElement) errorElement.textContent = "";
      roleOtherInput.removeAttribute("aria-invalid");
    }
  };

  setState(baseState);
  setSubmitting(false);
  if (baseState === "idle") clearStatus();
  updateRoleOther();
  form.addEventListener("change", (event) => {
    if (event.target?.name === "role") updateRoleOther();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;

    setState("validating");
    const values = readSurveyValues(form);
    const errors = validateSurveyValues(values);
    renderFieldErrors(form, errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      controlsForField(form, firstError)[0]?.focus();
      setState(baseState);
      return;
    }

    const endpoint = form.dataset.surveyEndpoint?.trim() ?? "";
    if (!endpoint) {
      setStatus("目前為預覽模式，尚未開放送出。", "error", "CONFIG_ERROR");
      setState("error");
      return;
    }

    pending = true;
    pendingRequestId ||= createRequestId(dependencies.cryptoObject);
    setState("submitting");
    setSubmitting(true);
    const payload = buildSurveyPayload(values, {
      requestId: pendingRequestId,
      submittedAtClient: now().toISOString(),
    });

    try {
      await submitSurvey(endpoint, payload, {
        fetchImpl: dependencies.fetchImpl,
        timeoutMs: 15_000,
        setTimeoutImpl: dependencies.setTimeoutImpl,
        clearTimeoutImpl: dependencies.clearTimeoutImpl,
      });
      clearStatus();
      form.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.focus();
      }
      pendingRequestId = "";
      setState("success");
      globalThis.blakeAnalytics?.trackEvent("generate_lead", {
        form_name: "course survey",
        inquiry_type: "learning needs",
        lead_source: "survey page",
      });
    } catch (error) {
      setStatus(error?.code === "TIMEOUT"
        ? "送出狀態尚未確認。你的內容仍保留，請稍後重新送出。"
        : "這次沒有送出成功。你的內容仍保留，請稍後再試。", "error", error?.code ?? "UNKNOWN_ERROR");
      setState("error");
    } finally {
      pending = false;
      setSubmitting(false);
    }
  });
}

if (typeof document !== "undefined" && document.querySelector("[data-survey-form]")) {
  initializeSurveyPage(document);
}
