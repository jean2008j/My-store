// Minimal service worker for the My Store admin app.
// Keeps the app shell available offline after the first visit.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
