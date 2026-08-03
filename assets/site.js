const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-site-nav]");

const universalNavigation = [
  { href: "/", label: "首頁", pages: "home" },
  {
    href: "/courses",
    label: "課程",
    pages: "courses",
    children: [
      { href: "/courses/career-transition", label: "AI 職涯重設計", pages: "career" },
      { href: "/courses/choice-over-effort", label: "選擇重於努力", pages: "choice-over-effort" },
      { href: "/courses/software-startup", label: "AI 軟體新創", pages: "startup" },
      { href: "/course-finder", label: "課程導航", pages: "finder" },
    ],
  },
  { href: "/ai-action-lab", label: "AI Action Lab", pages: "lab" },
  { href: "/results", label: "成果", pages: "results cases" },
  { href: "/resources", label: "文章與資源", pages: "resources articles book" },
  { href: "/about", label: "關於", pages: "about" },
];

if (nav) {
  nav.innerHTML = universalNavigation
    .map(
      ({ href, label, pages, children }) => {
        const primaryLink = `<a${children ? ' class="site-nav-parent"' : ""} href="${href}" data-nav-page="${pages}">${label}${children ? '<span class="site-nav-chevron" aria-hidden="true">⌄</span>' : ""}</a>`;

        if (!children) return primaryLink;

        const childLinks = children
          .map((child) => `<a href="${child.href}" data-nav-page="${child.pages}">${child.label}</a>`)
          .join("");

        return `<div class="site-nav-group">${primaryLink}<div class="site-nav-submenu" aria-label="課程子選單">${childLinks}</div></div>`;
      },
    )
    .join("");
}

document.querySelectorAll(".footer-nav").forEach((footerNav) => {
  footerNav.innerHTML = [
    '<a href="/courses/">課程</a>',
    '<a href="/ai-action-lab/">AI Action Lab</a>',
    '<a href="/results/">成果</a>',
    '<a href="/resources/">文章與資源</a>',
    '<a href="/about/">關於</a>',
    '<a href="/contact/">演講與合作</a>',
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
  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    if ((link.dataset.navPage || "").split(" ").includes(currentPage)) {
      link.setAttribute("aria-current", "page");
      link
        .closest(".site-nav-group")
        ?.querySelector(".site-nav-parent")
        ?.classList.add("is-active");
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
