#!/usr/bin/env python3
"""Kommandolinje for trading-boten.

Bruk:
    python main.py backtest            # test strategien på data (offline med --demo)
    python main.py backtest --demo     # bruk innebygde testdata, trenger ikke nett
    python main.py paper                # paper trading med liksom-penger
    python main.py live --i-understand-the-risk   # EKTE penger (les README først!)
"""

from __future__ import annotations

import argparse
import sys

from bot.backtest import run_backtest
from bot.broker import LiveBroker, PaperBroker
from bot.config import load_config
from bot.data import fetch_ohlcv, synthetic_ohlcv
from bot.notify import Notifier
from bot.risk import RiskManager
from bot.runner import Runner
from bot.strategy import build_strategy


def build_risk(cfg: dict) -> RiskManager:
    r = cfg["risk"]
    return RiskManager(
        stop_loss_pct=r["stop_loss_pct"],
        take_profit_pct=r["take_profit_pct"],
        trailing_stop_pct=r["trailing_stop_pct"],
    )


def build_notifier(cfg: dict) -> Notifier:
    tg = cfg["notifications"]["telegram"]
    return Notifier(telegram_token=tg["token"], telegram_chat_id=tg["chat_id"],
                    enabled=tg["enabled"])


def cmd_backtest(cfg: dict, args) -> None:
    if args.demo:
        print("Bruker innebygde testdata (offline).\n")
        df = synthetic_ohlcv(n=600)
    else:
        print(f"Henter {cfg['symbol']} fra {cfg['exchange']} ...\n")
        df = fetch_ohlcv(cfg["exchange"], cfg["symbol"], cfg["timeframe"], limit=600)

    strat = build_strategy(cfg["strategy"]["name"], cfg["strategy"]["params"])
    result = run_backtest(
        df, strat,
        starting_cash=cfg["starting_cash"],
        order_fraction=cfg["order_fraction"],
        fee=cfg["fee"],
        risk=build_risk(cfg),
    )
    print(f"Strategi: {cfg['strategy']['name']}  {cfg['strategy']['params']}")
    print("-" * 40)
    print(result.summary())
    print("-" * 40)

    # Sammenlign mot "bare kjøp og hold" — slår strategien den enkle baselinen?
    bh_return = (df["close"].iloc[-1] - df["close"].iloc[0]) / df["close"].iloc[0] * 100
    print(f"Til sammenligning, kjøp-og-hold: {bh_return:+.2f} %")
    if result.return_pct < bh_return:
        print("=> Strategien slo IKKE kjøp-og-hold her. Det er helt normalt og verdt å lære av.")


def cmd_paper(cfg: dict, args) -> None:
    broker = PaperBroker(cash=cfg["starting_cash"], fee=cfg["fee"])
    strat = build_strategy(cfg["strategy"]["name"], cfg["strategy"]["params"])
    runner = Runner(
        broker, strat, cfg["exchange"], cfg["symbol"], cfg["timeframe"],
        cfg["order_fraction"], mode="paper",
        risk=build_risk(cfg), notifier=build_notifier(cfg),
    )
    print(f"Paper trading {cfg['symbol']} — liksom-penger, null risiko. Ctrl+C for å stoppe.\n")
    runner.loop(interval_seconds=args.interval, rounds=args.rounds)


def cmd_live(cfg: dict, args) -> None:
    live = cfg["live"]
    if not args.i_understand_the_risk:
        sys.exit("Avbrutt: ekte handel krever flagget --i-understand-the-risk")
    if not live.get("enabled"):
        sys.exit("Avbrutt: sett live.enabled: true i config.yaml først")
    broker = LiveBroker(
        cfg["exchange"], cfg["symbol"], live["api_key"], live["api_secret"],
        max_order_value=live["max_order_value"], fee=cfg["fee"],
    )
    strat = build_strategy(cfg["strategy"]["name"], cfg["strategy"]["params"])
    runner = Runner(
        broker, strat, cfg["exchange"], cfg["symbol"], cfg["timeframe"],
        cfg["order_fraction"], mode="LIVE",
        risk=build_risk(cfg), notifier=build_notifier(cfg),
    )
    print(f"!!! EKTE HANDEL på {cfg['symbol']}. Maks {live['max_order_value']} per ordre. Ctrl+C for å stoppe.\n")
    runner.loop(interval_seconds=args.interval, rounds=args.rounds)


def main() -> None:
    parser = argparse.ArgumentParser(description="En liten, ærlig krypto-trading-bot")
    parser.add_argument("--config", default="config.yaml", help="Sti til config-fil")
    sub = parser.add_subparsers(dest="command", required=True)

    p_bt = sub.add_parser("backtest", help="Test strategien på historiske data")
    p_bt.add_argument("--demo", action="store_true", help="Bruk innebygde testdata (offline)")

    p_paper = sub.add_parser("paper", help="Paper trading med liksom-penger")
    p_paper.add_argument("--interval", type=int, default=3600, help="Sekunder mellom runder (default 1t)")
    p_paper.add_argument("--rounds", type=int, default=None, help="Antall runder (default: uendelig)")

    p_live = sub.add_parser("live", help="EKTE handel (les README!)")
    p_live.add_argument("--i-understand-the-risk", action="store_true")
    p_live.add_argument("--interval", type=int, default=3600)
    p_live.add_argument("--rounds", type=int, default=None)

    args = parser.parse_args()
    cfg = load_config(args.config)

    {"backtest": cmd_backtest, "paper": cmd_paper, "live": cmd_live}[args.command](cfg, args)


if __name__ == "__main__":
    main()
