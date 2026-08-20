import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

function createAnalyticsSandbox() {
  const listeners = new Map();
  const appendedNodes = [];
  const dataLayer = [];

  const document = {
    readyState: "loading",
    head: {
      appendChild(node) {
        appendedNodes.push(node);
        return node;
      },
    },
    body: {
      append() {},
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    createElement(tagName) {
      return {
        tagName: String(tagName).toUpperCase(),
        dataset: {},
        style: {},
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener() {},
        querySelector() {
          return null;
        },
        focus() {},
      };
    },
  };

  const window = {
    dataLayer,
    location: {
      href: "https://blake.mba/contact/",
      origin: "https://blake.mba",
    },
    localStorage: {
      getItem(key) {
        return key === "blake_analytics_consent_v1" ? "granted" : null;
      },
      setItem() {},
    },
  };

  window.window = window;
  window.document = document;
  window.addEventListener = () => {};
  window.removeEventListener = () => {};

  const context = vm.createContext({
    window,
    document,
    localStorage: window.localStorage,
    console,
    Date,
    URL,
    setTimeout,
    clearTimeout,
  });

  context.globalThis = window;
  context.self = window;

  return { window, document, listeners, appendedNodes, context };
}

test("generate_lead retains lead_source and drops personal fields", () => {
  const { window } = createAnalyticsSandbox();
  const source = readFileSync(fileURLToPath(new URL("../assets/analytics.js", import.meta.url)), "utf8");

  vm.runInContext(source, vm.createContext({
    ...window,
    window,
    document: window.document,
    localStorage: window.localStorage,
    console,
    Date,
    URL,
    setTimeout,
    clearTimeout,
    globalThis: window,
    self: window,
  }));

  window.blakeAnalytics.trackEvent("generate_lead", {
    form_name: "coaching inquiry",
    inquiry_type: "book_call",
    lead_source: "homepage hero",
    姓名: "測試使用者",
    Email: "test@example.com",
    message: "please reach out",
  });

  const leadEvent = window.dataLayer.find((entry) => entry?.event === "generate_lead");
  const normalizedLeadEvent = Object.fromEntries(Object.entries(leadEvent));

  assert.deepEqual(normalizedLeadEvent, {
    event: "generate_lead",
    form_name: "coaching inquiry",
    inquiry_type: "book_call",
    lead_source: "homepage hero",
  });
  assert.ok(!("姓名" in normalizedLeadEvent));
  assert.ok(!("Email" in normalizedLeadEvent));
  assert.ok(!("message" in normalizedLeadEvent));
});
