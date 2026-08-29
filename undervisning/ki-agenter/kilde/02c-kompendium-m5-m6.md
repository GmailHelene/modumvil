---
---

# Modul 5: Konfabulering med konsekvens

## Læringsmål

Etter denne modulen kan du forklare hvorfor språkmodeller finner på ting, vurdere når en konfabulering blir juridisk eller økonomisk bindende, og utforme tiltak som reduserer skaden.

## 5.1 Saken som avgjorde spørsmålet om ansvar

Jake Moffatt skulle reise fra Vancouver til Toronto i november 2022 etter et dødsfall i familien. Han spurte chatboten på Air Canadas nettsider om selskapets sorgrabatt. Boten svarte at han kunne kjøpe billett til full pris og deretter søke om rabatten innen 90 dager.

Det var ikke Air Canadas policy. Selskapets faktiske ordning krevde at rabatten ble avklart før reisen. Moffatt kjøpte billetter for 1 630,36 kanadiske dollar, søkte innenfor de 90 dagene boten hadde beskrevet, og fikk avslag.

Air Canada argumenterte for tvisteorganet British Columbia Civil Resolution Tribunal blant annet med at chatboten var «en separat juridisk enhet som er ansvarlig for sine egne handlinger». Tribunalet avviste dette i februar 2024. Det slo fast at Air Canada er ansvarlig for all informasjon på sine nettsider, uansett om den kommer fra en statisk side eller en chatbot, og at selskapet hadde begått uaktsom feilinformasjon. Moffatt ble tilkjent 650,88 kanadiske dollar i erstatning pluss renter og gebyrer, i alt rundt 812 dollar.

Beløpet er lite. Prinsippet er ikke. Avgjørelsen er blitt et internasjonalt referansepunkt av én grunn: **argumentet om at boten er sin egen ansvarlige aktør ble prøvd og forkastet.** Når du setter en agent til å snakke på vegne av virksomheten din, snakker virksomheten din.

## 5.2 Hvorfor modeller finner på

Kort teknisk forklaring, tilstrekkelig for formålet.

En språkmodell er trent til å produsere sannsynlig fortsettelse av tekst. Den har ingen egen representasjon av «dette vet jeg» kontra «dette gjetter jeg». Når den blir spurt om Air Canadas sorgrabattregler, produserer den den teksten som ser mest ut som et svar på et slikt spørsmål — trukket fra alt den har sett om flyselskapers rabattordninger. Resultatet er nesten alltid plausibelt, ofte riktig, og aldri garantert.

Tre praktiske konsekvenser følger:

**Feilene er velformulerte.** En konfabulering er ikke rotete. Den har riktig format, riktig tone og riktig detaljnivå. Det er nettopp derfor den passerer. En oppdiktet paragraf ser ut som en paragraf.

**Selvtilliten bærer ingen informasjon.** Modellen er ikke mer usikker i formen når den finner på. Å be den «si fra hvis du er usikker» hjelper noe, men den vurderingen er også bare tekstgenerering.

**Innhenting reduserer, men fjerner ikke.** Systemer som henter fram faktiske dokumenter før de svarer — RAG — reduserer konfabulering betydelig. De fjerner den ikke, fordi modellen fortsatt kan feiltolke, sammenblande eller fylle ut hull mellom kildene.

## 5.3 Fire varianter av samme feil

**Boten som fant opp en policy.** I april 2025 svarte støtteboten hos kodeverktøyet Cursor at produktet hadde en ny regel om at bruk var begrenset til én maskin per abonnement. Regelen fantes ikke. Brukere som trodde de var rammet av en innstramming, sa opp abonnementene i protest, og selskapet måtte forklare offentlig at boten hadde funnet på det. Kostnaden var ikke et erstatningsbeløp — det var oppsigelser og tillitstap.

**Boten som ble et omdømmeproblem.** I januar 2024 klarte en kunde å få leveringsselskapet DPDs chatbot til å banne, kalle seg verdens verste leveringstjeneste, og skrive et nedsettende dikt om sin egen arbeidsgiver. Selskapet slo av funksjonen. Dette er teknisk sett direkte injeksjon fra modul 4, men konsekvensen — omdømme — hører hjemme her.

**Boten som ga ulovlige råd.** New York Citys «MyCity»-chatbot, lansert i 2024 for å hjelpe småbedrifter, ga i flere tilfeller råd som ville brutt loven — blant annet at arbeidsgivere kunne ta av ansattes tips og at boliger kunne nekte leietakere med boligstøtte. Byen valgte å beholde tjenesten med tydelige advarsler. Casen er nyttig fordi den viser en beslutning under usikkerhet der svaret ikke er opplagt.

