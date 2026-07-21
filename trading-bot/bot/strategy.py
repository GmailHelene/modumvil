"""Strategier: reglene som avgjør NÅR vi kjøper og selger.

En strategi tar inn prisdata og returnerer et signal for siste candle:
    +1 = kjøp / vær long
     0 = gjør ingenting / vær utenfor marked
    -1 = selg / gå ut

Vil du lage din egen? Arv fra Strategy, implementer signal(), og
registrer den i STRATEGIES nederst. Det er hele oppskriften.
"""

from __future__ import annotations

import pandas as pd


class Strategy:
    """Basisklasse. Alle strategier arver fra denne."""

    def signal(self, df: pd.DataFrame) -> int:
        raise NotImplementedError

    # Praktisk for backtest: regn ut signal for HVER rad, ikke bare siste.
    def signals(self, df: pd.DataFrame) -> pd.Series:
        out = []
        for i in range(len(df)):
            window = df.iloc[: i + 1]
            out.append(self.signal(window))
        return pd.Series(out, index=df.index)


class SMACrossover(Strategy):
    """Glidende snitt-kryssing (klassikeren).

    Når det korte snittet krysser OVER det lange -> kjøpssignal (momentum opp).
    Når det korte snittet krysser UNDER det lange -> salgssignal.
    Enkel, gjennomsiktig, og et godt utgangspunkt for å lære.
    """

    def __init__(self, fast: int = 20, slow: int = 50):
        if fast >= slow:
            raise ValueError("'fast' må være mindre enn 'slow'")
        self.fast = fast
        self.slow = slow

    def signal(self, df: pd.DataFrame) -> int:
        if len(df) < self.slow:
            return 0  # ikke nok data ennå
        close = df["close"]
        fast_ma = close.rolling(self.fast).mean().iloc[-1]
        slow_ma = close.rolling(self.slow).mean().iloc[-1]
        if fast_ma > slow_ma:
            return 1
        if fast_ma < slow_ma:
            return -1
        return 0


class RSIReversion(Strategy):
    """RSI mean-reversion: kjøp når noe er 'oversolgt', selg når 'overkjøpt'.

    Et annet eksempel så du ser at strategier er utbyttbare byggeklosser.
    """

    def __init__(self, period: int = 14, low: float = 30, high: float = 70):
        self.period = period
        self.low = low
        self.high = high

    def signal(self, df: pd.DataFrame) -> int:
        if len(df) < self.period + 1:
            return 0
        delta = df["close"].diff()
        gain = delta.clip(lower=0).rolling(self.period).mean().iloc[-1]
        loss = -delta.clip(upper=0).rolling(self.period).mean().iloc[-1]
        if loss == 0:
            return -1  # ingen tap -> sterkt overkjøpt
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        if rsi < self.low:
            return 1
        if rsi > self.high:
            return -1
        return 0


class TrendFilter(Strategy):
    """Trend-følgende strategi med filter — vanligvis det beste utgangspunktet.

    Ideen: ikke kjemp mot hovedtrenden. Vi kjøper KUN når:
      1. prisen er over et langt snitt (marked i opptrend), OG
      2. det korte snittet er over det mellomlange (momentum opp)
    Vi selger når momentum snur ned. Dette filteret kutter mange av de dårlige
    handlene en ren SMA-crossover gjør i sidelengs marked ("whipsaws").

    Kombinert med stop-loss/take-profit (se bot/risk.py) gir dette en ryddig,
    regelbasert tilnærming du kan stole på og forstå.
    """

    def __init__(self, fast: int = 20, slow: int = 50, trend: int = 200):
        if not (fast < slow < trend):
            raise ValueError("Krav: fast < slow < trend")
        self.fast = fast
        self.slow = slow
        self.trend = trend

    def signal(self, df: pd.DataFrame) -> int:
        if len(df) < self.trend:
            return 0
        close = df["close"]
        fast_ma = close.rolling(self.fast).mean().iloc[-1]
        slow_ma = close.rolling(self.slow).mean().iloc[-1]
        trend_ma = close.rolling(self.trend).mean().iloc[-1]
        price = close.iloc[-1]

        in_uptrend = price > trend_ma
        momentum_up = fast_ma > slow_ma

        if in_uptrend and momentum_up:
            return 1
        if not momentum_up:
            return -1
        return 0


class MACD(Strategy):
    """MACD — populær momentum-indikator.

    Regner differansen mellom et raskt og et tregt eksponentielt snitt (EMA),
    og et "signalsnitt" av den differansen. Kjøp når MACD krysser over signalet
    (momentum snur opp), selg når den krysser under.
    """

    def __init__(self, fast: int = 12, slow: int = 26, signal: int = 9):
        self.fast = fast
        self.slow = slow
        self.signal_period = signal

    def signal(self, df: pd.DataFrame) -> int:
        if len(df) < self.slow + self.signal_period:
            return 0
        close = df["close"]
        ema_fast = close.ewm(span=self.fast, adjust=False).mean()
        ema_slow = close.ewm(span=self.slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=self.signal_period, adjust=False).mean()
        if macd_line.iloc[-1] > signal_line.iloc[-1]:
            return 1
        if macd_line.iloc[-1] < signal_line.iloc[-1]:
            return -1
        return 0


class Bollinger(Strategy):
    """Bollinger-bånd (mean-reversion).

    Legger et bånd på +/- N standardavvik rundt et glidende snitt. Ideen er at
    prisen "spretter tilbake": kjøp når prisen faller under nedre bånd
    (uvanlig lavt), selg når den stiger over øvre bånd (uvanlig høyt).
    """

    def __init__(self, period: int = 20, num_std: float = 2.0):
        self.period = period
        self.num_std = num_std

    def signal(self, df: pd.DataFrame) -> int:
        if len(df) < self.period:
            return 0
        close = df["close"]
        mid = close.rolling(self.period).mean().iloc[-1]
        std = close.rolling(self.period).std().iloc[-1]
        price = close.iloc[-1]
        if price < mid - self.num_std * std:
            return 1
        if price > mid + self.num_std * std:
            return -1
        return 0


# Registreringstabell: navn i config.yaml -> klasse
STRATEGIES = {
    "sma_crossover": SMACrossover,
    "rsi_reversion": RSIReversion,
    "trend_filter": TrendFilter,
    "macd": MACD,
    "bollinger": Bollinger,
}


def build_strategy(name: str, params: dict | None = None) -> Strategy:
    if name not in STRATEGIES:
        raise ValueError(f"Ukjent strategi '{name}'. Velg blant: {list(STRATEGIES)}")
    return STRATEGIES[name](**(params or {}))
