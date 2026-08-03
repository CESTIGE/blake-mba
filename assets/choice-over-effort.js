const header = document.querySelector("[data-header]");
const diagnostic = document.querySelector("[data-diagnostic]");
const diagnosticCount = document.querySelector("[data-diagnosis-count]");
const diagnosticMessage = document.querySelector("[data-diagnosis-message]");
const diagnosticResult = document.querySelector("[data-diagnosis-result]");
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const updateDiagnosis = () => {
  if (!diagnostic || !diagnosticCount || !diagnosticMessage) return;

  const selected = diagnostic.querySelectorAll('input[type="checkbox"]:checked').length;
  diagnosticCount.textContent = String(selected);
  diagnosticResult?.style.setProperty("--diagnosis-score", `${selected * 20}%`);
  if (diagnosticResult) diagnosticResult.dataset.level = String(selected);

  if (selected === 0) {
    diagnosticMessage.textContent = "先從你最想改變的一件事開始。";
  } else if (selected <= 2) {
    diagnosticMessage.textContent = "你已經看見部分卡點，下一步是把直覺變成判斷標準。";
  } else if (selected <= 4) {
    diagnosticMessage.textContent = "你需要的不只是更多投遞，而是一套公司與職涯比較框架。";
  } else {
    diagnosticMessage.textContent = "目前多個訊號同時出現，這堂課的選擇系統很適合作為重新整理的起點。";
  }
};

const closeNavigation = () => {
  siteNav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "開啟導覽");
};

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav?.classList.toggle("is-open") ?? false;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "關閉導覽" : "開啟導覽");
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) closeNavigation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1020) closeNavigation();
});

window.addEventListener("scroll", updateHeader, { passive: true });
diagnostic?.addEventListener("change", updateDiagnosis);

updateHeader();
updateDiagnosis();