**Den profesjonelle som ikke sjekket.** I saken Mata mot Avianca i 2023 leverte en advokat i New York et rettsdokument der flere av de siterte dommene ikke eksisterte; de var generert av ChatGPT. Advokaten hadde spurt modellen om sakene var ekte, og modellen hadde bekreftet det. Retten ila sanksjoner. Mønsteret gjentok seg i 2025, da Deloitte Australia måtte tilbakebetale deler av honoraret for en rapport til australske myndigheter etter at den viste seg å inneholde kilder og henvisninger som ikke fantes.

Fellesnevneren i alle fire: **feilen var ikke katastrofal i seg selv. Koblingen til handling gjorde den det.**

## 5.4 Alvorlighetstrappen

Bruk denne når du vurderer et KI-svar i en tjeneste:

| Trinn | Hva svaret er koblet til | Eksempel | Tiltak |
|---|---|---|---|
| 1 | Ingenting — brukeren leser bare | Idémyldring | Merking holder |
| 2 | Brukerens egen vurdering | Sammendrag av en artikkel | Kildehenvisning |
| 3 | En handling brukeren utfører | «Slik søker du om rabatt» | Verifisering mot faktisk regelverk |
| 4 | En forpliktelse for virksomheten | «Du får rabatten» | Innsnevret svarrom, godkjente formuleringer |
| 5 | En automatisk utført handling | Boten refunderer selv | Menneskelig godkjenning, beløpsgrenser |

Air Canada var på trinn 4 og trodde de var på trinn 2. Det er den vanligste feilen: virksomheten oppfatter boten som informasjon, mens kunden og retten oppfatter den som selskapets ord.

## 5.5 Tiltak som virker

**Snevre inn svarrommet.** For alt som gjelder priser, vilkår, rettigheter og frister: la ikke modellen formulere fritt. La den finne riktig godkjent tekstblokk og gjengi den. Modellen brukes til å forstå spørsmålet, ikke til å oppfinne svaret.

**Krev henvisning.** Ingen påstand uten kilde brukeren kan åpne. Dette flytter kontrollen til brukeren og gjør feil oppdagbare.

**Skill informasjon fra forpliktelse.** En bot kan gjerne forklare hvordan en ordning fungerer. Den skal ikke innvilge noe.

**Logg alt boten sier til kunder.** Air Canada-saken ble avgjort på grunnlag av et skjermbilde kunden hadde tatt. Hvis du ikke har logg, er det motpartens dokumentasjon som gjelder.

**Vær ærlig i grensesnittet.** «Dette er et KI-svar og kan inneholde feil» er ikke et juridisk skjold — Air Canada hadde ansvarsfraskrivelser — men det påvirker hvordan brukeren leser svaret, og det er verdt noe.

## 5.6 Refleksjonsspørsmål

1. Hvor på alvorlighetstrappen ligger KI-funksjonene på arbeidsplassen din eller studiestedet ditt?
2. Air Canadas forsvar var at boten var en egen enhet. Hvorfor tror du selskapet forsøkte det argumentet, og hva ville konsekvensene vært om det hadde vunnet fram?
3. Cursor mistet kunder fordi boten fant opp en regel. Hva ville kostet minst å endre i det systemet?
4. Er det forskjell på ansvaret til en advokat som siterer en oppdiktet dom og et konsulentselskap som gjør det?

---

# Modul 6: Skala, hastighet og den fysiske verden

## Læringsmål

Etter denne modulen kan du forklare hvordan små feilrater blir store skandaler gjennom automatisering, redegjøre for automasjonsparadokset og automasjonsskjevhet, og vurdere hva «menneske i løkka» faktisk er verdt i et gitt oppsett.

## 6.1 Førtifem minutter

1. august 2012 rullet handelsselskapet Knight Capital ut ny programvare på åtte tjenere. På sju gikk det bra. På den åttende ble den nye koden ikke installert riktig, og et gammelt kodesegment som hadde ligget ubrukt i årevis ble aktivert av et flagg som nå betydde noe annet.

Resultatet var at systemet begynte å kjøpe høyt og selge lavt, automatisk, i enorm hastighet. Ansatte forsto at noe var galt i løpet av minutter. Det tok førtifem minutter å stanse det. Tapet var i overkant av 440 millioner dollar, og selskapet — som var blant de største aktørene i amerikansk aksjehandel — måtte reddes og ble kjøpt opp kort tid etter.

Ingen KI var involvert. Casen står likevel først i denne modulen, fordi den isolerer variabelen: **det farlige er ikke intelligensen, det er hastigheten kombinert med rekkevidden og mangelen på stopp.** Et menneske som gjør samme feil gjør den fire ganger og oppdager den. Et system gjør den fire millioner ganger.

