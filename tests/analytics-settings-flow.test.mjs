import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const analyticsSource = readFileSync(
  fileURLToPath(new URL("../assets/analytics.js", import.meta.url)),
  "utf8",
);

function createElement(tagName) {
  const listeners = new Map();
  const element = {
    tagName: String(tagName).toUpperCase(),
    className: "",
    dataset: {},
    children: [],
    parentNode: null,
    hidden: false,
    focusCalls: [],
    textContent: "",
    append(...nodes) {
      for (const node of nodes) {
        node.parentNode = this;
        this.children.push(node);
      }
    },
    appendChild(node) {
      this.append(node);
      return node;
    },
    insertBefore(node, referenceNode) {
      const index = this.children.indexOf(referenceNode);
      assert.notEqual(index, -1, "reference node must belong to its parent");
      node.parentNode = this;
      this.children.splice(index, 0, node);
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    emit(type, event = {}) {
      listeners.get(type)?.({ target: this, ...event });
    },
    focus(options) {
      this.focusCalls.push(options);
    },
    closest(selector) {
      if (selector === "[data-analytics-choice]" && this.dataset.analyticsChoice) {
        return this;
      }
      return null;
    },
    querySelector(selector) {
      if (selector !== "[data-analytics-choice]") return null;
      return findElement(this, (candidate) => candidate.dataset.analyticsChoice);
    },
  };

  Object.defineProperty(element, "innerHTML", {
    set(value) {
      this._innerHTML = value;
      if (!String(value).includes("data-analytics-choice")) return;
      const denied = createElement("button");
      denied.dataset.analyticsChoice = "denied";
      const granted = createElement("button");
      granted.dataset.analyticsChoice = "granted";
      this.append(denied, granted);
    },
    get() {
      return this._innerHTML || "";
    },
  });

  return element;
}

function findElement(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) {
    const match = findElement(child, predicate);
    if (match) return match;
  }
  return null;
}

function renderConsentUi(
  storedChoice = null,
  { withMain = true, withFooter = true } = {},
) {
  const body = createElement("body");
  const main = withMain ? createElement("main") : null;
  const footer = withFooter ? createElement("footer") : null;
  body.append(...[main, footer].filter(Boolean));

  const document = {
    readyState: "complete",
    body,
    head: createElement("head"),
    createElement,
    querySelector(selector) {
      if (selector === "footer") return footer;
      if (selector === "main") return main;
      return null;
    },
    addEventListener() {},
  };
  const window = {
    dataLayer: [],
    document,
    location: {
      href: "https://blake.mba/contact/",
      origin: "https://blake.mba",
    },
    localStorage: {
      getItem() {
        return storedChoice;
      },
      setItem() {},
    },
  };
  window.window = window;

  vm.runInContext(
    analyticsSource,
    vm.createContext({
      window,
      document,
      localStorage: window.localStorage,
      console,
      Date,
      URL,
      globalThis: window,
      self: window,
    }),
  );

  return { body, footer, main };
}

test("analytics settings renders in a normal-flow slot immediately before the footer", () => {
  const { body, footer } = renderConsentUi();
  const settingsButton = findElement(
    body,
    (element) => element.className === "analytics-settings",
  );

  assert.ok(settingsButton, "settings button should render");
  assert.equal(settingsButton.parentNode.className, "analytics-settings-region");
  assert.equal(settingsButton.parentNode.parentNode, body);
  assert.equal(
    body.children.indexOf(settingsButton.parentNode) + 1,
    body.children.indexOf(footer),
  );
});

test("analytics settings styles never anchor the control to the viewport", () => {
  const css = readFileSync(
    fileURLToPath(new URL("../assets/analytics.css", import.meta.url)),
    "utf8",
  );
  const settingsRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
    ([, selectors]) =>
      selectors
        .split(",")
        .some((selector) =>
          /\.analytics-settings(?:-region)?(?:\b|:)/.test(selector.trim()),
        ),
  );

  assert.ok(settingsRules.length > 0, "settings styles should exist");
  assert.ok(
    settingsRules.some(([, selectors]) =>
      selectors.split(",").some((selector) =>
        /\.analytics-settings-region(?:\b|:)/.test(selector.trim()),
      ),
    ),
    "settings region styles should be checked",
  );
  for (const [, selectors, declarations] of settingsRules) {
    const position = declarations.match(
      /(?:^|;)\s*position\s*:\s*([^;]+)/i,
    )?.[1].trim();
    if (position) {
      assert.match(
        position,
        /^(?:static|relative)$/i,
        `out-of-flow positioning found in ${selectors.trim()}`,
      );
    }
    assert.doesNotMatch(
      declarations,
      /(?:^|;)\s*(?:inset|top|right|bottom|left)\s*:/i,
      `viewport inset found in ${selectors.trim()}`,
    );
  }
});

test("initial consent choice focuses main without changing the scroll position", () => {
  const { body, main } = renderConsentUi();
  const banner = findElement(
    body,
    (element) => element.className === "analytics-consent",
  );
  const settingsButton = findElement(
    body,
    (element) => element.className === "analytics-settings",
  );
  const deniedButton = findElement(
    banner,
    (element) => element.dataset.analyticsChoice === "denied",
  );

  banner.emit("click", { target: deniedButton });

  assert.equal(banner.hidden, true);
  assert.equal(main.tabindex, "-1");
  assert.equal(main.focusCalls.length, 1);
  assert.equal(main.focusCalls[0]?.preventScroll, true);
  assert.equal(settingsButton.focusCalls.length, 0);
});

test("consent choice returns focus to settings when settings opened the banner", () => {
  const { body, main } = renderConsentUi("denied");
  const banner = findElement(
    body,
    (element) => element.className === "analytics-consent",
  );
  const settingsButton = findElement(
    body,
    (element) => element.className === "analytics-settings",
  );
  const grantedButton = findElement(
    banner,
    (element) => element.dataset.analyticsChoice === "granted",
  );

  settingsButton.emit("click");
  banner.emit("click", { target: grantedButton });

  assert.equal(banner.hidden, true);
  assert.equal(settingsButton.focusCalls.length, 1);
  assert.equal(settingsButton.focusCalls[0]?.preventScroll, true);
  assert.equal(main.focusCalls.length, 0);
});

test("initial consent choice falls back to settings when main is unavailable", () => {
  const { body } = renderConsentUi(null, { withMain: false });
  const banner = findElement(
    body,
    (element) => element.className === "analytics-consent",
  );
  const settingsButton = findElement(
    body,
    (element) => element.className === "analytics-settings",
  );
  const deniedButton = findElement(
    banner,
    (element) => element.dataset.analyticsChoice === "denied",
  );

  banner.emit("click", { target: deniedButton });

  assert.equal(banner.hidden, true);
  assert.equal(settingsButton.focusCalls.length, 1);
  assert.equal(settingsButton.focusCalls[0]?.preventScroll, true);
});
