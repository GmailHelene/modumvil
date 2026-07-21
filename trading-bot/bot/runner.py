"""Live-løkke (paper eller ekte): hent siste data -> sjekk risiko -> handle.

Kjører én runde per kall til step(). CLI-en kaller step() på intervall.
Sender varsler (Telegram/konsoll) når noe faktisk skjer.
"""

from __future__ import annotations

import time

from .data import fetch_ohlcv
from .notify import Notifier
from .risk import RiskManager
from .strategy import Strategy


class Runner:
    def __init__(self, broker, strategy: Strategy, exchange_id: str, symbol: str,
                 timeframe: str, order_fraction: float, mode: str = "paper",
                 risk: RiskManager | None = None, notifier: Notifier | None = None):
        self.broker = broker
        self.strategy = strategy
        self.exchange_id = exchange_id
        self.symbol = symbol
        self.timeframe = timeframe
        self.order_fraction = order_fraction
        self.mode = mode
        self.risk = risk or RiskManager(stop_loss_pct=0, take_profit_pct=0)
        self.notifier = notifier or Notifier()

    def step(self) -> str:
        df = fetch_ohlcv(self.exchange_id, self.symbol, self.timeframe, limit=250)
        price = df["close"].iloc[-1]
        sig = self.strategy.signal(df)
        in_position = getattr(self.broker, "position", 0) > 0

        action = "hold"
        if in_position:
            reason = self.risk.check(price)
            if reason:                                  # risikostyring slår inn
                self.broker.sell(price, fraction=1.0)
                self.risk.clear()
                action = f"SELL ({reason})"
                self.notifier.send(f"🔴 [{self.mode}] SOLGTE {self.symbol} @ {price:,.2f} — grunn: {reason}")
            elif sig == -1:                             # strategien vil ut
                self.broker.sell(price, fraction=1.0)
                self.risk.clear()
                action = "SELL (signal)"
                self.notifier.send(f"🔴 [{self.mode}] SOLGTE {self.symbol} @ {price:,.2f} — signal")
        elif sig == 1 and getattr(self.broker, "cash", 1) > 0:
            self.broker.buy(price, self._order_value())
            self.risk.reset(price)
            action = "BUY"
            self.notifier.send(f"🟢 [{self.mode}] KJØPTE {self.symbol} @ {price:,.2f}")

        eq = self.broker.equity(price)
        return f"[{self.mode}] pris={price:,.2f}  signal={sig:+d}  handling={action}  verdi={eq:,.2f}"

    def _order_value(self) -> float:
        cash = getattr(self.broker, "cash", None)
        if cash is not None:                            # paper: andel av kontanter
            return cash * self.order_fraction
        return self.broker.max_order_value             # live: begrenset av sikkerhetsgrense

    def loop(self, interval_seconds: int = 3600, rounds: int | None = None):
        i = 0
        while rounds is None or i < rounds:
            try:
                print(self.step())
            except Exception as exc:                    # aldri krasj løkka på en enkelt feil
                print(f"[feil] {exc}")
            i += 1
            if rounds is None or i < rounds:
                time.sleep(interval_seconds)


class PortfolioRunner:
    """Kjører flere kryptopar samtidig — hvert par håndteres av sin egen Runner.

    Å spre kapitalen over flere par (f.eks. BTC + ETH) reduserer risikoen: går
    det dårlig med det ene, trenger ikke hele porteføljen å følge med ned.
    """

    def __init__(self, runners: list[Runner]):
        self.runners = runners

    def loop(self, interval_seconds: int = 3600, rounds: int | None = None):
        i = 0
        while rounds is None or i < rounds:
            for r in self.runners:
                try:
                    print(r.step())
                except Exception as exc:
                    print(f"[feil på {r.symbol}] {exc}")
            i += 1
            if rounds is None or i < rounds:
                time.sleep(interval_seconds)
