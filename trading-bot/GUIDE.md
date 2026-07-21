# 📘 Praktisk guide: hvordan bruke boten, hvor ofte, og når du kan gå live

Denne guiden svarer på det viktigste: **hva gjør jeg, hvor ofte, og når er jeg
klar for ekte penger?** Les den rolig — den er verdt mer enn selve koden.

---

## 1. Den beste strategien (og hvorfor "beste" er en felle)

Det finnes ingen strategi som alltid vinner. Hvis det gjorde det, ville alle
brukt den til den sluttet å virke. Men det finnes strategier som er **robuste**:
enkle, gjennomsiktige, og med innebygd beskyttelse mot store tap.

Boten bruker nå som standard **`trend_filter`** + **risikostyring**:

- **Trend-filter:** kjøper kun når markedet er i opptrend (pris over 200-snittet)
  og har momentum opp. Dette dropper de fleste dårlige handlene i sidelengs marked.
- **Stop-loss (5 %):** kutter tapet automatisk hvis en handel går feil vei.
- **Take-profit (10 %):** sikrer gevinst.
- **Trailing stop (valgfritt):** lar gevinsten løpe, men beskytter den.

> **Gullregelen:** god risikostyring slår en smart strategi. Du trenger ikke å ha
> rett ofte — du trenger å tape lite når du tar feil, og litt mer når du har rett.

Vil du finne dine egne tall? Kjør backtest med ulike verdier og sammenlign:

```bash
python main.py backtest --demo      # test mot innebygde data
python main.py backtest             # test mot ekte historiske data
```

Se på **avkastning**, **max drawdown** (største fall) og **andel gevinst**.
En strategi med lavere avkastning men mye lavere drawdown er ofte den beste å
faktisk leve med — for du klarer å holde deg til den uten å få panikk.

---

## 2. Varsler: så du slipper å stirre på skjermen

Sett opp Telegram (2 minutter) så får du en melding på mobilen hver gang boten
handler. Da trenger du **ikke** å følge med kontinuerlig.

1. Åpne Telegram → søk opp **@BotFather** → send `/newbot` → følg stegene → du får en **token**
2. Send en melding til din nye bot
3. Åpne `https://api.telegram.org/bot<DIN_TOKEN>/getUpdates` i nettleseren → finn `"chat":{"id": ...}`
4. Lim token + chat_id inn i `config.yaml` under `notifications.telegram`, og sett `enabled: true`

Nå får du 🟢 KJØPTE / 🔴 SOLGTE rett på mobilen.

---

## 3. Hvor ofte må jeg sjekke? (kort svar: ikke ofte)

Boten gjør jobben. Hvor ofte den *ser* på markedet styres av `timeframe` i config:

| timeframe | Boten sjekker | Egner seg for | Din innsats |
|-----------|---------------|---------------|-------------|
| `1h`      | hver time     | **anbefalt start** | sjekk 1× om dagen |
| `4h`      | hver 4. time  | rolig, langsiktig | sjekk noen få dager i uka |
| `1d`      | daglig        | veldig rolig | sjekk 1–2× i uka |
| `5m`/`15m`| ofte          | aktiv trading | krever mye mer oppmerksomhet |

**Anbefaling:** start på `1h` eller `4h`. Kortere tidsrammer = mer støy, flere
avgifter, mer stress — og sjelden bedre resultat for nybegynnere.

### Din faktiske rutine
- **Daglig (2 min):** kikk på Telegram-varslene. Handlet boten som forventet?
- **Ukentlig (15 min):** se på totalverdien. Ligger den omtrent slik backtesten antydet?
- **Månedlig (30 min):** kjør en ny backtest på ferske data. Fungerer strategien fortsatt i dagens marked?

Du skal **ikke** sitte og følge med minutt for minutt. Gjør du det, kommer du
til å overstyre boten på følelser — som er akkurat det den skal beskytte deg mot.

---

## 4. Når vet jeg at jeg kan gå over til ekte penger?

Ikke gjett. Bruk denne sjekklisten. **Alle punktene bør være oppfylt:**

- [ ] Du har kjørt **backtest** og forstår tallene (avkastning, drawdown, gevinstandel).
- [ ] Du har kjørt **paper trading i minst 4–8 uker** uten å endre strategien hele tiden.
- [ ] Paper-resultatet er omtrent som backtesten antydet (ikke vilt dårligere).
- [ ] Du har sett boten håndtere minst én **nedtur** i markedet — og stop-loss gjorde jobben.
- [ ] Du forstår **hvorfor** boten kjøper og selger (ikke bare at den gjør det).
- [ ] Du har bestemt et beløp du **tåler å tape helt** uten at det påvirker livet ditt.

Hvis noe av dette ikke er på plass: fortsett med paper trading. Det koster ingenting.

---

## 5. Hvordan gå over til ekte handel (trygt)

Når sjekklisten er grønn:

1. **Lag API-nøkler hos børsen.** Gi dem KUN rett til å *handle* — **aldri**
   rett til å ta ut penger (withdrawal). Det er din viktigste beskyttelse.
2. Lim nøklene inn i `config.yaml` under `live`.
3. Sett `live.enabled: true`.
4. Sett `live.max_order_value` **lavt** til å begynne med — f.eks. `20`.
   Dette er et hardt tak på hvor stort tap én ordre kan gi.
5. Start med et lite totalbeløp du er 100 % komfortabel med å tape.
6. Kjør:

```bash
python main.py live --i-understand-the-risk
```

De tre låsene (`enabled: true`, nøkler, og flagget) er der med vilje: det skal
være vanskelig å begynne med ekte penger ved et uhell.

**Trapp opp langsomt.** Kjør lite i noen uker. Går det som forventet, kan du øke
`max_order_value` gradvis. Aldri hopp rett til store beløp fordi noen uker gikk bra.

---

## 6. Ærlige forventninger (les denne når du blir utålmodig)

- **De fleste taper penger på trading.** Det er ikke pessimisme, det er statistikk.
- **En "god" strategi tjener kanskje noen få prosent i året** — ikke dobler pengene.
  Alt som lover mye mer er enten flaks, høy risiko, eller svindel.
- **Avgifter spiser gevinst.** Jo oftere boten handler, jo mer betaler du.
- **Backtest lyver litt.** Fortiden gjentar seg ikke perfekt. Live blir alltid litt verre.
- **Din største fiende er deg selv.** Ikke skru av stop-loss fordi "den snur snart".
  Ikke doble innsatsen for å "ta igjen" et tap. Boten finnes for å fjerne disse feilene.

Bruk dette som et verktøy for å lære hvordan markeder og automatisering fungerer.
Behandle eventuell gevinst som en bonus, ikke som en plan for å bli rik.

---

## Kjappe kommandoer

```bash
python main.py backtest --demo     # test offline, ingen nøkler
python main.py backtest            # test på ekte historiske data
python main.py paper               # paper trading (liksom-penger)
python main.py paper --rounds 3    # kjør bare 3 runder og stopp
python main.py live --i-understand-the-risk   # ekte handel (etter sjekklisten!)
python test_bot.py                 # kjør testene
```
