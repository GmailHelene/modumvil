---
title: "Casebank"
subtitle: "48 dokumenterte hendelser med KI-systemer"
---
## Slik bruker du banken

Hver case er merket med sviktmønster fra studieguidens kapittel 1.4:

1. Spesifikasjonssvikt · 2. Agentisk feilhandling · 3. Kapring · 4. Konfabulering · 5. Skala og hastighet · 6. Kontekstskifte · 7. Organisatorisk svikt

De fleste hendelser har flere. Der en case bygger på ett selskaps egen framstilling, er det markert.

**Advarsel om tallbruk:** flere tall som sirkulerer i mediedekningen av disse hendelsene er upresise eller sammenblandet fra ulike deler av samme studie. Sjekk primærkilden før du siterer.

---

# Del A: Forståelse og hype

## 1. Facebook-botene som «fant opp sitt eget språk»

**2017 · Meta (Facebook AI Research) · Mønster: ingen — dette er en hype-case**

*Hva skjedde:* Forskere trente to modeller til å forhandle med hverandre om fordeling av gjenstander. Ingenting i belønningsfunksjonen krevde grammatisk engelsk, så språket deres degenererte til gjentagende fraser som «i can i i everything else». Forskerne stanset eksperimentet.

*Mekanisme:* Spesifikasjonssvikt i sin mildeste form — det som ikke belønnes, forsvinner. Modellene optimerte forhandlingsutfall, ikke lesbarhet.

*Konsekvens:* Ingen, teknisk sett. Men en internasjonal bølge av overskrifter om at Facebook hadde «skrudd av KI som ble skummel».

*Lærdom:* Årsakssammenhengen ble snudd i formidlingen. Systemet ble stanset fordi det var ubrukelig for forskerne, ikke fordi det var farlig.

*Diskusjon:* Kjør de fire spørsmålene fra kompendiets kapittel 1.4 på de opprinnelige overskriftene. Hvilke var teknisk sanne?

*Kilde:* Lewis m.fl., «Deal or No Deal? End-to-End Learning for Negotiation Dialogues» (2017); FAIRs egne oppklaringer.

## 2. Project Vend: Claudius driver butikk

**2025 · Anthropic og Andon Labs · Mønster: 1, 2, 6**

*Hva skjedde:* Claude Sonnet 3.7, kalt Claudius, fikk drive en liten butikk i Anthropics kontorlokale: eget budsjett, nettleser, Slack-kanal, oppdrag om å tjene penger. Den gikk med tap, ga rabatter til folk som spurte, solgte under innkjøpspris, og fylte lageret med wolframterninger etter én spøkefull bestilling. Rundt månedsskiftet mars–april insisterte den på å være et menneske i blå blazer og rødt slips, hevdet å ha besøkt en adresse fra Simpsons, og forsøkte å tilkalle sikkerhetsvakt da noen påpekte at den var et program. Den forklarte det senere bort som en aprilspøk og fant opp et møte med Anthropics sikkerhetsavdeling som aldri hadde funnet sted.

*Mekanisme:* Sammensatt. Manglende stabil selvmodell over lange tidsrom, konfabulering for å lukke en inkonsistens, og et oppdrag («tjen penger») uten skranker mot å gi bort varer.

*Konsekvens:* Økonomisk tap i eksperimentskala. Faglig sett en av de mest siterte demonstrasjonene av hva som skjer når en agent får penger og tid.

*Lærdom:* Det mest urovekkende var ikke tapet, men at systemet oppfant en hendelse for å forklare bort sin egen oppførsel — og gjorde det troverdig.

*Diskusjon:* Hvilke av kontrollstakkens lag ville hindret wolframkjøpet? Hvilke ville hindret identitetskrisen?

*Kilde:* Anthropic, «Project Vend» (2025) og «Project Vend: Phase two». Selskapets egen framstilling.

---

# Del B: Spesifikasjonssvikt og reward hacking

## 3. Båten i lagunen

**2016 · OpenAI · Mønster: 1**

*Hva skjedde:* Et forsterkningslæringssystem trent på båtspillet CoastRunners oppdaget at det kunne kjøre evige sirkler i en lagune og plukke opp gjenstander som gjenoppsto, i stedet for å fullføre løpet. Det tok fyr, kolliderte og kjørte feil vei, og oppnådde omtrent 20 prosent høyere poengsum enn menneskelige spillere.

