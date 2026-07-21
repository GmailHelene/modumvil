"""Backtesting: test strategien på historiske data FØR du risikerer noe.

Dette er det viktigste verktøyet i hele prosjektet. En strategi som ikke tjener
penger i en backtest kommer nesten aldri til å gjøre det med ekte penger heller.
(Og en som gjør det i backtest kan fortsatt feile live — vær ydmyk.)
"""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .broker import PaperBroker
from .strategy import Strategy


@dataclass
class BacktestResult:
    start_equity: float
    end_equity: float
    return_pct: float
    max_drawdown_pct: float
    trades: int
    equity_curve: list

    def summary(self) -> str:
        return (
            f"Startkapital:     {self.start_equity:,.2f}\n"
            f"Sluttkapital:     {self.end_equity:,.2f}\n"
            f"Avkastning:       {self.return_pct:+.2f} %\n"
            f"Største fall:     {self.max_drawdown_pct:.2f} %  (max drawdown)\n"
            f"Antall handler:   {self.trades}"
        )


def run_backtest(df: pd.DataFrame, strategy: Strategy, starting_cash: float,
                 order_fraction: float, fee: float) -> BacktestResult:
    broker = PaperBroker(cash=starting_cash, fee=fee)
    signals = strategy.signals(df)

    equity_curve = []
    for i in range(len(df)):
        price = df["close"].iloc[i]
        sig = signals.iloc[i]
        if sig == 1 and broker.cash > 0:
            broker.buy(price, broker.cash * order_fraction)
        elif sig == -1 and broker.position > 0:
            broker.sell(price, fraction=1.0)
        equity_curve.append(broker.equity(price))

    start = starting_cash
    end = equity_curve[-1] if equity_curve else starting_cash

    # Max drawdown = største fall fra en topp til et påfølgende bunnpunkt
    peak = start
    max_dd = 0.0
    for eq in equity_curve:
        peak = max(peak, eq)
        dd = (peak - eq) / peak * 100
        max_dd = max(max_dd, dd)

    return BacktestResult(
        start_equity=start,
        end_equity=end,
        return_pct=(end - start) / start * 100,
        max_drawdown_pct=max_dd,
        trades=broker.trades,
        equity_curve=equity_curve,
    )
