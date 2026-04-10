/* BibleSearch – OnlyOffice Plugin
 * Tippe @Buch Kapitel:Vers und drücke Tab um den Vers inline einzufügen.
 * Aktivierung: Plugin-Panel öffnen → Toggle einschalten.
 * API: https://api.getbible.net/v2/{übersetzung}/{buch}/{kapitel}.json
 */
(function (window, undefined) {
    'use strict';

    // Defensiv: sicherstellen dass Asc.plugin existiert,
    // auch falls plugins.js noch nicht geladen ist
    window.Asc         = window.Asc         || {};
    window.Asc.plugin  = window.Asc.plugin  || {};

    // ── Bücher: Kürzel → Nummer 1–66 ──────────────────────────────────────
    const BOOKS = {
        // Altes Testament
        '1mo':1,'1mos':1,'1mose':1,'gen':1,'genesis':1,
        '2mo':2,'2mos':2,'2mose':2,'ex':2,'exo':2,'exodus':2,
        '3mo':3,'3mos':3,'3mose':3,'lev':3,'levitikus':3,
        '4mo':4,'4mos':4,'4mose':4,'num':4,'numeri':4,
        '5mo':5,'5mos':5,'5mose':5,'dtn':5,'deu':5,'deuteronomium':5,
        'jos':6,'josua':6,'josh':6,
        'ri':7,'richter':7,'jdg':7,'judges':7,
        'rut':8,'ruth':8,
        '1sam':9,'1samuel':9,'1sa':9,
        '2sam':10,'2samuel':10,'2sa':10,
        '1koe':11,'1koen':11,'1kön':11,'1kg':11,'1ki':11,
        '2koe':12,'2koen':12,'2kön':12,'2kg':12,'2ki':12,
        '1chr':13,'1chron':13,'1ch':13,
        '2chr':14,'2chron':14,'2ch':14,
        'esr':15,'esra':15,'ezr':15,
        'neh':16,'nehemia':16,
        'est':17,'ester':17,'esther':17,
        'hi':18,'hiob':18,'job':18,
        'ps':19,'psa':19,'psalm':19,'psalmen':19,
        'spr':20,'sprueche':20,'prov':20,
        'pred':21,'prediger':21,'koh':21,'kohelet':21,
        'hl':22,'hld':22,'hohelied':22,
        'jes':23,'jesaja':23,'isa':23,
        'jer':24,'jeremia':24,
        'klgl':25,'klagl':25,'lam':25,
        'hes':26,'hesekiel':26,'ez':26,'ezekiel':26,
        'dan':27,'daniel':27,
        'hos':28,'hosea':28,
        'joe':29,'joel':29,
        'am':30,'amos':30,
        'ob':31,'obadja':31,
        'jon':32,'jona':32,'jonah':32,
        'mi':33,'micha':33,'mic':33,
        'nah':34,'nahum':34,
        'hab':35,'habakuk':35,
        'zef':36,'zefanja':36,'zeph':36,
        'hag':37,'haggai':37,
        'sach':38,'sacharja':38,'zech':38,
        'mal':39,'maleachi':39,
        // Neues Testament
        'mt':40,'matt':40,'matth':40,'matthaeus':40,'matthew':40,
        'mk':41,'markus':41,'mark':41,
        'lk':42,'luk':42,'lukas':42,'luke':42,
        'joh':43,'jo':43,'johannes':43,'john':43,'jn':43,
        'apg':44,'acts':44,
        'roem':45,'röm':45,'roemer':45,'rom':45,'romans':45,
        '1kor':46,'1korinther':46,'1cor':46,
        '2kor':47,'2korinther':47,'2cor':47,
        'gal':48,'galater':48,'galatians':48,
        'eph':49,'epheser':49,'ephesians':49,
        'phil':50,'philipper':50,
        'kol':51,'kolosser':51,'col':51,
        '1thess':52,'1th':52,'1thes':52,
        '2thess':53,'2th':53,'2thes':53,
        '1tim':54,'1timotheus':54,'1ti':54,
        '2tim':55,'2timotheus':55,'2ti':55,
        'tit':56,'titus':56,
        'phlm':57,'philemon':57,
        'heb':58,'hebr':58,'hebraeer':58,'hebrews':58,
        'jak':59,'jakobus':59,'james':59,'jas':59,
        '1petr':60,'1petrus':60,'1pet':60,
        '2petr':61,'2petrus':61,'2pet':61,
        '1joh':62,'1johannes':62,'1jn':62,'1jo':62,
        '2joh':63,'2johannes':63,'2jn':63,
        '3joh':64,'3johannes':64,'3jn':64,
        'jud':65,'judas':65,'jude':65,
        'off':66,'offb':66,'offenbarung':66,'rev':66,'revelation':66,
    };

    // Deutsche Anzeigenamen (Index 0 = Buch 1)
    const NAMES = [
        '1. Mose','2. Mose','3. Mose','4. Mose','5. Mose',
        'Josua','Richter','Ruth','1. Samuel','2. Samuel',
        '1. Könige','2. Könige','1. Chronik','2. Chronik',
        'Esra','Nehemia','Ester','Hiob','Psalmen','Sprüche',
        'Prediger','Hohelied','Jesaja','Jeremia','Klagelieder',
        'Hesekiel','Daniel','Hosea','Joel','Amos','Obadja',
        'Jona','Micha','Nahum','Habakuk','Zefanja','Haggai',
        'Sacharja','Maleachi',
        'Matthäus','Markus','Lukas','Johannes','Apostelgeschichte',
        'Römer','1. Korinther','2. Korinther','Galater','Epheser',
        'Philipper','Kolosser','1. Thessalonicher','2. Thessalonicher',
        '1. Timotheus','2. Timotheus','Titus','Philemon','Hebräer',
        'Jakobus','1. Petrus','2. Petrus','1. Johannes','2. Johannes',
        '3. Johannes','Judas','Offenbarung',
    ];

    // ── Einstellungen ─────────────────────────────────────────────────────

    function isEnabled()      { return localStorage.getItem('bs_enabled')     === '1'; }
    function getTranslation() { return localStorage.getItem('bs_translation') || 'delut'; }
    function getFormat()      { return localStorage.getItem('bs_format')      || 'with_ref'; }
    function getLineBreaks()  { return localStorage.getItem('bs_linebreaks')  || 'prose'; }

    // ── Referenz-Parser ───────────────────────────────────────────────────
    // Erkennt: "Joh3:16"  "1Mo1:1-3"  "Ps23"  "1.Mose1:1"

    function parseRef(raw) {
        const clean = raw.replace(/\./g, '');   // "1.Mose" → "1Mose"
        const m = /^(\d*[a-zA-ZäöüÄÖÜß]+)(\d+)(?::(\d+)(?:-(\d+))?)?$/i.exec(clean);
        if (!m) return null;

        const num = BOOKS[m[1].toLowerCase()];
        if (!num) return null;

        return {
            num,
            name: NAMES[num - 1],
            ch:   parseInt(m[2], 10),
            vs:   m[3] ? parseInt(m[3], 10) : null,
            ve:   m[4] ? parseInt(m[4], 10) : null,
        };
    }

    // ── Vers-Hilfsfunktionen ──────────────────────────────────────────────

    function toVerseArray(data) {
        const v = data.verses;
        const arr = Array.isArray(v) ? v : Object.values(v || {});
        return arr.sort((a, b) => (a.verse || 0) - (b.verse || 0));
    }

    function filterVerses(all, vs, ve) {
        if (vs === null) return all;
        const maxV = all[all.length - 1]?.verse ?? vs;
        const end  = ve !== null ? Math.min(ve, maxV) : vs;
        return all.filter(v => v.verse >= vs && v.verse <= end);
    }

    function buildCitation(p, verses) {
        const v0 = verses[0].verse;
        const vN = verses[verses.length - 1].verse;
        if (p.vs === null) return `${p.name} ${p.ch}`;
        if (v0 === vN)     return `${p.name} ${p.ch}:${v0}`;
        return `${p.name} ${p.ch}:${v0}–${vN}`;
    }

    // Gibt { insert, method } zurück:
    //   method = 'PasteText' für Fließtext
    //   method = 'PasteHtml' für zeilenweise (damit Umbrüche ins Dokument kommen)
    function buildPending(citation, verses) {
        const fmt       = getFormat();
        const lineBreak = getLineBreaks() === 'lines';

        // Fußnote / Quellenangabe
        let cite = '';
        if (fmt === 'with_ref')    cite = ` (${citation})`;
        if (fmt === 'with_source') cite = ` (${citation}, ${getTranslation().toUpperCase()})`;

        if (!lineBreak || verses.length === 1) {
            // ── Fließtext ──────────────────────────────────────────────
            const text = verses.map(v => v.text.trim()).join(' ');
            return { insert: text + cite, method: 'PasteText' };
        }

        // ── Zeilenweise (HTML mit <br>) ────────────────────────────────
        // Jeder Vers bekommt seine eigene Zeile mit vorangestellter Versnummer
        const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        const lines = verses
            .map(v => `<b>${v.verse}</b>\u00a0${esc(v.text.trim())}`)
            .join('<br>');

        // Quellenangabe in der letzten Zeile kursiv
        const citeHtml = cite
            ? `<br><i>${esc(cite.trim().replace(/^\(|\)$/g,''))}</i>`  // "(Joh 3:16)" → kursiv
            : '';

        return { insert: lines + citeHtml, method: 'PasteHtml' };
    }

    // ── Zustand ───────────────────────────────────────────────────────────

    const cache   = {};
    let   pending = null;   // { insert, method }
    let   refText = '';     // zuletzt empfangenes "@..." Wort
    let   timer   = null;

    // ── API ───────────────────────────────────────────────────────────────

    async function fetchChapter(trl, bookNum, ch) {
        const key = `${trl}/${bookNum}/${ch}`;
        if (cache[key]) return cache[key];
        const res = await fetch(`https://api.getbible.net/v2/${key}.json`).catch(() => null);
        if (!res || !res.ok) return null;
        return (cache[key] = await res.json());
    }

    // ── Kern-Logik ────────────────────────────────────────────────────────

    async function lookup(query) {
        const p = parseRef(query);
        if (!p) return hide();

        const data = await fetchChapter(getTranslation(), p.num, p.ch);
        if (!data) return hide();

        const all    = toVerseArray(data);
        const verses = filterVerses(all, p.vs, p.ve);
        if (!verses.length) return hide();

        const citation = buildCitation(p, verses);

        // Vorschau im Dropdown (einzeiliger Hinweis)
        const preview = verses[0].text.trim();
        const label   = `${citation}  –  ${preview.length > 60 ? preview.slice(0, 60) + '…' : preview}`;

        pending = buildPending(citation, verses);

        const h = window.Asc.plugin.getInputHelper();
        h.setItems([{ text: label, id: '0' }]);
        h.show(500, h.getItemsHeight(1), true);
    }

    function hide() {
        pending = null;
        window.Asc.plugin.getInputHelper().show(0, 0, false);
    }

    // ── Plugin-Hooks ──────────────────────────────────────────────────────

    window.Asc.plugin.init = function () {
        // 1. InputHelper ZUERST – createWindow() vom Desktop-Host kann den
        //    Body mit ih_area überschreiben; das muss vor unserem UI passieren.
        if (!window._bsReady) {
            window._bsReady = true;
            if (typeof window.Asc.plugin.createInputHelper === 'function') {
                try {
                    window.Asc.plugin.createInputHelper();
                    window.Asc.plugin.getInputHelper().createWindow();
                    console.log('[BS] InputHelper bereit');
                } catch (e) {
                    console.error('[BS] InputHelper Fehler:', e.message);
                }
            } else {
                console.warn('[BS] createInputHelper nicht verfügbar');
            }
        }

        // 2. UI NACH createWindow() einfügen (createElement + insertBefore,
        //    nicht innerHTML – so bleibt ih_area erhalten).
        if (!document.getElementById('bs-root')) {
            var root = document.createElement('div');
            root.id = 'bs-root';
            root.style.cssText = 'padding:8px;';
            root.innerHTML = [
                '<div class="bs-section">',
                '  <label class="defaultlable">',
                '    <input type="checkbox" id="enabled" style="margin-right:6px;">',
                '    Inline-Einfügung aktiv',
                '  </label>',
                '  <div id="toggleSub" class="defaultlable" style="color:#aaa;margin-top:2px;font-size:10px;">Deaktiviert</div>',
                '</div>',
                '<div class="separator horizontal"></div>',
                '<div class="bs-section" style="margin-top:10px;">',
                '  <span class="defaultlable bs-label">Bibelübersetzung</span>',
                '  <select id="trl" class="form-control">',
                '    <option value="delut">Luther 1912 (Deutsch)</option>',
                '    <option value="elb1905">Elberfelder 1905 (Deutsch)</option>',
                '    <option value="kjv">King James Version (Englisch)</option>',
                '    <option value="web">World English Bible (Englisch)</option>',
                '  </select>',
                '  <span class="defaultlable bs-label">Versformat</span>',
                '  <select id="linebreaks" class="form-control">',
                '    <option value="prose">Fließtext</option>',
                '    <option value="lines">Jeder Vers eigene Zeile</option>',
                '  </select>',
                '  <span class="defaultlable bs-label">Ausgabe</span>',
                '  <select id="fmt" class="form-control">',
                '    <option value="with_ref">Text + Bibelstelle</option>',
                '    <option value="text_only">Nur Text</option>',
                '    <option value="with_source">Text + Stelle + Übersetzung</option>',
                '  </select>',
                '  <button id="saveBtn" class="btn-text-default">Speichern</button>',
                '  <span id="savedMsg" style="color:green;font-size:10px;margin-left:6px;"></span>',
                '</div>',
                '<div class="separator horizontal"></div>',
                '<div class="bs-section" style="margin-top:10px;">',
                '  <span class="defaultlable bs-label">Beispiele</span>',
                '  <div class="defaultlable" style="font-size:10px;line-height:1.8">',
                '    <b>@Joh3:16</b> Einzelner Vers<br>',
                '    <b>@1Mo1:1-3</b> Versbereich<br>',
                '    <b>@Ps23</b> Ganzes Kapitel<br>',
                '    Tippen \u2192 Dropdown \u2192 <b>Tab</b>',
                '  </div>',
                '</div>'
            ].join('\n');

            // Vor ih_area einfügen (oder ans Ende – je nachdem was existiert)
            document.body.insertBefore(root, document.body.firstChild);

            // Settings binden
            var enabledEl = document.getElementById('enabled');
            var toggleSub = document.getElementById('toggleSub');
            var trlEl     = document.getElementById('trl');
            var lbEl      = document.getElementById('linebreaks');
            var fmtEl     = document.getElementById('fmt');
            var saveBtn   = document.getElementById('saveBtn');
            var savedMsg  = document.getElementById('savedMsg');

            var on = localStorage.getItem('bs_enabled') === '1';
            enabledEl.checked = on;
            toggleSub.textContent = on ? 'Aktiviert' : 'Deaktiviert';
            trlEl.value = localStorage.getItem('bs_translation') || 'delut';
            lbEl.value  = localStorage.getItem('bs_linebreaks')  || 'prose';
            fmtEl.value = localStorage.getItem('bs_format')      || 'with_ref';

            enabledEl.addEventListener('change', function () {
                localStorage.setItem('bs_enabled', this.checked ? '1' : '0');
                toggleSub.textContent = this.checked ? 'Aktiviert' : 'Deaktiviert';
            });
            saveBtn.addEventListener('click', function () {
                localStorage.setItem('bs_translation', trlEl.value);
                localStorage.setItem('bs_linebreaks',  lbEl.value);
                localStorage.setItem('bs_format',      fmtEl.value);
                savedMsg.textContent = '\u2713 Gespeichert';
                setTimeout(function () { savedMsg.textContent = ''; }, 2000);
            });
        }
    };

    window.Asc.plugin.button = function () {
        window.Asc.plugin.executeCommand('close', '');
    };

    // Feuert bei jedem Tastendruck (text = aktuelles Wort am Cursor)
    window.Asc.plugin.onInputHelperInput = function (text) {
        // Nicht aktiv → nichts tun
        if (!isEnabled()) return;

        refText = text || '';
        clearTimeout(timer);

        if (!refText.startsWith('@') || refText.length < 3) {
            hide();
            return;
        }

        // Debounce: erst nach 280 ms ohne weiteren Tastendruck fetchen
        timer = setTimeout(() => lookup(refText.slice(1)), 280);
    };

    // Tab / Enter → @Referenz löschen und Verstext einfügen
    window.Asc.plugin.inputHelper_onSelectItem = function () {
        if (!pending || !refText) return;

        const { insert, method } = pending;
        const deleteLen = refText.length;

        window.Asc.plugin.executeMethod('DeleteTextOnLeft', [deleteLen], function () {
            window.Asc.plugin.executeMethod(method, [insert]);
        });
    };

}(window, undefined));
