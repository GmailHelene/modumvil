"""Leser config.yaml (med fornuftige standardverdier)."""

from __future__ import annotations

from pathlib import Path

import yaml

DEFAULTS = {
    "exchange": "binance",
    "symbol": "BTC/USDT",
    "timeframe": "1h",
    "strategy": {"name": "sma_crossover", "params": {"fast": 20, "slow": 50}},
    "starting_cash": 1000,
    "order_fraction": 0.25,
    "fee": 0.001,
    "live": {"enabled": False, "max_order_value": 50, "api_key": "", "api_secret": ""},
}


def load_config(path: str = "config.yaml") -> dict:
    cfg = {**DEFAULTS}
    p = Path(path)
    if p.exists():
        loaded = yaml.safe_load(p.read_text()) or {}
        cfg.update(loaded)
        # slå sammen nøstede seksjoner uten å miste standardverdier
        cfg["strategy"] = {**DEFAULTS["strategy"], **loaded.get("strategy", {})}
        cfg["live"] = {**DEFAULTS["live"], **loaded.get("live", {})}
    return cfg
