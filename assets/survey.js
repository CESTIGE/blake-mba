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
} = {}) {
  if (!isAllowedEndpoint(endpoint) || typeof fetchImpl !== "function" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new SurveyTransportError("CONFIG_ERROR", "問卷送出設定無效。");
  }

  const controller = new AbortController();
  let timer;
  let timedOut = false;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
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
    return result;
  } catch (error) {
    if (error instanceof SurveyTransportError) throw error;
    if (timedOut || (controller.signal.aborted && error?.name === "AbortError")) {
      throw new SurveyTransportError("TIMEOUT", "送出逾時，尚未確認是否完成。");
    }
    throw new SurveyTransportError("INVALID_RESPONSE", "無法讀取伺服器回應。");
  } finally {
    clearTimeout(timer);
  }
}
