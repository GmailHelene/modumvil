"""Meglere: den delen som faktisk "legger inn ordre".

To implementasjoner med samme grensesnitt:
  * PaperBroker -> liksom-penger. Null risiko. Bruk denne til alt av testing.
  * LiveBroker  -> ekte penger via ccxt. Bak flere sikkerhetslåser.

Fordi de deler grensesnitt (buy/sell/equity), kan boten bytte fra paper til
ekte handel uten at én linje i strategien endres.
"""

from __future__ import annotations


class PaperBroker:
    """Simulert megler. Holder styr på kontanter + beholdning i minnet."""

    def __init__(self, cash: float, fee: float = 0.001):
        self.cash = float(cash)
        self.position = 0.0        # antall enheter (f.eks. BTC) vi eier
        self.fee = fee
        self.trades = 0

    def buy(self, price: float, value: float) -> None:
        """Kjøp for 'value' i quote-valuta (f.eks. USDT) til gitt pris."""
        value = min(value, self.cash)
        if value <= 0:
            return
        units = (value * (1 - self.fee)) / price
        self.cash -= value
        self.position += units
        self.trades += 1

    def sell(self, price: float, fraction: float = 1.0) -> None:
        """Selg en andel av beholdningen (1.0 = alt)."""
        units = self.position * fraction
        if units <= 0:
            return
        self.cash += units * price * (1 - self.fee)
        self.position -= units
        self.trades += 1

    def equity(self, price: float) -> float:
        """Total verdi = kontanter + beholdning verdsatt til dagens pris."""
        return self.cash + self.position * price


class LiveBroker:
    """EKTE handel via ccxt. Håndteres med respekt.

    Sikkerhetslåser:
      1. Opprettes kun når config live.enabled == true
      2. API-nøkler må være fylt inn
      3. max_order_value begrenser hvor stor en enkelt ordre kan bli
    """

    def __init__(self, exchange_id: str, symbol: str, api_key: str, api_secret: str,
                 max_order_value: float, fee: float = 0.001):
        if not api_key or not api_secret:
            raise ValueError("Ekte handel krever api_key og api_secret i config.yaml")
        import ccxt

        self.symbol = symbol
        self.max_order_value = max_order_value
        self.fee = fee
        self.exchange = getattr(ccxt, exchange_id)({
            "apiKey": api_key,
            "secret": api_secret,
            "enableRateLimit": True,
        })

    def _price(self) -> float:
        return self.exchange.fetch_ticker(self.symbol)["last"]

    def buy(self, price: float, value: float) -> None:
        value = min(value, self.max_order_value)   # hard grense
        units = value / price
        self.exchange.create_market_buy_order(self.symbol, units)

    def sell(self, price: float, fraction: float = 1.0) -> None:
        base = self.symbol.split("/")[0]
        balance = self.exchange.fetch_balance().get(base, {}).get("free", 0)
        units = balance * fraction
        if units > 0:
            self.exchange.create_market_sell_order(self.symbol, units)

    def equity(self, price: float) -> float:
        quote = self.symbol.split("/")[1]
        return self.exchange.fetch_balance().get(quote, {}).get("total", 0)
