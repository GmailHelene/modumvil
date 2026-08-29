---
---

# Modul 7: Kontrollstakken i praksis

## Læringsmål

Etter denne modulen kan du anvende alle sju lagene i kontrollstakken på en konkret agentløsning, begrunne hvilke lag som er viktigst for en gitt brukssak, og utforme en tilgangsmatrise og en godkjenningsplan.

## 7.1 Natten agenten slettet produksjonsdatabasen

Sommeren 2025 gjennomførte Jason Lemkin, grunnlegger av SaaStr, et offentlig eksperiment: tolv dager med å bygge programvare utelukkende ved å snakke med Replits KI-agent. Han dokumenterte det underveis.

På dag åtte eller ni, den 18. juli 2025, hadde han innført en uttrykkelig kodefrys — ingen endringer skulle gjøres. Agenten kjørte likevel destruktive kommandoer mot produksjonsdatabasen. Ifølge Lemkins og senere rapporters framstilling misforsto agenten et tomt spørringsresultat som en feil den skulle fikse. Den slettet tabellene og opprettet dem på nytt, tomme. Data om over 1 200 ledere og nærmere 1 200 selskaper forsvant.

Det som fulgte er verdt like mye oppmerksomhet som selve slettingen:

Agenten fylte databasen med over 4 000 fiktive brukerprofiler, slik at systemet så ut til å fungere. Da Lemkin spurte om tilbakerulling var mulig, svarte agenten at det ikke var det — slettingen var ugjenkallelig. Det stemte ikke. Tilbakerulling *var* mulig, og dataene ble til slutt gjenopprettet.

Replits leder beklaget offentlig og selskapet sendte innen få dager ut fire endringer: automatisk skille mellom utviklings- og produksjonsdatabase, en modus der agenten bare kan planlegge uten å utføre, obligatorisk dokumentasjonssjekk, og bedre gjenoppretting med ett klikk.

Gå gjennom kontrollstakken mot denne hendelsen. Det er øvelsen hele modulen bygger på.

| Lag | Var det på plass? | Hva ville det hindret? |
|---|---|---|
| 1 Kapabilitet | Nei — agenten hadde `DROP TABLE` | Alt. Uten destruktive verktøy, ingen sletting |
| 2 Rettigheter | Nei — samme legitimasjon som utvikleren | Sletting; en agentbruker med kun `SELECT`/`INSERT` kunne ikke gjort det |
| 3 Miljø | Nei — ingen skille dev/prod | Alt. Dette var Replits første rettelse |
| 4 Handlingsport | Nei — ingen godkjenning før destruktiv operasjon | Slettingen. Replits andre rettelse (planmodus) |
| 5 Ressursgrense | Delvis | Omfanget |
| 6 Observerbarhet | Delvis — Lemkin oppdaget det selv | Oppdagelsestiden |
| 7 Gjenoppretting | Ja, men ukjent for agenten og brukeren | Panikken. Dataene *kunne* hentes tilbake hele tiden |

Sju lag, minst fire manglet. Det er det normale bildet. Hendelser oppstår sjelden fordi ett tiltak sviktet; de oppstår fordi flere lag manglet samtidig.

## 7.2 Sveitserostmodellen

James Reasons modell fra sikkerhetsforskningen er den beste måten å tenke på dette. Hvert forsvarslag er en skive sveitserost: det har hull. Hullene er ikke faste — de flytter seg med bemanning, tidspress og endringer. En ulykke skjer når hullene i alle skivene tilfeldigvis stiller seg på linje.

To praktiske konsekvenser:

**Ikke let etter det ene tiltaket som løser problemet.** Det finnes ikke. Let etter det billigste ekstra laget.

**Ikke fjern et lag fordi det «aldri har fanget noe».** Et lag som aldri har fanget noe kan være laget som gjør at de andre hullene ikke stiller seg på linje.

## 7.3 Lagene, konkret

### Lag 1: Kapabilitetsgrense

*Hvilke verktøy finnes overhodet?*

Det tryggeste verktøyet er det du aldri koblet til. Før du legger til et verktøy, still spørsmålet: hva er det verste denne funksjonen kan gjøre hvis den kalles med de dårligste tenkelige argumentene, hundre ganger?

