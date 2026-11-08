/* mfatihicin.com service worker — sayfalar ağdan, yoksa önbellekten; statik dosyalar önbellekten. */
const V = "mfi-v4";
const CORE = ["/", "/araclar/", "/oyunlar/", "/en/", "/en/tools/", "/offline.html", "/assets/style.css?v=10", "/assets/site.js?v=9", "/assets/play.js?v=2", "/assets/favicon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.startsWith("/.well-known/") || u.pathname === "/apple-app-site-association" || u.pathname === "/app-ads.txt" || /-privacy\//.test(u.pathname) || /\/join/.test(u.pathname)) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); if (res.ok) caches.open(V).then((ca) => ca.put(r, c)); return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match("/offline.html"))));
    return;
  }
  if (u.pathname.startsWith("/assets/")) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const c = res.clone(); if (res.ok) caches.open(V).then((ca) => ca.put(r, c)); return res; })));
  }
});
