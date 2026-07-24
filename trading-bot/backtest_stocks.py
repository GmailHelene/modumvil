#!/usr/bin/env python3
"""backtest_stocks.py — backtest en kurv med aksjer på ekte historikk.

Henter ~2 år dagsdata (Yahoo Finance) for hver aksje i lista under, kjører
strategien med risikostyring, og viser hvordan hver aksje OG hele kurven
(likt fordelt) ville utviklet seg.

Bruk:
    python backtest_stocks.py

⚠️  Historisk test — ikke aksjeråd og ingen garanti for fremtiden.
"""

from __future__ import annotations

from bot.backtest import run_backtest
from bot.risk import RiskManager
from bot.strategy import build_strategy
from scan import fetch_ohlcv

# Kurven som testes (endre fritt)
TICKERS = ["EQNR.OL", "ORK.OL", "STB.OL", "AAPL", "JPM"]

STARTING_CASH_EACH = 1000       # startkapital per aksje
STRATEGY = "trend_filter"
PARAMS = {"fast": 20, "slow": 50, "trend": 100}


def main() -> None:
    risk = RiskManager(stop_loss_pct=0.05, take_profit_pct=0.10, trailing_stop_pct=0.08)
    print(f"Backtest av {len(TICKERS)} aksjer med '{STRATEGY}' + risikostyring.")
    print(f"Startkapital {STARTING_CASH_EACH} per aksje.\n")
    print(f"{'Aksje':<10}{'Strategi':>12}{'Kjøp-og-hold':>16}{'Max fall':>12}")
    print("-" * 50)

    tot_start = tot_end = tot_bh_end = 0.0
    hentet = 0
    for ticker in TICKERS:
        df = fetch_ohlcv(ticker)
        if df is None or len(df) < 120:
            print(f"{ticker:<10}  (ingen/for lite data)")
            continue
        res = run_backtest(df, build_strategy(STRATEGY, PARAMS),
                           STARTING_CASH_EACH, order_fraction=0.5, fee=0.001, risk=risk)
        bh = (df["close"].iloc[-1] - df["close"].iloc[0]) / df["close"].iloc[0]
        bh_end = STARTING_CASH_EACH * (1 + bh)
        print(f"{ticker:<10}{res.return_pct:>+11.1f}%{bh*100:>+15.1f}%{res.max_drawdown_pct:>11.1f}%")
        tot_start += STARTING_CASH_EACH
        tot_end += res.end_equity
        tot_bh_end += bh_end
        hentet += 1

    if hentet:
        print("-" * 50)
        strat_ret = (tot_end - tot_start) / tot_start * 100
        bh_ret = (tot_bh_end - tot_start) / tot_start * 100
        print(f"{'KURVEN':<10}{strat_ret:>+11.1f}%{bh_ret:>+15.1f}%")
        print(f"\nStrategien på hele kurven: {strat_ret:+.1f} %   "
              f"Bare eie (kjøp-og-hold): {bh_ret:+.1f} %")
        print("Merk: en spredt kurv svinger mindre enn enkeltaksjene hver for seg.")
    print("\n⚠️  Historisk test — ikke aksjeråd. Fortiden gjentar seg ikke.")


if __name__ == "__main__":
    main()
