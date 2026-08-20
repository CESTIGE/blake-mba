(() => {
  const root = document.querySelector("#lcc-ai-course");
  if (!root || root.dataset.ready === "true") return;

  root.dataset.ready = "true";
  root.classList.add("lcc-ai-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticPreview = new URLSearchParams(window.location.search).has("static");
  const revealItems = [...root.querySelectorAll("[data-reveal]")];
  const sectionItems = [...root.querySelectorAll(".page-section[id]")];
  const deck = root.querySelector(".page-deck");
  const deckLinks = deck ? [...deck.querySelectorAll('.page-deck__links a')] : [];
  const previousButton = deck?.querySelector(".page-deck__prev");
  const nextButton = deck?.querySelector(".page-deck__next");
  const currentNumber = deck?.querySelector("p strong");
  const mobileMenu = root.querySelector(".mobile-menu");
  const mobileMenuSummary = mobileMenu?.querySelector("summary");
  let currentIndex = 0;

  const scrollToSection = (index) => {
    const nextIndex = Math.max(0, Math.min(sectionItems.length - 1, index));
    sectionItems[nextIndex]?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const setCurrentSection = (index) => {
    currentIndex = Math.max(0, Math.min(sectionItems.length - 1, index));
    deckLinks.forEach((link, linkIndex) => {
      link.classList.toggle("is-active", linkIndex === currentIndex);
      if (linkIndex === currentIndex) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (currentNumber) currentNumber.textContent = String(currentIndex + 1).padStart(2, "0");
    if (previousButton) previousButton.disabled = currentIndex === 0;
    if (nextButton) nextButton.disabled = currentIndex === sectionItems.length - 1;
  };

  if (staticPreview || reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  if ("IntersectionObserver" in window && sectionItems.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setCurrentSection(sectionItems.indexOf(visible.target));
      },
      { threshold: [0.12, 0.28, 0.5], rootMargin: "-20% 0px -52% 0px" }
    );
    sectionItems.forEach((section) => sectionObserver.observe(section));
  }

  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;
      const target = root.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  previousButton?.addEventListener("click", () => scrollToSection(currentIndex - 1));
  nextButton?.addEventListener("click", () => scrollToSection(currentIndex + 1));

  const syncMobileMenuLabel = () => {
    if (!mobileMenuSummary) return;
    mobileMenuSummary.setAttribute(
      "aria-label",
      mobileMenu?.open ? "關閉導覽選單" : "開啟導覽選單"
    );
  };

  mobileMenu?.addEventListener("toggle", syncMobileMenuLabel);
  root.querySelectorAll(".mobile-menu nav a").forEach((link) => {
    link.addEventListener("click", () => {
      link.closest("details")?.removeAttribute("open");
      syncMobileMenuLabel();
    });
  });

  setCurrentSection(0);
  syncMobileMenuLabel();
})();
