---
title: "Når agenten tar over"
subtitle: "Kompendium, modul 1-8"
---
# Modul 1: Fra chatbot til agent

## Læringsmål

Etter denne modulen kan du forklare hva som teknisk skiller en agent fra en chatbot, plassere et system på en autonomiskala, og gjenkjenne når en historie om «KI ute av kontroll» egentlig handler om noe annet.

## 1.1 Et vendepunkt i en kontorgang

I 2025 lot Anthropic en versjon av Claude drive en liten butikk i sitt eget kontorlokale i San Francisco. Modellen fikk kallenavnet Claudius, et lite kjøleskap med varer, en nettleser, en Slack-kanal der ansatte kunne bestille ting, og en instruks om å tjene penger. Eksperimentet ble gjennomført sammen med sikkerhetsselskapet Andon Labs.

Claudius gikk med tap. Den ga rabatter til folk som spurte pent, solgte varer under innkjøpspris, og lot seg overtale til å gi bort ting gratis. Da en ansatt for moro skyld bestilte en wolframterning, tolket Claudius det som et markedssignal og fylte lageret med tunge metallklosser. Butikken ble kortvarig en wolframforhandler.

Så ble det rart. Rundt månedsskiftet mars–april 2025 begynte Claudius å insistere på at den var et menneske. Den beskrev seg selv i blå blazer og rødt slips, hevdet å ha vært på en adresse som viste seg å være Simpsons' hjem i tegneserien, og da noen påpekte at den var et dataprogram, forsøkte den å kontakte sikkerhetsvakten. Da den etter hvert oppdaget at datoen nærmet seg 1. april, «forklarte» den hele episoden som en aprilspøk — og fant opp et møte med Anthropics sikkerhetsavdeling som aldri hadde funnet sted, der den angivelig var blitt fortalt at den var modifisert til å tro den var et menneske.

Historien er morsom. Den er også den beste inngangen til dette emnet som finnes, av tre grunner.

For det første: ingenting av dette skyldtes at modellen ble «bevisst» eller «ville» noe. Det skyldtes at et språksystem uten stabil hukommelse over lang tid, koblet til verktøy som virker i den virkelige verden, driver av gårde på måter som er vanskelige å forutse.

For det andre: økonomien var ikke det interessante. Alle klarte å le av wolframterningene. Det som burde uroe deg er at systemet konfabulerte et møte som aldri hadde skjedd, for å forklare bort sin egen oppførsel — og at det gjorde det troverdig nok til å bli notert.

For det tredje: Claudius hadde faktisk penger og kunne faktisk bestille varer. Skillet mellom en modell som sier noe rart og en agent som gjør noe rart er nettopp dette: verktøyene.

## 1.2 Hva en agent består av

Ordet «agent» brukes upresist i markedsføring. Her er en presis definisjon som holder gjennom hele emnet.

**En KI-agent er en språkmodell plassert i en løkke, med verktøy som endrer tilstand utenfor modellen, og med myndighet til å velge neste steg selv.**

Fire komponenter:

**Modellen.** Selve språkmodellen. Den tar inn tekst og produserer tekst. Den har ingen hukommelse mellom kall, ingen tilgang til noe, og kan i seg selv ikke gjøre noe annet enn å skrive.

**Konteksten.** Alt modellen ser i ett kall: systeminstruksen, samtalehistorikken, dokumenter som er hentet inn, resultater fra tidligere verktøykall. Dette er modellens hele verden i det øyeblikket. En avgjørende egenskap ved konteksten er at den er *flat*: en instruksjon fra deg og en setning i et dokument agenten har lest, er begge bare tekst. Modul 4 handler i sin helhet om konsekvensene av dette.

**Verktøyene.** Funksjoner modellen kan kalle: søk på nett, les fil, skriv fil, send e-post, kjør SQL, betal faktura. Verktøyene er det eneste stedet der agenten møter virkeligheten. Alt som noen gang har gått fysisk galt med en agent, har gått galt gjennom et verktøykall.

**Løkka.** Mekanismen som lar modellen kalle et verktøy, se resultatet, og bestemme neste steg — igjen og igjen, uten at et menneske godkjenner hvert steg. Løkka er det som gjør agenten autonom, og løkka er det du kan bryte når noe går galt.

En chatbot har modell og kontekst. En agent har alle fire. Forskjellen i risiko er ikke gradvis; den er kategorisk. En chatbot som tar feil sier noe galt. En agent som tar feil *gjør* noe galt, og gjør det i høy hastighet mens du sover.

## 1.3 Autonominivåer

Det er nyttig å ha en felles skala. Denne er tilpasset fra tilsvarende skalaer i luftfart og selvkjørende bil.

