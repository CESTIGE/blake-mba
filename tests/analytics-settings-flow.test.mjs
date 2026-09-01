import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const analyticsSource = readFileSync(
  fileURLToPath(new URL("../assets/analytics.js", import.meta.url)),
  "utf8",
);

function runAnalytics(storedChoice = null) {
  const documentListeners = new Map();
  const headChildren = [];
  const bodyChildren = [];
  const document = {
    readyState: "complete",
    head: {
      appendChild(node) {
        headChildren.push(node);
        return node;
      },
    },
    body: {
      append(...nodes) {
        bodyChildren.push(...nodes);
      },
      appendChild(node) {
        bodyChildren.push(node);
        return node;
      },
    },
    createElement(tagName) {
      return {
        tagName: String(tagName).toUpperCase(),
        className: "",
        dataset: {},
      };
    },
    addEventListener(type, handler) {
      documentListeners.set(type, handler);
    },
  };
  const window = {
    dataLayer: [],
    document,
    location: {
      href: "https://blake.mba/courses/",
      origin: "https://blake.mba",
    },
    localStorage: {
      getItem() {
        return storedChoice;
      },
    },
  };
  window.window = window;

  vm.runInContext(
    analyticsSource,
    vm.createContext({
      window,
      document,
      console,
      Date,
      URL,
      globalThis: window,
      self: window,
    }),
  );

  return {
    window,
    headChildren,
    bodyChildren,
    click(target) {
      documentListeners.get("click")?.({ target });
    },
  };
}

function consentCommands(dataLayer, action) {
  return dataLayer.filter(
    (entry) => entry?.[0] === "consent" && entry?.[1] === action,
  );
}

for (const storedChoice of [null, "denied", "invalid", "granted"]) {
  test(`analytics has no consent UI for stored choice ${String(storedChoice)}`, () => {
    const { window, headChildren, bodyChildren } = runAnalytics(storedChoice);

    const defaults = consentCommands(window.dataLayer, "default");
    const updates = consentCommands(window.dataLayer, "update");

    assert.equal(defaults.length, 1);
    assert.equal(defaults[0][2].analytics_storage, "denied");
    assert.equal(updates.length, storedChoice === "granted" ? 1 : 0);
    if (storedChoice === "granted") {
      assert.equal(updates[0][2].analytics_storage, "granted");
    }

    assert.deepEqual(bodyChildren, []);
    assert.equal(headChildren.length, 1);
    assert.equal(headChildren[0].tagName, "SCRIPT");
    assert.equal(headChildren[0].dataset.blakeGtm, "GTM-KLVS6KVH");
  });
}

for (const storedChoice of [null, "denied", "invalid"]) {
  test(`analytics does not track CTA clicks without consent: ${String(storedChoice)}`, () => {
    const sandbox = runAnalytics(storedChoice);
    const target = {
      textContent: "直接詢問 BLAKE",
      closest() {
        return this;
      },
      getAttribute(name) {
        return name === "href" ? "/contact/" : null;
      },
    };

    sandbox.window.blakeAnalytics.trackEvent("generate_lead", {
      form_name: "contact",
    });
    sandbox.click(target);

    assert.equal(
      sandbox.window.dataLayer.some(
        (entry) => entry?.event === "generate_lead" || entry?.event === "select_content",
      ),
      false,
    );
  });
}

test("stored consent keeps CTA interaction tracking without restoring the window", () => {
  const sandbox = runAnalytics("granted");
  const target = {
    textContent: "  直接詢問 BLAKE  ",
    closest() {
      return this;
    },
    getAttribute(name) {
      return name === "href" ? "/contact/?from=courses" : null;
    },
  };

  sandbox.click(target);

  assert.deepEqual(
    {
      ...sandbox.window.dataLayer.find(
        (entry) => entry?.event === "select_content",
      ),
    },
    {
      event: "select_content",
      content_type: "cta",
      item_id: "/contact/",
      link_text: "直接詢問 BLAKE",
    },
  );
  assert.deepEqual(sandbox.bodyChildren, []);
});
