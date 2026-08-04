(function () {
  "use strict";

  const GTM_ID = "GTM-KLVS6KVH";
  const STORAGE_KEY = "blake_analytics_consent_v1";
  const GRANTED = "granted";
  const DENIED = "denied";

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

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Consent still applies for this page even when storage is unavailable.
    }
  }

  let currentChoice = readChoice();

  if (currentChoice === GRANTED) {
    window.gtag("consent", "update", { analytics_storage: GRANTED });
  }

  const gtmScript = document.createElement("script");
  gtmScript.async = true;
  gtmScript.dataset.blakeGtm = GTM_ID;
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  document.head.appendChild(gtmScript);

  const analyticsStyles = document.createElement("link");
  analyticsStyles.rel = "stylesheet";
  analyticsStyles.href = "/assets/analytics.css?v=20260804gtm1";
  document.head.appendChild(analyticsStyles);

  function updateConsent(choice) {
    currentChoice = choice;
    saveChoice(choice);
    window.gtag("consent", "update", {
      ad_storage: DENIED,
      analytics_storage: choice,
      ad_user_data: DENIED,
      ad_personalization: DENIED,
    });
    window.dataLayer.push({
      event: "blake_consent_update",
      analytics_storage: choice,
    });
  }

  function trackEvent(name, parameters) {
    if (currentChoice !== GRANTED) return;
    window.gtag("event", name, parameters || {});
  }

  window.blakeAnalytics = { trackEvent };

  function createConsentUi() {
    const banner = document.createElement("section");
    banner.className = "analytics-consent";
    banner.setAttribute("aria-label", "分析與隱私設定");
    banner.hidden = Boolean(currentChoice);
    banner.innerHTML = `
      <div class="analytics-consent__copy">
        <strong>協助我們改善 BLAKE.MBA</strong>
        <p>允許後，Google Analytics 會協助我們了解頁面瀏覽、互動與來源。我們不會把表單中的姓名、Email、電話或訊息內容傳送到分析系統，你也能隨時更改選擇。</p>
      </div>
      <div class="analytics-consent__actions">
        <button type="button" class="analytics-consent__button analytics-consent__button--secondary" data-analytics-choice="denied">僅使用必要功能</button>
        <button type="button" class="analytics-consent__button analytics-consent__button--primary" data-analytics-choice="granted">允許匿名分析</button>
      </div>
    `;

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "analytics-settings";
    settingsButton.setAttribute("aria-label", "開啟分析與隱私設定");

    const updateSettingsLabel = () => {
      settingsButton.textContent =
        currentChoice === GRANTED ? "分析：開啟" : "分析與隱私設定";
    };

    banner.addEventListener("click", (event) => {
      const button = event.target.closest("[data-analytics-choice]");
      if (!button) return;
      updateConsent(button.dataset.analyticsChoice);
      banner.hidden = true;
      updateSettingsLabel();
      settingsButton.focus();
    });

    settingsButton.addEventListener("click", () => {
      banner.hidden = false;
      banner.querySelector("[data-analytics-choice]")?.focus();
    });

    updateSettingsLabel();
    document.body.append(banner, settingsButton);

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
    document.addEventListener("DOMContentLoaded", createConsentUi, { once: true });
  } else {
    createConsentUi();
  }
})();
