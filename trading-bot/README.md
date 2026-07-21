# 🤖 Krypto-trading-bot (Python)

En liten, ærlig trading-bot bygget for **læring og trygg testing** — ikke en
pengemaskin. Den utfører en strategi *du* bestemmer, tester den på historiske
data, og kan handle med liksom-penger (paper trading) før du eventuelt kobler
til ekte penger.

> **Ærlig advarsel:** De aller fleste trading-strategier taper penger etter
> avgifter. Ingen bot garanterer gevinst. Målet her er å *forstå* hvordan det
> virker og teste ideer trygt — ikke å bli rik uten innsats. Handle aldri for
> mer enn du har råd til å tape.

> 👉 **Les [GUIDE.md](GUIDE.md)** for praktiske svar: beste strategi, hvor ofte
> du bør sjekke, og hvordan/når du trygt går over til ekte penger.

## Hva boten kan

- 📈 **5 strategier** — trend-filter, SMA-crossover, RSI, MACD og Bollinger — bytt fritt
- ⚖️ **Sammenlign strategier** side om side i en tabell (`compare`)
- 🛡️ **Risikostyring:** stop-loss, take-profit og trailing stop automatisk per handel
- 🔔 **Varsler på Telegram OG e-post** når boten kjøper/selger — slipp å stirre på skjermen
- 📊 **Equity-graf** (SVG) av kapitalutviklingen mot kjøp-og-hold
- 🧪 **Backtesting** med avkastning, max drawdown, gevinstandel og kjøp-og-hold-sammenligning
- 💵 **Paper trading** (liksom-penger) → **ekte handel** bak flere sikkerhetslåser

## Rekkefølgen (viktig!)

```
1. BACKTEST   ->  virker strategien på historiske data?
2. PAPER      ->  virker den live, men med liksom-penger?
3. LIVE       ->  først da, med små beløp og strenge grenser
```

Ikke hopp over steg. De som taper mest, starter på steg 3.

## Kom i gang

```bash
cd trading-bot
python -m pip install -r requirements.txt      # installer avhengigheter
cp config.example.yaml config.yaml             # lag din egen config
```

### 1. Backtest (fungerer offline med --demo)

```bash
python main.py backtest --demo     # bruker innebygde testdata, trenger ikke nett
python main.py backtest            # bruker ekte data fra børsen (krever internett)
```

Du får avkastning, største fall (max drawdown), antall handler — og en
sammenligning mot enkel «kjøp-og-hold». Slår ikke strategien det, bør du tenke deg om.

Lag en graf av kapitalutviklingen (åpnes i nettleser):

```bash
python main.py backtest --demo --plot        # lagrer equity_curve.svg
```

Sammenlign alle strategiene i én tabell:

```bash
python main.py compare --demo
```

### 2. Paper trading (liksom-penger)

```bash
python main.py paper --interval 60     # sjekker markedet hvert 60. sekund
python main.py paper --rounds 5        # kjør bare 5 runder og stopp
```

### 3. Ekte handel (kun når du er klar)

Krever tre bevisste valg — det er med vilje vanskelig:
1. Fyll inn `api_key` / `api_secret` i `config.yaml`
2. Sett `live.enabled: true`
3. Kjør med det eksplisitte flagget:

```bash
python main.py live --i-understand-the-risk
```

`live.max_order_value` i config setter et hardt tak på hvor stor hver ordre kan bli.
**Start med et lite tall (f.eks. 10–50).**

## Bytt eller lag din egen strategi

Strategiene ligger i `bot/strategy.py`. Innebygd:
- `trend_filter` — trend-følgende med filter (**standard, anbefalt**)
- `sma_crossover` — glidende snitt-kryssing
- `rsi_reversion` — RSI mean-reversion
- `macd` — MACD momentum-kryssing
- `bollinger` — Bollinger-bånd mean-reversion

Kjør `python main.py compare --demo` for å se hvordan de gjør det mot hverandre.

Lag din egen: arv fra `Strategy`, implementer `signal()` (returner +1 kjøp,
0 hold, -1 selg), og legg den i `STRATEGIES`. Endre `strategy.name` i config.

## Prosjektstruktur

```
trading-bot/
├── main.py               # kommandolinje (backtest / paper / live)
├── config.example.yaml   # mal — kopier til config.yaml
├── requirements.txt
├── test_bot.py           # tester som kjører uten nett
├── GUIDE.md              # praktisk guide: rutine, når du kan gå live
└── bot/
    ├── data.py           # henter prisdata (ekte + syntetiske testdata)
    ├── strategy.py       # 5 strategier for kjøp/salg
    ├── risk.py           # stop-loss / take-profit / trailing stop
    ├── notify.py         # varsler (Telegram + e-post + konsoll)
    ├── plot.py           # equity-graf som SVG
    ├── backtest.py       # test på historiske data
    ├── broker.py         # PaperBroker (liksom) + LiveBroker (ekte)
    ├── runner.py         # live-løkka
    └── config.py         # leser config.yaml
```

## Tester

```bash
python test_bot.py
```

## Sikkerhet

- `config.yaml` (med nøklene dine) er i `.gitignore` — havner aldri på GitHub.
- Gi API-nøklene på børsen **kun** rettighet til å handle, **aldri** til å ta ut penger.
- Test alltid med paper trading først.
