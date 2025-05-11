const CACHE_NAME = "scorekeeper-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/countdown.html",
  "/skull.html",
  "/qwixx.html",
  "/hanabi.html",
  "/style.css",
  "/sidebar.css",
  "/script.js",
  "/countdown-script.js",
  "/skull-script.js",
  "/hanabi-script.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  // Fonts, images, libraries if needed
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Share+Tech+Mono&display=swap",
  "https://fonts.cdnfonts.com/css/star-jedi",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching app shell...");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
