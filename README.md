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

Das Formular sendet per `POST` als JSON an den n8n-Webhook, der in `script.js` als `WEBHOOK` steht (Workflow „eschweiler-kollegen.de -> Kontakt -> Pipedrive (Generell)"). n8n legt Person und Deal in der Pipedrive-Pipeline „Generell" an, hängt die Nachricht als Notiz an und verschickt eine Eingangsbestätigung an den Absender sowie eine Meldung an `info@eschweiler-kollegen.de`.

Felder: `name`, `unternehmen`, `email`, `telefon`, `nachricht`, `datenschutz`, `quelle`, `seite`, `zeitpunkt`. Das unsichtbare Feld `website` ist ein Honeypot gegen Bots.

Ist `WEBHOOK` leer, öffnet das Formular stattdessen das E-Mail-Programm des Besuchers.

## Hinweise

- Reichweitenmessung mit Vercel Web Analytics (cookielos, Skript `/_vercel/insights/script.js` im `<head>` jeder Seite; im Vercel-Projekt eingeschaltet). Keine Werbedienste, keine Cookies, keine externen Schriften, kein Cookie-Banner. Die Datenschutzerklärung beschreibt genau diesen Stand.
- Ablauf: Kontaktformular → `/terminbuchen` (Kalender von Cal.com, Angaben vorbefüllt) → `/termin-bestaetigt` (Name, Angaben, Termin). Die Angaben liegen dazwischen nur im Browser (`sessionStorage`, Schlüssel `ek_lead` und `ek_termin`) und werden auf der Bestätigungsseite entfernt. Der Kalender ist in `script.js` als `CAL_LINK` hinterlegt.
- Kanonische Adresse ist `https://www.eschweiler-kollegen.de`.
- `llms.txt` beschreibt die Website für Sprachmodelle (Aufbau nach llmstxt.org); der Inhalt folgt den Texten der Startseite.
- Suchmaschinen: jede Seite trägt Titel, Beschreibung, Open-Graph- und Twitter-Angaben mit dem Vorschaubild `assets/img/og-eschweiler-kollegen.jpg` (1200 × 630). Startseite und Terminseite sind indexierbar und stehen in `sitemap.xml`; Rechtsseiten, Bestätigungsseite und 404 sind `noindex`. Strukturierte Daten (JSON-LD): Unternehmen, Website, Seite, Fragen, Brotkrumen. Fotos liegen als WebP vor.
- Nach Änderungen an `styles.css` oder `script.js` die Versionsnummer `?v=` in den vier HTML-Dateien erhöhen.
