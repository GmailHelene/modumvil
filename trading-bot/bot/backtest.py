"""Backtesting: test strategien på historiske data FØR du risikerer noe.

Dette er det viktigste verktøyet i hele prosjektet. En strategi som ikke tjener
penger i en backtest kommer nesten aldri til å gjøre det med ekte penger heller.
(Og en som gjør det i backtest kan fortsatt feile live — vær ydmyk.)

Modellen er posisjonsbasert: vi er enten UTE av markedet eller INNE med én
posisjon. Vi går inn på kjøpssignal og ut på salgssignal ELLER når
risikostyringen (stop-loss / take-profit / trailing stop) slår inn.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from .broker import PaperBroker
from .risk import RiskManager
from .strategy import Strategy


@dataclass
class BacktestResult:
    start_equity: float
    end_equity: float
    return_pct: float
    max_drawdown_pct: float
    trades: int
    wins: int
    exit_reasons: dict = field(default_factory=dict)
    equity_curve: list = field(default_factory=list)

    @property
    def win_rate(self) -> float:
        return (self.wins / self.trades * 100) if self.trades else 0.0

    def summary(self) -> str:
        reasons = ", ".join(f"{k}: {v}" for k, v in self.exit_reasons.items()) or "ingen"
        return (
            f"Startkapital:     {self.start_equity:,.2f}\n"
            f"Sluttkapital:     {self.end_equity:,.2f}\n"
            f"Avkastning:       {self.return_pct:+.2f} %\n"
            f"Største fall:     {self.max_drawdown_pct:.2f} %  (max drawdown)\n"
            f"Fullførte handler:{self.trades:>4}  (kjøp+salg-par)\n"
            f"Andel gevinst:    {self.win_rate:.1f} %\n"
            f"Salgsgrunner:     {reasons}"
        )


def run_backtest(df: pd.DataFrame, strategy: Strategy, starting_cash: float,
                 order_fraction: float, fee: float,
                 risk: RiskManager | None = None) -> BacktestResult:
    broker = PaperBroker(cash=starting_cash, fee=fee)
    risk = risk or RiskManager(stop_loss_pct=0, take_profit_pct=0)  # av som default
    signals = strategy.signals(df)

    equity_curve = []
    entry_equity = None            # egenkapital da vi gikk inn (for å avgjøre gevinst/tap)
    completed = 0
    wins = 0
    exit_reasons: dict = {}

    def close_position(price: float, reason: str) -> None:
        nonlocal completed, wins, entry_equity
        broker.sell(price, fraction=1.0)
        risk.clear()
        completed += 1
        if broker.equity(price) > entry_equity:
            wins += 1
        exit_reasons[reason] = exit_reasons.get(reason, 0) + 1
        entry_equity = None

    for i in range(len(df)):
        price = df["close"].iloc[i]
        sig = signals.iloc[i]

        if broker.position > 0:
            # Vi er inne: sjekk risikostyring FØR strategisignal
            reason = risk.check(price)
            if reason:
                close_position(price, reason)
            elif sig == -1:
                close_position(price, "signal")
        elif sig == 1 and broker.cash > 0:
            entry_equity = broker.equity(price)
            broker.buy(price, broker.cash * order_fraction)
            risk.reset(price)

        equity_curve.append(broker.equity(price))

    start = starting_cash
    end = equity_curve[-1] if equity_curve else starting_cash

    peak = start
    max_dd = 0.0
    for eq in equity_curve:
        peak = max(peak, eq)
        max_dd = max(max_dd, (peak - eq) / peak * 100)

    return BacktestResult(
        start_equity=start,
        end_equity=end,
        return_pct=(end - start) / start * 100,
        max_drawdown_pct=max_dd,
        trades=completed,
        wins=wins,
        exit_reasons=exit_reasons,
        equity_curve=equity_curve,
    )