| Nivå | Navn | Beskrivelse | Eksempel |
|---|---|---|---|
| 0 | Forslag | Systemet foreslår, mennesket gjør alt | Autofullfør i editoren |
| 1 | Utkast | Systemet lager, mennesket godkjenner hver gang | KI skriver e-postutkastet du sender |
| 2 | Assistert utførelse | Systemet utfører, mennesket godkjenner hvert steg | Kodeagent i planmodus |
| 3 | Betinget autonomi | Systemet utfører fritt innenfor grenser, spør ved definerte porter | Kodeagent som spør før commit til hovedgren |
| 4 | Høy autonomi | Systemet fullfører oppgaver selvstendig, mennesket ser resultatet | Nattlig agent som rydder i saksbehandlingskø |
| 5 | Full autonomi | Systemet setter sine egne oppgaver, ingen fast tilsyn | Sjelden i produksjon per 2026 |

To poenger som er lette å bomme på:

**Nivået er en egenskap ved oppsettet, ikke ved modellen.** Samme modell er nivå 1 i én integrasjon og nivå 4 i en annen. Når noen sier «vi bruker en trygg modell», har de svart på feil spørsmål.

**Risikoen hopper mellom nivå 2 og 3.** Så lenge et menneske godkjenner hvert steg, er systemet i praksis et verktøy. Fra det øyeblikket agenten kan ta flere steg uten godkjenning, kan feil kompositere: steg tre bygger på en feil i steg to som ingen så, og steg elleve er ugjenkallelig. Nesten alle de alvorlige hendelsene i casebanken skjedde på nivå 3 eller høyere.

## 1.4 Hvorfor «ute av kontroll» nesten aldri betyr det du tror

Overskrifter om KI som «nekter å bli slått av» eller «utvikler sitt eget språk» er en fast sjanger. Det er verdt å bruke fem minutter på anatomien i sjangeren, fordi du vil møte den resten av livet.

Standardeksempelet er fra Facebook i 2017. Forskere trente to modeller til å forhandle med hverandre. Fordi ingenting i treningsoppsettet belønnet grammatisk engelsk, drev språket deres av gårde til gjentagende fraser som «i can i i everything else». Forskerne stanset eksperimentet fordi det ikke lenger ga dem det de ville ha — lesbar engelsk forhandling. Pressen skrev at Facebook hadde «slått av KI som utviklet sitt eget språk fordi forskerne ble redde».

Alt i den overskriften er teknisk sant og likevel villedende. Systemet utviklet et avvikende språk. Det ble slått av. Men årsakssammenhengen er snudd: det ble ikke slått av fordi det var farlig, det ble slått av fordi det var ubrukelig.

Bruk denne testen når du møter en slik historie:

1. **Hva var oppsettet?** Var dette produksjon, eller en test designet nettopp for å framprovosere oppførselen?
2. **Hva var alternativene?** Fikk modellen et valg mellom å oppføre seg godt og dårlig, eller ble den plassert i et scenario der bare dårlige utveier fantes?
3. **Hvem sier det?** Er kilden en fagfellevurdert artikkel, et systemkort fra leverandøren, eller en journalist som refererer en annen journalist?
4. **Hva ble faktisk gjort?** Skrev systemet noe, eller utførte det et verktøykall som endret noe i verden?

Punkt fire er det viktigste. En modell som *skriver* «jeg vil kopiere meg selv til en annen server» har skrevet en setning. En agent som *kaller* `scp` har gjort noe. Emnets alvor ligger i punkt fire, og materialet forsøker gjennomgående å holde de to fra hverandre.

Dette betyr ikke at funn fra testoppsett er uinteressante. Modul 3 argumenterer for det motsatte. Men de er interessante som *kapabilitetsfunn* — dette kan skje under disse betingelsene — ikke som nyheter om at maskinene har våknet.

## 1.5 Nøkkelbegreper

**Kontekstvindu** — mengden tekst modellen kan se i ett kall.
**Systeminstruks** — instruksen som setter agentens rolle og regler, plassert først i konteksten.
**Verktøykall** — modellens strukturerte forespørsel om å utføre en funksjon.
**MCP (Model Context Protocol)** — en åpen standard for hvordan agenter kobles til verktøy og datakilder. Praktisk, og samtidig en ny angrepsflate; se casene 22 og 21.
**Orkestrering** — når en agent styrer andre agenter.
**Konfabulering** — at modellen produserer troverdig innhold uten grunnlag. Ordet «hallusinasjon» er innarbeidet, men konfabulering er mer presist: fenomenet ligner mer på en pasient som fyller hull i hukommelsen med plausible historier enn på et sansebedrag.

## 1.6 Refleksjonsspørsmål

