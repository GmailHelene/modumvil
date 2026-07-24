#!/usr/bin/env python3
"""scan.py — skann en watchlist med SAMSTEMTE signaler (consensus).

I stedet for å stole på én strategi, spør vi ALLE fem og teller stemmene.
Boten sier KJØP kun når nok strategier er enige — det gir færre, men mer
overbeviste signaler (høyere «treffsikkerhet»).

Henter ekte aksjedata (Yahoo Finance — gratis, ingen API-nøkkel).

Bruk:
    python scan.py

⚠️  ÆRLIG ADVARSEL — LES DETTE:
Dette er IKKE aksjeråd. At flere strategier er enige gjør et signal mer
robust, men det er fortsatt bare mekaniske regler på historiske data — ingen
garanti for fremtiden. Gjør alltid din egen vurdering, og handle aldri for
mer enn du tåler å tape.
"""

from __future__ import annotations

import urllib.parse

from bot.strategy import build_strategy

# --- Innstillinger (endre fritt) ------------------------------------------
WATCHLIST_FILE = "watchlist.txt"

# Alle strategiene som får stemme, med parametre tilpasset dagsdata.
VOTERS = {
    "trend_filter": {"fast": 20, "slow": 50, "trend": 100},
    "sma_crossover": {"fast": 20, "slow": 50},
    "rsi_reversion": {"period": 14, "low": 30, "high": 70},
    "macd": {"fast": 12, "slow": 26, "signal": 9},
    "bollinger": {"period": 20, "num_std": 2.0},
}
BUY_THRESHOLD = 3      # minst så mange strategier må si KJØP
SELL_THRESHOLD = 3     # minst så mange må si SALG

# Lenke-mal: {q} byttes ut med aksjens navn. Bytt gjerne til et eget mønster.
LINK_TEMPLATE = "https://www.google.com/search?q={q}"


def load_watchlist(path: str) -> list[str]:
    tickers = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    tickers.append(line.split()[0])
    except FileNotFoundError:
        print(f"Fant ikke {path}. Lag en fil med én ticker per linje.")
    return tickers


def fetch_ohlcv(ticker: str):
    """Hent ~2 år med dagsdata for én aksje. None ved feil (én aksje stopper ikke resten)."""
    try:
        import yfinance as yf

        df = yf.Ticker(ticker).history(period="2y", interval="1d")
        if df is None or df.empty:
            return None
        df = df.rename(columns=str.lower)
        return df[["open", "high", "low", "close", "volume"]].reset_index(drop=True)
    except Exception:
        return None


def trade_link(ticker: str) -> str:
    navn = ticker.replace(".OL", "")
    return LINK_TEMPLATE.format(q=urllib.parse.quote(f"{navn} aksje nordnet"))


def consensus(df) -> tuple[int, int, int]:
    """Spør alle strategiene. Returner (beslutning, antall kjøp, antall salg).

    beslutning: 1 = KJØP, -1 = SALG, 0 = VENT.
    """
    buy = sell = 0
    for name, params in VOTERS.items():
        sig = build_strategy(name, params).signal(df)
        if sig == 1:
            buy += 1
        elif sig == -1:
            sell += 1
    if buy >= BUY_THRESHOLD and buy > sell:
        return 1, buy, sell
    if sell >= SELL_THRESHOLD and sell > buy:
        return -1, buy, sell
    return 0, buy, sell


def main() -> None:
    tickers = load_watchlist(WATCHLIST_FILE)
    if not tickers:
        return

    total = len(VOTERS)
    print(f"Skanner {len(tickers)} aksjer — {total} strategier stemmer, "
          f"minst {BUY_THRESHOLD} må være enige.\n")
    print(f"{'Aksje':<10}{'Signal':<10}{'Stemmer':<16}{'Pris':>12}   Handle her")
    print("-" * 78)

    buys = []
    for ticker in tickers:
        df = fetch_ohlcv(ticker)
        if df is None:
            print(f"{ticker:<10}{'(ingen data)':<10}")
            continue
        decision, buy, sell = consensus(df)
        price = df["close"].iloc[-1]
        label = {1: "🟢 KJØP", -1: "🔴 SALG"}.get(decision, "⚪ VENT")
        votes = f"{buy}/{total} kjøp, {sell}/{total} salg"
        link = trade_link(ticker) if decision != 0 else ""
        print(f"{ticker:<10}{label:<10}{votes:<16}{price:>12,.2f}   {link}")
        if decision == 1:
            buys.append(ticker)

    print("-" * 78)
    if buys:
        print(f"Samstemt KJØP på: {', '.join(buys)}")
    else:
        print("Ingen samstemte kjøpssignaler nå. Det er helt greit — tålmodighet lønner seg.")
    print("\n⚠️  Samstemte signaler er mer robuste, men fortsatt ikke aksjeråd. Vurder selv.")


if __name__ == "__main__":
    main()
