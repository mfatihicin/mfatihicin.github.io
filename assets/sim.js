/* Bir bilet okutulduğunda ne olur? — temsili sistem simülasyonu.
   Basit kuyruk modeli: önbellek isabeti, veritabanı kapasitesi, yoğunlukta gecikme ve zaman aşımı. */
(function () {
  const root = document.getElementById("sim");
  if (!root) return;
  let svg, layer;
  const $ = (s) => root.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const N = {};
  const pkts = [];
  function bind() {
    svg = [...root.querySelectorAll("svg")].find((s) => getComputedStyle(s).display !== "none") || root.querySelector("svg");
    layer = svg.querySelector(".pkts");
    pkts.splice(0).forEach((p) => p.c.remove());
    svg.querySelectorAll(".node").forEach((g) => {
      const r = g.querySelector("rect");
      const x = +r.getAttribute("x"), y = +r.getAttribute("y"), w = +r.getAttribute("width"), h = +r.getAttribute("height");
      N[g.dataset.id] = { g, cx: x + w / 2, cy: y + h / 2 };
    });
  }
  bind();
  matchMedia("(max-width: 560px)").addEventListener("change", () => { bind(); render(); });

  const S = { rush: false, cache: true, replica: false };
  const CAP = 260;           // veritabanı kapasitesi (istek/sn)
  const HOP = 8;             // ağ gecikmesi (ms)
  let shown = { rps: 0, lat: 0, hit: 0, db: 0, err: 0 };

  function model() {
    const rps = S.rush ? 420 : 40;
    const hit = S.cache ? 0.92 : 0;
    const cap = S.replica ? CAP * 2 : CAP;
    const dbRps = rps * (1 - hit);
    const util = dbRps / cap;
    const err = util > 1 ? (util - 1) / util : 0;
    const dbLat = util >= 0.97 ? 800 : 12 / (1 - util);
    const lat = 3 * HOP + hit * 1 + (1 - hit) * (err > 0 ? 800 : dbLat);
    return { rps, hit, util: Math.min(util, 1.6), err, dbLat, lat };
  }

  function render() {
    const m = model();
    const k = 0.12;
    shown.rps += (m.rps - shown.rps) * k;
    shown.lat += (m.lat - shown.lat) * k;
    shown.hit += (m.hit * 100 - shown.hit) * k;
    shown.db += (m.util * 100 - shown.db) * k;
    $("#m-rps").textContent = Math.round(shown.rps);
    $("#m-lat").textContent = Math.round(shown.lat) + " ms";
    $("#m-hit").textContent = "%" + Math.round(shown.hit);
    const db = $("#m-db");
    db.textContent = "%" + Math.min(999, Math.round(shown.db));
    db.classList.toggle("bad", shown.db > 85);
    $("#m-lat").classList.toggle("bad", shown.lat > 300);
    N.db.g.classList.toggle("err", m.err > 0);
    N.cache.g.classList.toggle("down", !S.cache);
  }

  // ---------- paketler ----------
  function route(kind) {
    const p = [N.qr, N.gate, N.api];
    if (kind === "cache") p.push(N.cache, N.api);
    else p.push(N.db, N.api);
    p.push(N.gate);
    return p.map((n) => [n.cx, n.cy]);
  }
  function spawn(kind, cls, speed) {
    if (reduce) return;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", 4.5);
    c.setAttribute("class", "pkt " + cls);
    layer.appendChild(c);
    pkts.push({ c, pts: route(kind), seg: 0, t: 0, speed });
  }
  function step(dt) {
    for (let i = pkts.length - 1; i >= 0; i--) {
      const p = pkts[i];
      p.t += dt * p.speed;
      while (p.t >= 1 && p.seg < p.pts.length - 2) { p.t -= 1; p.seg++; }
      if (p.seg >= p.pts.length - 2 && p.t >= 1) { p.c.remove(); pkts.splice(i, 1); continue; }
      const [x1, y1] = p.pts[p.seg], [x2, y2] = p.pts[p.seg + 1];
      p.c.setAttribute("cx", x1 + (x2 - x1) * p.t);
      p.c.setAttribute("cy", y1 + (y2 - y1) * p.t);
    }
  }

  let acc = 0, last = 0, visible = true, raf = 0;
  function loop(ts) {
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
    last = ts;
    const m = model();
    acc += dt * (m.rps / 18);              // görsel örnekleme: her ~18 istekten biri çizilir
    while (acc >= 1) {
      acc -= 1;
      if (pkts.length > 60) break;
      const hit = Math.random() < m.hit;
      const fail = !hit && Math.random() < m.err;
      const slow = !hit && m.util > 0.7;
      spawn(hit ? "cache" : "db", hit ? "cache" : fail ? "fail" : slow ? "slow" : "", fail ? 1.1 : slow ? 1.6 : 3.2);
    }
    step(dt);
    render();
    if (visible) raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting && !document.hidden; visible ? start() : stop(); }).observe(root);
  } else start();
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; visible ? start() : stop(); });
  if (reduce) { setInterval(render, 250); }

  // ---------- tek bilet izi ----------
  const log = $("#sim-log");
  let tracing = false;
  const code = () => "MS-" + new Date().getFullYear().toString().slice(2) + "-" + Math.random().toString(16).slice(2, 6).toUpperCase();
  function lit(id, cls) { Object.values(N).forEach((n) => n.g.classList.remove("on")); if (id) N[id].g.classList.add(cls || "on"); }
  async function trace() {
    if (tracing) return;
    tracing = true;
    const m = model();
    const hit = Math.random() < m.hit;
    const fail = !hit && Math.random() < Math.max(m.err, 0);
    const c = code();
    const lines = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
    const put = (html) => { lines.push(html); log.innerHTML = lines.slice(-3).join("<br>"); };
    let t = 0;
    lit("qr"); put(`<b>QR okundu</b> ${c}`); await wait(450);
    lit("gate"); t += HOP; put(`Turnike → API: POST /v1/gecis <b>${HOP} ms</b>`); await wait(450);
    lit("api"); t += HOP; put(`API: imza ve yetki doğrulandı <b>${HOP} ms</b>`); await wait(450);
    if (hit) { lit("cache"); t += 1; put(`Önbellek: bilet bulundu <b>1 ms</b>`); }
    else if (fail) { lit("db"); t += 800; put(`SQL Server: <b>zaman aşımı 800 ms</b>, kuyrukta ${Math.round(m.rps * (1 - m.hit))} istek`); }
    else { lit("db"); const d = m.err > 0 ? Math.round(420 + Math.random() * 330) : Math.round(m.dbLat); t += d; put(`SQL Server: bilet doğrulandı, geçiş yazıldı <b>${d} ms</b>` + (m.err > 0 ? " (kuyrukta bekledi)" : "")); }
    await wait(500);
    lit("gate");
    if (fail) put(`<b>503</b>, turnike kapalı kaldı: ziyaretçi tekrar okutmalı. Toplam ${t} ms`);
    else put(`<b>200 OK</b>, turnike açıldı. Toplam <b>${t} ms</b>`);
    if (!reduce) spawn(hit ? "cache" : "db", hit ? "cache" : fail ? "fail" : "", 2.2);
    await wait(900);
    lit(null);
    tracing = false;
  }
  $("#sim-trace").addEventListener("click", trace);
  function toggle(btn, key, onTxt, offTxt, msg) {
    btn.addEventListener("click", () => {
      S[key] = !S[key];
      btn.setAttribute("aria-pressed", String(key === "cache" ? !S[key] : S[key]));
      if (onTxt) btn.textContent = S[key] ? onTxt : offTxt;
      const m = model();
      log.innerHTML = msg(m);
      if (!raf && !reduce) start();
    });
  }
  const desc = (m) => `Saniyede <b>${m.rps}</b> okutma, ortalama yanıt <b>${Math.round(m.lat)} ms</b>` + (m.err > 0 ? `, isteklerin <b>%${Math.round(m.err * 100)}</b>'i zaman aşımına düşüyor.` : ".");
  toggle($("#sim-rush"), "rush", null, null, (m) => (S.rush ? "Bayram sabahı: kapılarda kuyruk var. " : "Normal gün. ") + desc(m));
  toggle($("#sim-cache"), "cache", "Önbelleği kapat", "Önbelleği aç", (m) => (S.cache ? "Önbellek açık: biletlerin çoğu veritabanına gitmeden doğrulanıyor. " : "Önbellek kapalı: her okutma veritabanına gidiyor. ") + desc(m));
  toggle($("#sim-rep"), "replica", null, null, (m) => (S.replica ? "Okuma replikası eklendi: veritabanı kapasitesi iki katına çıktı. " : "Tek veritabanı sunucusu. ") + desc(m));
  render();
})();
