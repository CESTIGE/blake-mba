const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-site-nav]");

const universalNavigation = [
  {
    href: "/about",
    label: "認識我",
    eyebrow: "MY STORY",
    pages: "about",
    sectionPages: "home about results cases",
    submenuLabel: "認識我子選單",
    children: [
      { href: "/", label: "人物首頁", pages: "home" },
      { href: "/about", label: "關於 BLAKE", pages: "about" },
      { href: "/results", label: "經歷與成果", pages: "results" },
      { href: "/cases", label: "公開案例", pages: "cases" },
    ],
  },
  {
    href: "/courses",
    label: "選課程",
    eyebrow: "ACADEMY",
    pages: "courses",
    sectionPages: "courses career choice-over-effort startup finder",
    submenuLabel: "選課程子選單",
    children: [
      { href: "/courses", label: "課程總覽", pages: "courses" },
      {
        href: "/courses/career-transition",
        label: "AI 職涯重設計",
        pages: "career",
      },
      {
        href: "/courses/software-startup",
        label: "AI 軟體新創",
        pages: "startup",
      },
      {
        href: "/courses/choice-over-effort",
        label: "選擇重於努力",
        pages: "choice-over-effort",
      },
      { href: "/course-finder", label: "課程導航", pages: "finder" },
    ],
  },
  {
    href: "/resources",
    label: "看觀點",
    eyebrow: "INSIGHTS",
    pages: "resources",
    sectionPages: "resources articles lab book",
    submenuLabel: "看觀點子選單",
    children: [
      { href: "/articles", label: "文章總覽", pages: "articles" },
      { href: "/ai-action-lab", label: "AI Action Lab", pages: "lab" },
      { href: "/resources", label: "免費資源", pages: "resources" },
      { href: "/book", label: "新書計畫", pages: "book" },
    ],
  },
  {
    href: "/contact?inquiry=ai-advisory#contact-form",
    label: "找顧問",
    eyebrow: "AI ADVISORY",
    pages: "",
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
    '<a href="/about">認識我</a>',
    '<a href="/courses">選課程</a>',
    '<a href="/resources">看觀點</a>',
    '<a href="/contact?inquiry=ai-advisory#contact-form">找顧問</a>',
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

const currentPage = document.body.dataset.page;

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

const contactForm = document.querySelector("[data-contact-form]");
const contactStatus = document.querySelector("[data-form-status]");
const inquirySelect = contactForm?.querySelector("[data-inquiry-select]");

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

if (contactForm && contactStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const fields = Array.from(formData.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");
    const inquiryType = formData.get("需求類型");
    const subjectText = inquiryType
      ? `BLAKE 官網｜${inquiryType}`
      : "BLAKE 官網｜聯絡需求";
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(
      `您好，以下是從 BLAKE 官網整理的聯絡需求：\r\n\r\n${fields}`,
    );
    const recipient = contactForm.dataset.recipient?.trim() || "cestig@gmail.com";

    if (recipient) {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
      contactStatus.textContent = "已建立寄給 BLAKE 的郵件草稿，請在郵件程式中確認並按下寄出。";
      return;
    }

    contactStatus.textContent = "目前無法建立郵件，請稍後再試。";
  });
}

const printPageButton = document.querySelector("[data-print-page]");

if (printPageButton) {
  printPageButton.addEventListener("click", () => window.print());
}

const courseFinder = document.querySelector("[data-course-finder]");
const finderResult = document.querySelector("[data-finder-result]");

if (courseFinder && finderResult) {
  const careerResult = finderResult.querySelector("[data-finder-career]");
  const startupResult = finderResult.querySelector("[data-finder-startup]");
  const balancedResult = finderResult.querySelector("[data-finder-balanced]");
  const resetButton = finderResult.querySelector("[data-finder-reset]");

  courseFinder.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = Array.from(new FormData(courseFinder).values());
    const careerScore = answers.filter((answer) => answer === "career").length;
    const startupScore = answers.filter((answer) => answer === "startup").length;

    careerResult.hidden = careerScore <= startupScore;
    startupResult.hidden = startupScore <= careerScore;
    balancedResult.hidden = careerScore !== startupScore;
    finderResult.hidden = false;
    courseFinder.hidden = true;
    finderResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetButton?.addEventListener("click", () => {
    courseFinder.reset();
    courseFinder.hidden = false;
    finderResult.hidden = true;
    courseFinder.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
