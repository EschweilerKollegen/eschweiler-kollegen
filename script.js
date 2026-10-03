/* eschweiler-kollegen.de: Menü, Einsteigen beim Scrollen, Zeitleiste, Kontaktformular. Ohne dieses Skript ist jeder Inhalt sichtbar. */
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

      button.disabled = true;
      say('Nachricht wird gesendet …', '');
      fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); form.reset(); say(ok, 'ok'); })
        .catch(function () {
          say('Die Nachricht konnte nicht gesendet werden. Bitte schreiben Sie an info@eschweiler-kollegen.de oder rufen Sie an: +49 171 479 13 14.', 'err');
        })
        .then(function () { button.disabled = false; });
    });
  }
})();
