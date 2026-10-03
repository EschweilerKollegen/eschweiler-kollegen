/* eschweiler-kollegen.de: Menü, Einsteigen beim Scrollen, Zeitleiste, Terminkalender, Terminbestätigung, Cookie-Einstellungen, Kontaktformular. Ohne dieses Skript ist jeder Inhalt sichtbar. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Menü auf schmalen Bildschirmen */
  var menuBtn = document.querySelector('.ek-menu');
  var menu = document.getElementById('ek-mobilnav');
  if (menuBtn && menu) {
    var setMenu = function (open) {
      if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    menuBtn.addEventListener('click', function () { setMenu(menu.hasAttribute('hidden')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hasAttribute('hidden')) { setMenu(false); menuBtn.focus(); } });
  }

  /* Einsteigen beim Scrollen: einmal je Element */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ek-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px 8% 0px' });
    var els = document.querySelectorAll('[data-reveal]');
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* Zeitleiste der Arbeitsweise: füllt sich mit dem Scrollen */
  var tls = document.querySelectorAll('.ek-tl');
  if (!reduce && tls.length) {
    var live = false, ticking = false;
    var update = function () {
      ticking = false;
      var line = window.innerHeight * 0.62;
      for (var t = 0; t < tls.length; t++) {
        var steps = tls[t].querySelectorAll('.ek-tl-step');
        for (var s = 0; s < steps.length; s++) {
          var dot = steps[s].querySelector('.ek-tl-dot');
          var r = dot.getBoundingClientRect();
          steps[s].classList.toggle('is-on', r.top + r.height / 2 <= line);
          var fill = steps[s].querySelector('.ek-tl-fill');
          if (fill) {
            var sr = fill.parentNode.getBoundingClientRect();
            var p = sr.height > 0 ? (line - sr.top) / sr.height : 1;
            fill.style.setProperty('--s', Math.max(0, Math.min(1, p)).toFixed(3));
          }
        }
      }
    };
    var request = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
    var onScroll = function () {
      if (!live) { live = true; for (var t = 0; t < tls.length; t++) tls[t].classList.add('is-live'); }
      request();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { if (live) request(); });
    if (document.documentElement.scrollHeight - window.innerHeight > 200) onScroll();
  }

  /* Angaben aus dem Kontaktformular bzw. der Buchung; liegen nur im Browser (sessionStorage). */
  var readLead = function () {
    try { return JSON.parse(sessionStorage.getItem('ek_lead') || '{}') || {}; } catch (err) { return {}; }
  };

  /* Terminseite: Buchungskalender von Cal.com. Wird nur geladen, wo #cal-inline steht. */
  var calBox = document.getElementById('cal-inline');
  if (calBox) {
    var CAL_LINK = 'andre-eschweiler/kostenfreies-erstgesprach-sanierung';
    var CAL_NS = 'erstgespraech';
    var lead = readLead();
    var greet = document.getElementById('tm-greet');
    if (greet && lead.name) greet.textContent = 'Danke, ' + lead.name + '. Ihre Nachricht ist angekommen. ';

    var cfg = { layout: 'month_view', theme: 'light', useSlotsViewOnSmallScreen: 'true' };
    if (lead.name) cfg.name = lead.name;
    if (lead.email) cfg.email = lead.email;
    if (lead.phone) {
      var tel = String(lead.phone).replace(/[^\d+]/g, '');
      if (/^00/.test(tel)) tel = '+' + tel.slice(2);
      else if (/^0[1-9]/.test(tel)) tel = '+49' + tel.slice(1);
      else if (/^[1-9]/.test(tel)) tel = '+49' + tel;
      if (/^\+\d{7,}$/.test(tel)) cfg.attendeePhoneNumber = tel;
    }
    if (lead.firma) cfg.notes = 'Unternehmen: ' + lead.firma;

    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', CAL_NS, { origin: 'https://app.cal.com' });
    window.Cal.ns[CAL_NS]('inline', { elementOrSelector: '#cal-inline', calLink: CAL_LINK, config: cfg });
    window.Cal.ns[CAL_NS]('ui', { theme: 'light', hideEventTypeDetails: true, layout: 'month_view', cssVarsPerTheme: { light: { 'cal-brand': '#0b1c33' } } });
    window.Cal.ns[CAL_NS]('on', { action: 'linkReady', callback: function () { calBox.classList.add('is-ready'); } });
    /* Nach der Buchung: Termin und Angaben merken, weiter zur Bestätigungsseite */
    window.Cal.ns[CAL_NS]('on', { action: 'bookingSuccessful', callback: function (e) {
      try {
        var d = e && e.detail && e.detail.data;
        var bk = (d && d.booking) || {};
        var rs = bk.responses || {};
        var at = (bk.attendees && bk.attendees[0]) || {};
        var str = function (v) { return typeof v === 'string' && v ? v : ''; };
        var when = d && (d.date || bk.startTime || (d.confirmed && d.confirmed.date));
        if (when) sessionStorage.setItem('ek_termin', when);
        sessionStorage.setItem('ek_lead', JSON.stringify({
          name: str(rs.name) || str(at.name) || lead.name || '',
          email: str(rs.email) || str(at.email) || lead.email || '',
          phone: str(rs.attendeePhoneNumber) || lead.phone || '',
          firma: lead.firma || ''
        }));
      } catch (err) {}
      (window.dataLayer = window.dataLayer || []).push({ event: 'termin_gebucht' });
      window.setTimeout(function () { location.href = '/termin-bestaetigt'; }, 600);
    } });
  }

  /* Bestätigungsseite: Name, Angaben und Termin der Buchung anzeigen, danach lokal aufräumen */
  var daten = document.getElementById('tb-daten');
  if (daten) {
    var bl = readLead();
    var tg = document.getElementById('tb-greet');
    if (tg && bl.name) tg.textContent = 'Danke, ' + bl.name + '. ';
    var rows = daten.querySelectorAll('[data-row]');
    for (var ri = 0; ri < rows.length; ri++) {
      var value = bl[rows[ri].getAttribute('data-row')];
      if (value) { rows[ri].querySelector('dd').textContent = value; rows[ri].removeAttribute('hidden'); }
    }
    if (!daten.querySelector('[data-row]:not([hidden])')) daten.setAttribute('hidden', '');
    try {
      var whenRaw = sessionStorage.getItem('ek_termin');
      var dt = whenRaw ? new Date(whenRaw) : null;
      var tw = document.getElementById('tb-when');
      if (tw && dt && !isNaN(dt)) {
        tw.textContent = 'Ihr Termin: ' + dt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) +
          ' um ' + dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
        tw.removeAttribute('hidden');
      }
      sessionStorage.removeItem('ek_lead');
      sessionStorage.removeItem('ek_termin');
    } catch (err) {}
  }

  /* Cookie-Einstellungen: öffnet das Einwilligungsfenster erneut */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.ek-cookie') : null;
    if (!a) return;
    e.preventDefault();
    var cb = window.Cookiebot;
    if (cb && typeof cb.renew === 'function') cb.renew();
    else if (cb && typeof cb.show === 'function') cb.show();
  });

  /* Kontaktformular.
     WEBHOOK: Adresse des n8n-Webhooks (Workflow "eschweiler-kollegen.de -> Kontakt -> Pipedrive (Generell)").
     Ist sie leer, öffnet das Formular
     das E-Mail-Programm des Besuchers mit der fertigen Nachricht. */
  var WEBHOOK = 'https://eschweiler.app.n8n.cloud/webhook/ek-kontakt';
  var form = document.getElementById('kontaktformular');
  if (form) {
    var status = document.getElementById('kf-status');
    var button = document.getElementById('kf-senden');
    var say = function (text, kind) {
      status.textContent = text;
      status.className = kind ? 'is-' + kind : '';
    };
    var val = function (name) { return (form.elements[name].value || '').trim(); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = 'Vielen Dank. Ihre Nachricht ist angekommen, wir melden uns bei Ihnen.';
      if (val('website')) { form.reset(); say(ok, 'ok'); return; } /* Honeypot */

      var data = {
        name: val('name'), unternehmen: val('unternehmen'), email: val('email'),
        telefon: val('telefon'), nachricht: val('nachricht'), datenschutz: true,
        quelle: 'eschweiler-kollegen.de', seite: location.href, zeitpunkt: new Date().toISOString()
      };

      if (!WEBHOOK) {
        var body = data.nachricht + '\n\n' + data.name +
          (data.unternehmen ? '\n' + data.unternehmen : '') +
          (data.telefon ? '\nTelefon: ' + data.telefon : '') + '\n' + data.email;
        location.href = 'mailto:info@eschweiler-kollegen.de?subject=' +
          encodeURIComponent('Anfrage über eschweiler-kollegen.de') + '&body=' + encodeURIComponent(body);
        say('Ihr E-Mail-Programm öffnet sich mit Ihrer Nachricht. Bitte senden Sie sie dort ab.', 'ok');
        return;
      }

      var sent = false;
      button.disabled = true;
      say('Nachricht wird gesendet …', '');
      fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          /* Angaben für Terminseite und Bestätigung: nur im Browser (sessionStorage), nichts in der Adresse */
          try { sessionStorage.setItem('ek_lead', JSON.stringify({ name: data.name, email: data.email, phone: data.telefon, firma: data.unternehmen })); } catch (err) {}
          form.reset(); say('Vielen Dank. Ihre Nachricht ist angekommen. Sie gelangen jetzt zur Terminauswahl …', 'ok');
          (window.dataLayer = window.dataLayer || []).push({ event: 'kontakt' }); /* für GTM; ohne Formularinhalte */
          sent = true;
          window.setTimeout(function () { location.href = '/terminbuchen'; }, 1200);
        })
        .catch(function () {
          say('Die Nachricht konnte nicht gesendet werden. Bitte schreiben Sie an info@eschweiler-kollegen.de oder rufen Sie an: +49 171 479 13 14.', 'err');
        })
        .then(function () { if (!sent) button.disabled = false; });
    });
  }
})();
