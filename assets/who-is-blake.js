const header = document.querySelector("[data-header]");
const navLinks = [...document.querySelectorAll(".main-nav a")];
const sectionNavLinks = navLinks.filter((link) =>
  link.getAttribute("href")?.startsWith("#"),
);
const sections = sectionNavLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const truthCards = [...document.querySelectorAll("[data-truth-card]")];
const truthAnswer = document.querySelector("[data-truth-answer]");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const updateActiveSection = () => {
  if (!sections.length) {
    return;
  }

  const marker = window.scrollY + window.innerHeight * 0.32;
  let activeId = "";

  for (const section of sections) {
    if (section.offsetTop <= marker) {
      activeId = section.id;
    }
  }

  sectionNavLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

window.addEventListener(
  "scroll",
  () => {
    updateHeader();
    updateActiveSection();
  },
  { passive: true },
);

updateHeader();
updateActiveSection();

truthCards.forEach((card) => {
  card.addEventListener("click", () => {
    const willReveal = !card.classList.contains("is-revealed");

    truthCards.forEach((item) => {
      item.classList.remove("is-revealed");
      item.setAttribute("aria-expanded", "false");
    });

    if (willReveal) {
      card.classList.add("is-revealed");
      card.setAttribute("aria-expanded", "true");
      if (truthAnswer) {
        truthAnswer.textContent =
          card.dataset.answer || "這是真的。照片已在卡片中揭曉。";
        truthAnswer.classList.add("is-revealed");
      }
    } else if (truthAnswer) {
      truthAnswer.textContent = "選一張卡片，點開查看照片。";
      truthAnswer.classList.remove("is-revealed");
    }
  });
});
