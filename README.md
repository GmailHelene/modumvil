# Politisk blogg-mal (politisk-blogg-template)

Rolig, redaksjonell one-page blogg med manifest, temaoversikt og en liste med
innlegg. Klones for hver ny kunde via Studio-portalen. Ren statisk side, ingen
byggsteg, hostes f.eks. på Netlify.

## Slik henger det sammen
- `content/innhold.json` styrer rammen: toppmeny, forside, manifest og temaoversikt.
- `content/innlegg/` har ett innlegg per fil (`<slug>.json`) pluss en `index.json`
  som er lista over innlegg. Portalen vedlikeholder index.json automatisk.
- `index.html` viser forside + innleggsliste. `innlegg.html?slug=...` viser ett innlegg.

Alt redigeres i Studio-portalen (ingen koding). Når kunden publiserer, committer
portalen til dette repoet, og Netlify bygger siden live.

## Slik tas den i bruk
1. Push denne mappen til GitHub som repoet **`politisk-blogg-template`**.
2. GitHub -> repoets **Settings** -> hak av **"Template repository"**.
3. Malen er allerede registrert i portalen (`src/lib/templates.ts`, key `politisk-blogg`).
4. I portalen: **+ Ny side** -> velg malen **"Politisk blogg"** -> hak av
   "Opprett GitHub-repo automatisk fra mal".
5. Koble repoet til Netlify (publish dir = reporoten, ingen build command).

## Felter (allerede i mal-registeret)
- info: navn, tittel, ingress, ctaTekst, heroBilde, epost, facebook
- manifestTittel (overskrift), manifest (rik tekst)
- temaer (liste: tittel, beskrivelse)
- innlegg (samling: tittel, dato, ingress, bilde, brødtekst) - hvert innlegg en egen fil

## SEO-merknad
Enkeltinnlegg setter tittel/meta/Open Graph via JavaScript ved innlasting.
Det er greit for en opinionsblogg. Vil du ha forhåndsrendret SEO (server-side),
er neste steg å bygge malen med Astro/Eleventy.

## Spanskkurs (`spansk.html`)

En liten, selvstendig språk-app som ligger i samme repo, men er helt frikoblet
fra bloggen: eget design, egen JS, ingen lenke fra menyen og `noindex` +
`Disallow` i robots.txt.

- `spansk.html` - skallet
- `css/spansk.css` - stilen (lys og mørk modus)
- `js/spansk-kurs.js` - innholdet: 8 enheter, 24 leksjoner, 252 ord og setninger
- `js/spansk.js` - kursmotoren

Slik virker den: ved første besøk stilles fire spørsmål (navn, hva du vil bruke
spansken til, hvor mye du kan, dagsmål). Svarene bestemmer rekkefølgen på
enhetene og hvor mange leksjoner som åpnes med én gang. Hver leksjon blander
flervalg, lytting, ordbank, oversettelse og pare-oppgaver, og oppgavetypen
velges ut fra hvor godt du kan hvert enkelt ord. Feil svar legges bakerst i køen
og kommer igjen. «Repeter» henter de svakeste ordene på tvers av alt du har
gjort.

Framgang (poeng, dager på rad, liv, ordstyrke) ligger i `localStorage` på
enheten. Ingen konto, ingen server, ingenting sendes noe sted. Uttalen bruker
nettleserens egen talesyntese - finnes ingen spansk stemme, faller lytteøvelsene
bort av seg selv.

---
Laget av [helene.cloud](https://helene.cloud)
