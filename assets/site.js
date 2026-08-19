const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-site-nav]");

const universalNavigation = [
  {
    href: "/",
    label: "認識我",
    eyebrow: "MY STORY",
    pages: "home",
    sectionPages: "home",
  },
  {
    href: "/courses",
    label: "選課程",
    eyebrow: "ACADEMY",
    pages: "courses",
    sectionPages: "courses career choice-over-effort startup entrepreneurship ai-course",
  },
  {
    href: "/insights",
    label: "看觀點",
    eyebrow: "INSIGHTS",
    pages: "insights",
    sectionPages: "insights resources articles lab book",
  },
  {
    href: "/ai-transform",
    label: "找顧問",
    eyebrow: "AI ADVISORY",
    pages: "ai-transform",
  },
  {
    href: "/contact",
    label: "聊更多",
    eyebrow: "LET'S TALK",
    pages: "contact",
    className: "site-nav-talk",
  },
];

if (nav) {
  nav.innerHTML = universalNavigation
    .map(
      ({
        href,
        label,
        eyebrow,
        pages,
        sectionPages,
        submenuLabel,
        className,
        children,
      }) => {
        const linkClasses = [
          children ? "site-nav-parent" : "",
          className || "",
        ]
          .filter(Boolean)
          .join(" ");
        const classAttribute = linkClasses ? ` class="${linkClasses}"` : "";
        const primaryLink = `<a${classAttribute} href="${href}" data-nav-page="${pages}" data-nav-section="${sectionPages || pages}"><span class="site-nav-copy"><small>${eyebrow}</small><span>${label}</span></span>${children ? '<span class="site-nav-chevron" aria-hidden="true">⌄</span>' : ""}</a>`;

        if (!children) return primaryLink;

        const childLinks = children
          .map(
            (child) =>
              `<a href="${child.href}" data-nav-page="${child.pages}">${child.label}</a>`,
          )
          .join("");

        return `<div class="site-nav-group">${primaryLink}<div class="site-nav-submenu" aria-label="${submenuLabel}">${childLinks}</div></div>`;
      },
    )
    .join("");
}

document.querySelectorAll(".footer-nav").forEach((footerNav) => {
  footerNav.innerHTML = [
    '<a href="/">認識我</a>',
    '<a href="/courses">選課程</a>',
    '<a href="/insights">看觀點</a>',
    '<a href="/ai-transform">找顧問</a>',
    '<a href="/contact">聊更多</a>',
  ].join("");
});

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const currentPage = document.body.dataset.navPage || document.body.dataset.page;

if (currentPage) {
  document.querySelectorAll("[data-nav-section]").forEach((link) => {
    if ((link.dataset.navSection || "").split(" ").includes(currentPage)) {
      link.classList.add("is-active");
    }
  });

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    if ((link.dataset.navPage || "").split(" ").includes(currentPage)) {
      link.setAttribute("aria-current", "page");
    }
  });
}

const articleSidebarList = document.querySelector("[data-article-sidebar-list]");
const articleCards = document.querySelectorAll(".article-list .article-card");

if (articleSidebarList && articleCards.length) {
  articleSidebarList.innerHTML = "";

  articleCards.forEach((card) => {
    const titleLink = card.querySelector("h3 a");
    const category = card.querySelector(".article-meta span")?.textContent?.trim();
    const date = card.querySelector(".article-meta time")?.textContent?.trim();

    if (!titleLink) return;

    const item = document.createElement("a");
    item.className = "article-sidebar-link";
    item.href = titleLink.getAttribute("href") || "#";
    item.innerHTML = `
      <span>${[category, date].filter(Boolean).join("｜")}</span>
      <strong>${titleLink.textContent.trim()}</strong>
    `;
    articleSidebarList.appendChild(item);
  });
}

const contactForms = document.querySelectorAll("[data-contact-form]");
const inquirySelect = document.querySelector("[data-inquiry-select]");

if (inquirySelect) {
  const inquiryPreset = new URLSearchParams(window.location.search).get(
    "inquiry",
  );
  const inquiryPresetValues = {
    "ai-advisory": "AI 應用或創業顧問",
  };
  const inquiryValue = inquiryPresetValues[inquiryPreset];

  if (
    inquiryValue &&
    Array.from(inquirySelect.options).some(
      (option) => option.value === inquiryValue,
    )
  ) {
    inquirySelect.value = inquiryValue;
  }
}
document.querySelectorAll("[data-inquiry-type]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const inquiryType = trigger.dataset.inquiryType;

    if (
      inquirySelect &&
      Array.from(inquirySelect.options).some(
        (option) => option.value === inquiryType,
      )
    ) {
      inquirySelect.value = inquiryType;
    }
  });
});

