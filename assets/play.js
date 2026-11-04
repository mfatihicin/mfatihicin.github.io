/* Oyun sonuçları: kişisel rekor, gelişim grafiği, yüzdelik karşılaştırma ve paylaşılabilir sonuç kartı.
   Kullanım: GR.done("reaction", 213)  — skor yalnızca anonim sayı olarak gönderilir. */
(function () {
  const EN = (document.documentElement.lang || "").startsWith("en");
  // lower: düşük değer daha iyi; norm: ortalama ve standart sapma (yaklaşık, yayımlanmış araştırma ve test verileri)
  const G = {
    reaction: { lower: true, unit: "ms", norm: [273, 55], tr: "Refleks testi", en: "Reaction time test", verb: ["insanların %{p}{abl} daha hızlısın", "faster than {p}% of people"] },
    typing: { lower: false, unit: EN ? "WPM" : "kelime/dk", norm: [41, 15], tr: "Klavye hız testi", en: "Typing speed test", verb: ["insanların %{p}{abl} daha hızlı yazıyorsun", "you type faster than {p}% of people"] },
    number: { lower: false, unit: EN ? "digits" : "basamak", norm: [8, 1.8], tr: "Sayı hafıza testi", en: "Number memory test", verb: ["insanların %{p}{abl} daha iyi hatırlıyorsun", "better memory than {p}% of people"] },
    stroop: { lower: false, unit: EN ? "correct" : "doğru", norm: [21, 6], tr: "Stroop testi", en: "Stroop test", verb: ["insanların %{p}{abl} daha odaklısın", "more focused than {p}% of people"] },
    memory: { lower: true, unit: EN ? "moves" : "hamle", norm: [22, 5], tr: "Hafıza oyunu", en: "Memory game", verb: ["insanların %{p}{abl} daha az hamle", "fewer moves than {p}% of people"] },
    logic: { lower: false, unit: EN ? "points" : "puan", norm: [50, 17], tr: "Mantık ve örüntü testi", en: "Logic and pattern test", verb: ["katılımcıların %{p}{abl} daha yüksek puan", "higher than {p}% of test takers"] },
  };
  const T = EN
    ? { best: "Personal best", last: "Your last results", share: "Share result", save: "Save image", again: "Play again", live: "based on {n} results on this site", approx: "approximate, based on published averages", newbest: "New personal best!", copied: "Copied" }
    : { best: "Kişisel rekor", last: "Son sonuçların", share: "Sonucu paylaş", save: "Görseli indir", again: "Tekrar oyna", live: "bu sitedeki {n} sonuca göre", approx: "yaklaşık, yayımlanmış ortalamalara göre", newbest: "Yeni kişisel rekor!", copied: "Kopyalandı" };
  const ABL = (n) => { n = Math.round(n); const d = n % 10, t = n % 100;
    if (n === 100) return "'ünden";
    if (d) return ["", "'inden", "'sinden", "'ünden", "'ünden", "'inden", "'sından", "'sinden", "'inden", "'undan"][d];
    return { 10: "'undan", 20: "'sinden", 30: "'undan", 40: "'ından", 50: "'sinden", 60: "'ından", 70: "'inden", 80: "'inden", 90: "'ından", 0: "'ından" }[t]; };
  const say = (g, p) => G[g].verb[EN ? 1 : 0].replace("{p}", p).replace("{abl}", ABL(p));
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const normPct = (v, m, s, lower) => { const z = (v - m) / s; const c = 0.5 * (1 + erf(z / Math.SQRT2)); return Math.max(1, Math.min(99, Math.round((lower ? 1 - c : c) * 100))); };
  const hist = (g) => { try { return JSON.parse(localStorage.getItem("hist:" + g) || "[]"); } catch (e) { return []; } };
  const saveHist = (g, h) => { try { localStorage.setItem("hist:" + g, JSON.stringify(h.slice(-20))); } catch (e) {} };
  const fmt = (v) => (Math.round(v * 10) / 10).toLocaleString(EN ? "en-US" : "tr-TR");

  function spark(vals, lower) {
    if (vals.length < 2) return "";
    const w = 240, h = 48, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    const pts = vals.map((v, i) => [i * (w / (vals.length - 1)), lower ? 4 + ((v - mn) / r) * (h - 8) : h - 4 - ((v - mn) / r) * (h - 8)]);
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p) => p.join(",")).join(" ")}"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" fill="var(--brand)"/></svg>`;
  }

  function card(g, v, pct) {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const x = c.getContext("2d"); const cs = getComputedStyle(document.documentElement);
    const brand = cs.getPropertyValue("--band").trim() || "#1D3B8F";
    x.fillStyle = brand; x.fillRect(0, 0, 1200, 630);
    x.globalAlpha = 0.08; x.strokeStyle = "#fff"; x.lineWidth = 2;
    for (let i = 0; i < 1300; i += 60) for (let j = 0; j < 700; j += 60) { x.beginPath(); x.arc(i, j, 26, 0, Math.PI * 2); x.stroke(); }
    x.globalAlpha = 1; x.fillStyle = "#fff";
    const F = '"Schibsted Grotesk", system-ui, sans-serif';
    x.font = `600 36px ${F}`; x.fillText(G[g][EN ? "en" : "tr"], 80, 120);
    x.font = `800 150px ${F}`; x.fillText(`${fmt(v)} ${G[g].unit}`, 76, 300);
    if (pct != null) { x.font = `600 44px ${F}`; x.globalAlpha = .9; x.fillText(say(g, pct), 80, 390); x.globalAlpha = 1; }
    x.font = `600 34px ${F}`; x.fillText(EN ? "Can you beat it?" : "Sen kaç yaparsın?", 80, 520);
    x.globalAlpha = .8; x.font = `500 30px ${F}`; x.fillText("mfatihicin.com", 80, 570); x.globalAlpha = 1;
    return c;
  }

  async function shareCard(g, v, pct) {
    const c = card(g, v, pct);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    const file = new File([blob], `${g}-${Math.round(v)}.png`, { type: "image/png" });
    const text = `${G[g][EN ? "en" : "tr"]}: ${fmt(v)} ${G[g].unit}${pct != null ? " · " + say(g, pct) : ""}. ${EN ? "Can you beat it?" : "Sen kaç yaparsın?"}`;
    const url = location.origin + location.pathname;
    if (window.gtag) gtag("event", "share", { method: "result_card", content_type: g });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
    if (navigator.share) { try { await navigator.share({ text, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
  }

  async function done(g, v, mount) {
    const cfg = G[g]; if (!cfg || !isFinite(v)) return;
    const h = hist(g); const prevBest = h.length ? (cfg.lower ? Math.min(...h) : Math.max(...h)) : null;
    h.push(v); saveHist(g, h);
    const isBest = prevBest == null || (cfg.lower ? v < prevBest : v > prevBest);
    const best = cfg.lower ? Math.min(...h) : Math.max(...h);
    if (window.MS) MS.submit(g, v);
    if (window.gtag) gtag("event", "game_complete", { game: g, score: v });
    let box = document.getElementById("gr-box");
    if (!box) { box = document.createElement("div"); box.id = "gr-box"; box.className = "gr"; (mount || document.querySelector(".tool")).after(box); }
    let pct = normPct(v, cfg.norm[0], cfg.norm[1], cfg.lower), src = T.approx;
    const render = () => {
      box.innerHTML = `<div class="gr-main"><div><div class="gr-v">${fmt(v)} <small>${cfg.unit}</small></div>
<p class="gr-p">${say(g, pct)} <span>(${src})</span></p>${isBest && h.length > 1 ? `<p class="gr-nb">🏆 ${T.newbest}</p>` : ""}</div>
<div class="gr-side"><div class="muted">${T.best}: <b>${fmt(best)} ${cfg.unit}</b></div>${h.length > 1 ? `<div class="muted" style="margin-top:6px">${T.last}</div>${spark(h.slice(-10), cfg.lower)}` : ""}</div></div>
<div class="row"><button class="btn primary" type="button" data-share>${T.share}</button><button class="btn" type="button" data-save>${T.save}</button></div>`;
      box.querySelector("[data-share]").onclick = () => shareCard(g, v, pct);
      box.querySelector("[data-save]").onclick = () => { const c = card(g, v, pct); const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `${g}-${Math.round(v)}.png`; a.click(); };
    };
    render();
    box.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    if (window.MS) { try { const r = await MS.rank(g, v, cfg.lower); if (r) { pct = Math.max(1, Math.min(99, r.pct)); src = T.live.replace("{n}", r.total.toLocaleString(EN ? "en-US" : "tr-TR")); render(); } } catch (e) {} }
  }
  window.GR = { done, hist, normPct, G, shareCard, card };
})();
