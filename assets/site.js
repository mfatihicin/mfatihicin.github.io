/* ======================================================================
   SİTE AYARLARI — sadece bu bloğu düzenleyerek telefon, reklam ve analiz
   altyapısını açıp kapatabilirsin.
   ====================================================================== */
window.SITE = {
  // Cep numarası: uluslararası formatta, boşluksuz. Örn: "905551112233"
  // Boş bırakılırsa telefon ve WhatsApp butonları görünmez.
  phone: "905418388004",
  // Telegram kullanıcı adı (t.me/...). Boşsa gizlenir.
  telegram: "mfatihicin",
  email: "mfatihicin@gmail.com",

  // Reklam altyapısı. provider: null => reklam yok (varsayılan).
  // Örnekler:
  //   { provider: "custom", html: "<a href='...'><img src='...'></a>" }   // sponsor / affiliate banner
  //   { provider: "script", src: "https://...", attrs: {"data-x":"y"} }   // Media.net, EthicalAds vb. script
  ads: { provider: null },

  // Ziyaretçi analizi (çerezsiz). Örn: { provider: "goatcounter", code: "mfatihicin" }
  analytics: { provider: "cloudflare", token: "e86a4488e5fd4628b8c4f8ef418019ea" },

  // Bağış / destek linki (Buy Me a Coffee, GitHub Sponsors vb.). Boşsa gizlenir.
  supportUrl: ""
};

(function () {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Tema
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  const tb = $("#themeBtn");
  if (tb) tb.addEventListener("click", () => {
    const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const nxt = cur === "light" ? "dark" : "light";
    root.dataset.theme = nxt;
    try { localStorage.setItem("theme", nxt); } catch (e) {}
  });

  // Mobil menü
  const mb = $("#menuBtn"), nav = $("#nav");
  if (mb && nav) mb.addEventListener("click", () => {
    const o = nav.classList.toggle("open");
    mb.setAttribute("aria-expanded", o);
  });

  // İletişim: telefon / WhatsApp
  const fmt = p => "+" + p.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5");
  $$("[data-phone]").forEach(el => {
    if (!S.phone) { el.remove(); return; }
    const kind = el.dataset.phone;
    if (kind === "tel") { el.href = "tel:+" + S.phone; el.querySelector("span") && (el.querySelector("span").textContent = fmt(S.phone)); }
    if (kind === "wa") { el.href = "https://wa.me/" + S.phone + "?text=" + encodeURIComponent((document.documentElement.lang || "").startsWith("en") ? "Hi Mehmet, I am reaching out via your website." : "Merhaba Mehmet Bey, web siteniz üzerinden ulaşıyorum."); }
    el.hidden = false;
  });
  $$("[data-telegram]").forEach(el => { if (!S.telegram) { el.remove(); return; } el.href = "https://t.me/" + S.telegram; el.hidden = false; });
  $$("[data-support]").forEach(el => { if (!S.supportUrl) el.remove(); else { el.href = S.supportUrl; el.hidden = false; } });

  // Reklam yuvaları
  if (S.ads && S.ads.provider) {
    $$(".ad-slot").forEach(slot => {
      if (S.ads.provider === "custom" && S.ads.html) slot.innerHTML = S.ads.html;
    });
    if (S.ads.provider === "script" && S.ads.src) {
      const sc = document.createElement("script");
      sc.async = true; sc.src = S.ads.src;
      Object.entries(S.ads.attrs || {}).forEach(([k, v]) => sc.setAttribute(k, v));
      document.head.appendChild(sc);
    }
  }

  // Analiz
  if (S.analytics && S.analytics.provider === "cloudflare" && S.analytics.token) {
    const sc = document.createElement("script");
    sc.defer = true; sc.src = "https://static.cloudflareinsights.com/beacon.min.js";
    sc.setAttribute("data-cf-beacon", JSON.stringify({ token: S.analytics.token }));
    document.body.appendChild(sc);
  }
  if (S.analytics && S.analytics.provider === "goatcounter" && S.analytics.code) {
    const sc = document.createElement("script");
    sc.async = true; sc.src = "https://gc.zgo.at/count.js";
    sc.dataset.goatcounter = "https://" + S.analytics.code + ".goatcounter.com/count";
    document.body.appendChild(sc);
  }

  // Mağaza tıklamalarını say (analytics açıksa)
  $$("a[data-store]").forEach(a => a.addEventListener("click", () => {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "store-" + a.dataset.store, event: true });
  }));

  // Ortak yardımcılar
  window.toast = msg => {
    let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
  };
  const EN = (document.documentElement.lang || "").toLowerCase().startsWith("en");
  window.copyText = async txt => { try { await navigator.clipboard.writeText(txt); toast(EN ? "Copied" : "Kopyalandı"); } catch (e) { toast(EN ? "Could not copy" : "Kopyalanamadı"); } };
  window.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();

/* ======================================================================
   Komut paleti — Ctrl/⌘ + K veya "/" ile açılır. İndeks: /assets/search.json
   ====================================================================== */
