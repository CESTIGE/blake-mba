(() => {
  const main = document.querySelector("main");

  if (!main) {
    return;
  }

  const directSections = Array.from(main.children).filter(
    (element) => element.tagName === "SECTION" && !element.hidden,
  );
  const article = main.children.length === 1 ? main.querySelector(":scope > article") : null;
  const articleBlocks = article
    ? Array.from(article.children).filter(
        (element) =>
          !element.hidden &&
          element.matches("header, section, .article-layout"),
      )
    : [];
  const topLevelSections = Array.from(main.querySelectorAll("section")).filter(
    (element) => {
      if (element.hidden) {
        return false;
      }

      let parent = element.parentElement;
      while (parent && parent !== main) {
        if (parent.tagName === "SECTION") {
          return false;
        }
        parent = parent.parentElement;
      }

      return parent === main;
    },
  );
  const sections =
    directSections.length >= 2
      ? directSections
      : articleBlocks.length >= 2
        ? articleBlocks
        : topLevelSections;

  if (sections.length < 2) {
    return;
  }

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileLayout = window.matchMedia("(max-width: 760px)");
  const usedIds = new Set(
    Array.from(document.querySelectorAll("[id]"), (element) => element.id),
  );

  root.classList.add("has-page-deck");

  function createSectionId(index) {
    const base = `page-section-${String(index + 1).padStart(2, "0")}`;
    let candidate = base;
    let suffix = 2;

    while (usedIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(candidate);
    return candidate;
  }

  function getSectionLabel(section, index) {
    const heading = section.querySelector("h1, h2, h3");
    const source =
      section.dataset.pageTitle ||
      section.getAttribute("aria-label") ||
      heading?.textContent ||
      `第 ${index + 1} 段`;
    const normalized = source.replace(/\s+/g, " ").trim();
    return normalized.length > 34
      ? `${normalized.slice(0, 34).trim()}…`
      : normalized;
  }

  const entries = sections.map((section, index) => {
    if (!section.id) {
      section.id = createSectionId(index);
    }

    section.classList.add("page-deck-section");
    section.dataset.pageDeckSection = String(index + 1);

    return {
      section,
      label: getSectionLabel(section, index),
      index,
    };
  });

  const nav = document.createElement("nav");
  nav.className = "page-deck-nav";
  nav.setAttribute("aria-label", "本頁段落導覽");

  const previousButton = document.createElement("button");
  previousButton.className = "page-deck-button page-deck-previous";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "上一段");
  previousButton.innerHTML = '<span aria-hidden="true">↑</span>';

  const track = document.createElement("div");
  track.className = "page-deck-track";

  const anchors = entries.map(({ section, label, index }) => {
    const number = String(index + 1).padStart(2, "0");
    const anchor = document.createElement("a");
    const dot = document.createElement("span");
    const tooltip = document.createElement("span");
    const tooltipNumber = document.createElement("b");

    anchor.className = "page-deck-anchor";
    anchor.href = `#${encodeURIComponent(section.id)}`;
    anchor.dataset.pageDeckIndex = String(index);
    anchor.setAttribute("aria-label", `${number}，${label}`);
    dot.className = "page-deck-dot";
    dot.setAttribute("aria-hidden", "true");
    tooltip.className = "page-deck-label";
    tooltipNumber.textContent = number;
    tooltip.append(tooltipNumber, document.createTextNode(label));
    anchor.append(dot, tooltip);
    track.append(anchor);
    return anchor;
  });

  const nextButton = document.createElement("button");
  nextButton.className = "page-deck-button page-deck-next";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "下一段");
  nextButton.innerHTML = '<span aria-hidden="true">↓</span>';

  const status = document.createElement("span");
  status.className = "page-deck-status";
  status.innerHTML = `
    <span data-page-deck-current>01</span>
    <i aria-hidden="true">/</i>
    <span>${String(entries.length).padStart(2, "0")}</span>
  `;

  const keyHint = document.createElement("span");
  keyHint.className = "page-deck-key";
  keyHint.textContent = "PGDN";
  keyHint.setAttribute("aria-hidden", "true");

  nav.append(previousButton, track, nextButton, status, keyHint);
  document.body.append(nav);

  let activeIndex = 0;
  let headerOffset = 88;
  let scrollFrame = 0;
  let keyboardLockedUntil = 0;

  function updateHeaderOffset() {
    const header = document.querySelector(".site-header");
    const headerHeight = header?.getBoundingClientRect().height || 0;
    headerOffset = Math.max(24, Math.round(headerHeight + 16));
    root.style.setProperty("--page-deck-offset", `${headerOffset}px`);
  }

  function keepActiveAnchorVisible(anchor) {
    const smooth = reducedMotion.matches ? "auto" : "smooth";

    if (mobileLayout.matches) {
      const target =
        anchor.offsetLeft - track.clientWidth / 2 + anchor.offsetWidth / 2;
      track.scrollTo({ left: Math.max(0, target), behavior: smooth });
      return;
    }

    const target =
      anchor.offsetTop - track.clientHeight / 2 + anchor.offsetHeight / 2;
    track.scrollTo({ top: Math.max(0, target), behavior: smooth });
  }

  function setActive(index) {
    const nextIndex = Math.max(0, Math.min(entries.length - 1, index));
    activeIndex = nextIndex;

    anchors.forEach((anchor, anchorIndex) => {
      if (anchorIndex === nextIndex) {
        anchor.setAttribute("aria-current", "location");
      } else {
        anchor.removeAttribute("aria-current");
      }
    });

    status.querySelector("[data-page-deck-current]").textContent = String(
      nextIndex + 1,
    ).padStart(2, "0");
    const activeRect = entries[nextIndex].section.getBoundingClientRect();
    previousButton.disabled =
      nextIndex === 0 && activeRect.top >= headerOffset - 72;
    nextButton.disabled =
      nextIndex === entries.length - 1 &&
      activeRect.bottom <= window.innerHeight + 72;
    keepActiveAnchorVisible(anchors[nextIndex]);
  }

  function findActiveIndex() {
    const referenceY =
      headerOffset + Math.min(160, Math.max(48, window.innerHeight * 0.22));
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    entries.forEach(({ section, index }) => {
      const rect = section.getBoundingClientRect();

      if (rect.top <= referenceY && rect.bottom >= referenceY) {
        closestIndex = index;
        closestDistance = 0;
        return;
      }

      if (closestDistance === 0) {
        return;
      }

      const distance = Math.min(
        Math.abs(rect.top - referenceY),
        Math.abs(rect.bottom - referenceY),
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function updateFromScroll() {
    scrollFrame = 0;
    setActive(findActiveIndex());
  }

  function requestScrollUpdate() {
    if (!scrollFrame) {
      scrollFrame = window.requestAnimationFrame(updateFromScroll);
    }
  }

  function replaceHash(section) {
    const nextHash = `#${encodeURIComponent(section.id)}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }

  function goToSection(index, updateHash = true) {
    const nextIndex = Math.max(0, Math.min(entries.length - 1, index));
    const { section } = entries[nextIndex];
    const top =
      window.scrollY + section.getBoundingClientRect().top - headerOffset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
    setActive(nextIndex);

    if (updateHash) {
      replaceHash(section);
    }
  }

  function pageThrough(direction) {
    const { section } = entries[activeIndex];
    const rect = section.getBoundingClientRect();
    const pageStep = Math.max(320, window.innerHeight - headerOffset - 32);

    if (direction > 0) {
      const remainingInSection = rect.bottom - window.innerHeight;
      if (remainingInSection > 72) {
        window.scrollBy({
          top: Math.min(pageStep, remainingInSection + 24),
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      } else {
        goToSection(activeIndex + 1);
      }
      return;
    }

    const remainingAbove = headerOffset - rect.top;
    if (remainingAbove > 72) {
      window.scrollBy({
        top: -Math.min(pageStep, remainingAbove + 24),
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    } else {
      goToSection(activeIndex - 1);
    }
  }

  function isInteractiveTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    if (target.closest(".page-deck-nav")) {
      return false;
    }

    return Boolean(
      target.closest(
        'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"], [aria-modal="true"]',
      ),
    );
  }

  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      goToSection(Number(anchor.dataset.pageDeckIndex));
    });
  });

  previousButton.addEventListener("click", () => pageThrough(-1));
  nextButton.addEventListener("click", () => pageThrough(1));

  window.addEventListener(
    "keydown",
    (event) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const direction =
        event.key === "PageDown" ? 1 : event.key === "PageUp" ? -1 : 0;

      if (!direction) {
        return;
      }

      event.preventDefault();
      const now = Date.now();

      if (event.repeat || now < keyboardLockedUntil) {
        return;
      }

      keyboardLockedUntil = now + 520;
      pageThrough(direction);
    },
    { passive: false },
  );

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", () => {
    updateHeaderOffset();
    requestScrollUpdate();
  });
  window.addEventListener("hashchange", requestScrollUpdate);
  mobileLayout.addEventListener?.("change", () => {
    keepActiveAnchorVisible(anchors[activeIndex]);
  });

  updateHeaderOffset();
  setActive(findActiveIndex());
})();