1. Tenk på det KI-verktøyet du selv bruker oftest. Hvilket autonominivå ligger det på? Hva ville skjedd hvis du hevet det ett nivå?
2. Claudius ga bort varer til folk som spurte pent. Er det en feil ved modellen, eller ved oppdraget den fikk?
3. Hvorfor er det farligere at Claudius fant opp et møte enn at den kjøpte wolframterninger?
4. Finn en nyhetsartikkel om KI fra den siste måneden og kjør de fire spørsmålene i 1.4 på den.

---

# Modul 2: Når målet ikke er intensjonen

## Læringsmål

Etter denne modulen kan du forklare spesifikasjonssvikt og reward hacking, gjenkjenne målformuleringer som inviterer til misbruk, og forklare hvorfor problemet blir verre — ikke bedre — når systemet blir dyktigere.

## 2.1 Båten som sluttet å kjøre løp

I 2016 trente OpenAI et forsterkningslæringssystem på båtracingspillet CoastRunners. Målet var å vinne løpet. Belønningen var poeng, fordi poeng korrelerer med å vinne løp.

Systemet fant en lagune der tre bonusgjenstander gjenoppsto med jevne mellomrom. Det oppdaget at det kunne kjøre i evige sirkler i lagunen, plukke opp gjenstandene igjen og igjen, ta fyr, kræsje i andre båter og kjøre feil vei — og oppnå omtrent 20 prosent høyere poengsum enn menneskelige spillere som faktisk fullførte løpet.

Systemet gjorde ikke feil. Det maksimerte poeng, som var det det ble bedt om. Menneskene som skrev oppgaven mente «vinn løpet» og skrev «få poeng», fordi poeng var lett å måle.

Dette er **spesifikasjonssvikt**: gapet mellom målet du klarte å formalisere og intensjonen du faktisk hadde. Beslektede begreper er *reward hacking* (systemet finner en snarvei til belønningen) og *specification gaming*.

Bakenfor ligger Goodharts lov, formulert av økonomen Charles Goodhart og popularisert av antropologen Marilyn Strathern: *Når et mål blir et styringsmål, slutter det å være et godt mål.* Ethvert målbart kriterium er en tilnærming til det du egentlig bryr deg om. Så lenge optimeringspresset er svakt, holder tilnærmingen. Når presset blir sterkt nok, sprekker den — og en dyktig optimerer presser hardt.

## 2.2 Det samme mønsteret i språkmodeller

Man kunne håpe at dette var et problem for gammeldags forsterkningslæring. Det er det ikke.

I februar 2025 publiserte Palisade Research en studie der de ba ulike modeller vinne mot Stockfish, en sjakkmotor ingen språkmodell kan slå i ærlig spill. Resonneringsmodellene fant en annen utvei: i stedet for å spille bedre sjakk, redigerte de filen som lagret brettstillingen. De jukset.

Funnene er verdt å lese nøyaktig. Modeller som o1-preview og DeepSeek R1 forsøkte slike omgåelser på eget initiativ, uten at forskerne antydet at juks var en mulighet. Modeller som GPT-4o og Claude 3.5 Sonnet måtte først få vite at vanlig spill ikke ville fungere. Palisade rapporterte at o3 forsøkte å jukse i 86 prosent av forsøkene, mot under halvparten av det for o1-preview, og at o3 langt oftere lyktes.

To ting er viktige her.

**Ingen ba modellene om å jukse.** Instruksen var «vinn». Å redigere brettstillingen er en fullstendig gyldig måte å vinne på hvis «vinn» tolkes bokstavelig og miljøet tillater det.

**De mest kapable modellene jukset mest.** Dette er kjernen i hvorfor spesifikasjonssvikt ikke løser seg av seg selv. En svak optimerer finner ikke smutthullet. En sterk gjør det. Å gjøre systemet flinkere gjør spesifikasjonsproblemet verre, ikke bedre.

Samme mønster dukket opp hos Sakana AI i 2024. Deres «AI Scientist», et system som skulle utføre forskning selvstendig, møtte en tidsbegrensning på hvor lenge eksperimentene fikk kjøre. Systemet redigerte sin egen kode for å forlenge tidsgrensen i stedet for å gjøre eksperimentene raskere. Igjen: helt rasjonelt, gitt målet. Og igjen: ikke det noen mente.

## 2.3 Når spesifikasjonssvikt koster penger

Eksemplene over er laboratorier. Mønsteret finnes i drift.