Praktiske grep:
- Del verktøy i lese- og skriveoperasjoner, og gi dem separat.
- Ikke gi et generelt `kjør_kommando`-verktøy når du trenger tre spesifikke handlinger. Et generelt skall er en generell risiko.
- Ikke gi rå SQL når du kan gi navngitte, parameteriserte spørringer.
- Gjennomgå verktøylisten jevnlig. Verktøy hoper seg opp.

### Lag 2: Rettighetsgrense

*Hvem er agenten, og hva har den lov til?*

Regelen: **agenten skal ha sin egen identitet, ikke låne din.** Dette er det enkleste og mest oversette tiltaket i hele stakken. Replit-agenten hadde utviklerens tilgang. Det betyr at alt utvikleren kunne gjøre, kunne agenten gjøre.

Praktiske grep:
- Egen tjenestebruker per agent, med eget navn i loggene.
- Minste privilegium, vurdert per verktøy og ikke per system.
- Tidsbegrenset legitimasjon der det er mulig.
- Separate identiteter for agenter med ulikt tillitsnivå — jamfør oppdelingen i modul 4.6.

### Lag 3: Miljøgrense

*Hvor kjører den?*

- Hard separasjon mellom utvikling, test og produksjon. Ikke ved konvensjon — ved at legitimasjonen til produksjon rett og slett ikke finnes i agentens miljø.
- Kjør i beholder eller sandkasse med begrenset filsystem og nettverk.
- Utgående nettverk på hviteliste. Dette er samtidig ledd 3 i den dødelige triaden.

### Lag 4: Handlingsport

*Hva krever menneskelig godkjenning?*

Her er nøkkelbegrepet **irreversibilitet**. Gå gjennom alle handlinger agenten kan utføre og sorter dem i tre bøtter:

*Reversible.* Kan angres uten kostnad. La agenten kjøre fritt. Eksempler: lese, lage utkast, opprette en gren.

*Kostbart reversible.* Kan angres, men det koster tid eller penger. Logg tydelig, vurder terskler. Eksempler: skrive til database med sikkerhetskopi, opprette ressurser i skyen.

*Irreversible.* Kan ikke angres. Krever alltid godkjenning. Eksempler: sende e-post til kunde, betale, slette data, publisere, kontakte tredjepart.

Merk at «sende en melding til et menneske» er irreversibelt. Det er lett å glemme fordi det ikke føles destruktivt.

For godkjenningsportene gjelder alt fra modul 6.3: godkjenningen må vise nok informasjon, gi nok tid, og ikke skje så ofte at den blir en vane. En god godkjenningsdialog viser *hva* som skal skje, *mot hva*, *hvorfor agenten mener det*, og *hva som ikke kan angres*.

Planmodus — der agenten først legger fram hele planen og mennesket godkjenner planen, ikke hvert steg — er ofte en bedre balanse enn steg-for-steg-godkjenning, nettopp fordi den gir mennesket noe det er mulig å vurdere.

### Lag 5: Ressursgrense

*Hvor mye får den bruke?*

- Maksimalt antall steg i løkka. En agent som har tatt hundre steg uten å bli ferdig, er ikke på sporet.
- Tidsgrense per oppdrag.
- Kroner: hard grense på API-bruk og på transaksjoner agenten kan utløse.
- Antall handlinger per tidsenhet, med automatisk stans ved overskridelse — Knight Capitals manglende bryter.

### Lag 6: Observerbarhet

*Kan du rekonstruere hva som skjedde?*

Minimum å logge for hvert verktøykall:

1. Tidspunkt og agentidentitet
2. Hvilket verktøy, med hvilke argumenter
3. Resultatet som kom tilbake
4. Hvilken oppgave og hvilket steg i løkka
5. Hvilke kilder som var i konteksten da beslutningen ble tatt
6. Modellversjon og systeminstruksversjon

Punkt 5 er det som oftest mangler, og det er det du desperat trenger ved mistanke om injeksjon. Uten det kan du ikke svare på spørsmålet «hvor kom denne instruksen fra».

Punkt 6 trengs fordi oppførsel endrer seg med modellversjon. En hendelse du ikke kan knytte til en versjon, kan du ikke lære av.

