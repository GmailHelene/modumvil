#!/usr/bin/env python3
"""portfolio.py — følg aksjene du FAKTISK eier, mot kjøpsprisen din.

Du logger kjøpene dine i portfolio.txt (ticker, antall, kjøpspris). Dette
skriptet henter dagens kurs, regner ut gevinst/tap mot det du betalte, og
anbefaler SELG når:
  * du er opp nok fra kjøp (take-profit), eller
  * du er ned for mye fra kjøp (stop-loss), eller
  * strategiene snur til salgssignal (consensus)

Bruk:
    python portfolio.py

⚠️  Systemet leser IKKE Nordnet automatisk — det husker kun det DU skriver inn
i portfolio.txt. Dette er ikke aksjeråd; det er mekaniske regler mot kjøpsprisen
din. Vurder alltid selv.
"""

from __future__ import annotations

# Gjenbruker byggeklossene fra scan.py (samme mappe)
from scan import consensus, fetch_ohlcv, trade_link

PORTFOLIO_FILE = "portfolio.txt"
TAKE_PROFIT = 0.15     # anbefal salg når du er +15 % fra kjøpspris
STOP_LOSS = 0.10       # anbefal salg når du er -10 % fra kjøpspris


def load_portfolio(path: str) -> list[tuple[str, float, float]]:
    """Les (ticker, antall, kjøpspris) fra fila. Hopper over kommentarer/tomt."""
    holdings = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.split("#")[0].strip()      # fjern kommentar
                if not line:
                    continue
                deler = [d.strip() for d in line.split(",")]
                if len(deler) != 3:
                    print(f"Hopper over ugyldig linje: {line!r} (trenger 3 felt)")
                    continue
                ticker, antall, pris = deler
                holdings.append((ticker, float(antall), float(pris)))
    except FileNotFoundError:
        print(f"Fant ikke {path}. Lag den med linjer på formen: TICKER, antall, kjøpspris")
    return holdings


def sell_recommendation(buy_price: float, current_price: float,
                        strat_signal: int) -> tuple[bool, str]:
    """Skal vi anbefale salg? Returner (ja/nei, grunn)."""
    change = (current_price - buy_price) / buy_price
    if change >= TAKE_PROFIT:
        return True, f"take-profit (+{change:.1%} fra kjøp)"
    if change <= -STOP_LOSS:
        return True, f"stop-loss ({change:.1%} fra kjøp)"
    if strat_signal == -1:
        return True, "strategiene sier SALG"
    return False, f"hold ({change:+.1%} fra kjøp)"


def main() -> None:
    holdings = load_portfolio(PORTFOLIO_FILE)
    if not holdings:
        return

    print(f"Følger {len(holdings)} posisjoner mot kjøpsprisen din.\n")
    print(f"{'Aksje':<10}{'Kjøpt':>9}{'Nå':>9}{'Endring':>10}{'Anbefaling':<14}Grunn")
    print("-" * 88)

    for ticker, antall, buy in holdings:
        df = fetch_ohlcv(ticker)
        if df is None:
            print(f"{ticker:<10}{'(ingen data)':>9}")
            continue
        price = df["close"].iloc[-1]
        strat_signal = consensus(df)[0]
        sell, reason = sell_recommendation(buy, price, strat_signal)
        change = (price - buy) / buy
        rec = "🔴 SELG" if sell else "🟢 HOLD"
        link = f"   {trade_link(ticker)}" if sell else ""
        print(f"{ticker:<10}{buy:>9,.2f}{price:>9,.2f}{change:>+9.1%} {rec:<14}{reason}{link}")

    print("-" * 88)
    print("Gevinst/tap er per aksje i aksjens egen valuta (NOK for .OL, ellers USD).")
    print("⚠️  Mekaniske regler mot kjøpsprisen din — ikke aksjeråd. Vurder selv.")


if __name__ == "__main__":
    main()
