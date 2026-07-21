"""Parameter-optimalisering: la boten prøve mange varianter og finne de beste.

ADVARSEL — LES DETTE:
Optimalisering kan lure deg. Hvis du finpusser parametrene til de passer PERFEKT
til fortiden, får du ofte tall som ser fantastiske ut, men som feiler live. Det
kalles "overtilpasning" (overfitting): du har tilpasset deg støy, ikke signal.

Tommelregler for å unngå fellen:
  * Foretrekk parametre som gjør det JEVNT bra, ikke én enkelt "magisk" topp.
  * Test alltid de beste parametrene på data de IKKE ble optimalisert på
    (kjør backtest på en annen periode etterpå).
  * Enkelt slår komplisert. Færre parametre = mindre å overtilpasse.
"""

from __future__ import annotations

import itertools

import pandas as pd

from .backtest import run_backtest
from .risk import RiskManager
from .strategy import build_strategy

# Fornuftige søkeområder per strategi (kan justeres)
DEFAULT_GRIDS = {
    "sma_crossover": {"fast": [10, 20, 30], "slow": [50, 100, 150]},
    "trend_filter": {"fast": [10, 20], "slow": [50, 80], "trend": [150, 200]},
    "macd": {"fast": [8, 12], "slow": [21, 26], "signal": [9]},
    "bollinger": {"period": [14, 20, 30], "num_std": [1.5, 2.0, 2.5]},
    "rsi_reversion": {"period": [10, 14, 21], "low": [25, 30], "high": [70, 75]},
}


def _combos(grid: dict):
    """Gjør {'fast':[10,20], 'slow':[50]} om til alle kombinasjoner av parametre."""
    keys = list(grid)
    for values in itertools.product(*(grid[k] for k in keys)):
        yield dict(zip(keys, values))


def grid_search(df: pd.DataFrame, strategy_name: str, grid: dict | None,
                starting_cash: float, order_fraction: float, fee: float,
                risk: RiskManager | None = None) -> list[dict]:
    """Prøv alle parameter-kombinasjoner og returner dem sortert etter en robust score.

    Score = avkastning delt på (1 + max drawdown). Dette premierer strategier som
    tjener penger UTEN store fall — ikke bare høyest avkastning for enhver pris.
    """
    grid = grid or DEFAULT_GRIDS.get(strategy_name, {})
    if not grid:
        raise ValueError(f"Ingen søkeområde definert for '{strategy_name}'")

    results = []
    for params in _combos(grid):
        try:
            strat = build_strategy(strategy_name, params)
            res = run_backtest(df, strat, starting_cash, order_fraction, fee,
                               risk=RiskManager(**vars_of(risk)) if risk else None)
        except Exception:
            continue
        score = res.return_pct / (1 + res.max_drawdown_pct)
        results.append({
            "params": params,
            "return_pct": res.return_pct,
            "max_drawdown_pct": res.max_drawdown_pct,
            "trades": res.trades,
            "win_rate": res.win_rate,
            "score": score,
        })
    results.sort(key=lambda r: r["score"], reverse=True)
    return results


def vars_of(risk: RiskManager) -> dict:
    """Kopier risiko-innstillingene så hver backtest får en fersk RiskManager."""
    return {
        "stop_loss_pct": risk.stop_loss_pct,
        "take_profit_pct": risk.take_profit_pct,
        "trailing_stop_pct": risk.trailing_stop_pct,
    }
