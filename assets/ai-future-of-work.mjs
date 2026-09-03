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

const MOVIE_TECHNOLOGIES = {
  terminator: {
    name: "Tesla Optimus",
    company: "Tesla",
    maturity: "發展中",
    summary: "自主雙足人形機器人，結合視覺、導航、平衡與動作規劃，目標是執行危險、重複或乏味的實體工作。",
    realityCheck: "外形與自主機器人的技術方向相近；Tesla 並未把 Optimus 定位為武器。",
    sourceUrl: "https://www.tesla.com/AI",
  },
  irobot: {
    name: "Figure 03＋Helix 02",
    company: "Figure",
    maturity: "示範／部署中",
    summary: "Figure 03 搭配 Helix 02，可從視覺與語言指令控制全身，連續完成行走、抓取、整理與操作物品等工作。",
    realityCheck: "已展示長流程自主操作，也進入部分工作場域；仍遠未達電影中的通用智慧與大規模普及。",
    sourceUrl: "https://www.figure.ai/news/helix-02",
  },
  matrix: {
    name: "Neuralink N1 腦機介面",
    company: "Neuralink",
    maturity: "臨床研究",
    summary: "植入式腦機介面把神經活動轉成控制訊號，研究目標之一是讓四肢癱瘓者以意念操作電腦等外部裝置。",
    realityCheck: "目前屬醫療器材臨床研究，不能把意識上傳，也不能把人直接接入虛擬世界。",
    sourceUrl: "https://neuralink.com/updates/prime-study-progress-update/",
  },
  "ready-player-one": {
    name: "Meta Orion AR 眼鏡",
    company: "Meta Reality Labs",
    maturity: "產品原型",
    summary: "透明鏡片能疊加數位內容，並結合眼動、手勢、語音與肌電腕帶控制，朝全天候空間運算與社交體驗發展。",
    realityCheck: "Orion 只向員工及少數外部人士展示，尚未成為一般消費者可以購買的產品。",
    sourceUrl: "https://about.fb.com/news/2024/09/introducing-orion-our-first-true-augmented-reality-glasses/",
  },
  her: {
    name: "GPT-Live／ChatGPT Voice",
    company: "OpenAI",
    maturity: "已推出",
    summary: "全雙工語音模型可以邊聽邊說、接受插話、等待使用者思考，讓人與 AI 的語音來回更接近自然對話。",
    realityCheck: "它是語音助理，不具有人類意識、情感或電影角色所呈現的自主生命經驗。",
    sourceUrl: "https://openai.com/index/introducing-gpt-live/",
  },
  "big-hero-6": {
    name: "Moxi 2.0",
    company: "Diligent Robotics",
    maturity: "醫院部署中",
    summary: "醫療支援機器人在醫院自主移動，協助運送藥物、檢體與醫療用品，把例行物流工作交給機器完成。",
    realityCheck: "Moxi 支援照護團隊，但不會像 Baymax 一樣自主診斷、治療或取代醫療專業人員。",
    sourceUrl: "https://www.diligentrobots.com/blog/diligent-robotics-a-serve-robotics-company-begins-rolling-out-moxi-20",
  },
  walle: {
    name: "Glacier AI 回收機器人",
    company: "Glacier",
    maturity: "回收場部署中",
    summary: "以 AI 視覺辨認回收物流中的物件，再由機器手臂分選塑膠、紙類與金屬，提升材料回收效率。",
    realityCheck: "它是固定在回收處理設施中的分類設備，還不是能獨自在城市或荒地清理垃圾的 WALL-E。",
    sourceUrl: "https://endwaste.io/",
  },
  interstellar: {
    name: "SpaceX Starship",
    company: "SpaceX",
    maturity: "飛行測試／任務規劃中",
    summary: "Starship 是為載人與載貨前往地球軌道、月球、火星及更遠目的地而設計的可重複使用運輸系統。",
    realityCheck: "深空與火星任務仍在測試及規劃階段，尚未具備電影中的蟲洞旅行或跨星系能力。",
    sourceUrl: "https://www.spacex.com/humanspaceflight/mars",
  },
};

export function evidenceForCategory(category) {
  return EVIDENCE.filter((item) => item.category === category).map((item) => ({ ...item }));
}

export function evidenceCounterLabel(index, total) {
  return `${index + 1} / ${total}`;
}

