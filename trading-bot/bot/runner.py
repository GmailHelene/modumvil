"""Live-løkke (paper eller ekte): hent siste data -> regn signal -> handle.

Kjører én runde per kall til step(). CLI-en kaller step() på intervall.
"""

from __future__ import annotations

import time

from .data import fetch_ohlcv
from .strategy import Strategy


class Runner:
    def __init__(self, broker, strategy: Strategy, exchange_id: str, symbol: str,
                 timeframe: str, order_fraction: float, mode: str = "paper"):
        self.broker = broker
        self.strategy = strategy
        self.exchange_id = exchange_id
        self.symbol = symbol
        self.timeframe = timeframe
        self.order_fraction = order_fraction
        self.mode = mode

    def step(self) -> str:
        df = fetch_ohlcv(self.exchange_id, self.symbol, self.timeframe, limit=200)
        price = df["close"].iloc[-1]
        sig = self.strategy.signal(df)

        action = "hold"
        if sig == 1 and getattr(self.broker, "cash", 1) > 0:
            self.broker.buy(price, self._order_value())
            action = "BUY"
        elif sig == -1 and getattr(self.broker, "position", 1) > 0:
            self.broker.sell(price, fraction=1.0)
            action = "SELL"

        eq = self.broker.equity(price)
        return f"[{self.mode}] pris={price:,.2f}  signal={sig:+d}  handling={action}  verdi={eq:,.2f}"

    def _order_value(self) -> float:
        cash = getattr(self.broker, "cash", None)
        if cash is not None:                       # paper: andel av kontanter
            return cash * self.order_fraction
        return self.broker.max_order_value         # live: begrenset av sikkerhetsgrense

    def loop(self, interval_seconds: int = 60, rounds: int | None = None):
        i = 0
        while rounds is None or i < rounds:
            try:
                print(self.step())
            except Exception as exc:               # aldri krasj løkka på en enkelt feil
                print(f"[feil] {exc}")
            i += 1
            if rounds is None or i < rounds:
                time.sleep(interval_seconds)