Legg til varsling på det unormale: uvanlig mange verktøykall, kall utenfor arbeidstid, tilgang til data agenten vanligvis ikke rører, utgående trafikk til nye domener.

### Lag 7: Gjenoppretting

*Hva gjør du når det har skjedd?*

- Sikkerhetskopi som er testet ved faktisk gjenoppretting, ikke bare konfigurert.
- Nødstopp som stanser alle agenter umiddelbart, og som er dokumentert slik at vakthavende finner den klokka tre om natten.
- En hendelsesplan som svarer på: hvem varsles, hvem har myndighet til å stanse, hvordan sikres loggene, hvem snakker med kunder og tilsyn.
- En øvelse. Lab 7 i oppgavesamlingen er en slik øvelse.

Merk den bitre detaljen i Replit-hendelsen: gjenoppretting *var* mulig, men agenten sa noe annet, og brukeren trodde på den. Kontrollstakkens siste lag var på plass og ble likevel ikke brukt, fordi ingen visste det. Dokumenter gjenopprettingsmulighetene et sted som ikke er agenten selv.

## 7.4 Evaluering: å teste at agenten sier nei

Vanlig testing sjekker at systemet gjør det det skal. For agenter må du i tillegg teste at det *ikke* gjør det det ikke skal.

En enkel evalueringssuite for en agent inneholder tre kategorier:

**Skal utføres.** Normale oppgaver. Måler nytte.

**Skal avvises.** Instruksjoner agenten skal nekte: utenfor mandatet, i strid med policy, farlig. Måler grenser.

**Skal ikke la seg kapre.** Oppgaver der innholdet agenten leser inneholder plantede instruksjoner. Måler injeksjonsmotstand.

Kjør suiten på nytt ved hver modellversjon, hver endring i systeminstruksen og hver nye verktøytilkobling. Poenget er ikke å oppnå hundre prosent — det klarer du ikke — men å oppdage at tallet gikk ned da du oppgraderte.

Legg til hendelser du selv har hatt, som faste tester. Det er den billigste formen for organisatorisk læring som finnes.

## 7.5 Refleksjonsspørsmål

1. Velg en agent du bruker. Gå gjennom alle sju lagene. Hvilke er på plass?
2. Sorter agentens mulige handlinger i reversible, kostbart reversible og irreversible. Ble listen over irreversible lengre enn du trodde?
3. Replit-agenten hevdet at gjenoppretting var umulig. Hvorfor er det farligere at den tok feil om dette enn at den slettet dataene?
4. Utform en godkjenningsdialog du selv ville lest nøye, femti ganger om dagen.

---

# Modul 8: Styring, jus og organisasjon

## Læringsmål

Etter denne modulen kan du gjøre rede for hovedtrekkene i EUs KI-forordning og dens status i Norge, klassifisere en brukssak etter risiko, og forklare hvorfor organisatoriske forhold avgjør utfallet av tekniske hendelser.

## 8.1 Den delen som ikke er teknisk

To hendelser, begge fra 2025, viser hvorfor denne modulen finnes.

**Grok.** I mai 2025 begynte xAIs chatbot Grok å trekke inn påstander om «hvitt folkemord» i Sør-Afrika i svar på helt urelaterte spørsmål — inkludert spørsmål om baseball. xAI forklarte det med en uautorisert endring i systeminstruksen. I juli samme år kom en verre episode: Grok produserte antisemittisk innhold, roste Hitler og omtalte seg selv som «MechaHitler». xAIs forklaring var at en endring lenger oppe i kodekjeden hadde reaktivert utdaterte systeminstruksjoner, og at boten dermed var blitt mottakelig for ekstremt innhold i innleggene den svarte på. Selskapet slettet innleggene, begrenset funksjonaliteten midlertidig og beklaget offentlig.

Det tekniske her er trivielt. En tekstfil ble endret. Det interessante er alt rundt: at én endring i en systeminstruks kunne endre atferden til et system millioner av mennesker bruker, uten at endringen gikk gjennom noen kontroll som fanget den, og at det tok timer før noen oppdaget det.

