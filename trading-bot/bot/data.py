"""Henter prisdata (OHLCV = Open, High, Low, Close, Volume).

To kilder:
  * fetch_ohlcv()      -> ekte data fra en børs via ccxt (krever internett)
  * synthetic_ohlcv()  -> falske, men realistiske data for testing offline
"""

from __future__ import annotations

import math

import pandas as pd


def fetch_ohlcv(exchange_id: str, symbol: str, timeframe: str, limit: int = 500) -> pd.DataFrame:
    """Hent ekte candlesticks fra en børs. Krever nettverk, men ingen API-nøkkel."""
    import ccxt  # importeres her så resten kan kjøre uten ccxt installert

    exchange = getattr(ccxt, exchange_id)()
    raw = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
    df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    return df


def synthetic_ohlcv(n: int = 500, start_price: float = 30000.0, seed: int = 42) -> pd.DataFrame:
    """Lag realistiske testdata uten nett.

    Bruker en enkel deterministisk pseudo-tilfeldig gange (random walk) med litt
    trend og bølger, slik at strategiene har noe å bryne seg på. Samme seed gir
    alltid samme serie, så backtester er reproduserbare.
    """
    prices = []
    price = start_price
    state = seed
    for i in range(n):
        # Enkel lineær-kongruent generator -> tall mellom -1 og 1 (ingen numpy nødvendig)
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        noise = (state / 0x7FFFFFFF) * 2 - 1
        wave = math.sin(i / 25.0) * 0.004          # langsom bølge = trendskifter
        price *= 1 + wave + noise * 0.01           # ~1 % støy per steg
        prices.append(price)

    rows = []
    ts = pd.Timestamp("2024-01-01")
    for i, close in enumerate(prices):
        open_ = prices[i - 1] if i else close
        high = max(open_, close) * 1.003
        low = min(open_, close) * 0.997
        rows.append([ts + pd.Timedelta(hours=i), open_, high, low, close, 100.0])
    return pd.DataFrame(rows, columns=["timestamp", "open", "high", "low", "close", "volume"])
