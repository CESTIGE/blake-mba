const EVIDENCE = [
  { category: "白領", company: "IBM", sourceUrl: "https://www.marketscreener.com/quote/stock/MICROSOFT-CORPORATION-4835/news/IBM-to-pause-hiring-in-plan-to-replace-7-800-jobs-with-AI-Bloomberg-News-43705216/" },
  { category: "白領", company: "Intuit", sourceUrl: "https://www.intuit.com/blog/news-social/intuit-transformation-ai-era/" },
  { category: "創意", company: "WGA", sourceUrl: "https://www.wga.org/contracts/know-your-rights/artificial-intelligence" },
  { category: "創意", company: "SAG-AFTRA", sourceUrl: "https://www.sagaftra.org/message-your-sag-aftra-president-and-chief-negotiator" },
  { category: "客服", company: "Klarna", sourceUrl: "https://www.prnewswire.com/news-releases/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month-302072744.html" },
  { category: "客服", company: "Stanford", sourceUrl: "https://siepr.stanford.edu/publications/working-paper/canaries-coal-mine-six-facts-about-recent-employment-effects-artificial" },
  { category: "程式", company: "Stanford", sourceUrl: "https://digitaleconomy.stanford.edu/news/canariesaug26/" },
  { category: "程式", company: "OpenAI", sourceUrl: "https://openai.com/index/paperbench/" },
  { category: "製造", company: "Amazon Robotics", sourceUrl: "https://www.aboutamazon.com/news/operations/amazon-fulfillment-center-robotics-ai" },
  { category: "製造", company: "Amazon Blue Jay", sourceUrl: "https://www.aboutamazon.com/news/operations/new-robots-amazon-fulfillment-agentic-ai" },
];

export function evidenceForCategory(category) {
  return EVIDENCE.filter((item) => item.category === category).map((item) => ({ ...item }));
}

export function evidenceCounterLabel(index, total) {
  return `${index + 1} / ${total}`;
}

export function scrollProgress(scrollY, sceneTop, sceneDistance) {
  if (sceneDistance <= 0) return scrollY >= sceneTop ? 1 : 0;
  return Math.min(1, Math.max(0, (scrollY - sceneTop) / sceneDistance));
}

export function sceneIndex(progress, count) {
  if (count <= 0) return -1;
  const safeProgress = Math.min(1, Math.max(0, Number(progress) || 0));
  return Math.min(count - 1, Math.floor(safeProgress * count));
}

export function cinemaOffset(progress, count) {
  if (count <= 1) return 0;
  const safeProgress = Math.min(1, Math.max(0, Number(progress) || 0));
  if (safeProgress === 0) return 0;
  return -Math.round((count - 1) * safeProgress * 10000) / 100;
}

function setActiveFrame(scene, progress) {
  const selector = scene.dataset.frameSelector;
  if (!selector) return;
  const frames = [...scene.querySelectorAll(selector)];
  const activeIndex = sceneIndex(progress, frames.length);

  frames.forEach((frame, index) => {
    const active = index === activeIndex;
    frame.classList.toggle("is-active", active);
    frame.setAttribute("aria-hidden", String(!active));
    frame.inert = !active;
  });

  const dots = [...scene.querySelectorAll(".frame-dots span")];
  dots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeIndex));
}

function initializeScrollFilm() {
  const scenes = [...document.querySelectorAll("[data-scroll-scene]")];
  const pageProgress = document.querySelector("[data-page-progress]");
  const cinema = document.querySelector(".cinema-film");
  const cinemaRail = document.querySelector("[data-cinema-rail]");
  const posterCards = cinemaRail ? [...cinemaRail.children] : [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scheduled = false;

  const render = () => {
    scheduled = false;
    const viewportHeight = window.innerHeight;
    const documentDistance = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    const documentProgress = Math.min(1, Math.max(0, window.scrollY / documentDistance));
    if (pageProgress) pageProgress.style.transform = `scaleX(${documentProgress})`;

    scenes.forEach((scene) => {
      const distance = Math.max(1, scene.offsetHeight - viewportHeight);
      const progress = scrollProgress(window.scrollY, scene.offsetTop, distance);
      scene.style.setProperty("--scene-progress", progress.toFixed(4));
      if (!reducedMotion) setActiveFrame(scene, progress);
    });

    if (cinema && cinemaRail && !reducedMotion) {
      const distance = Math.max(1, cinema.offsetHeight - viewportHeight);
      const progress = scrollProgress(window.scrollY, cinema.offsetTop, distance);
      const travel = Math.max(0, cinemaRail.scrollWidth - window.innerWidth + window.innerWidth * 0.08);
      cinemaRail.style.transform = `translate3d(${-travel * progress}px, 0, 0)`;
      const activePoster = sceneIndex(progress, posterCards.length);
      posterCards.forEach((card, index) => card.classList.toggle("is-current", index === activePoster));
    }
  };

  const requestRender = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  };

  if (reducedMotion) {
    document.documentElement.classList.add("reduced-motion");
    document.querySelectorAll("[aria-hidden]").forEach((item) => {
      if (item.matches(".evolution-frame, .news-frame")) item.setAttribute("aria-hidden", "false");
    });
  }

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  window.addEventListener("load", requestRender, { once: true });
  requestRender();
}

if (typeof document !== "undefined") initializeScrollFilm();
