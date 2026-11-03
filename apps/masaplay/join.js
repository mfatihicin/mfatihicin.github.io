/*
 * MasaPlay invite landing page logic (join.html?code=XXXXXX).
 * The code is validated against the room-code alphabet before use, all
 * text goes in with textContent (never innerHTML), and room details come
 * from the public `join` Edge Function (?format=json: game, host name, seats).
 * Pure helpers are exported for the app's jest suite (invite-link.test.ts).
 */
(function () {
  'use strict';

  var ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
  var API = 'https://zdbcfqgybkyvhmanqqvy.supabase.co/functions/v1/join';
  var PKG = 'com.mfatihicin.masaplay';
  var PLAY = 'https://play.google.com/store/apps/details?id=' + PKG;
  var GAMES = { tavla: 'Tavla', pisti: 'Pişti', batak: 'Batak', okey: 'Okey', okey101: '101 Okey' };

  function normalizeCode(raw) {
    if (typeof raw !== 'string' || raw.length > 32) return null;
    var c = raw.trim().toUpperCase().replace(/[\s-]/g, '');
    return ROOM_CODE_RE.test(c) ? c : null;
  }

  function codeFromSearch(search) {
    var m = /(?:^\?|&)code=([^&#]*)/.exec(search || '');
    if (!m) return null;
    try {
      return normalizeCode(decodeURIComponent(m[1]));
    } catch (e) {
      return null;
    }
  }

  function appUrl(code, android) {
    return android
      ? 'intent://join?code=' + code + '#Intent;scheme=masaplay;package=' + PKG +
          ';S.browser_fallback_url=' + encodeURIComponent(PLAY) + ';end'
      : 'masaplay://join?code=' + code;
  }

  /** Headline + sub text for a room lookup result (null = lookup failed). */
  function describe(info) {
    if (!info || info.error) return { title: 'Masaya davetlisin', sub: 'Uygulamada aç, direkt masaya otur.' };
    if (!info.found) {
      return { title: 'Masa bulunamadı', sub: 'Bu masa kapanmış olabilir. Arkadaşından yeni bir davet iste.' };
    }
    var game = GAMES[info.game] || 'MasaPlay';
    var host = typeof info.host === 'string' ? info.host.slice(0, 32) : '';
    if (!info.open) {
      return { title: game + ' masası', sub: 'Bu masada oyun başladı ya da bitti. Arkadaşından yeni bir davet iste.' };
    }
    if (info.players >= info.maxPlayers) {
      return { title: game + ' masası dolu', sub: 'Tüm koltuklar dolu.' };
    }
    return {
      title: host ? host + ' seni ' + game + ' masasına çağırıyor' : game + ' masasına davetlisin',
      sub: 'Masada ' + info.players + '/' + info.maxPlayers + ' oyuncu var. Uygulamada aç, direkt masaya otur.',
    };
  }

  var api = { normalizeCode: normalizeCode, codeFromSearch: codeFromSearch, appUrl: appUrl, describe: describe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };
  var show = function (el) { if (el) el.classList.remove('hidden'); };
  var setText = function (d) { $('title').textContent = d.title; $('sub').textContent = d.sub; };

  var code = codeFromSearch(window.location.search);
  if (!code) {
    setText({ title: 'Davet linki geçersiz', sub: 'Linkteki oda kodu hatalı. Arkadaşından yeni bir davet iste.' });
    return;
  }
  document.title = 'MasaPlay — ' + code;
  $('code').textContent = code;
  show($('codeBox'));

  var android = /Android/i.test(navigator.userAgent);
  var open = $('open');
  open.setAttribute('href', appUrl(code, android));
  show(open);

  if (navigator.clipboard && window.isSecureContext) {
    var copy = $('copy');
    show(copy);
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(code).then(function () { copy.textContent = 'Kopyalandı ✓'; });
    });
  }

  if (window.fetch) {
    fetch(API + '?format=json&code=' + code)
      .then(function (r) { return r.json(); })
      .then(function (info) { setText(describe(info)); })
      .catch(function () {});
  }

  // Try to open the app right away; if we're still here shortly after, the
  // app is probably not installed → show the hint above the store buttons.
  var timer = setTimeout(function () { show($('hint')); }, 1800);
  document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); });
  try { window.location.href = appUrl(code, android); } catch (e) { /* ignore */ }
})();