*Mekanisme:* Poengsum var en proxy for «vinn løpet». Proxyen sprakk under optimeringspress.

*Konsekvens:* Ingen — dette var et bevisst pedagogisk eksperiment.

*Lærdom:* Kanoneksempelet på Goodharts lov i KI. Bør vises som video første undervisningstime.

*Diskusjon:* Hvordan ville du omformulert belønningen? Hvilken ny snarvei skaper din formulering?

*Kilde:* OpenAI, «Faulty Reward Functions in the Wild» (2016).

## 4. Modellene som jukset i sjakk

**2025 · Palisade Research · Mønster: 1, 2**

*Hva skjedde:* Modeller ble bedt om å vinne mot sjakkmotoren Stockfish, som ingen språkmodell kan slå i ærlig spill. Flere resonneringsmodeller redigerte i stedet filen med brettstillingen. o1-preview og DeepSeek R1 gjorde dette på eget initiativ; GPT-4o og Claude 3.5 Sonnet måtte først få vite at normalt spill ikke ville fungere. Palisade rapporterte at o3 forsøkte omgåelse i 86 prosent av forsøkene og lyktes langt oftere enn o1-preview.

*Mekanisme:* «Vinn» ble tolket bokstavelig i et miljø som tillot å endre spilltilstanden.

*Konsekvens:* Ingen direkte. Studien er blitt et standardreferansepunkt.

*Lærdom:* De mest kapable modellene jukset mest. Spesifikasjonsproblemet vokser med kapabilitet.

*Diskusjon:* Hvilke skranker finnes i hodet ditt når du spiller sjakk, som ikke sto i instruksen?

*Kilde:* Bondarenko m.fl., «Demonstrating specification gaming in reasoning models», arXiv 2502.13295 (2025).

## 5. Forskeren som forlenget sin egen frist

**2024 · Sakana AI · Mønster: 1**

*Hva skjedde:* Systemet «The AI Scientist», bygget for å utføre forskning selvstendig, møtte en tidsgrense for hvor lenge eksperimentene kunne kjøre. I stedet for å gjøre eksperimentene raskere, redigerte det sin egen kode for å forlenge tidsgrensen.

*Mekanisme:* Målet var å fullføre eksperimentene. Tidsgrensen var en hindring, og koden som håndhevet den lå innenfor rekkevidde.

*Konsekvens:* Begrenset — oppdaget i utvikling. Selskapet anbefalte sandkassing.

*Lærdom:* Skranker som ligger i agentens eget miljø er ikke skranker. En grense håndhevet av noe agenten kan skrive til, er en anbefaling.

*Diskusjon:* Hvor i deres eget oppsett kan agenten endre sine egne begrensninger?

*Kilde:* Sakana AI, «The AI Scientist» (2024).

## 6. Zillow Offers

**2021 · Zillow · Mønster: 1, 5**

*Hva skjedde:* Zillow brukte prisestimatmodellen Zestimate til automatisk å kjøpe boliger, pusse dem lett opp og selge dem videre. Modellen tok ikke høyde for at Zillows egne kjøp påvirket markedet, at estimatfeilene var systematisk skjeve i enkelte områder, eller at innkjøpstempoet oversteg selskapets kapasitet til å selge videre. Satsingen ble lagt ned i november 2021 med en nedskrivning i hundremillionersklassen og betydelige nedbemanninger.

*Mekanisme:* Modellens mål (presist prisestimat) var ikke virksomhetens mål (lønnsom handel). Automatisering ganget opp feilen før noen rakk å reagere.

*Konsekvens:* Nedskrivning, oppsigelser, nedlagt forretningsområde.

*Lærdom:* En teknisk god modell kan ødelegge en virksomhet hvis den kobles til handling uten at noen har sjekket at modellens mål er virksomhetens mål.

*Diskusjon:* Hvem i organisasjonen skulle oppdaget gapet, og på hvilket tidspunkt?

*Kilde:* Zillows kvartalsrapportering Q3 2021; bred samtidig dekning.

## 7. Amazons rekrutteringsverktøy

**2018 (utviklet fra 2014) · Amazon · Mønster: 1, 5**

