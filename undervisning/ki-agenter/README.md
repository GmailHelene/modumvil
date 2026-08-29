# Når agenten tar over

Komplett undervisningsopplegg om AI-sikkerhet og styring av autonome systemer,
bygget rundt dokumenterte hendelser der KI-systemer har handlet utilsiktet.

Emnet er lagt på fagskole-/bachelornivå innen IT og kan gjennomføres som
selvstudium over åtte uker, eller undervises. Omfang: ca. 30 timer.

## Ferdige dokumenter

| Fil | Sider | Innhold |
|---|---|---|
| `01_Studieguide_og_emneplan` | 9 | Emneplan, læringsutbytte, de sju sviktmønstrene, kontrollstakken, selvstudieløype |
| `02_Kompendium_modul_1-8` | 32 | Hovedteksten: åtte moduler |
| `03_Casebank_48_hendelser` | 26 | 48 hendelser klassifisert etter sviktmønster |
| `04_Oppgaver_labber_og_vurdering` | 13 | 8 labber, oppgaver, workshops, prosjekt, quiz med fasit, rubrikker |

Word-versjoner i `word/`, PDF-versjoner i `pdf/`.

## Redigere

Kildeteksten er markdown i `kilde/`. Etter endringer:

```bash
npm install docx playwright
node build.js       # -> word/*.docx
node build-pdf.js   # -> pdf/*.pdf
```

`build-pdf.js` bruker Chromium. Stien til nettleseren settes øverst i skriptet
og må kanskje justeres i andre miljøer.

## Merk

Casene er faktasjekket i august 2026 mot offentlig tilgjengelige kilder. Regelverk
og hendelsesbeskrivelser endrer seg — sjekk primærkilden før du siterer tall.
Hver case har kildehenvisning nettopp for det formålet.
