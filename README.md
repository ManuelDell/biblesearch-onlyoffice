# BibleSearch – OnlyOffice Plugin

Bibelverse direkt im Dokument einfügen mit der `@Referenz`-Syntax.

---

## Installation

### Methode 1 – .plugin-Datei (empfohlen)

1. `biblesearch.plugin` aus dem Repository herunterladen
2. OnlyOffice Docs öffnen → **Plugins** → **Einstellungen** → **Plugin aus Datei hinzufügen**
3. Die `.plugin`-Datei auswählen → Plugin wird aktiviert

### Methode 2 – manuell (Desktop)

Den `biblesearch/`-Ordner in das Plugin-Verzeichnis kopieren:

| System  | Pfad |
|---------|------|
| Windows | `%APPDATA%\onlyoffice\desktopeditors\sdkjs-plugins\` |
| Linux   | `~/.config/onlyoffice/desktopeditors/sdkjs-plugins\` |
| macOS   | `~/Library/Application Support/OnlyOffice/desktopeditors/sdkjs-plugins/` |

Anschließend OnlyOffice neu starten.

---

## Verwendung

1. **Plugin-Panel öffnen:** Plugins → BibleSearch
2. Panel offen lassen (der InputHelper ist nur aktiv, solange das Panel sichtbar ist)
3. Im Dokument eine `@Referenz` eintippen:

```
@Joh3:16        → einzelner Vers
@1Mo1:1-3       → Versbereich (3 Verse)
@Ps23           → gesamtes Kapitel
@Mt5:3-12       → Seligpreisungen
@Offb22:20-21   → Versbereich am Kapitelende
```

4. Sobald die Referenz erkannt wird, erscheint ein Dropdown mit Vorschau
5. Mit **Enter** oder Mausklick wird der Vers inline eingefügt

### Automatisches Kappen am Kapitelende

Geht ein Versbereich über das Kapitelende hinaus, wird er automatisch begrenzt:

```
@Joh3:14-99  →  fügt Joh 3:14–36 ein  (Kapitel endet bei Vers 36)
```

---

## Unterstützte Buchkürzel

Deutsche und englische Abkürzungen werden erkannt:

| Kürzel                | Buch           |
|-----------------------|----------------|
| `1Mo`, `1Mose`, `Gen` | 1. Mose        |
| `Joh`, `Jo`, `Jn`    | Johannes        |
| `Ps`, `Psalm`         | Psalmen         |
| `Röm`, `Roem`, `Rom`  | Römer          |
| `Off`, `Offb`, `Rev`  | Offenbarung     |
| `Mt`, `Matt`          | Matthäus        |
| … alle 66 Bücher      |                 |

Sowohl `@1.Mose1:1` (Langform mit Punkt) als auch `@1Mo1:1` (Kurzform) funktionieren.

---

## Einstellungen

Im Plugin-Panel einstellbar:

| Einstellung      | Optionen |
|------------------|----------|
| Bibelübersetzung | Luther 1912 (`delut`), Elberfelder 1905 (`elb1905`), KJV (`kjv`), WEB (`web`) |
| Ausgabeformat    | Text + Bibelstelle · Nur Text · Text + Stelle + Übersetzung |

**Beispiel** (Format: Text + Bibelstelle):
> Also hat Gott die Welt geliebt, daß er seinen eingeborenen Sohn gab … (Johannes 3:16)

---

## API

Das Plugin verwendet die freie [GetBible API](https://getbible.net) – kein API-Key erforderlich.

```
https://api.getbible.net/v2/{übersetzung}/{buch-nr}/{kapitel}.json
```

Alle verfügbaren Übersetzungscodes:
[api.getbible.net/v2/translations.json](https://api.getbible.net/v2/translations.json)

---

## Projektstruktur

```
biblesearch/
├── config.json          ← Plugin-Manifest (GUID, Editor-Unterstützung)
├── index.html           ← Einstiegspunkt + Settings-Panel
├── scripts/
│   └── code.js          ← Gesamte Plugin-Logik (~230 Zeilen)
├── styles/
│   └── plugin.css
└── resources/img/
    ├── icon.png         ← 40×40 px
    └── icon@2x.png      ← 80×80 px (Retina)
```

### .plugin-Datei neu erzeugen

```bash
python3 -c "
import zipfile, os
with zipfile.ZipFile('biblesearch.plugin', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('biblesearch'):
        for f in files:
            path = os.path.join(root, f)
            zf.write(path, os.path.relpath(path, 'biblesearch'))
print('biblesearch.plugin erstellt')
"
```

---

## Bekannte Einschränkungen (Phase 1)

- Der InputHelper ist nur aktiv, solange das Plugin-Panel geöffnet ist
- Nur Writer (`word`) unterstützt – kein Calc/Impress
