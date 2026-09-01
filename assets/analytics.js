(function () {
  "use strict";

  const GTM_ID = "GTM-KLVS6KVH";
  const STORAGE_KEY = "blake_analytics_consent_v1";
  const GRANTED = "granted";
  const DENIED = "denied";
  const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
  const ALLOWED_EVENT_PARAMETERS = new Set([
    "content_type",
    "item_id",
    "link_text",
    "form_name",
    "inquiry_type",
    "lead_source",
  ]);
  const MAX_PARAMETER_LENGTH = 100;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  window.gtag("consent", "default", {
    ad_storage: DENIED,
    analytics_storage: DENIED,
    ad_user_data: DENIED,
    ad_personalization: DENIED,
    wait_for_update: 500,
  });
  window.gtag("set", "ads_data_redaction", true);

  function readChoice() {
    try {
      const choice = window.localStorage.getItem(STORAGE_KEY);
      return choice === GRANTED || choice === DENIED ? choice : null;
    } catch {
      return null;
    }
  }

  const currentChoice = readChoice();

  if (currentChoice === GRANTED) {
    window.gtag("consent", "update", { analytics_storage: GRANTED });
  }

  const gtmScript = document.createElement("script");
  gtmScript.async = true;
  gtmScript.dataset.blakeGtm = GTM_ID;
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  document.head.appendChild(gtmScript);

  function sanitizeParameters(parameters) {
    return Object.fromEntries(
      Object.entries(parameters || {}).flatMap(([key, value]) => {
        if (!ALLOWED_EVENT_PARAMETERS.has(key)) return [];
        if (typeof value === "number" && Number.isFinite(value)) {
          return [[key, value]];
        }
        if (typeof value !== "string") return [];
        const normalizedValue = value.trim().slice(0, MAX_PARAMETER_LENGTH);
        return normalizedValue ? [[key, normalizedValue]] : [];
      }),
    );
  }

  function trackEvent(name, parameters) {
    if (currentChoice !== GRANTED || !EVENT_NAME_PATTERN.test(name)) return;
    window.dataLayer.push({
      event: name,
      ...sanitizeParameters(parameters),
    });
  }

  window.blakeAnalytics = { trackEvent };

  function registerInteractionTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest(
        "a.button, a.btn, button.button, [data-inquiry-type], [data-print-page]",
      );
      if (!target) return;

      const label = (target.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      const href = target.getAttribute("href") || "";
      let destination = href;

      if (href) {
        try {
          const url = new URL(href, window.location.href);
          destination =
            url.origin === window.location.origin
              ? url.pathname
              : `${url.hostname}${url.pathname}`;
        } catch {
          destination = href.split("?")[0];
        }
      }

      trackEvent("select_content", {
        content_type: "cta",
        item_id: destination || label || "unlabeled_cta",
        link_text: label || undefined,
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerInteractionTracking, {
      once: true,
    });
  } else {
    registerInteractionTracking();
  }
})();
