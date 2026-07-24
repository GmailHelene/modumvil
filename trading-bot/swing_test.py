#!/usr/bin/env python3
"""swing_test.py — 2-ukers-test: lønner kortsiktig trading seg egentlig?

For hver aksje går vi bakover i historien og spør ærlig:
  «Hvis jeg hadde kjøpt hver gang strategien ga et kortsiktig kjøpssignal,
   og solgt nøyaktig 2 uker (10 handelsdager) senere — hvor ofte gikk jeg i
   pluss, og hvor mye i snitt, etter avgifter?»

Vi tester også en BASELINE: kjøp en HELT TILFELDIG dag og selg 2 uker senere.
Hvis strategien ikke slår baselinen, tilfører den ingenting — den er da bare
myntkast med ekstra steg.

Bruk:
    python swing_test.py

⚠️  Dette er et lærings-/testverktøy, ikke aksjeråd. At noe fungerte i fortiden
garanterer ingenting for fremtiden. Kortsiktig trading er svært vanskelig.
"""

from __future__ import annotations

from scan import fetch_ohlcv

HOLD_DAYS = 10            # ~2 uker (handelsdager)
FEE_ROUNDTRIP = 0.003    # 0,3 % samlet for kjøp + salg (courtage)
FAST, SLOW = 5, 20       # kortsiktig momentum: 5-dagers over 20-dagers snitt

# 50 større selskaper — USA + Oslo Børs
TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "MA",
    "JNJ", "WMT", "PG", "HD", "KO", "PEP", "DIS", "NFLX", "ADBE", "CRM",
    "INTC", "AMD", "CSCO", "ORCL", "IBM", "BA", "CAT", "GE", "XOM", "CVX",
    "PFE", "MRK", "NKE", "MCD", "COST",
    "EQNR.OL", "DNB.OL", "NHY.OL", "TEL.OL", "YAR.OL", "MOWI.OL", "AKRBP.OL",
    "ORK.OL", "KOG.OL", "STB.OL", "SALM.OL", "TGS.OL", "AKSO.OL", "GJF.OL", "SUBC.OL",
]


def test_ticker(df) -> tuple[list[float], list[float]]:
    """Returner (strategi-handler, baseline-handler) som lister med avkastning."""
    close = df["close"].reset_index(drop=True)
    fast = close.rolling(FAST).mean()
    slow = close.rolling(SLOW).mean()

    # Kjøpssignal: fast krysser OVER slow (momentum snur opp)
    cross_up = (fast > slow) & (fast.shift(1) <= slow.shift(1))

    strat_trades, baseline_trades = [], []
    n = len(close)
    for i in range(n - HOLD_DAYS):
        entry, exit_ = close.iloc[i], close.iloc[i + HOLD_DAYS]
        ret = (exit_ / entry - 1) - FEE_ROUNDTRIP
        baseline_trades.append(ret)              # baseline: hver dag teller
        if bool(cross_up.iloc[i]):               # strategi: kun paa signal
            strat_trades.append(ret)
    return strat_trades, baseline_trades


def oppsummer(navn: str, trades: list[float]) -> None:
    if not trades:
        print(f"{navn}: ingen handler")
        return
    n = len(trades)
    vinn = sum(1 for r in trades if r > 0) / n * 100
    snitt = sum(trades) / n * 100
    best = max(trades) * 100
    verst = min(trades) * 100
    print(f"{navn:<28}{n:>7} handler   {vinn:>5.1f} % i pluss   "
          f"snitt {snitt:>+5.2f} %   (beste {best:+.1f} %, verste {verst:+.1f} %)")


def main() -> None:
    print(f"2-ukers-test paa {len(TICKERS)} selskaper "
          f"(kjøp -> selg etter {HOLD_DAYS} handelsdager, {FEE_ROUNDTRIP*100:.1f} % avgift).\n")
    print("Henter data ... (kan ta et par minutter)\n")

    alle_strat, alle_baseline = [], []
    hentet = 0
    for ticker in TICKERS:
        df = fetch_ohlcv(ticker)
        if df is None or len(df) < SLOW + HOLD_DAYS + 5:
            continue
        s, b = test_ticker(df)
        alle_strat += s
        alle_baseline += b
        hentet += 1

    print(f"Ferdig — data fra {hentet} selskaper.\n")
    print("=" * 92)
    oppsummer("STRATEGI (5/20-signal)", alle_strat)
    oppsummer("BASELINE (tilfeldig dag)", alle_baseline)
    print("=" * 92)

    # Ærlig konklusjon basert paa tallene
    if alle_strat and alle_baseline:
        s_vinn = sum(1 for r in alle_strat if r > 0) / len(alle_strat) * 100
        b_vinn = sum(1 for r in alle_baseline if r > 0) / len(alle_baseline) * 100
        print(f"\nStrategien traff pluss {s_vinn:.1f} % av gangene — baseline (rent flaks) "
              f"{b_vinn:.1f} %.")
        if s_vinn <= b_vinn + 2:
            print("=> Strategien slår knapt (eller ikke) rent flaks. Det er den ærlige "
                  "virkeligheten\n   for kortsiktig trading: nær myntkast, og avgifter spiser gevinsten.")
        else:
            print("=> Strategien gjorde det litt bedre enn flaks her — men husk at fortiden\n"
                  "   ikke gjentar seg, og forskjellen kan være tilfeldig.")
    print("\n⚠️  Kortsiktig trading er svært vanskelig. Test alltid, og risiker aldri "
          "mer enn du tåler å tape.")


if __name__ == "__main__":
    main()
