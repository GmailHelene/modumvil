"""Risikostyring: automatisk beskyttelse for hver handel.

Dette er ofte VIKTIGERE enn selve strategien. En middels strategi med god
risikostyring slår en god strategi uten den. Reglene:

  * stop-loss    -> selg automatisk hvis prisen faller X % fra kjøp (kutt tapet)
  * take-profit  -> selg automatisk hvis prisen stiger X % (sikre gevinsten)
  * trailing stop-> flytter stop-loss OPP når prisen stiger, så du beholder
                    mer av gevinsten hvis trenden snur (0 = av)
"""

from __future__ import annotations


class RiskManager:
    def __init__(self, stop_loss_pct: float = 0.05,
                 take_profit_pct: float = 0.10,
                 trailing_stop_pct: float = 0.0):
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct
        self.trailing_stop_pct = trailing_stop_pct
        self.entry_price = None
        self.high_water = None      # høyeste pris sett siden kjøp (for trailing)

    def reset(self, entry_price: float) -> None:
        """Kall denne når en ny posisjon åpnes."""
        self.entry_price = entry_price
        self.high_water = entry_price

    def check(self, price: float) -> str | None:
        """Returner grunn til å selge ('stop_loss'/'take_profit'/'trailing_stop') eller None."""
        if self.entry_price is None:
            return None
        self.high_water = max(self.high_water, price)

        # Take-profit: nådd gevinstmålet?
        if self.take_profit_pct > 0 and price >= self.entry_price * (1 + self.take_profit_pct):
            return "take_profit"

        # Trailing stop: falt for mye fra toppen?
        if self.trailing_stop_pct > 0 and price <= self.high_water * (1 - self.trailing_stop_pct):
            return "trailing_stop"

        # Stop-loss: falt for mye fra kjøpspris?
        if self.stop_loss_pct > 0 and price <= self.entry_price * (1 - self.stop_loss_pct):
            return "stop_loss"

        return None

    def clear(self) -> None:
        self.entry_price = None
        self.high_water = None
