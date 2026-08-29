/*
 * Bygger PDF-er fra markdown-kildene via Chromium.
 * Bruk: node build-pdf.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, 'kilde');
const OUT = path.join(__dirname, 'pdf');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function stripFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return text;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') return lines.slice(i + 1).join('\n');
  return text;
}

function inline(t) {
  return esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9æøå ]/g, '').trim().replace(/\s+/g, '-');

function mdToHtml(md) {
  const lines = stripFrontmatter(md).split('\n');
  const html = [];
  const toc = [];
  let i = 0, firstH1 = true;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { i++; continue; }

    if (/^-{3,}$/.test(t)) { html.push('<hr>'); i++; continue; }

    if (t.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
      const head = cells(t); i += 2;
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { body.push(cells(lines[i])); i++; }
      html.push('<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
        + body.map(r => '<tr>' + head.map((_, k) => `<td>${inline(r[k] || '')}</td>`).join('') + '</tr>').join('')
        + '</tbody></table>');
      continue;
    }

    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length, txt = h[2], id = slug(txt);
      if (lvl === 1) {
        html.push(`<h1 id="${id}"${firstH1 ? ' class="first"' : ''}>${inline(txt)}</h1>`);
        toc.push({ lvl: 1, txt, id });
        firstH1 = false;
      } else if (lvl === 2) {
        html.push(`<h2 id="${id}">${inline(txt)}</h2>`);
        toc.push({ lvl: 2, txt, id });
      } else {
        html.push(`<h${lvl}>${inline(txt)}</h${lvl}>`);
      }
      i++; continue;
    }

    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++; }
      html.push('<ul>' + items.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }

    if (/^\d+[.)]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+[.)]\s+/, '')); i++; }
      html.push('<ol>' + items.map(x => `<li>${inline(x)}</li>`).join('') + '</ol>');
      continue;
    }

    const buf = [];
    while (i < lines.length) {
      const c = lines[i].trim();
      if (c === '' || /^#{1,4}\s/.test(c) || /^[-*]\s/.test(c) || /^\d+[.)]\s/.test(c) || c.startsWith('|') || /^-{3,}$/.test(c)) break;
      buf.push(c); i++;
    }
    if (buf.length) html.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { body: html.join('\n'), toc };
}

const CSS = `
@page { size: A4; margin: 20mm 18mm 18mm 18mm; }
* { box-sizing: border-box; }
body { font-family: "Charter","Georgia","Times New Roman",serif; font-size: 10.5pt; line-height: 1.55;
       color: #1a1a1a; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1, h2, h3, h4 { font-family: "Georgia",serif; color: #1f3864; break-after: avoid; page-break-after: avoid; }
h1 { font-size: 20pt; margin: 0 0 14pt; padding-bottom: 6pt; border-bottom: 2px solid #1f3864;
     break-before: page; page-break-before: always; }
h1.first { break-before: auto; page-break-before: auto; }
h2 { font-size: 14pt; color: #2e5090; margin: 20pt 0 7pt; }
h3 { font-size: 11.5pt; color: #1a1a1a; margin: 15pt 0 5pt; }
h4 { font-size: 10.5pt; margin: 12pt 0 4pt; }
p { margin: 0 0 8pt; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 9pt; padding-left: 18pt; }
li { margin-bottom: 3pt; }
strong { font-weight: 700; }
code { font-family: "Consolas",monospace; font-size: 9pt; background: #f2f4f8; padding: 0 3px; border-radius: 2px; }
hr { border: 0; border-top: 1px solid #c7cedb; margin: 14pt 0; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 8.7pt;
        font-family: "Helvetica Neue",Arial,sans-serif; break-inside: avoid; page-break-inside: avoid; }
th, td { border: 1px solid #c7cedb; padding: 4pt 5pt; text-align: left; vertical-align: top; line-height: 1.4; }
th { background: #edf1f7; font-weight: 700; color: #1f3864; }
tr { break-inside: avoid; page-break-inside: avoid; }

.title-page { height: 251mm; display: flex; flex-direction: column; justify-content: center;
              break-after: page; page-break-after: always; }
.kicker { font-family: "Helvetica Neue",Arial,sans-serif; font-size: 8.5pt; font-weight: 700;
          letter-spacing: .18em; color: #2e5090; text-transform: uppercase; margin-bottom: 10pt; }
.title-page h1 { font-size: 34pt; line-height: 1.1; border: 0; margin: 0 0 6pt; padding: 0; break-before: auto; }
.subtitle { font-size: 16pt; color: #2e5090; font-family: "Georgia",serif; padding-bottom: 10pt;
            border-bottom: 3px solid #1f3864; margin-bottom: 16pt; }
.blurb { font-size: 11pt; line-height: 1.6; max-width: 135mm; margin-bottom: 26pt; }
.meta { font-family: "Helvetica Neue",Arial,sans-serif; font-size: 9pt; color: #55617a; line-height: 1.7; }

.toc { break-after: page; page-break-after: always; }
.toc h1 { break-before: auto; page-break-before: auto; }
.toc a { color: #1a1a1a; text-decoration: none; }
.toc .l1 { font-weight: 700; margin: 9pt 0 2pt; font-size: 10.5pt; color: #1f3864; }
.toc .l2 { margin-left: 12pt; font-size: 9.8pt; color: #333; }
`;

const DOCS = [
  { file: '01_Studieguide_og_emneplan.pdf', title: 'Når agenten tar over', subtitle: 'Studieguide og emneplan',
    blurb: 'Emnebeskrivelse, læringsutbytte, de sju sviktmønstrene, kontrollstakken, moduloversikt, åtte ukers selvstudieløype og vurderingsordning.',
    src: ['01-studieguide.md'] },
  { file: '02_Kompendium_modul_1-8.pdf', title: 'Når agenten tar over', subtitle: 'Kompendium, modul 1–8',
    blurb: 'Hovedteksten i emnet. Åtte moduler om hva en agent er, hvordan mål svikter, hva sikkerhetsevalueringene faktisk viser, prompt injection, konfabulering, skala og hastighet, kontrollstakken, og styring og jus.',
    src: ['02a-kompendium-m1-m2.md', '02b-kompendium-m3-m4.md', '02c-kompendium-m5-m6.md', '02d-kompendium-m7-m8.md'] },
  { file: '03_Casebank_48_hendelser.pdf', title: 'Casebank', subtitle: '48 dokumenterte hendelser med KI-systemer',
    blurb: 'Hendelser hos Anthropic, OpenAI, Microsoft, Google, Amazon, Meta, xAI, Replit, Cruise, Uber, Air Canada og andre — klassifisert etter sviktmønster, med mekanisme, konsekvens, lærdom, diskusjonsspørsmål og kilde.',
    src: ['03a-casebank-1-24.md', '03b-casebank-25-48.md'] },
  { file: '04_Oppgaver_labber_og_vurdering.pdf', title: 'Oppgaver, labber og vurdering', subtitle: 'Når agenten tar over',
    blurb: 'Åtte praktiske labber, skriftlige oppgaver, gruppeworkshops, prosjektoppgave, quiz med fasit, vurderingsrubrikker og leseliste.',
    src: ['04-oppgaver.md'] },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();

  for (const d of DOCS) {
    const md = d.src.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n\n');
    const { body, toc } = mdToHtml(md);
    const tocHtml = '<div class="toc"><h1 class="first">Innhold</h1>'
      + toc.map(e => `<div class="l${e.lvl}"><a href="#${e.id}">${esc(e.txt)}</a></div>`).join('')
      + '</div>';

    const html = `<!doctype html><html lang="no"><head><meta charset="utf-8">
<title>${esc(d.title)}</title><style>${CSS}</style></head><body>
<div class="title-page">
  <div class="kicker">Undervisningsmateriell</div>
  <h1>${esc(d.title)}</h1>
  <div class="subtitle">${esc(d.subtitle)}</div>
  <div class="blurb">${esc(d.blurb)}</div>
  <div class="meta">AI-sikkerhet og styring av autonome systemer<br>Faktasjekket august 2026</div>
</div>
${tocHtml}
${body}
</body></html>`;

    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: path.join(OUT, d.file),
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:8pt;color:#55617a;padding:0 18mm;display:flex;justify-content:space-between;">
        <span>${esc(d.subtitle)}</span><span class="pageNumber"></span></div>`,
      margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
    });
    const kb = (fs.statSync(path.join(OUT, d.file)).size / 1024).toFixed(0);
    console.log(`${d.file}  —  ${toc.length} overskrifter, ${kb} kB`);
  }
  await browser.close();
})();
