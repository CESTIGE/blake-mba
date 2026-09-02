const POST_TYPES = new Set(["IMAGE", "CAROUSEL_ALBUM"]);
const CHILD_TYPES = new Set(["IMAGE", "VIDEO"]);
const DEFAULT_BATCH_SIZE = 9;
export const LIVE_FEED_URL = "https://blake-instagram-feed.cestige.workers.dev/api/instagram";

function isHttps(value) {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function isValidDateString(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).valueOf());
}

function isAllowedMedia(value, source) {
  return typeof value === "string"
    && (value === "" || isHttps(value) || (source === "fixture" && value.startsWith("/assets/")));
}

function isValidMediaItem(item, source, isChild = false) {
  const allowedTypes = isChild ? CHILD_TYPES : POST_TYPES;
  if (!item || !allowedTypes.has(item.mediaType)) return false;
  if (typeof item.id !== "string" || item.id.length === 0) return false;
  if (typeof item.caption !== "string") return false;
  if (!isAllowedMedia(item.mediaUrl, source) || !isAllowedMedia(item.thumbnailUrl, source)) return false;
  if (typeof item.permalink !== "string") return false;
  if (isChild ? item.permalink !== "" && !isHttps(item.permalink) : !isHttps(item.permalink)) return false;
  if (typeof item.timestamp !== "string") return false;
  if (isChild ? item.timestamp !== "" && !isValidDateString(item.timestamp) : !isValidDateString(item.timestamp)) return false;
  if (!Array.isArray(item.children)) return false;
  return item.children.every((child) => isValidMediaItem(child, source, true));
}

export function validateFeed(value) {
  if (!value || !Array.isArray(value.items) || !value.profile || !value.meta) return null;
  if (typeof value.profile.username !== "string" || value.profile.username.length === 0) return null;
  if (typeof value.profile.displayName !== "string" || value.profile.displayName.length === 0) return null;
  if (value.meta.source !== "instagram" && value.meta.source !== "fixture") return null;
  if (!isValidDateString(value.meta.syncedAt) || typeof value.meta.stale !== "boolean") return null;
  return value.items.every((item) => isValidMediaItem(item, value.meta.source)) ? value : null;
}

export function formatSocialDate(value, locale = "zh-TW") {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(date);
}

async function fetchFeed(fetchImpl, url) {
  try {
    const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return validateFeed(await response.json());
  } catch { return null; }
}

export async function loadSocialFeed({ fetchImpl = fetch, hostname = location.hostname } = {}) {
  const liveFeed = await fetchFeed(fetchImpl, LIVE_FEED_URL);
  if (liveFeed) return liveFeed;
  if (["localhost", "127.0.0.1"].includes(hostname)) {
    const fixtureFeed = await fetchFeed(fetchImpl, "/tests/fixtures/instagram-media.json?v=20260902a");
    if (fixtureFeed?.meta.source === "fixture") return fixtureFeed;
  }
  throw new Error("instagram_unavailable");
}

export function getSocialStatusCopy(state) {
  if (state === "fixture") return { feed: "示範資料｜尚未連接 Instagram API" };
  if (state === "stale") return { feed: "內容更新中｜目前顯示上次成功同步" };
  if (state === "error") return { feed: "Instagram 內容目前無法載入" };
  if (state === "empty") return { feed: "目前尚無貼文" };
  return { feed: "近即時更新｜通常於 15 分鐘內同步" };
}

function displaySource(item) {
  return item.thumbnailUrl || item.mediaUrl
    || item.children[0]?.thumbnailUrl || item.children[0]?.mediaUrl || "";
}

function createMediaImage(item, alt, eager = false) {
  const image = document.createElement("img");
  image.src = displaySource(item);
  image.alt = alt;
  image.width = 900;
  image.height = 1125;
  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => { image.hidden = true; });
  return image;
}

export function createCard(item) {
  const card = document.createElement("a");
  card.className = "social-card";
  card.href = item.permalink;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  const media = document.createElement("div");
  media.className = "social-card-media";
  media.append(createMediaImage(item, item.caption || "Instagram 貼文"));
  const copy = document.createElement("div");
  copy.className = "social-card-copy";
  const type = document.createElement("span");
  type.className = "social-card-type";
  type.textContent = item.mediaType === "CAROUSEL_ALBUM" ? "CAROUSEL" : "POST";
  const caption = document.createElement("p");
  caption.textContent = item.caption;
  const linkLabel = document.createElement("span");
  linkLabel.className = "social-card-link";
  linkLabel.textContent = `${formatSocialDate(item.timestamp)} · 在 Instagram 查看 ↗`;
  copy.append(type, caption, linkLabel);
  card.append(media, copy);
  return card;
}

export function renderRail(rail, items, { batchSize = DEFAULT_BATCH_SIZE, onRender = () => {} } = {}) {
  let visibleCount = Math.min(batchSize, items.length);
  let observer = null;

  const renderBatch = () => {
    const visibleItems = items.slice(0, visibleCount).map(createCard);
    const hasMore = visibleCount < items.length;

    if (hasMore) {
      const loadMore = document.createElement("button");
      loadMore.className = "social-load-more";
      loadMore.type = "button";
      loadMore.textContent = "載入更多貼文";
      loadMore.addEventListener("click", () => {
        visibleCount = Math.min(visibleCount + batchSize, items.length);
        renderBatch();
      });
      visibleItems.push(loadMore);

      if (typeof IntersectionObserver !== "undefined") {
        observer?.disconnect?.();
        observer = new IntersectionObserver(([entry]) => {
          if (!entry?.isIntersecting) return;
          visibleCount = Math.min(visibleCount + batchSize, items.length);
          renderBatch();
        }, { rootMargin: "320px 0px" });
        observer.observe(loadMore);
      }
    } else {
      observer?.disconnect?.();
    }

    rail.replaceChildren(...visibleItems);
    onRender(visibleCount, items.length);
  };

  renderBatch();
  rail.setAttribute("aria-busy", "false");
}

export function renderSocialWall(root, feed) {
  const rail = root.querySelector("[data-feed-rail]");
  const empty = root.querySelector("[data-empty-state]");
  const status = root.querySelector("[data-feed-status]");
  const feedState = feed.meta.source === "fixture" ? "fixture" : feed.meta.stale ? "stale" : "ready";
  const hasItems = feed.items.length !== 0;
  const baseStatus = getSocialStatusCopy(hasItems ? feedState : "empty").feed;
  renderRail(rail, feed.items, {
    onRender: (visible, total) => {
      status.textContent = total > 0 ? `${baseStatus}｜已顯示 ${visible} / ${total}` : baseStatus;
    },
  });
  rail.hidden = !hasItems;
  empty.hidden = hasItems;
}

export async function initialiseSocialWall() {
  document.documentElement.dataset.socialStatus = "loading";
  const status = document.querySelector("[data-feed-status]");
  const rail = document.querySelector("[data-feed-rail]");
  const empty = document.querySelector("[data-empty-state]");
  try {
    const feed = await loadSocialFeed();
    renderSocialWall(document, feed);
    const state = feed.items.length === 0 ? "empty"
      : feed.meta.source === "fixture" ? "fixture" : feed.meta.stale ? "stale" : "ready";
    document.documentElement.dataset.socialStatus = state;
  } catch {
    document.documentElement.dataset.socialStatus = "error";
    status.textContent = getSocialStatusCopy("error").feed;
    rail.setAttribute("aria-busy", "false");
    rail.hidden = true;
    empty.hidden = false;
  }
}

if (typeof document !== "undefined") initialiseSocialWall();
