const ids = Array.from({ length: 11 }, (_, index) => String(index + 1).padStart(2, "0"));
let contentTransition;
let motionQuery;

export function readStyleId(search) {
  const value = new URLSearchParams(search).get("style");
  return ids.includes(value) ? value : "11";
}

export function styleHref(id) {
  return `?style=${ids.includes(id) ? id : "11"}`;
}

export function nextStyleId(current, delta) {
  const start = ids.indexOf(readStyleId(`?style=${current}`));
  return ids[((start + delta) % ids.length + ids.length) % ids.length];
}

// Scroll only the rail, never the reader's position in the content document.
function revealChoice(choice) {
  const list = document.querySelector("[data-style-list]");
  if (!choice || !list || list.hidden) return;
  // The list is the positioned offset parent; allow room for the active outline.
  const top = choice.offsetTop, left = choice.offsetLeft;
  if (top - 8 < list.scrollTop) list.scrollTop = Math.max(0, top - 8);
  else if (top + choice.offsetHeight + 8 > list.scrollTop + list.clientHeight) list.scrollTop = top + choice.offsetHeight + 8 - list.clientHeight;
  if (left - 8 < list.scrollLeft) list.scrollLeft = Math.max(0, left - 8);
  else if (left + choice.offsetWidth + 8 > list.scrollLeft + list.clientWidth) list.scrollLeft = left + choice.offsetWidth + 8 - list.clientWidth;
}

export function applyStyle(id, { push = false, animate = true } = {}) {
  const normalized = readStyleId(`?style=${id}`);
  if (typeof document === "undefined") return normalized;
  const previous = document.documentElement.dataset.style;
  const changed = previous !== normalized;
  document.documentElement.dataset.style = normalized;
  if (changed) {
    contentTransition?.cancel();
    // A small settling motion keeps the complete text visible throughout.
    // Cancel on rapid switching and respect live OS motion preferences.
    if (animate && previous && !motionQuery?.matches) {
      contentTransition = document.querySelector("#blake-profile")?.animate?.(
        [{ transform: "translateY(6px)" }, { transform: "translateY(0)" }],
        { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }
  }
  document.querySelectorAll("[data-style-choice]").forEach((choice) => {
    if (choice.dataset.styleChoice === normalized) choice.setAttribute("aria-current", "true");
    else choice.removeAttribute("aria-current");
  });
  document.querySelector("[data-style-progress]")?.replaceChildren(`${normalized} / 11`);
  revealChoice(document.querySelector(`[data-style-choice="${normalized}"]`));
  if (push && changed) history.pushState({ style: normalized }, "", styleHref(normalized));
  return normalized;
}

if (typeof document !== "undefined" && document.querySelector("[data-blake-page]")) {
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", (event) => {
    if (event.matches) contentTransition?.cancel();
  });
  const rail = document.querySelector(".blake-style-rail");
  const list = document.querySelector("[data-style-list]");
  const toggle = document.querySelector("[data-style-toggle]");
  const step = (delta) => applyStyle(nextStyleId(document.documentElement.dataset.style, delta), { push: true });
  applyStyle(readStyleId(location.search), { animate: false });

  rail.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-style-choice]");
    if (!choice || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    applyStyle(choice.dataset.styleChoice, { push: true });
  });
  rail.addEventListener("keydown", (event) => {
    if (!event.target.closest("[data-style-choice]") || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const id = step(["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1);
    document.querySelector(`[data-style-choice="${id}"]`)?.focus({ preventScroll: true });
  });
  window.addEventListener("popstate", () => applyStyle(readStyleId(location.search)));
  window.addEventListener("resize", () => revealChoice(document.querySelector(`[data-style-choice="${document.documentElement.dataset.style}"]`)));
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.replaceChildren(expanded ? "收合格式" : "展開格式");
    list.hidden = !expanded;
    if (expanded) revealChoice(document.querySelector(`[data-style-choice="${document.documentElement.dataset.style}"]`));
  });

  let wheelTotal = 0, lastWheel = -Infinity, lastSwitch = -Infinity;
  list.addEventListener("wheel", (event) => {
    if (event.ctrlKey || list.hidden) return;
    const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!raw) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastSwitch < 400) return;
    if (now - lastWheel > 200 || Math.sign(raw) !== Math.sign(wheelTotal)) wheelTotal = 0;
    lastWheel = now;
    wheelTotal += raw * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? list.clientHeight : 1);
    if (Math.abs(wheelTotal) < 80) return;
    step(Math.sign(wheelTotal));
    wheelTotal = 0;
    lastSwitch = now;
  }, { passive: false });

  let touchStart = null;
  list.addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  list.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
  list.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}
