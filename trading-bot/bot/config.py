"""Leser config.yaml (med fornuftige standardverdier)."""

from __future__ import annotations

from pathlib import Path

import yaml

DEFAULTS = {
    "exchange": "binance",
    "symbol": "BTC/USDT",
    "symbols": [],             # flere par samtidig, f.eks. [BTC/USDT, ETH/USDT]
    "timeframe": "1h",
    "strategy": {"name": "trend_filter", "params": {"fast": 20, "slow": 50, "trend": 200}},
    "starting_cash": 1000,
    "order_fraction": 0.25,
    "fee": 0.001,
    "risk": {"stop_loss_pct": 0.05, "take_profit_pct": 0.10, "trailing_stop_pct": 0.0},
    "notifications": {
        "telegram": {"enabled": False, "token": "", "chat_id": ""},
        "email": {"enabled": False, "smtp_host": "smtp.gmail.com", "smtp_port": 587,
                  "username": "", "password": "", "to": ""},
    },
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
        cfg["risk"] = {**DEFAULTS["risk"], **loaded.get("risk", {})}
        cfg["live"] = {**DEFAULTS["live"], **loaded.get("live", {})}
        notif = loaded.get("notifications", {})
        cfg["notifications"] = {
            "telegram": {**DEFAULTS["notifications"]["telegram"], **notif.get("telegram", {})},
            "email": {**DEFAULTS["notifications"]["email"], **notif.get("email", {})},
        }

    # Normaliser til en liste med par. Bruk 'symbols' hvis satt, ellers 'symbol'.
    symbols = cfg.get("symbols") or [cfg["symbol"]]
    cfg["symbols"] = symbols
    cfg["symbol"] = symbols[0]     # bakoverkompatibelt for enkelt-par-kommandoer
    return cfg
