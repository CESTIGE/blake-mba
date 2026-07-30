const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-site-nav]");

const universalNavigation = [
  { href: "/", label: "首頁", pages: "home" },
  { href: "/courses/", label: "課程", pages: "courses career startup finder" },
  { href: "/ai-action-lab/", label: "AI Action Lab", pages: "lab" },
  { href: "/results/", label: "成果", pages: "results cases" },
  { href: "/resources/", label: "文章與資源", pages: "resources articles book" },
  { href: "/about/", label: "關於", pages: "about" },
];

if (nav) {
  nav.innerHTML = universalNavigation
    .map(
      ({ href, label, pages }) =>
        `<a href="${href}" data-nav-page="${pages}">${label}</a>`,
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

if (contactForm && contactStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const fields = Array.from(formData.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join("%0D%0A");
    const source = formData.get("名單來源");
    const subjectText = source
      ? `William Blake Huang 黃大成｜${source}`
      : "William Blake Huang 黃大成｜演講／顧問／合作邀約";
    const subject = encodeURIComponent(subjectText);
    const body = `您好，以下是網站表單送出的需求：%0D%0A%0D%0A${fields}`;
    const recipient = "tmarsbase@gmail.com";

    if (recipient) {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
      contactStatus.textContent = "已開啟郵件草稿，請確認內容後寄出。";
      return;
    }

    contactStatus.textContent = "已收到表單內容。正式上線前，請在 assets/site.js 補上收件信箱或串接表單服務。";
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