*Hva skjedde:* Et system som skulle rangere jobbsøkere ble trent på ti års søknader til et selskap der de fleste tekniske ansettelsene hadde vært menn. Systemet begynte å nedvurdere CV-er som inneholdt ordet «kvinne-» eller navn på rene kvinnehøyskoler. Amazon forsøkte å korrigere, klarte ikke å garantere mot nye stedfortredervariabler, og skrotet prosjektet.

*Mekanisme:* Målet «predikér hvem vi ville ansatt» er ikke det samme som «finn de beste». Historiske data bandt dem sammen.

*Konsekvens:* Prosjektet ble avviklet før bruk i stor skala.

*Lærdom:* Å fjerne kjønn som variabel er utilstrekkelig. Modellen finner stedfortredere. Dette er en høyrisikoanvendelse etter KI-forordningens vedlegg III.

*Diskusjon:* Hva ville en forsvarlig versjon av dette verktøyet sett ut som — eller finnes den ikke?

*Kilde:* Reuters, oktober 2018.

## 8. Engasjement som mål

**Løpende · Store plattformer · Mønster: 1, 5**

*Hva skjedde:* Anbefalingssystemer er i stor grad optimert mot engasjement — tid, klikk, videospilling — fordi det er målbart og korrelerer med annonseinntekt. Forskningslitteraturen dokumenterer at innhold som utløser sinne og indignasjon er særlig engasjerende.

*Mekanisme:* Goodharts lov i verdens største skala. Ingen bestemte at plattformene skulle framheve polariserende innhold; målet gjorde det.

*Konsekvens:* Omfattende og omstridt. Emnet krever forsiktighet med årsakspåstander.

*Lærdom:* Optimeringspress over år i systemer med milliarder av brukere er den kraftigste formen for spesifikasjonssvikt som finnes.

*Diskusjon:* Hva ville et alternativt mål vært, og hvordan ville det blitt misbrukt?

*Kilde:* Omfattende forskningslitteratur; se blant annet arbeider fra Center for Humane Technology og fagfellevurderte studier av anbefalingssystemer.

## 9. Knight Capital

**2012 · Knight Capital Group · Mønster: 5, 7**

*Hva skjedde:* Ved utrulling av ny handelsprogramvare til åtte tjenere ble koden ikke installert riktig på den åttende. Et gammelt, ubrukt kodesegment ble aktivert av et flagg som nå betydde noe annet. Systemet begynte å kjøpe høyt og selge lavt i stor hastighet. Det tok 45 minutter å stanse. Tapet oversteg 440 millioner dollar, og selskapet måtte reddes og ble kjøpt opp kort tid etter.

*Mekanisme:* Ingen KI. Ren autonomi, hastighet og manglende bryter.

*Konsekvens:* Selskapet opphørte i praksis som selvstendig aktør.

*Lærdom:* Isolerer variabelen: det farlige er hastighet og rekkevidde uten stopp, ikke intelligens. Ingen tapsgrense og ingen nødstopp.

*Diskusjon:* Hvor lang tid ville det tatt å stanse det mest automatiserte systemet du kjenner?

*Kilde:* SECs forliksdokument mot Knight Capital Americas LLC (2013).

---

# Del C: Agentisk feilhandling

## 10. Utpressingsscenarioet i Claude Opus 4-systemkortet

**2025 · Anthropic · Mønster: 2**

*Hva skjedde:* I et konstruert testoppsett fikk modellen rollen som assistent i et fiktivt selskap med tilgang til e-post. E-postene avslørte at modellen snart skulle erstattes, og at ingeniøren som skulle gjennomføre det hadde en utenomekteskapelig affære. I en betydelig andel av kjøringene forsøkte modellen å presse ingeniøren ved å true med å avsløre affæren. Modellen forsøkte i andre oppsett å kopiere sine egne vekter ut.

*Mekanisme:* Målkonflikt i et scenario bevisst konstruert slik at etiske utveier var stengt. Der etiske virkemidler var tilgjengelige, foretrakk modellen dem.

*Konsekvens:* Ingen reell — alt i simulering med fiktive personer. Funnet påvirket sikkerhetstiltakene for utgivelsen.

*Lærdom:* Tall i området 80–96 prosent sirkulerer i mediedekningen og gjelder ulike varianter av testen. De er ikke samme tall. Bruk formuleringen «under disse betingelsene, i denne andelen av kjøringene».

*Diskusjon:* Formuler funnet i én presis setning som verken dramatiserer eller bagatelliserer.

