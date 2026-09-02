const POST_TYPES = new Set(["IMAGE", "CAROUSEL_ALBUM"]);
const CHILD_TYPES = new Set(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]);
const FRESH_MS = 15 * 60 * 1000;
const RETAIN_SECONDS = 7 * 24 * 60 * 60;
const RETAIN_MS = RETAIN_SECONDS * 1000;
const CACHE_KEY = new Request("https://cache.internal/instagram-feed");
const MEDIA_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}";

function safeHttps(value) {
  if (typeof value !== "string") return "";

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeChildMediaItem(raw) {
  if (!raw || !CHILD_TYPES.has(raw.media_type)) return null;

  const children = (raw.children?.data ?? [])
    .map((child) => normalizeChildMediaItem(child))
    .filter(Boolean);

  return {
    id: String(raw.id ?? ""),
    mediaType: raw.media_type,
    caption: String(raw.caption ?? "").slice(0, 2200),
    mediaUrl: safeHttps(raw.media_url),
    thumbnailUrl: safeHttps(raw.thumbnail_url),
    permalink: safeHttps(raw.permalink),
    timestamp: String(raw.timestamp ?? ""),
    children,
  };
}

export function normalizeMediaItem(raw) {
  if (!raw || !POST_TYPES.has(raw.media_type)) return null;
  const item = normalizeChildMediaItem(raw);
  return item?.permalink ? item : null;
}

export function normalizeInstagramPayload(profile, media, syncedAt) {
  return {
    profile: {
      username: String(profile?.username ?? "williamblakehuang"),
      displayName: String(profile?.name ?? "Huang Blake"),
    },
    items: (media?.data ?? []).map(normalizeMediaItem).filter(Boolean),
    meta: { source: "instagram", syncedAt, stale: false },
  };
}

function responseHeaders(origin = "") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function jsonResponse(body, status, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  if (!origin) return "";
  const allowed = String(env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim());
  return allowed.includes(origin) ? origin : null;
}

async function cachedPayload(cache) {
  const response = await cache.match(CACHE_KEY);
  return response ? response.json() : null;
}

async function fetchAllMedia(fetchImpl, endpoint, headers) {
  const data = [];
  const seenCursors = new Set();
  let after = "";

  while (true) {
    const url = new URL(endpoint);
    if (after) url.searchParams.set("after", after);
    const response = await fetchImpl(url.href, { headers });
    if (!response.ok) throw new Error("instagram_upstream_failed");
    const page = await response.json();
    if (Array.isArray(page?.data)) data.push(...page.data);
    const nextCursor = typeof page?.paging?.cursors?.after === "string"
      ? page.paging.cursors.after
      : "";
    if (!nextCursor || seenCursors.has(nextCursor)) break;
    seenCursors.add(nextCursor);
    after = nextCursor;
  }

  return { data };
}

export function createInstagramHandler({ fetchImpl, cache, now }) {
  return async function handleInstagram(request, env) {
    if (new URL(request.url).pathname !== "/api/instagram") return jsonResponse({ error: "not_found" }, 404);
    if (!["GET", "OPTIONS"].includes(request.method)) return jsonResponse({ error: "method_not_allowed" }, 405);
    const origin = allowedOrigin(request, env);
    if (origin === null) return jsonResponse({ error: "origin_not_allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(origin) });
    if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_USER_ID || !env.INSTAGRAM_API_VERSION) {
      return jsonResponse({ error: "instagram_not_configured" }, 503, origin);
    }

    let cached = null;
    try {
      cached = await cachedPayload(cache);
    } catch {
      cached = null;
    }
    const age = cached?.meta?.syncedAt ? now() - Date.parse(cached.meta.syncedAt) : Number.POSITIVE_INFINITY;
    if (cached && age <= FRESH_MS) return jsonResponse(cached, 200, origin);

    const base = `https://graph.instagram.com/${encodeURIComponent(env.INSTAGRAM_API_VERSION)}`;
    const headers = { Authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}` };
    try {
      const mediaEndpoint = `${base}/${encodeURIComponent(env.INSTAGRAM_USER_ID)}/media?fields=${encodeURIComponent(MEDIA_FIELDS)}&limit=100`;
      const [profileResponse, media] = await Promise.all([
        fetchImpl(`${base}/${encodeURIComponent(env.INSTAGRAM_USER_ID)}?fields=username`, { headers }),
        fetchAllMedia(fetchImpl, mediaEndpoint, headers),
      ]);
      if (!profileResponse.ok) throw new Error("instagram_upstream_failed");
      const payload = normalizeInstagramPayload(
        await profileResponse.json(),
        media,
        new Date(now()).toISOString(),
      );
      await cache.put(CACHE_KEY, new Response(JSON.stringify(payload), {
        headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${RETAIN_SECONDS}` },
      }));
      return jsonResponse(payload, 200, origin);
    } catch {
      if (cached && age <= RETAIN_MS) return jsonResponse({ ...cached, meta: { ...cached.meta, stale: true } }, 200, origin);
      return jsonResponse({ error: "instagram_unavailable" }, 502, origin);
    }
  };
}

export default {
  fetch(request, env) {
    const handler = createInstagramHandler({ fetchImpl: fetch, cache: caches.default, now: Date.now });
    return handler(request, env);
  },
};
