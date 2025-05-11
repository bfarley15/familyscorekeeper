const CACHE_NAME = "scorekeeper-v1";

// List all HTML, CSS, JS, and assets needed for offline use
const urlsToCache = [
  "/",                    // root page
  "/index.html",          // Wingspan + Countdown wrapper
  "/hanabi.html",
  "/qwixx.html",
  "/skull.html",
  "/countdown.html",
  "/timer.html",

  // CSS files
  "/style.css",
  "/sidebar.css",
  "/countdown.css",
  "/hanabi.css",

  // JS scripts
  "/script.js",
  "/countdown-script.js",
  "/hanabi-script.js",
  "/skull-script.js",
  "/qwixx-script.js",

  // Fonts (optional fallback)
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Share+Tech+Mono&display=swap",
  "https://fonts.cdnfonts.com/css/star-jedi",

  // Images & Icons
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/images/rocket-bg.png",
  "/images/hanabi-title.png"  // if used
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app files...");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() =>
          // Optional fallback if offline and file not cached
          caches.match("/index.html")
        )
      );
    })
  );
});