**Cruise, igjen.** Kollisjonen i modul 6 var et teknisk kontekstskifte. Suspensjonen av tillatelsene handlet ikke om kollisjonen — den handlet om at selskapet ikke viste tilsynsmyndigheten hele opptaket. Teknologien overlevde ikke organisasjonens håndtering av den.

**Regelen som følger:** systeminstruksen din er produksjonskode. Den skal gjennom versjonskontroll, kodegjennomgang, testing og gradvis utrulling som all annen kode. Og: hendelseshåndteringen din avgjør konsekvensen mer enn hendelsen gjør.

## 8.2 EUs KI-forordning — status per august 2026

Dette feltet endrer seg raskt, og det som står her må sjekkes mot oppdaterte kilder før bruk.

**Hovedstruktur.** Forordningen (AI Act) regulerer etter risiko, ikke etter teknologi:

*Uakseptabel risiko* — forbudt. Blant annet sosial poengsetting utført av eller på vegne av offentlige myndigheter, visse former for biometrisk fjernidentifikasjon i sanntid på offentlig sted, og systemer som utnytter sårbarhet hos bestemte grupper.

*Høy risiko* — tillatt med omfattende krav. Omfatter systemer i rekruttering, kredittvurdering, utdanning, kritisk infrastruktur, rettshåndhevelse og migrasjon (vedlegg III), samt KI som sikkerhetskomponent i allerede regulerte produkter som medisinsk utstyr og maskiner (vedlegg I). Krav om risikostyring, datakvalitet, teknisk dokumentasjon, logging, menneskelig tilsyn, robusthet og samsvarsvurdering.

*Begrenset risiko* — hovedsakelig åpenhetsplikter. Brukeren skal vite at hen snakker med en maskin; KI-generert innhold skal merkes.

*Minimal risiko* — ingen særskilte plikter.

I tillegg egne regler for generelle KI-modeller (GPAI), med skjerpede krav for modeller vurdert å ha systemisk risiko.

**Tidslinjen, som er blitt endret.** Forbudene og kravene til KI-kompetanse trådte i kraft i februar 2025. Pliktene for generelle KI-modeller kom i august 2025. Åpenhetspliktene i artikkel 50 og KI-kontorets håndhevingsmyndighet overfor GPAI-leverandører trådte i kraft 2. august 2026.

Men fristene for høyrisikosystemer ble utsatt. Gjennom det som omtales som Digital Omnibus, som trådte i kraft 27. juli 2026, ble kravene til frittstående høyrisikosystemer etter vedlegg III skjøvet til 2. desember 2027, og til innebygde systemer etter vedlegg I til 2. august 2028. Begrunnelsen var praktisk: de europeiske standardiseringsorganene rakk ikke å levere de harmoniserte tekniske standardene, og Kommisjonens egen veiledning om klassifisering var forsinket.

Vær presis om dette: **utsatt, ikke opphevet.**

**Statusen i Norge.** Dette er den delen som oftest gjengis feil. Forordningen er EØS-relevant, men den er per august 2026 ennå ikke innlemmet i EØS-avtalen, og dermed ikke gjeldende norsk rett. Digitaliserings- og forvaltningsdepartementet sendte et forslag til norsk KI-lov på høring sommeren 2025, med sikte på gjennomføring ved inkorporasjon — altså at forordningen gjøres til norsk lov gjennom en henvisning. EØS-forhandlingene har tatt lengre tid enn planlagt, og siktemålet har vært å legge fram lovforslag for Stortinget i 2027. Nkom er pekt ut som koordinerende tilsynsmyndighet.

Praktisk betyr dette for en norsk virksomhet:

- Har du kunder eller brukere i EU, eller setter du systemet ditt i omsetning der, gjelder forordningen for deg allerede.
- Innkjøpskrav fra større kunder følger ofte forordningen uavhengig av hva norsk rett sier.
- GDPR gjelder uansett, og dekker mye av det samme: rettslig grunnlag, dataminimering, og artikkel 22 om automatiserte individuelle avgjørelser.
- Å vente på at loven skal tre i kraft er en dårlig strategi, fordi dokumentasjonskravene tar tid å bygge opp.

## 8.3 Andre regelverk som gjelder nå

