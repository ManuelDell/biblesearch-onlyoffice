/* BibleSearch – OnlyOffice Plugin
 * Tippe @Buch Kapitel:Vers im Dokument, z.B. @Joh3:16 oder @1Mo1:1-3
 * API: https://api.getbible.net/v2/{übersetzung}/{buch}/{kapitel}.json
 */
(function () {
    'use strict';

    // ── Bücher: Kürzel → Buch-Nummer 1–66 ─────────────────────────────────
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

    // ── Hilfsfunktionen ───────────────────────────────────────────────────

    function getSetting(key, fallback) {
        return localStorage.getItem('bs_' + key) || fallback;
    }

    // Referenz parsen: "Joh3:16" / "1Mo1:1-3" / "Ps23"
    function parseRef(raw) {
        // Punkte entfernen (1.Mose → 1Mose), dann match
        const clean = raw.replace(/\./g, '');
        const m = /^(\d*[a-zA-ZäöüÄÖÜß]+)(\d+)(?::(\d+)(?:-(\d+))?)?$/i.exec(clean);
        if (!m) return null;

        const key = m[1].toLowerCase();
        const num = BOOKS[key];
        if (!num) return null;

        return {
            num,
            name: NAMES[num - 1],
            ch: parseInt(m[2], 10),
            vs:  m[3] ? parseInt(m[3], 10) : null,
            ve:  m[4] ? parseInt(m[4], 10) : null,
        };
    }

    // Verse aus API-Antwort (Array oder Objekt) als sortiertes Array holen
    function toVerseArray(chapterData) {
        const v = chapterData.verses;
        const arr = Array.isArray(v) ? v : Object.values(v || {});
        return arr.sort((a, b) => (a.verse || 0) - (b.verse || 0));
    }

    // Versbereich filtern, automatisch auf Kapitelende kappen
    function filterVerses(all, vs, ve) {
        if (vs === null) return all;
        const end = ve !== null ? Math.min(ve, all[all.length - 1]?.verse ?? ve) : vs;
        return all.filter(v => v.verse >= vs && v.verse <= end);
    }

    // Zitationsstring bauen (mit tatsächlichem Versbereich nach Kappung)
    function buildCitation(p, verses) {
        const v0 = verses[0].verse;
        const vN = verses[verses.length - 1].verse;
        if (p.vs === null)      return `${p.name} ${p.ch}`;
        if (v0 === vN)          return `${p.name} ${p.ch}:${v0}`;
        return `${p.name} ${p.ch}:${v0}–${vN}`;
    }

    // Endtext nach Format-Einstellung zusammenbauen
    function buildInsertText(citation, verseText) {
        const fmt = getSetting('format', 'with_ref');
        if (fmt === 'text_only')  return verseText;
        if (fmt === 'with_source') {
            const trl = getSetting('translation', 'delut').toUpperCase();
            return `${verseText} (${citation}, ${trl})`;
        }
        return `${verseText} (${citation})`;
    }

    // ── Plugin-Zustand ────────────────────────────────────────────────────

    const cache   = {};       // API-Antworten zwischenspeichern
    let   pending = null;     // { insert: '...' } für aktuellen Vorschlag
    let   refText = '';       // zuletzt empfangener "@..." Text
    let   timer   = null;

    // ── Kern-Logik ────────────────────────────────────────────────────────

    async function lookup(query) {
        const p = parseRef(query);
        if (!p) return hide();

        const trl = getSetting('translation', 'delut');
        const url = `https://api.getbible.net/v2/${trl}/${p.num}/${p.ch}.json`;

        if (!cache[url]) {
            const res = await fetch(url).catch(() => null);
            if (!res || !res.ok) return hide();
            cache[url] = await res.json();
        }

        const all     = toVerseArray(cache[url]);
        const verses  = filterVerses(all, p.vs, p.ve);
        if (!verses.length) return hide();

        const citation   = buildCitation(p, verses);
        const verseText  = verses.map(v => v.text.trim()).join(' ');
        const insertText = buildInsertText(citation, verseText);

        // Vorschau im Dropdown
        const preview = verseText.length > 65 ? verseText.slice(0, 65) + '…' : verseText;

        pending = { insert: insertText };
        const h = window.Asc.plugin.getInputHelper();
        h.setItems([{ text: `${citation}  –  ${preview}`, id: '0' }]);
        h.show(500, h.getItemsHeight(1), true);
    }

    function hide() {
        window.Asc.plugin.getInputHelper().show(0, 0, false);
    }

    // ── Plugin-Hooks ──────────────────────────────────────────────────────

    window.Asc.plugin.init = function () {
        if (!window._bsReady) {
            window._bsReady = true;
            window.Asc.plugin.createInputHelper();
            window.Asc.plugin.getInputHelper().createWindow();
        }
    };

    window.Asc.plugin.button = function () {
        window.Asc.plugin.executeCommand('close', '');
    };

    // Feuert bei jedem Tastendruck im Dokument (Text = aktuelles "Wort" am Cursor)
    window.Asc.plugin.onInputHelperInput = function (text) {
        refText = text || '';
        clearTimeout(timer);

        if (!refText.startsWith('@') || refText.length < 3) {
            hide();
            return;
        }

        timer = setTimeout(() => lookup(refText.slice(1)), 280);
    };

    // Nutzer wählt Vorschlag → @Referenz löschen, Verstext einfügen
    window.Asc.plugin.inputHelper_onSelectItem = function () {
        if (!pending || !refText) return;
        window.Asc.plugin.executeMethod('DeleteTextOnLeft', [refText.length], function () {
            window.Asc.plugin.executeMethod('PasteText', [pending.insert]);
        });
    };

}());
