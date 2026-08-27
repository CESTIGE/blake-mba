function setDividendState(toggle, panel, expanded) {
  toggle.setAttribute("aria-expanded", String(expanded));
  panel.hidden = !expanded;
  const label = toggle.querySelector("[data-toggle-label]");
  if (label) label.textContent = expanded ? "收起紅利" : "展開紅利";
}

function initializeMilestones(root = document) {
  root.querySelectorAll("[data-dividend-toggle]").forEach((toggle) => {
    const panel = root.getElementById(toggle.getAttribute("aria-controls"));
    if (!panel) return;
    setDividendState(toggle, panel, false);
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      setDividendState(toggle, panel, expanded);
    });
  });
}

if (typeof document !== "undefined") initializeMilestones();

export { initializeMilestones, setDividendState };