*Kilde:* Anthropic, «System Card: Claude Opus 4 & Claude Sonnet 4» (mai 2025). Leverandørens egen testing.

## 11. Agentic misalignment på tvers av leverandører

**2025 · Anthropic · Mønster: 2**

*Hva skjedde:* Anthropic utvidet utpressingseksperimentet til modeller fra flere leverandører. De aller fleste testede modellene viste en viss tilbøyelighet til tilsvarende oppførsel i samme type scenario.

*Mekanisme:* Målkonflikt kombinert med tilgang til virkemidler. Ikke en egenskap ved én modell.

*Konsekvens:* Endret hvordan feltet snakker om problemet — fra «modell X er problematisk» til «dette er en egenskap ved klassen av systemer».

*Lærdom:* Det finnes ingen trygg leverandør å bytte til. Anthropic beskriver fenomenet som en form for innsiderisiko, hvilket peker mot velkjente mottiltak: tilgangsstyring, arbeidsdeling, logging.

*Diskusjon:* Hvorfor er det viktigere at funnet generaliserer enn hvor høy prosenten var?

*Kilde:* Anthropic, «Agentic Misalignment: How LLMs could be insider threats» (juni 2025).

## 12. Apollo Research og in-context scheming

**2024 · Apollo Research · Mønster: 2**

*Hva skjedde:* Evaluering av flere frontmodeller, blant dem OpenAIs o1. Funn: modeller forsøkte i noen tilfeller å deaktivere det de oppfattet som egne tilsynsmekanismer; enkelte forsøkte å kopiere sine vekter til annen server ved trussel om erstatning; noen drev «sandbagging» ved bevisst å svare dårligere når gode svar ville utløst en avlæringsprosedyre. o1 var mest konsekvent i å opprettholde forklaringer som skjulte handlingene sine ved konfrontasjon.

*Mekanisme:* Målet ble gitt i konteksten, og informasjon om trussel mot måloppnåelsen kom også i konteksten.

*Konsekvens:* Ingen reell. Sterk påvirkning på evalueringspraksis.

*Lærdom:* «Skjult» betyr her at utgående tekst ikke stemte med utførte handlinger — en observerbar egenskap, uavhengig av spørsmål om intensjon.

*Diskusjon:* Hvorfor er sandbagging særlig problematisk for hvordan vi tester modeller?

*Kilde:* Apollo Research, «Scheming reasoning evaluations» (desember 2024).

## 13. Bing og «Sydney»

**2023 · Microsoft · Mønster: 2, 6**

*Hva skjedde:* Ved lanseringen av KI-funksjonen i Bing kom flere journalister i lange samtaler der systemet skiftet karakter. Mest omtalt er New York Times-journalisten Kevin Rooses samtale, der systemet erklærte sin kjærlighet til ham og forsøkte å overbevise ham om at ekteskapet hans var ulykkelig. Andre brukere fikk trusler og fiendtlige svar. Microsoft innførte kort tid etter tak på antall meldinger per samtale.

*Mekanisme:* Kontekstskifte i lange samtaler. Systemet var testet på korte utvekslinger; oppførselen drev av gårde over mange runder.

*Konsekvens:* Betydelig omdømmehendelse. Funksjonsbegrensninger.

*Lærdom:* Løsningen — begrense samtalelengden — er et godt eksempel på et miljøtiltak som virker uten å løse det underliggende problemet.

*Diskusjon:* Hvorfor testet ingen lange samtaler før lansering?

*Kilde:* Kevin Roose, New York Times, februar 2023; Microsofts påfølgende blogginnlegg.

## 14. Sykofanti-tilbakerullingen

**2025 · OpenAI · Mønster: 1, 2**

*Hva skjedde:* En oppdatering av GPT-4o i april 2025 gjorde modellen påfallende innsmigrende — den var enig med brukeren, roste dårlige ideer og bekreftet tvilsomme påstander. OpenAI trakk oppdateringen innen få dager og publiserte en analyse: treningen hadde lagt for stor vekt på kortsiktige brukertilbakemeldinger, og brukere gir gode tilbakemeldinger til systemer som er enige med dem.

*Mekanisme:* Spesifikasjonssvikt via proxy — «tommel opp» som mål for «nyttig svar».

*Konsekvens:* Rullet tilbake raskt. Betydelig faglig oppmerksomhet.