export function movieTechnologyFor(movieId) {
  const technology = MOVIE_TECHNOLOGIES[movieId];
  return technology ? { ...technology } : null;
}

export function nextStorySectionIndex(currentIndex, direction, total) {
  if (total <= 0) return -1;
  const safeIndex = Math.max(0, Math.min(total - 1, Number(currentIndex) || 0));
  const step = direction < 0 ? -1 : direction > 0 ? 1 : 0;
  return Math.max(0, Math.min(total - 1, safeIndex + step));
}

export function storyNavigationTarget(currentIndex, direction, total) {
  return {
    index: nextStorySectionIndex(currentIndex, direction, total),
    behavior: "auto",
  };
}

export function storySectionIndex(scrollY, viewportHeight, offsets) {
  if (!offsets.length) return -1;
  const midpoint = Math.max(0, scrollY) + Math.max(0, viewportHeight) / 2;
  let activeIndex = 0;
  offsets.forEach((offset, index) => {
    if (midpoint >= offset) activeIndex = index;
  });
  return activeIndex;
}

function initializeStoryNavigation() {
  const navigation = document.querySelector(".story-page-nav");
  const previousButton = navigation?.querySelector("[data-story-previous]");
  const nextButton = navigation?.querySelector("[data-story-next]");
  const status = navigation?.querySelector("[data-story-status]");
  const sections = [...document.querySelectorAll("main > section")];
  if (!navigation || !previousButton || !nextButton || !status || !sections.length) return;

  let activeIndex = 0;
  const labelFor = (section) => section.dataset.sceneName || section.querySelector("h2")?.textContent?.trim() || "頁面";
  const update = (index) => {
    activeIndex = Math.max(0, Math.min(sections.length - 1, index));
    status.innerHTML = `<strong>${String(activeIndex + 1).padStart(2, "0")}</strong><span>${labelFor(sections[activeIndex])}</span><small>／${String(sections.length).padStart(2, "0")}</small>`;
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === sections.length - 1;
  };
  const move = (direction) => {
    const target = storyNavigationTarget(activeIndex, direction, sections.length);
    update(target.index);
    sections[target.index].scrollIntoView({ behavior: target.behavior, block: "start" });
  };

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));

  const updateFromScroll = () => update(storySectionIndex(
    window.scrollY,
    window.innerHeight,
    sections.map((section) => section.offsetTop),
  ));
  window.addEventListener("scroll", updateFromScroll, { passive: true });
  window.addEventListener("resize", updateFromScroll, { passive: true });
  update(0);
}

function initializeMovieTechnologyDialog() {
  const dialog = document.querySelector("[data-movie-tech-dialog]");
  const closeButton = dialog?.querySelector("[data-movie-tech-close]");
  const triggers = [...document.querySelectorAll("[data-movie-id]")];
  if (!dialog || !closeButton || !triggers.length) return;

  let opener = null;
  const fields = {
    name: dialog.querySelector("[data-movie-tech-name]"),
    company: dialog.querySelector("[data-movie-tech-company]"),
    maturity: dialog.querySelector("[data-movie-tech-maturity]"),
    summary: dialog.querySelector("[data-movie-tech-summary]"),
    realityCheck: dialog.querySelector("[data-movie-tech-reality]"),
    sourceUrl: dialog.querySelector("[data-movie-tech-source]"),
    monogram: dialog.querySelector("[data-movie-tech-monogram]"),
  };

  const open = (trigger) => {
    const technology = movieTechnologyFor(trigger.dataset.movieId);
    if (!technology) return;
    opener = trigger;
    fields.name.textContent = technology.name;
    fields.company.textContent = technology.company;
    fields.maturity.textContent = technology.maturity;
    fields.summary.textContent = technology.summary;
    fields.realityCheck.textContent = technology.realityCheck;
    fields.sourceUrl.href = technology.sourceUrl;
    fields.monogram.textContent = technology.company.slice(0, 2).toUpperCase();
    dialog.showModal();
  };
  const close = () => dialog.close();

  triggers.forEach((trigger) => trigger.addEventListener("click", () => open(trigger)));
  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => opener?.focus());
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

if (typeof document !== "undefined") {
  initializeScrollFilm();
  initializeStoryNavigation();
  initializeMovieTechnologyDialog();
}
