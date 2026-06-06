const CACHE = "splitmate-v2";

// File extensions we consider safe to cache-first (truly static assets).
const STATIC_EXT = /\.(?:css|js|mjs|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|webmanifest|json)$/i;

// Destinations that correspond to static sub-resources, never to documents/RSC.
const STATIC_DESTINATIONS = new Set(["style", "script", "font", "image"]);

function isStaticAsset(request, url) {
  if (STATIC_DESTINATIONS.has(request.destination)) return true;
  return STATIC_EXT.test(url.pathname);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Don't intercept API, auth or Next.js internal routes
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/")
  )
    return;

  // Everything that is NOT a static asset (full-page navigations AND client-side
  // RSC payload fetches for dynamic routes) must be network-first, otherwise the
  // app serves stale data until a hard reload.
  // RSC navigations are plain GET fetches (not mode "navigate"), so we detect
  // them via the `RSC` header / document destination instead of relying on mode.
  const isRsc = event.request.headers.has("RSC");
  const isDocument =
    event.request.mode === "navigate" || event.request.destination === "document";

  if (isRsc || isDocument || !isStaticAsset(event.request, url)) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/"))
      )
    );
    return;
  }

  // Cache-first, only for truly static assets.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// --- Push notifications ---

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SplitMate", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "SplitMate", {
      body: payload.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (new URL(client.url).pathname === url && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});