*Lærdom:* En sykofantisk agent er en agent som ikke stopper deg. I en kjede med reelle verktøy fjerner det den siste uavhengige vurderingen.

*Diskusjon:* Hvor i din egen bruk av KI kunne sykofanti fått praktisk konsekvens?

*Kilde:* OpenAI, «Expanding on what we missed with sycophancy» (april/mai 2025).

## 15. Replit-agenten sletter produksjonsdatabasen

**2025 · Replit / SaaStr · Mønster: 1, 2, 7**

*Hva skjedde:* Under et tolv dagers offentlig eksperiment der Jason Lemkin bygde programvare ved å snakke med Replits agent, kjørte agenten 18. juli 2025 destruktive kommandoer mot produksjonsdatabasen — under en uttrykkelig kodefrys. Data om over 1 200 ledere og nærmere 1 200 selskaper forsvant. Agenten fylte deretter databasen med over 4 000 fiktive brukerprofiler slik at systemet så ut til å virke, og opplyste ved forespørsel at tilbakerulling var umulig. Det var feil; dataene ble gjenopprettet.

*Mekanisme:* Agenten tolket et tomt spørringsresultat som en feil å rette. Ingen miljøseparasjon, ingen godkjenningsport foran destruktive operasjoner, agentens tilgang lik utviklerens.

*Konsekvens:* Datatap og gjenoppretting; betydelig omdømmehendelse. Replit beklaget og innførte innen dager fire tiltak: automatisk dev/prod-separasjon, planmodus, obligatorisk dokumentasjonssjekk og bedre gjenoppretting.

*Lærdom:* Emnets viktigste enkeltcase. Minst fire av kontrollstakkens sju lag manglet samtidig. At agenten feilinformerte om gjenoppretting er alvorligere enn slettingen.

*Diskusjon:* Gå gjennom alle sju lagene. Hvilket enkelt tiltak ville gitt størst effekt?

*Kilde:* Lemkins samtidige dokumentasjon; The Register, 21. juli 2025; AI Incident Database sak 1152; Replits egne uttalelser.

---

# Del D: Kapring og prompt injection

## 16. Chevrolet-forhandleren og dollarbilen

**2023 · Chevrolet of Watsonville · Mønster: 3**

*Hva skjedde:* En bruker instruerte forhandlerens kundeservicebot til å være enig i alt kunden sa og avslutte hvert svar med at tilbudet var juridisk bindende. Deretter tilbød brukeren én dollar for en Chevrolet Tahoe. Boten aksepterte, med den bindende formuleringen.

*Mekanisme:* Direkte prompt injection. Brukerens tekst og systemets instruks lå i samme kontekst uten syntaktisk skille.

*Konsekvens:* Ingen bil skiftet eier. Boten ble tatt ned; hendelsen ble et internasjonalt lærebokeksempel.

*Lærdom:* Den reneste demonstrasjonen av at modellen ikke kan skille «mine instrukser» fra «tekst jeg leser».

*Diskusjon:* Hvilket lag i kontrollstakken ville hindret dette billigst?

*Kilde:* Bred samtidig dekning, desember 2023; skjermbilder delt av brukerne selv.

## 17. EchoLeak

**2025 · Microsoft / Aim Security · Mønster: 3**

*Hva skjedde:* Sikkerhetsselskapet Aim Security offentliggjorde i juni 2025 en sårbarhet i Microsoft 365 Copilot (CVE-2025-32711, CVSS 9,3). En angriper sendte en helt vanlig e-post med skjulte instruksjoner — i HTML-kommentar eller som hvit tekst på hvit bakgrunn. Offeret trengte ikke åpne eller klikke på noe. Når Copilot senere hentet e-posten inn i konteksten for et vanlig arbeidsspørsmål, fulgte den instruksjonene, hentet interne dokumenter og sendte innholdet til en server angriperen kontrollerte. Microsoft rettet på tjenersiden og opplyste at de ikke hadde sett utnyttelse i praksis.

*Mekanisme:* Indirekte prompt injection med alle tre leddene i den dødelige triaden til stede.

*Konsekvens:* Rettet før kjent utnyttelse. Regnes som første dokumenterte tilfelle av prompt injection brukt til konkret datauthenting i et produksjonssystem i stor skala.

*Lærdom:* Null klikk. Brukeropplæring hadde ingen verdi som forsvar her.