Legg merke til hva som manglet: en nødstopp som kunne aktiveres på sekunder, og en tapsgrense som stanset handelen automatisk. Begge deler er lag 5 og 7 i kontrollstakken.

## 6.2 Når staten automatiserer

To europeiske og en australsk sak hører sammen, og de er de tyngste i hele materialet.

**Robodebt (Australia, 2016–2020).** Australske myndigheter innførte et automatisert system som sammenlignet inntekt oppgitt til skattemyndighetene med utbetalte trygdeytelser, og sendte ut krav om tilbakebetaling der det var avvik. Metoden fordelte årsinntekt jevnt utover året, noe som ga systematisk feil for alle som hadde hatt uregelmessig arbeid. Bevisbyrden ble snudd: mottakeren måtte dokumentere at kravet var feil. Hundretusener fikk krav, mange uriktige. En kongelig granskningskommisjon konkluderte i 2023 skarpt, ordningen ble kjent ulovlig, og staten betalte tilbake milliardbeløp. Kommisjonen dokumenterte også at juridiske advarsler internt var blitt ignorert.

**Toeslagenaffaire (Nederland, ca. 2013–2021).** Nederlandske skattemyndigheter brukte et risikoklassifiseringssystem for å oppdage svindel med barnepassstøtte. Systemet vektet blant annet dobbelt statsborgerskap. Tusenvis av familier — uforholdsmessig mange med minoritetsbakgrunn — ble uriktig anklaget for svindel og avkrevd store tilbakebetalinger. Mange ble økonomisk ruinert; over tusen barn ble plassert utenfor hjemmet. Saken førte til at hele den nederlandske regjeringen gikk av i januar 2021.

**Post Office Horizon (Storbritannia, 1999–2015).** Ikke KI, men det viktigste eksempelet som finnes på hva som skjer når en organisasjon stoler mer på et system enn på mennesker. Regnskapssystemet Horizon viste underskudd på postkontorer der det ikke var noe underskudd. Over 900 postkontorbestyrere ble straffeforfulgt for tyveri og underslag. Noen ble fengslet. Flere tok sitt eget liv. Feilen lå i programvaren, og Post Office visste om feilene mens rettssakene pågikk.

Tre trekk går igjen:

**Systemets utdata ble behandlet som bevis, ikke som en hypotese.** I alle tre sakene måtte den enkelte bevise sin uskyld mot en maskin.

**Feilraten var «akseptabel» på systemnivå og katastrofal på individnivå.** Nittifem prosent riktighet høres bra ut helt til du ganger med hundretusen mennesker.

**Advarslene kom, og de ble avvist.** Ikke fordi noen var ond, men fordi systemet allerede var innført, budsjettert og forsvart offentlig.

Disse sakene er obligatoriske i dette emnet nettopp fordi de ikke handler om KI. De viser at det farlige mønsteret er eldre enn teknologien, og at KI gjør det billigere å gjenta.

## 6.3 Automasjonsparadokset

Jo bedre automatikken er, desto verre blir menneskets jobb.

Paradokset ble beskrevet av ergonomen Lisanne Bainbridge i 1983, om industrielle prosessanlegg, og treffer KI-agenter perfekt. Resonnementet:

Når automatikken tar seg av de vanlige tilfellene, står mennesket igjen med bare de uvanlige — de vanskeligste. Samtidig mister mennesket øvelse, fordi det ikke lenger gjør jobben rutinemessig. Og fordi automatikken nesten alltid har rett, slutter mennesket å følge ordentlig med.

Så: du har en person med redusert ferdighet og redusert oppmerksomhet, som skal gripe inn i akkurat de situasjonene som er vanskeligst, ofte under tidspress.

Dette er grunnen til at «vi har et menneske i løkka» er et svakere svar enn det høres ut som. Spør alltid:

- Har mennesket **nok informasjon** til å vurdere? En godkjenningsdialog som viser en kommandostreng uten kontekst gir ikke det.
- Har mennesket **nok tid**? Femten sekunder er ikke en vurdering.
- Har mennesket **reell mulighet til å si nei**? Hvis det å avvise stopper produksjonslinja og alle ser hvem som gjorde det, er nei-et dyrt.
- Hvor mange ganger om dagen skjer dette? Femti godkjenninger daglig er ikke kontroll, det er en klikkevane.

**Automasjonsskjevhet** er det beslektede fenomenet: mennesker stoler systematisk mer på et systems forslag enn på egen vurdering, også når systemet tar feil. Det er godt dokumentert i luftfart, medisin og nå i programvareutvikling.

