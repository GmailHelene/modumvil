# Klokkemester

Mobilspill (PWA) som lærer barn å lese den analoge klokka på norsk. Laget for en 12-åring, men fungerer fra ca. 8 år.

Ren statisk side: HTML, CSS og JavaScript-moduler. Ingen byggsteg, ingen avhengigheter, ingen server. Virker uten nett etter første besøk.

## Innhold

- **Fritekst og flervalg:** omtrent 45 % av leseoppgavene i hver runde må besvares ved å skrive (35 % på boss-nivåer med tidsfrist). Spillet godtar mange skrivemåter: `9`, `09`, `9:05`, `09:05`, `9.05`, `905`, «fem over ni», «5 over 9», «klokka er fem over ni», også alternative riktige formuleringer som «tjue over ni». Varighet kan skrives som `25`, `25 min`, «1 time og 10 minutter», `1:10` eller «et kvarter». Svar spillet ikke forstår, gir et hint i stedet for feil.
- **Eventyret:** 6 verdener med 6 nivåer hver (36 nivåer). Hver verden ender med en boss: lengre runde, ofte med tidsfrist og færre tall på klokka.
  1. Klokkeskogen: hele, halve, kvart over og kvart på
  2. Femminuttsfjellet: fem og ti over/på, romertall
  3. Halvveisbyen: på halv og over halv, klokke uten tall
  4. Minuttmyra: hvert eneste minutt
  5. Døgnøya: 24-timers tid, morgen, ettermiddag, kveld og natt
  6. Tidsmaskinen: tidsregning fram og tilbake (buss, film, gaming, kake i ovnen)
- **Klokkevarianter:** vanlige tall, romertall, bare 12/3/6/9, og helt uten tall.
- **Arkade, 7 småspill:** Lynrunde, Sant eller usant, Finn klokka, Klokke-memory, Still på tid, Tidslinja og Overlevelse. Egne rekorder og merker for hvert spill.
- **Dagens utfordring:** 10 nye oppgaver hver dag (samme for samme dag), 50 bonus-XP første gang.
- **73 merker** i 9 kategorier, alle med fremdriftsmåler.
- **Stil:** 10 bakgrunner og 8 klokkedesign som låses opp underveis. Viserfargene er alltid rød (time) og blå (minutt), siden leksjonene viser til dem.
- **Øv fritt** og **Lær klokka** (10 leksjoner).
- **8 rangtitler**, XP, stjerner og dager på rad.

## Variasjon

- Spillet husker de siste 120 oppgavene og unngår dem i nye runder, også etter «Start på nytt».
- Tekstoppgavene trekker fra mange scenarier og navn, og spørsmålsformuleringene varierer.
- Feil svar kommer igjen senere i samme runde, som motsatt oppgavetype.

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

Dekker norsk tidstekst for alle 720 klokkeslett, at fritekstsvar godtas i alle skrivemåter (både tall og ord for alle 720 klokkeslett), alle 36 nivåer, arkadeoppgavene, merker, opplåsing, variasjon mellom runder, dagens utfordring og overgang fra gammel lagring.

## Publisere

Kopier mappa til hvilken som helst statisk hosting (Netlify, Vercel, GitHub Pages). Alle stier er relative, så den virker både på rot og i en undermappe.

**Ved endringer:** øk `VERSION` i `sw.js`, ellers fortsetter installerte telefoner å bruke gammel versjon.

### Domeneshop (eller annet Apache-webhotell) via SFTP

1. Last opp innholdet i denne mappa til `www/klokke/` (uten `tests/` og `README.md`). `.htaccess` må være med; den er skjult, så slå på visning av skjulte filer i Cyberduck.
2. Slå på HTTPS for domenet i Domeneshop-panelet. Service worker (offline/installering) virker bare over HTTPS.
3. Åpne `https://helene.cloud/klokke/`.

## Personvern

All fremgang lagres i `localStorage` på enheten. Ingen konto, ingen sporing, ingen analyse, ingen eksterne kall.