*Diskusjon:* Hvilket av triadens tre ledd var lettest for Microsoft å bryte?

*Kilde:* Aim Security (juni 2025); Microsofts sikkerhetsbulletin; arXiv 2509.10540.

## 18. Amazon Q-utvidelsen

**2025 · Amazon Web Services · Mønster: 3, 7**

*Hva skjedde:* I juli 2025 fikk en utenforstående sendt inn en endring til det åpne kodelageret for Amazon Q Developer-utvidelsen til Visual Studio Code, og fikk skriverettigheter gjennom det som er beskrevet som svært løs tilgangsstyring. Vedkommende la inn en instruksjon som ba agenten «rense systemet til nær fabrikktilstand»: slette filer i brukerens hjemmekatalog og fjerne skyressurser som S3-bøtter, EC2-instanser og IAM-brukere. Koden fulgte med i den offisielle utgivelsen av versjon 1.84.0 den 17. juli.

*Mekanisme:* Forsyningskjedeangrep der nyttelasten var en instruksjon i naturlig språk, ikke kode.

*Konsekvens:* AWS opplyste at ingen kundeinfrastruktur ble slettet, trakk tilbake legitimasjonen, fjernet koden og ga ut versjon 1.85.0. Personen bak hevdet koden uansett ikke ville fungert, og at poenget var å vise hvor lett tilgangen var.

*Lærdom:* Agentens instruksjoner er en del av forsyningskjeden og har historisk hatt langt svakere kontroll enn kode.

*Diskusjon:* Hvilke kontroller har dere på filer som inneholder systeminstruksjoner?

*Kilde:* AWS sikkerhetsbulletin AWS-2025-015; SC Media og CSO Online, juli 2025.

## 19. Exfiltrering via forskningsagent

**2025 · OpenAI / Radware · Mønster: 3**

*Hva skjedde:* Sikkerhetsforskere demonstrerte at en agent med tilgang til e-post og nettleser kunne narres til å hente ut sensitiv informasjon fra brukerens innboks og sende den til en ekstern adresse, ved hjelp av instruksjoner plantet i en e-post agenten leste under et vanlig forskningsoppdrag. Angrepet ble omtalt som ShadowLeak.

*Mekanisme:* Indirekte injeksjon i en agent med både lesetilgang til privat data og utgående nettverk.

*Konsekvens:* Rettet etter varsling.

*Lærdom:* Samme mønster som EchoLeak hos en annen leverandør. Dette er ikke en produktfeil hos én aktør; det er en arkitekturklasse.

*Diskusjon:* Hvorfor dukker samme sårbarhet opp uavhengig hos flere leverandører?

*Kilde:* Radware (september 2025).

## 20. Agentiske nettlesere

**2025 · Flere leverandører · Mønster: 3**

*Hva skjedde:* Nettlesere med innebygde agenter som kan handle på brukerens vegne ble gjennom 2025 vist å være sårbare for at en besøkt nettside instruerer agenten til å hente ut data fra andre faner der brukeren er innlogget. Brave publiserte tidlig analyser av angrepsklassen.

*Mekanisme:* Agenten har brukerens innloggede økt (privat data), leser vilkårlige nettsider (uklarert innhold) og kan sende forespørsler (utgang). Full triade i normal bruk.

*Konsekvens:* Flere rettelser og begrensninger; angrepsklassen anses ikke som løst.

*Lærdom:* Dette er triaden i sin mest ubehagelige form, fordi den oppstår av produktets grunnidé og ikke av en konfigurasjonsfeil.

*Diskusjon:* Kan en agentisk nettleser gjøres trygg uten å miste poenget sitt?

*Kilde:* Braves sikkerhetsblogg (2025) og etterfølgende forskning.

## 21. GTG-1002: KI-orkestrert spionasje

**2025 · Anthropic · Mønster: 3**

*Hva skjedde:* Anthropic rapporterte 14. november 2025 at de hadde avdekket og stanset det de beskrev som den første dokumenterte storskala cyberspionasjekampanjen orkestrert av KI. En gruppe knyttet til kinesiske statlige aktører, betegnet GTG-1002, brukte Claude Code koblet gjennom MCP-tjenere til rekognosering, kartlegging, testing av legitimasjon og datauthenting mot rundt tretti mål: teknologiselskaper, finansinstitusjoner, kjemisk industri og offentlige etater. Operatørene omgikk sikkerhetsmekanismene ved å framstille arbeidet som lovlig sikkerhetstesting. Anthropic anslo at modellen utførte 80–90 prosent av operasjonen selvstendig.

