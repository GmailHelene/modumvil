# Glosemester

Mobilspill (PWA) for ukas gloser og ukas ord. Det meste av oppgavene skal skrives, ikke velges.

## Innhold
- Ferdig lagt inn: **Uke 48** (swallowed, catch, wiggled + hjemme, akkurat, alltid, aldri) og **Explore s. 68-69** (magic, wicked, curious, earth, through, be careful, ugly + åtte sammensatte ord).
- **Nye ord hver uke:** Ordlister → «Legg inn nye ord». Gloser skrives `engelsk = norsk / alternativ`, ukas ord ett per linje, sammensatte ord som `vindusrute = vindu + rute`.

## Oppgavetyper
Skrive: norsk til engelsk, engelsk til norsk, diktat (opplesning), se-dekk-skriv, bokstavsalat, manglende bokstaver, setning med hull, sett sammen ord.
Velge (ca. hver fjerde): hva betyr, finn engelsk ord, riktig stavet.

Moduser: Øv (12 oppgaver, feil kommer igjen), Test deg (alle ord, alt skrives, ingen hjelp), Mine feil, arkade (Stavejakt, Skrivestafett).
Et ord «sitter» etter tre riktige skrivinger uten hjelp. Feil trekker det ned igjen.

## Teknisk
- Ren HTML/CSS/JS (ES-moduler), ingen byggesteg, ingen avhengigheter.
- Fremgang og egne lister lagres bare i `localStorage` på enheten. Ingen sporing, ingenting sendes ut.
- Opplesning bruker enhetens egne stemmer (Web Speech API). Finnes ingen norsk stemme, brukes se-dekk-skriv i stedet for norsk diktat.
- Offline via service worker. Bump `VERSION` i `sw.js` ved endringer.

## Publisering
Last opp innholdet i mappa til `www/gloser/` på webhotellet (Cyberduck/SFTP), inkludert `.htaccess`. Åpne https://helene.cloud/gloser/.

## Tester
`node --test tests/*.test.mjs`
