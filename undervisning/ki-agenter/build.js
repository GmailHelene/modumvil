/*
 * Bygger Word-dokumenter fra markdown-kildene i kilde/.
 * Bruk: node build.js
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak, TableOfContents, Footer, PageNumber, convertInchesToTwip,
} = require('docx');

const SRC = path.join(__dirname, 'kilde');
const OUT = path.join(__dirname, 'word');
const CONTENT_WIDTH = 9026; // A4 minus 1" marger, i DXA

const INK = '1A1A1A';
const ACCENT = '1F3864';
const ACCENT2 = '2E5090';
const RULE = 'C7CEDB';
const HEADBG = 'EDF1F7';

// ---------- markdown-parsing ----------

function stripFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return text;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  return end === -1 ? text : lines.slice(end + 1).join('\n');
}

// Deler en linje i biter: **fet**, *kursiv*, `kode`
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    const tok = m[0];
    if (tok.startsWith('**')) {
      runs.push(new TextRun({ ...base, text: tok.slice(2, -2), bold: true }));
    } else if (tok.startsWith('`')) {
      runs.push(new TextRun({ ...base, text: tok.slice(1, -1), font: 'Consolas', size: (base.size || 22) - 2 }));
    } else {
      runs.push(new TextRun({ ...base, text: tok.slice(1, -1), italics: true }));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ ...base, text: text.slice(last) }));
  return runs.length ? runs : [new TextRun({ ...base, text: '' })];
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
}

function buildTable(rows) {
  const header = rows[0];
  const body = rows.slice(1);
  const cols = header.length;
  const w = Math.floor(CONTENT_WIDTH / cols);
  const widths = Array(cols).fill(w);
  widths[cols - 1] = CONTENT_WIDTH - w * (cols - 1);

  const mkCell = (txt, isHead, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: isHead ? { type: ShadingType.CLEAR, fill: HEADBG, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 110, right: 110 },
    children: [new Paragraph({
      spacing: { before: 0, after: 0, line: 250 },
      children: inline(txt, { size: 18, color: INK, bold: isHead || undefined }),
    })],
  });

  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: RULE },
    },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((c, i) => mkCell(c, true, i)) }),
      ...body.map(r => new TableRow({
        children: Array.from({ length: cols }, (_, i) => mkCell(r[i] || '', false, i)),
      })),
    ],
  });
}

function parse(md, opts = {}) {
  const out = [];
  const lines = stripFrontmatter(md).split('\n');
  let i = 0;
  let firstH1 = true;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t === '') { i++; continue; }

    // horisontal linje
    if (/^-{3,}$/.test(t)) {
      out.push(new Paragraph({
        spacing: { before: 100, after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } },
        children: [new TextRun({ text: '' })],
      }));
      i++; continue;
    }

    // tabell
    if (t.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const rows = [splitRow(t)];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i])); i++;
      }
      out.push(buildTable(rows));
      out.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun('')] }));
      continue;
    }

    // overskrifter
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const txt = h[2];
      if (lvl === 1) {
        const kids = [];
        if (!firstH1 && opts.pageBreakOnH1) kids.push(new PageBreak());
        firstH1 = false;
        kids.push(...inline(txt, { size: 36, bold: true, color: ACCENT, font: 'Georgia' }));
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 220 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 6 } },
          children: kids,
        }));
      } else if (lvl === 2) {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 340, after: 140 },
          children: inline(txt, { size: 27, bold: true, color: ACCENT2, font: 'Georgia' }),
        }));
      } else {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 260, after: 110 },
          children: inline(txt, { size: 23, bold: true, color: INK }),
        }));
      }
      i++; continue;
    }

    // punktliste
    if (/^[-*]\s+/.test(t)) {
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        out.push(new Paragraph({
          numbering: { reference: 'kulepunkt', level: 0 },
          spacing: { before: 40, after: 40, line: 276 },
          children: inline(lines[i].trim().replace(/^[-*]\s+/, ''), { size: 21, color: INK }),
        }));
        i++;
      }
      out.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun('')] }));
      continue;
    }

    // nummerert liste
    if (/^\d+[.)]\s+/.test(t)) {
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        out.push(new Paragraph({
          numbering: { reference: 'nummer', level: 0 },
          spacing: { before: 40, after: 40, line: 276 },
          children: inline(lines[i].trim().replace(/^\d+[.)]\s+/, ''), { size: 21, color: INK }),
        }));
        i++;
      }
      out.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun('')] }));
      continue;
    }

    // vanlig avsnitt (samler sammenhengende linjer)
    const buf = [];
    while (i < lines.length) {
      const c = lines[i].trim();
      if (c === '' || /^#{1,4}\s/.test(c) || /^[-*]\s/.test(c) || /^\d+[.)]\s/.test(c)
          || c.startsWith('|') || /^-{3,}$/.test(c)) break;
      buf.push(c); i++;
    }
    if (buf.length) {
      out.push(new Paragraph({
        spacing: { after: 160, line: 300 },
        alignment: AlignmentType.LEFT,
        children: inline(buf.join(' '), { size: 21, color: INK }),
      }));
    }
  }
  return out;
}

// ---------- dokumentbygging ----------

function titlePage(title, subtitle, blurb) {
  return [
    new Paragraph({ spacing: { before: 2400, after: 0 }, children: [
      new TextRun({ text: 'UNDERVISNINGSMATERIELL', size: 18, bold: true, color: ACCENT2, characterSpacing: 60 }),
    ]}),
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: title, size: 56, bold: true, color: ACCENT, font: 'Georgia' })],
    }),
    new Paragraph({
      spacing: { after: 360 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 } },
      children: [new TextRun({ text: subtitle, size: 28, color: ACCENT2, font: 'Georgia' })],
    }),
    new Paragraph({ spacing: { after: 200, line: 300 }, children: [
      new TextRun({ text: blurb, size: 21, color: INK }),
    ]}),
    new Paragraph({ spacing: { before: 600 }, children: [
      new TextRun({ text: 'AI-sikkerhet og styring av autonome systemer', size: 20, color: '55617A' }),
    ]}),
    new Paragraph({ children: [
      new TextRun({ text: 'Faktasjekket august 2026', size: 20, color: '55617A' }),
    ]}),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function makeDoc({ title, subtitle, blurb, body, toc }) {
  const children = [...titlePage(title, subtitle, blurb)];
  if (toc) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 6 } },
      children: [new TextRun({ text: 'Innhold', size: 36, bold: true, color: ACCENT, font: 'Georgia' })],
    }));
    children.push(new TableOfContents('Innhold', { hyperlink: true, headingStyleRange: '1-2' }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
  children.push(...body);

  return new Document({
    creator: 'Undervisningsmateriell',
    title,
    description: subtitle,
    features: { updateFields: true },
    numbering: {
      config: [
        { reference: 'kulepunkt', levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } },
        }]},
        { reference: 'nummer', levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } },
        }]},
      ],
    },
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 21, color: INK } },
      },
    },
    sections: [{
      properties: {
        page: { margin: {
          top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1), right: convertInchesToTwip(1),
        }},
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '55617A' })],
        })]}),
      },
      children,
    }],
  });
}

// ---------- oppsett ----------

const DOCS = [
  {
    file: '01_Studieguide_og_emneplan.docx',
    title: 'Når agenten tar over',
    subtitle: 'Studieguide og emneplan',
    blurb: 'Emnebeskrivelse, læringsutbytte, de sju sviktmønstrene, kontrollstakken, moduloversikt, åtte ukers selvstudieløype og vurderingsordning.',
    src: ['01-studieguide.md'],
    toc: true,
    pageBreakOnH1: true,
  },
  {
    file: '02_Kompendium_modul_1-8.docx',
    title: 'Når agenten tar over',
    subtitle: 'Kompendium, modul 1–8',
    blurb: 'Hovedteksten i emnet. Åtte moduler om hva en agent er, hvordan mål svikter, hva sikkerhetsevalueringene faktisk viser, prompt injection, konfabulering, skala og hastighet, kontrollstakken, og styring og jus.',
    src: ['02a-kompendium-m1-m2.md', '02b-kompendium-m3-m4.md', '02c-kompendium-m5-m6.md', '02d-kompendium-m7-m8.md'],
    toc: true,
    pageBreakOnH1: true,
  },
  {
    file: '03_Casebank_48_hendelser.docx',
    title: 'Casebank',
    subtitle: '48 dokumenterte hendelser med KI-systemer',
    blurb: 'Hendelser hos Anthropic, OpenAI, Microsoft, Google, Amazon, Meta, xAI, Replit, Cruise, Uber, Air Canada og andre — klassifisert etter sviktmønster, med mekanisme, konsekvens, lærdom, diskusjonsspørsmål og kilde.',
    src: ['03a-casebank-1-24.md', '03b-casebank-25-48.md'],
    toc: true,
    pageBreakOnH1: true,
  },
  {
    file: '04_Oppgaver_labber_og_vurdering.docx',
    title: 'Oppgaver, labber og vurdering',
    subtitle: 'Når agenten tar over',
    blurb: 'Åtte praktiske labber, skriftlige oppgaver, gruppeworkshops, prosjektoppgave, quiz med fasit, vurderingsrubrikker og leseliste.',
    src: ['04-oppgaver.md'],
    toc: true,
    pageBreakOnH1: true,
  },
];

fs.mkdirSync(OUT, { recursive: true });

(async () => {
  for (const d of DOCS) {
    const md = d.src.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n\n');
    const body = parse(md, { pageBreakOnH1: d.pageBreakOnH1 });
    const doc = makeDoc({ ...d, body });
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, d.file), buf);
    console.log(`${d.file}  —  ${body.length} blokker, ${(buf.length / 1024).toFixed(0)} kB`);
  }
})();
