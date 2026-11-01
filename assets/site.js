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
  analytics: { provider: null },

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
    if (kind === "wa") { el.href = "https://wa.me/" + S.phone + "?text=" + encodeURIComponent("Merhaba Mehmet Bey, web siteniz üzerinden ulaşıyorum."); }
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
  window.copyText = async txt => { try { await navigator.clipboard.writeText(txt); toast("Kopyalandı"); } catch (e) { toast("Kopyalanamadı"); } };
  window.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