function initializeContactForm(contactForm) {
  const contactStatus = contactForm.querySelector("[data-form-status]");

  if (!contactStatus) return;

  const formInquirySelect = contactForm.querySelector("[data-inquiry-select]");
  const submitButton = contactForm.querySelector('[type="submit"]');
  const submitText = submitButton?.querySelector("[data-submit-text]");
  const contactFrame = contactForm.querySelector("[data-contact-frame]");
  const requestIdField = contactForm.querySelector("[data-request-id]");
  const defaultSubmitText = submitText?.textContent || "送出需求";
  const successMessage =
    contactForm.dataset.successMessage ||
    "資料已送出，謝謝你的來訊。我收到後會儘快回覆。";
  const formName = contactForm.dataset.formName || "contact";
  let pendingRequestId = "";
  let submissionTimeout = 0;

  const setContactStatus = (message, state) => {
    contactStatus.className = "form-status";
    contactStatus.setAttribute("role", state === "error" ? "alert" : "status");

    if (state) {
      contactStatus.classList.add(`is-${state}`);
    }

    contactStatus.textContent = message;
  };

  const finishSubmission = () => {
    window.clearTimeout(submissionTimeout);
    submissionTimeout = 0;
    pendingRequestId = "";
    submitButton?.removeAttribute("disabled");
    contactForm.removeAttribute("aria-busy");

    if (submitText) {
      submitText.textContent = defaultSubmitText;
    }
  };

  window.addEventListener("message", (event) => {
    const message = event.data;
    const isGoogleScriptOrigin =
      /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/i.test(
        event.origin,
      );

    if (
      !pendingRequestId ||
      !contactFrame ||
      event.source !== contactFrame.contentWindow ||
      !isGoogleScriptOrigin ||
      !message ||
      message.source !== "blake-google-contact" ||
      message.requestId !== pendingRequestId
    ) {
      return;
    }

    if (message.success) {
      const inquiryType =
        formInquirySelect?.value ||
        contactForm.querySelector('[name="需求類型"]')?.value ||
        "unspecified";
      const leadSource =
        contactForm.querySelector('[name="名單來源"]')?.value ||
        "unspecified";
      contactForm.reset();
      window.blakeAnalytics?.trackEvent("generate_lead", {
        form_name: formName,
        inquiry_type: inquiryType,
        lead_source: leadSource,
      });
      setContactStatus(
        message.notificationSent === false
          ? "資料已安全保存；Email 通知可能稍有延遲。"
          : successMessage,
        "success",
      );
    } else {
      setContactStatus(
        "這次沒有送出成功，你填寫的內容仍保留在頁面上，請稍後再試。",
        "error",
      );
    }

    finishSubmission();
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const endpoint = contactForm.dataset.appsScriptEndpoint?.trim();

    if (
      !endpoint ||
      !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/i.test(
        endpoint,
      ) ||
      !contactFrame ||
      !requestIdField
    ) {
      setContactStatus(
        "表單設定不完整，暫時無法送出，請稍後再試。",
        "error",
      );
      return;
    }

    if (pendingRequestId) {
      return;
    }

    pendingRequestId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    requestIdField.value = pendingRequestId;

    submitButton?.setAttribute("disabled", "");
    contactForm.setAttribute("aria-busy", "true");

    if (submitText) {
      submitText.textContent = "送出中…";
    }

    setContactStatus("正在安全送出你的需求，請稍候…", "loading");

    submissionTimeout = window.setTimeout(() => {
      setContactStatus(
        "送出等候時間較長，你填寫的內容仍保留在頁面上，請稍後再試。",
        "error",
      );
      finishSubmission();
    }, 30000);

    contactForm.action = endpoint;
    contactForm.target = contactFrame.name;
    HTMLFormElement.prototype.submit.call(contactForm);
  });
}

contactForms.forEach(initializeContactForm);

const printPageButton = document.querySelector("[data-print-page]");

if (printPageButton) {
  printPageButton.addEventListener("click", () => window.print());
}