## 6.4 Når systemet møter en verden det ikke ble testet i

**Tay (Microsoft, 2016).** Microsoft lanserte chatboten Tay på Twitter, trent til å lære av samtaler med brukere. Innen et døgn hadde koordinerte grupper lært den å produsere rasistisk og nazistisk innhold, og Microsoft slo den av. Systemet fungerte som spesifisert — det lærte av brukerne. Ingen hadde spesifisert hva som skjer når brukerne er fiendtlige og organiserte. Tay er den reneste illustrasjonen som finnes på at *testmiljøet ditt er ikke internett*.

**Uber ATG, Tempe, Arizona, mars 2018.** En selvkjørende testbil traff og drepte Elaine Herzberg, som trillet en sykkel over veien utenfor et fotgjengerfelt. Granskningen fra det amerikanske havarikommisjonen NTSB avdekket flere lag av svikt: klassifiseringssystemet vekslet mellom å tolke objektet som ukjent, kjøretøy og sykkel, og hver omklassifisering nullstilte sporingen av bevegelsesbanen; nødbremsefunksjonen var deaktivert under testkjøring for å unngå ubehagelig kjøring; systemet var ikke bygget for å forutse fotgjengere utenfor fotgjengerfelt; og sikkerhetssjåføren, som skulle være siste barriere, så på telefonen. Automasjonsparadokset i sin mest bokstavelige form.

**Cruise, San Francisco, oktober 2023.** En fotgjenger ble påkjørt av en bilist som stakk fra stedet, og kastet inn i banen til en førerløs Cruise-taxi. Bilen bremset, men traff henne. Deretter gjorde den det den var programmert til etter en kollisjon: den kjørte til siden for å stanse trygt — med kvinnen under bilen. Hun ble dratt rundt seks meter i lav hastighet.

Kollisjonen var i utgangspunktet ikke selskapets skyld. Det som fulgte var. Da Cruise viste opptak til California DMV dagen etter, ble den delen som viste stoppemanøveren og slepingen ikke vist. DMV suspenderte selskapets tillatelser 24. oktober 2023 og begrunnet det med at Cruise hadde gitt uriktig framstilling av kjøretøyenes sikkerhet. NHTSA ila senere et gebyr på 1,5 millioner dollar for mangelfull rapportering. Selskapets leder gikk av, virksomheten ble kraftig nedskalert, og GM avviklet til slutt robotaxisatsingen.

Cruise-casen brukes to ganger i dette emnet: her som et teknisk kontekstskifte (bilen hadde ingen representasjon av «det ligger et menneske under meg»), og i modul 8 som organisatorisk svikt. Det er den samme hendelsen, og de to lesningene er begge riktige.

**McDonald's og IBM, 2024.** Etter tre års utprøving avsluttet McDonald's samarbeidet om KI-basert bestilling i drive-thru. Videoer av systemet som la til 260 kyllingnuggets på en ordre spredte seg bredt. Casen er en påminnelse om at ikke alle feil er dramatiske — noen er bare dyre og pinlige nok til at prosjektet dør.

## 6.5 Praktisk: hva du gjør med skalarisiko

**Gradvis utrulling.** Ett prosent av trafikken, så fem, så femogtyve. Knight Capital rullet ut til åtte tjenere samtidig.

**Automatiske brytere.** Definer på forhånd hva som er unormalt — antall handlinger per minutt, beløp, feilrate — og la systemet stanse seg selv når terskelen brytes. En bryter som krever menneskelig vurdering er ikke en bryter.

**Stikkprøver på utfall, ikke bare på systemet.** Robodebt overvåket at systemet kjørte. Ingen tok et utvalg krav og spurte om de var riktige.

**Tell irreversible handlinger.** Hvor mange av agentens mulige handlinger kan ikke angres? Det tallet bør være lite og kjent.

**Sørg for at det finnes en klageveg som ikke går gjennom systemet.** Alle tre forvaltningssakene hadde det til felles at den som ble rammet, ikke nådde fram til et menneske med myndighet til å overstyre.

## 6.6 Refleksjonsspørsmål

1. Knight Capital brukte 45 minutter på å stanse. Hva ville det tatt hos deg, for det mest automatiserte systemet du kjenner?
2. Beskriv en godkjenningsdialog du selv klikker bort uten å lese. Hva ville skullet til for at du faktisk leste den?
3. Robodebt, Toeslagenaffaire og Horizon skjedde uten KI. Hva gjør KI verre — og hva gjør den eventuelt bedre?
4. Cruise-bilen gjorde det den var programmert til. Hvem burde forutsett situasjonen, og på hvilket stadium?
