# eschweiler-kollegen.de

Unternehmensseite von Eschweiler & Kollegen. Statische Seite ohne Build-Schritt, gedacht für Vercel (`cleanUrls`).

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `impressum.html`, `datenschutz.html` | Rechtstexte, erreichbar unter `/impressum` und `/datenschutz` |
| `404.html` | Fehlerseite |
| `styles.css` | Schriften, Grundlagen, Bewegung, Zustände. Das Layout steht als Inline-Stil im HTML. |
| `script.js` | Menü, Einsteigen beim Scrollen, Zeitleiste, Kontaktformular |
| `assets/img`, `assets/fonts` | Fotos, Logos, lokal eingebundene Schriften (Figtree, Playfair Display; SIL Open Font License) |

## Kontaktformular

In `script.js` steht `var WEBHOOK = '';`. Dort gehört die Adresse des n8n-Webhooks hinein.
Solange der Wert leer ist, öffnet das Formular das E-Mail-Programm des Besuchers mit der fertigen Nachricht an `info@eschweiler-kollegen.de`.

Gesendet wird als JSON: `name`, `unternehmen`, `email`, `telefon`, `nachricht`, `datenschutz`, `quelle`, `seite`, `zeitpunkt`.

## Hinweise

- Keine Analyse- und Werbedienste, keine externen Schriften, kein Cookie-Banner. Die Datenschutzerklärung beschreibt genau diesen Stand.
- Kanonische Adresse ist `https://www.eschweiler-kollegen.de`.
- Nach Änderungen an `styles.css` oder `script.js` die Versionsnummer `?v=` in den vier HTML-Dateien erhöhen.
