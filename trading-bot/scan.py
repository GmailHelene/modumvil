#!/usr/bin/env python3
"""scan.py — skann en watchlist med aksjer og vis kjøps-/salgssignaler.

Henter EKTE aksjedata (Yahoo Finance — gratis, ingen API-nøkkel) og kjører
strategien på hver aksje i watchlist.txt. Viser 🟢 KJØP / 🔴 SALG / ⚪ VENT,
pluss en lenke så du kommer rett til aksjen for å handle selv.

Bruk:
    python scan.py

⚠️  ÆRLIG ADVARSEL — LES DETTE:
Dette er IKKE aksjeråd. Boten finner ikke gode aksjer for deg. Den sier bare
hvilke av DINE valgte aksjer strategien tilfeldigvis signaliserer akkurat nå,
etter mekaniske regler. Et signal er ikke en anbefaling om at noe er lurt å
kjøpe. Gjør alltid din egen vurdering — og handle aldri for mer enn du tåler
å tape.
"""

from __future__ import annotations

import urllib.parse

from bot.strategy import build_strategy

# --- Innstillinger (endre fritt) ------------------------------------------
WATCHLIST_FILE = "watchlist.txt"
STRATEGY_NAME = "trend_filter"
STRATEGY_PARAMS = {"fast": 20, "slow": 50, "trend": 100}

# Lenke-mal: {q} byttes ut med aksjens navn. Standard = søk (øverste treff er
# som regel Nordnet-siden). Vil du ha et annet mønster, bytt bare denne linja.
LINK_TEMPLATE = "https://www.google.com/search?q={q}"


def load_watchlist(path: str) -> list[str]:
    tickers = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    tickers.append(line.split()[0])   # ta kun ticker, ikke kommentar
    except FileNotFoundError:
        print(f"Fant ikke {path}. Lag en fil med én ticker per linje.")
    return tickers


def fetch_ohlcv(ticker: str):
    """Hent ~2 år med dagsdata for én aksje via Yahoo Finance.

    Returnerer None ved feil (f.eks. ukjent ticker eller nettverksproblem),
    slik at én aksje som feiler ikke stopper hele skanningen.
    """
    try:
        import yfinance as yf

        df = yf.Ticker(ticker).history(period="2y", interval="1d")
        if df is None or df.empty:
            return None
        df = df.rename(columns=str.lower)             # 'Close' -> 'close' osv.
        return df[["open", "high", "low", "close", "volume"]].reset_index(drop=True)
    except Exception:
        return None


def trade_link(ticker: str) -> str:
    navn = ticker.replace(".OL", "")                  # rydd bort børs-endelsen
    return LINK_TEMPLATE.format(q=urllib.parse.quote(f"{navn} aksje nordnet"))


def main() -> None:
    tickers = load_watchlist(WATCHLIST_FILE)
    if not tickers:
        return

    strat = build_strategy(STRATEGY_NAME, STRATEGY_PARAMS)
    print(f"Skanner {len(tickers)} aksjer med strategi '{STRATEGY_NAME}' ...\n")
    print(f"{'Aksje':<10}{'Signal':<12}{'Pris':>12}   Handle her")
    print("-" * 70)

    buys = []
    for ticker in tickers:
        df = fetch_ohlcv(ticker)
        if df is None:
            print(f"{ticker:<10}{'(ingen data)':<12}")
            continue
        sig = strat.signal(df)
        price = df["close"].iloc[-1]
        label = {1: "🟢 KJØP", -1: "🔴 SALG"}.get(sig, "⚪ VENT")
        link = trade_link(ticker) if sig != 0 else ""
        print(f"{ticker:<10}{label:<12}{price:>12,.2f}   {link}")
        if sig == 1:
            buys.append(ticker)

    print("-" * 70)
    if buys:
        print(f"Strategien signaliserer KJØP på: {', '.join(buys)}")
    else:
        print("Ingen kjøpssignaler akkurat nå. Det er helt greit — vent på et bedre tidspunkt.")
    print("\n⚠️  Husk: dette er mekaniske signaler, ikke aksjeråd. Vurder alltid selv.")


if __name__ == "__main__":
    main()