(function () {
  let data = null, items = [], sel = 0, box = null;
  const EN = (document.documentElement.lang || "").toLowerCase().startsWith("en");
  const TX = EN ? { label: "Search the site", ph: "Search tools, apps, projects… (e.g. ip, qr, pdf)", find: "Search", sel: "↑↓ select", open: "Enter open", close: "Esc close", load: "Loading…", none: (q) => `No results for “${esc(q)}”. Try a shorter word or browse <a href="/en/tools/">all tools</a>.`, err: "Could not load the search index. Refresh the page and try again.", idx: "/assets/search-en.json" }
                : { label: "Sitede ara", ph: "Araç, uygulama, yazı ara… (ör. maaş, gizlilik, ip)", find: "Ara", sel: "↑↓ seç", open: "Enter aç", close: "Esc kapat", load: "Yükleniyor…", none: (q) => `“${esc(q)}” için sonuç yok. Daha kısa bir kelime dene ya da <a href="/araclar/">tüm araçlara</a> göz at.`, err: "Arama dizini yüklenemedi. Sayfayı yenileyip tekrar dene.", idx: "/assets/search.json" };
  const norm = (s) => (s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").normalize("NFD").replace(/[̀-ͯ]/g, "");
  function build() {
    box = document.createElement("div");
    box.className = "cmdk";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", TX.label);
    box.innerHTML = '<div class="cmdk-box"><div class="cmdk-in"><span aria-hidden="true">🔎</span><input type="text" placeholder="' + TX.ph + '" aria-label="' + TX.find + '" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="cmdk-list"><kbd>Esc</kbd></div><div class="cmdk-list" id="cmdk-list" role="listbox"></div><div class="cmdk-foot"><span>' + TX.sel + '</span><span>' + TX.open + '</span><span>' + TX.close + '</span></div></div>';
    document.body.appendChild(box);
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    const inp = box.querySelector("input");
    inp.addEventListener("input", () => { sel = 0; draw(inp.value); });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, items.length - 1); mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); mark(); e.preventDefault(); }
      else if (e.key === "Enter") { const a = box.querySelectorAll(".cmdk-list a")[sel]; if (a) { a.click(); } e.preventDefault(); }
      else if (e.key === "Escape") close();
    });
  }
  function score(it, q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return it.p || 0;
    const t = norm(it.t), k = norm(it.k || "") + " " + norm(it.d || "");
    let s = 0;
    for (const w of words) {
      if (t.startsWith(w)) s += 30;
      else if (t.split(/\s+/).some((x) => x.startsWith(w))) s += 20;
      else if (t.includes(w)) s += 12;
      else if (k.includes(w)) s += 6;
      else return -1;
    }
    return s + (it.p || 0) / 10;
  }
  function draw(q) {
    const list = box.querySelector(".cmdk-list");
    if (!data) { list.innerHTML = '<div class="cmdk-empty">' + TX.load + '</div>'; return; }
    items = data.map((it) => [score(it, q), it]).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0]).slice(0, 12).map((x) => x[1]);
    if (!items.length) { list.innerHTML = `<div class="cmdk-empty">${TX.none(q)}</div>`; return; }
    list.innerHTML = items.map((it, i) => `<a href="${it.u}" role="option" id="cmdk-${i}"><span class="e" aria-hidden="true">${it.e || "•"}</span><span class="t"><b>${esc(it.t)}</b><small>${esc(it.d || "")}</small></span><span class="k">${esc(it.c)}</span></a>`).join("");
    list.querySelectorAll("a").forEach((a, i) => a.addEventListener("mousemove", () => { if (sel !== i) { sel = i; mark(); } }));
    mark();
  }
  function mark() {
    box.querySelectorAll(".cmdk-list a").forEach((a, i) => a.setAttribute("aria-selected", String(i === sel)));
    const a = box.querySelectorAll(".cmdk-list a")[sel];
    if (a) { a.scrollIntoView({ block: "nearest" }); box.querySelector("input").setAttribute("aria-activedescendant", a.id); }
  }
  let lastFocus = null;
  function open(prefill) {
    if (!box) build();
    lastFocus = document.activeElement;
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    const inp = box.querySelector("input");
    inp.value = prefill || "";
    inp.focus();
    draw(inp.value);
    if (!data) fetch(TX.idx).then((r) => r.json()).then((j) => { data = j; draw(inp.value); }).catch(() => { box.querySelector(".cmdk-list").innerHTML = '<div class="cmdk-empty">' + TX.err + '</div>'; });
  }
  function close() { if (!box) return; box.classList.remove("open"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.addEventListener("keydown", (e) => {
    const typing = /input|textarea|select/i.test((e.target || {}).tagName || "") || (e.target && e.target.isContentEditable);
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); box && box.classList.contains("open") ? close() : open(); }
    else if (e.key === "/" && !typing) { e.preventDefault(); open(); }
  });
  document.querySelectorAll("[data-cmdk]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(b.dataset.cmdk || ""); }));
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll("kbd[data-mod]").forEach((k) => (k.textContent = isMac ? "⌘K" : "Ctrl K"));
})();
