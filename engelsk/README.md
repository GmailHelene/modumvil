# Engelskmester

Mobilspill (PWA) for å øve til engelskprøve i **compound verbs** (sammensatte verbuttrykk) og **adjektiv + preposisjon**. Pensumet følger *Explore English* side 48-49. Statisk side uten byggesteg og avhengigheter, og den virker uten nett etter første besøk.

## Pensum (sett 1-4)
- **Compound verbs:** believe in, look after, try on, hurry up, break up, sleep over, put off, give up, throw away, calm down, cheer up, keep on, get along, get on, find out. Bokas engelske forklaringer er med.
- **Adjektiv + preposisjon:** famous for, interested in, afraid of, keen on, bad at, pleased with, excited about, angry with, good at, worried about, proud of, good for, bad for.
- **Bonus (sett 5-6):** ekstra uttrykk som ikke er pensum, i en egen bonusverden. Prøveøvingen bruker aldri disse.

Alle ord og setninger ligger i `js/data.js` og kan enkelt byttes ut eller utvides.

## Innhold
- **Eventyret:** 6 verdener med 4 nivåer hver. Hver verden har en boss med tidsfrist. Prøvelandet øver på alt fra boka og på compound verbs i fortid.
- **Prøveøving:** 20 oppgaver fra pensum uten hjelp. Gir prosent og en liste over det som bør øves mer på.
- **Mine feil:** en runde med de uttrykkene du bommer mest på.
- **Dagens utfordring:** 10 nye oppgaver hver dag.
- **Arkade:** Lynrunde, Right or wrong? og Ord-memory.
- **Ordliste:** alle uttrykk med norsk betydning, eksempelsetning, fortid, «norsk felle» og opplesning (🔊).
- **Merker og stil:** 53 merker og 8 bakgrunner.

## Pedagogikk
- **Flervalg og fritekst blandes,** omtrent 40 % fritekst. Svarene godtas uavhengig av store og små bokstaver, ekstra mellomrom, et foranstilt «to» og alternative riktige svar (take care of = look after, get on = get along, angry at = angry with). Skrivefeil på én bokstav gir beskjeden «Nesten! Sjekk stavingen», men teller som feil, slik som på en prøve.
- **Feilsvarene er laget av den norske fella:** afraid *for*, good *in*, angry *on*, proud *over*. Alternativer som også er riktig engelsk vises aldri som feil (for eksempel *throw out*, *good with*, *pleased about*).
- **Repetisjon:** Feil svar kommer tilbake senere i runden. Uttrykk du ofte bommer på, dukker opp oftere, og nylig brukte oppgaver unngås i neste runde.

## Kjøre lokalt / teste
```bash
npx http-server engelsk -p 8080 -c-1
node --test engelsk/tests/*.test.mjs
```

## Publisere (Domeneshop via SFTP)
1. Last opp innholdet i denne mappa til `www/engelsk/`, uten `tests/` og `README.md`. Husk den skjulte `.htaccess`.
2. HTTPS må være på (Domeneshop-panelet).
3. Åpne `https://helene.cloud/engelsk/`.

Ved endringer: øk `VERSION` i `sw.js`.

## Personvern
All fremgang lagres i `localStorage` på enheten. Ingen konto, sporing eller eksterne kall. Opplesning bruker telefonens innebygde stemme.