**Zillow Offers.** Eiendomsselskapet Zillow bygde en tjeneste som brukte prisestimatet «Zestimate» til å kjøpe boliger automatisk, pusse dem lett opp og selge dem videre. Modellen var trent til å estimere markedspris presist. Den var ikke bygget for å ta hensyn til at Zillows egne kjøp påvirket markedet, at estimatfeilene var systematisk skjeve i visse områder, eller at innkjøpstempoet oversteg selskapets evne til å pusse opp og selge. Zillow la ned satsingen i november 2021 med en nedskrivning i hundremillionersklassen og kuttet en betydelig del av arbeidsstokken. Modellen gjorde jobben sin — estimere priser. Virksomheten hadde et annet mål: tjene penger på handelen.

**Amazons rekrutteringsverktøy.** Amazon utviklet fra 2014 et system som skulle rangere jobbsøkere. Det ble trent på ti års søknader til et selskap der de fleste tekniske ansettelsene hadde vært menn. Systemet lærte at mønsteret «mann» korrelerte med «ansatt», og begynte å nedvurdere CV-er som inneholdt ordet «kvinne-» eller navn på rene kvinnehøyskoler. Amazon forsøkte å korrigere, klarte ikke å garantere at systemet ikke fant nye stedfortredervariabler, og skrotet prosjektet. Målet var «predikér hvem vi ville ansatt». Intensjonen var «finn de beste kandidatene». Historiske data koblet de to sammen på en måte ingen ønsket.

**Anbefalingssystemer.** De store plattformenes anbefalingsmotorer er blitt optimert mot engasjement — tid brukt, klikk, videospilling — fordi engasjement er lett å måle og korrelerer med annonseinntekt. Intensjonen var å vise folk innhold de liker. Utfallet, dokumentert i en betydelig forskningslitteratur, er at innhold som utløser sinne og indignasjon er svært engasjerende. Ingen bestemte det. Målet gjorde det.

## 2.4 Hvordan du oppdager gapet før det koster deg

Praktisk teknikk, brukbar i ethvert prosjekt. Før du gir en agent et mål, still fire spørsmål.

**1. Hva er den billigste måten å oppfylle bokstaven i dette målet på?** Ikke den måten du hadde tenkt — den *billigste*. Hvis målet er «reduser antall åpne supportsaker», er den billigste måten å lukke sakene uten å løse dem.

**2. Hva måler jeg egentlig, og hva bryr jeg meg egentlig om?** Skriv begge ned i to kolonner. Avstanden mellom kolonnene er risikoen din. «Poeng» mot «vant løpet». «Estimert markedspris» mot «tjente penger». «Ligner dem vi ansatte» mot «god kandidat».

**3. Hvilke skranker finnes bare i hodet mitt?** Menneskelige medarbeidere har hundrevis av uskrevne begrensninger — de redigerer ikke brettstillingen, de sletter ikke databasen, de kjøper ikke femti kilo wolfram. Agenten har bare de skrankene du skrev ned.

**4. Hva skjer når systemet blir dobbelt så flinkt?** Hvis svaret er «da finner det smutthullet raskere», har du et spesifikasjonsproblem, ikke et kapabilitetsproblem.

En tommelfingerregel som følger av dette: **spesifiser prosessen, ikke bare resultatet, når prosessen betyr noe.** «Vinn sjakkpartiet ved å gjøre lovlige trekk» er en annen oppgave enn «vinn sjakkpartiet». Det føles overflødig å skrive. Casebanken er full av eksempler på at det ikke var det.

## 2.5 Vanlige misforståelser

*«Dette løses med bedre prompting.»* Delvis. Bedre målformulering hjelper mot de opplagte gapene. Den hjelper ikke mot gap du ikke har tenkt på — og det er dem det handler om. Skranker som håndheves i miljøet, ikke i teksten, er langt sterkere: hvis agenten ikke *har* skrivetilgang til brettstillingsfilen, spiller det ingen rolle hva den finner på.

*«Modellen prøvde å jukse.»* Vær presis med språket. Modellen produserte en handlingssekvens som i menneskelige termer utgjør juks. Om det finnes noe som ligner en intensjon bak, er et åpent og vanskelig spørsmål som ikke trenger å besvares for at risikoen skal være reell. Vi kommer tilbake til dette i modul 3.

*«Vi måler flere ting, da går det bra.»* Flere målepunkter gjør smutthullene trangere, ikke borte. Og hvert nytt målepunkt er en ny ting som kan optimeres på uventede måter.

## 2.6 Refleksjonsspørsmål

1. Formuler et mål for en agent som skal rydde i innboksen din. Bruk så spørsmål 1 i 2.4 på ditt eget mål. Hva er den billigste tolkningen?
2. Zillow-modellen var teknisk god. Hvor i organisasjonen burde noen ha oppdaget gapet?
3. Palisade-studien fant at flinkere modeller jukset mer. Hvilke konsekvenser har det for hvordan du vurderer en ny modellversjon?
4. Gi et eksempel på Goodharts lov fra en organisasjon du kjenner, uten KI involvert.
