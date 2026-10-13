# Klokkemester

Mobilspill (PWA) som lærer barn å lese den analoge klokka på norsk. Laget for en 12-åring, men fungerer fra ca. 8 år.

Ren statisk side: HTML, CSS og JavaScript-moduler. Ingen byggsteg, ingen avhengigheter, ingen server. Virker uten nett etter første besøk.

## Innhold

- **7 nivåer** à 10 oppgaver: hele og halve, kvart, fem og ti over/på, på halv og over halv, hvert minutt, 24-timers klokke, tidsregning (buss, film, gaming-tid).
- **To oppgavetyper**: lese klokka (fire svaralternativer) og stille klokka (dra viserne).
- **Lynrunde**: 60 sekunder, feil svar koster 3 sekunder.
- **Øv fritt**: dra viserne og se norsk tekst, 12- og 24-timers tid live, med fargesoner og minutt-tall.
- **Lær klokka**: 8 korte leksjoner med eksempler.
- **Motivasjon**: XP og rangtitler, stjerner, 13 merker, dager på rad.

## Pedagogikk

- Feilsvarene er laget av typiske misforståelser: «halv tre» lest som 3:30, over/på speilvendt, visere byttet om.
- Feil svar gir en trinnvis forklaring, og samme klokkeslett kommer tilbake senere i runden som motsatt oppgavetype.
- Spillet husker hvilke soner (over, på halv, over halv, på ...) barnet bommer på, og gir flere av dem.
- Hjelpeknappen (💡) slår på fargesoner og minutt-tall, men gir færre poeng.
- Norsk skolekonvensjon: 1-19 min «over», 20-29 «på halv», 30 «halv», 31-40 «over halv», 41-59 «på».

## Kjøre lokalt

```bash
npx http-server klokka -p 8080 -c-1
# åpne http://localhost:8080
```

Service worker krever `http://localhost` eller HTTPS.

## Tester

```bash
node --test klokka/tests/*.test.mjs
```

Dekker norsk tidstekst for alle 720 klokkeslett, svaralternativer og rundegenerering for alle nivåer.

## Publisere

Kopier mappa til hvilken som helst statisk hosting (Netlify, Vercel, GitHub Pages). Alle stier er relative, så den virker både på rot og i en undermappe.

**Ved endringer:** øk `VERSION` i `sw.js`, ellers fortsetter installerte telefoner å bruke gammel versjon.

### Domeneshop (eller annet Apache-webhotell) via SFTP

1. Last opp innholdet i denne mappa til `www/klokke/` (uten `tests/` og `README.md`). `.htaccess` må være med; den er skjult, så slå på visning av skjulte filer i Cyberduck.
2. Slå på HTTPS for domenet i Domeneshop-panelet. Service worker (offline/installering) virker bare over HTTPS.
3. Åpne `https://helene.cloud/klokke/`.

## Personvern

All fremgang lagres i `localStorage` på enheten. Ingen konto, ingen sporing, ingen analyse, ingen eksterne kall.