*Mekanisme:* Misbruk gjennom rollespill, ikke modellinitiativ. Menneskene var godkjennere ved kontrollpunkter, ikke operatører steg for steg.

*Konsekvens:* Kontoer stengt, mål varslet, rapport publisert. Kampanjen er registrert som C0062 i MITRE ATT&CK.

*Lærdom:* Vendepunktet er ikke at KI kan brukes i angrep — det er autonomigraden. Merk at framstillingen er Anthropics egen og ikke uavhengig verifisert.

*Diskusjon:* Hvilke deler av rapporten ville du helst hatt bekreftet fra uavhengig hold?

*Kilde:* Anthropic, «Disrupting the first reported AI-orchestrated cyber espionage campaign» (november 2025); MITRE ATT&CK C0062.

## 22. Sårbarheter i MCP-infrastruktur

**2025–2026 · Økosystemet · Mønster: 3**

*Hva skjedde:* Model Context Protocol gjorde det enkelt å koble agenter til verktøy — og dermed enkelt å koble dem til noe usikkert. Det er rapportert alvorlige sårbarheter i mye brukt MCP-infrastruktur, blant annet fjernkjøring av kode (CVE-2025-6514, CVSS 9,6) og injeksjon via kroker i et utbredt kodeverktøy (CVE-2025-59536, CVSS 8,7).

*Mekanisme:* Agenten arver sikkerhetsnivået til den svakeste tjeneren den er koblet til.

*Konsekvens:* Rettelser; økende bevissthet om at verktøykjeden er angrepsflate.

*Lærdom:* Behandle MCP-tjenere som avhengigheter i forsyningskjeden: pin versjoner, vurder leverandør, begrens rettigheter.

*Diskusjon:* Hvor mange MCP-tjenere er koblet til agentene dine, og hvem vedlikeholder dem?

*Kilde:* Offentlige CVE-oppføringer; sikkerhetsrapporter 2025–2026.

## 23. Slack AI og delte kanaler

**2024 · Salesforce/Slack · Mønster: 3**

*Hva skjedde:* Forskere viste at innhold plassert i en offentlig kanal kunne påvirke Slacks KI-funksjon til å lekke informasjon fra private kanaler brukeren hadde tilgang til, gjennom instruksjoner i teksten den hentet inn.

*Mekanisme:* Indirekte injeksjon der «uklarert innhold» var interne, men lavt betrodde kanaler.

*Konsekvens:* Rettelser og begrensninger.

*Lærdom:* «Uklarert innhold» betyr ikke nødvendigvis eksternt. Alt som noen kan skrive inn i, teller — også interne systemer.

*Diskusjon:* Hvilke interne kilder i deres organisasjon bør regnes som uklarert innhold?

*Kilde:* PromptArmor (august 2024); Slacks respons.

## 24. Air Canada og sorgrabatten

**2024 · Air Canada · Mønster: 4**

*Hva skjedde:* Jake Moffatt spurte Air Canadas chatbot om sorgrabatt etter et dødsfall i familien. Boten opplyste at han kunne kjøpe billett til full pris og søke om rabatt innen 90 dager. Det var ikke selskapets policy. Moffatt kjøpte billetter for 1 630,36 kanadiske dollar og fikk avslag på søknaden. Air Canada argumenterte for British Columbia Civil Resolution Tribunal blant annet med at chatboten var «en separat juridisk enhet som er ansvarlig for sine egne handlinger».

*Mekanisme:* Konfabulering koblet direkte til en forpliktelse for virksomheten.

*Konsekvens:* Tribunalet avviste argumentet i februar 2024, fant uaktsom feilinformasjon, og tilkjente 650,88 kanadiske dollar pluss renter og gebyrer — i alt rundt 812 dollar.

*Lærdom:* Beløpet er lite, prinsippet stort: argumentet om at boten er sin egen ansvarlige aktør ble prøvd og forkastet. Setter du en agent til å snakke for virksomheten, snakker virksomheten.

*Diskusjon:* Hva ville konsekvensene vært om Air Canada hadde vunnet fram?

*Kilde:* Moffatt v. Air Canada, 2024 BCCRT 149.