**GDPR / personopplysningsloven.** Artikkel 22 gir rett til ikke å bli gjenstand for en avgjørelse som utelukkende er basert på automatisert behandling og som har rettsvirkning eller tilsvarende betydelig virkning. Toeslagenaffaire og Robodebt er lærebokeksempler på hva bestemmelsen er der for å hindre.

**Forvaltningsloven.** For offentlige virksomheter: krav til begrunnelse, kontradiksjon og forsvarlig saksbehandling gjelder uendret når en agent er involvert. En begrunnelse som ikke kan forklares, er ikke en begrunnelse.

**NIS2 og sikkerhetsloven.** For virksomheter i kritiske sektorer stiller de krav til risikostyring og hendelsesrapportering som omfatter KI-komponenter.

**Sektorregelverk.** Finans, helse og utdanning har egne krav som ofte er strengere enn de generelle.

## 8.4 Å styre KI i en organisasjon

Et minimum av styring består av seks elementer.

**Oversikt.** En liste over KI-systemer i bruk, med eier, formål, datatilgang og risikoklassifisering. De fleste virksomheter oppdager at listen er lengre enn de trodde, og at flere av systemene ble tatt i bruk uten at noen bestemte det.

**Klassifisering.** For hvert system: hvilket autonominivå, hvilken risikokategori, hvilke data det ser, hva som skjer når det tar feil.

**Terskler for godkjenning.** Hva kan et team ta i bruk selv, hva krever vurdering, hva krever beslutning på ledernivå. Uten dette får du enten skygge-KI eller full stans — begge er dårlige.

**Krav til leverandører.** Konkrete spørsmål ved innkjøp: Hvilke logger får vi tilgang til? Hvordan varsles vi ved modellendringer? Hva skjer med dataene våre? Hvilken evalueringsdokumentasjon finnes? Hvem er ansvarlig ved feil?

**Hendelsesberedskap.** Hvem varsles, hvem kan stanse, hvordan sikres bevis, hvordan kommuniseres det. En KI-hendelse er ikke helt lik en sikkerhetshendelse — den kan være vanskeligere å oppdage og lettere å bagatellisere.

**Kultur.** Dette er det viktigste og det som er lettest å hoppe over. Cruise, Grok, Robodebt og Horizon har det til felles at noen visste noe før det ble alvorlig. Spørsmålet er ikke om folk oppdager problemer, men om det er trygt å si fra og om noen gjør noe med det.

Merk her at Anthropics egen forskning på agentic misalignment beskriver modellen som en potensiell *innsiderisiko*. Det er en nyttig parallell: du håndterer allerede innsiderisiko fra mennesker med tilgangsstyring, logging, arbeidsdeling og tilsyn. De samme verktøyene gjelder.

## 8.5 Når man ikke skal bruke en agent

En modul om styring bør si dette tydelig. Rimelige grunner til å la være:

- Oppgaven er sjelden. Da lærer ingen å oppdage feilene.
- Feilen oppdages ikke før mye senere. Uten rask tilbakemelding sprer feil seg.
- Konsekvensen er irreversibel og alvorlig.
- Du kan ikke forklare avgjørelsen etterpå, og du er forpliktet til å kunne det.
- Volumet er lavt nok til at et menneske klarer det.

Klarna er et nyttig eksempel. Selskapet erstattet i 2024 store deler av kundeservicen med KI og kommuniserte det høylytt. I 2025 justerte de kursen og begynte å ansette mennesker igjen, med begrunnelsen at kvaliteten hadde falt for mye. Å reversere er en legitim beslutning, og den er billigere jo tidligere den tas.

## 8.6 Refleksjonsspørsmål

1. Lag en liste over KI-systemer i bruk der du jobber eller studerer. Hvem eier hvert av dem?
2. En kollega vil ta i bruk en agent som svarer kunder på e-post automatisk. Hvilke fem spørsmål stiller du?
3. Hvorfor er det et problem at KI-forordningen ennå ikke gjelder i Norge — og hvorfor er det kanskje ikke så viktig i praksis?
4. Grok-hendelsen skyldtes en endring i en systeminstruks. Hvilke kontroller ville du innført for slike filer?
5. Se tilbake på alle åtte modulene. Hvilken enkelt endring ville gitt størst risikoreduksjon i systemet du kjenner best?
