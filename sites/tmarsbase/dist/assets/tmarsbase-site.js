export function getBaseProgress(scrollY, scrollHeight, innerHeight) {
  const available = Math.max(scrollHeight - innerHeight, 0);
  if (available === 0) return 0;
  return Math.min(Math.max(scrollY / available, 0), 1);
}

export function getPointerDrift(position, dimension, distance) {
  if (!Number.isFinite(dimension) || dimension <= 0) return 0;
  const ratio = Math.min(Math.max(position / dimension, 0), 1);
  return (ratio * 2 - 1) * distance;
}

export function prefersReducedMotion(mediaQuery) {
  return Boolean(mediaQuery?.matches);
}

function startTMarsBaseMotion() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-base-header]");
  const progress = document.querySelector("[data-base-progress]");
  const reveals = [...document.querySelectorAll("[data-base-reveal]")];
  const orbits = [...document.querySelectorAll("[data-base-orbit]")];

  const updateScroll = () => {
    const value = getBaseProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
    if (progress) progress.style.transform = "scaleX(" + value + ")";
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  if (!prefersReducedMotion(reducedMotion)) {
    root.classList.add("has-base-motion");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach((element) => observer.observe(element));

    window.addEventListener("pointermove", (event) => {
      const x = getPointerDrift(event.clientX, window.innerWidth, 10);
      const y = getPointerDrift(event.clientY, window.innerHeight, 8);
      orbits.forEach((orbit, index) => {
        const factor = index === 0 ? 1 : -0.6;
        orbit.style.setProperty("--orbit-x", x * factor + "px");
        orbit.style.setProperty("--orbit-y", y * factor + "px");
      });
    }, { passive: true });
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });
  window.addEventListener("resize", updateScroll, { passive: true });
}

startTMarsBaseMotion();
