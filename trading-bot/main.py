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
from bot.optimize import DEFAULT_GRIDS, grid_search
from bot.plot import save_equity_svg
from bot.risk import RiskManager
from bot.runner import PortfolioRunner, Runner
from bot.strategy import STRATEGIES, build_strategy


def _load_df(cfg: dict, args, symbol: str | None = None):
    """Hjelper: hent data enten fra innebygde testdata (--demo) eller ekte børs."""
    if getattr(args, "demo", False):
        return synthetic_ohlcv(n=600)
    sym = symbol or cfg["symbol"]
    return fetch_ohlcv(cfg["exchange"], sym, cfg["timeframe"], limit=600)


def build_risk(cfg: dict) -> RiskManager:
    r = cfg["risk"]
    return RiskManager(
        stop_loss_pct=r["stop_loss_pct"],
        take_profit_pct=r["take_profit_pct"],
        trailing_stop_pct=r["trailing_stop_pct"],
    )


def build_notifier(cfg: dict) -> Notifier:
    return Notifier(
        telegram=cfg["notifications"]["telegram"],
        email=cfg["notifications"]["email"],
    )


def _period_str(df) -> str:
    """Kort tekst med hvilken periode dataene faktisk dekker."""
    return (f"Periode: {df['timestamp'].iloc[0].date()} til "
            f"{df['timestamp'].iloc[-1].date()}  ({len(df)} datapunkter)")


def cmd_backtest(cfg: dict, args) -> None:
    if args.demo:
        print("Bruker innebygde testdata (offline).\n")
        df = synthetic_ohlcv(n=600)
    else:
        print(f"Henter {cfg['symbol']} fra {cfg['exchange']} ...\n")
        df = fetch_ohlcv(cfg["exchange"], cfg["symbol"], cfg["timeframe"], limit=600)

    print(_period_str(df) + "\n")
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

    if args.plot:
        # Kjøp-og-hold-kurve i samme skala som strategien (samme startkapital)
        first = df["close"].iloc[0]
        bh_curve = [cfg["starting_cash"] * (p / first) for p in df["close"]]
        save_equity_svg(args.plot, result.equity_curve, bh_curve,
                        title=f"{cfg['strategy']['name']} — {cfg['symbol']}")
        print(f"\nGraf lagret: {args.plot}  (åpne i nettleser)")


def cmd_compare(cfg: dict, args) -> None:
    """Kjør ALLE strategiene på samme data og sett dem opp mot hverandre."""
    if args.demo:
        print("Sammenligner strategier på innebygde testdata (offline).\n")
        df = synthetic_ohlcv(n=600)
    else:
        print(f"Henter {cfg['symbol']} fra {cfg['exchange']} ...\n")
        df = fetch_ohlcv(cfg["exchange"], cfg["symbol"], cfg["timeframe"], limit=600)

    bh_return = (df["close"].iloc[-1] - df["close"].iloc[0]) / df["close"].iloc[0] * 100

    print(_period_str(df) + "\n")
    print(f"{'Strategi':<16}{'Avkastning':>12}{'Max fall':>12}{'Handler':>10}{'Gevinst%':>10}")
    print("-" * 60)
    rows = []
    for name in STRATEGIES:
        try:
            strat = build_strategy(name)
            res = run_backtest(df, strat, cfg["starting_cash"], cfg["order_fraction"],
                               cfg["fee"], risk=build_risk(cfg))
            rows.append((name, res))
        except Exception as exc:
            print(f"{name:<16}  (hoppet over: {exc})")
    # Sorter best avkastning øverst
    for name, res in sorted(rows, key=lambda r: r[1].return_pct, reverse=True):
        print(f"{name:<16}{res.return_pct:>+11.2f}%{res.max_drawdown_pct:>11.2f}%"
              f"{res.trades:>10}{res.win_rate:>9.0f}%")
    print("-" * 60)
    print(f"{'kjøp-og-hold':<16}{bh_return:>+11.2f}%")
    print("\nTips: høyest avkastning er ikke alltid best — se på 'Max fall' også.")
    print("En strategi du klarer å holde ut i nedgangstider slår en du får panikk av.")


def cmd_optimize(cfg: dict, args) -> None:
    """Prøv mange parameter-varianter og finn de mest robuste."""
    name = cfg["strategy"]["name"]
    df = _load_df(cfg, args)
    if args.demo:
        print(f"Optimaliserer '{name}' på innebygde testdata (offline).\n")
    else:
        print(f"Optimaliserer '{name}' på {cfg['symbol']} fra {cfg['exchange']} ...\n")

    results = grid_search(df, name, DEFAULT_GRIDS.get(name),
                          cfg["starting_cash"], cfg["order_fraction"], cfg["fee"],
                          risk=build_risk(cfg))

    print(f"{'Parametre':<40}{'Avkastn.':>10}{'Max fall':>10}{'Score':>9}")
    print("-" * 69)
    for r in results[:10]:                       # topp 10
        params = ", ".join(f"{k}={v}" for k, v in r["params"].items())
        print(f"{params:<40}{r['return_pct']:>+9.2f}%{r['max_drawdown_pct']:>9.2f}%{r['score']:>9.2f}")
    print("-" * 69)
    print("\n⚠️  Advarsel om overtilpasning: de beste tallene her passer FORTIDEN.")
    print("   Test dem alltid på en annen periode før du stoler på dem live.")
    print("   'Score' = avkastning / (1 + max fall) — premierer jevn, ikke ekstrem, ytelse.")


def _split_cash(cfg: dict) -> float:
    """Fordel startkapitalen likt over alle parene."""
    return cfg["starting_cash"] / max(len(cfg["symbols"]), 1)


def cmd_portfolio(cfg: dict, args) -> None:
    """Backtest strategien på FLERE par og vis samlet resultat."""
    symbols = cfg["symbols"]
    cash_each = _split_cash(cfg)
    print(f"Portefølje-backtest på {len(symbols)} par: {', '.join(symbols)}")
    print(f"Kapital fordelt likt: {cash_each:,.0f} per par\n")

    print(f"{'Par':<14}{'Avkastning':>12}{'Max fall':>12}{'Handler':>10}")
    print("-" * 48)
    total_start = total_end = 0.0
    for sym in symbols:
        df = _load_df(cfg, args, symbol=sym)
        strat = build_strategy(cfg["strategy"]["name"], cfg["strategy"]["params"])
        res = run_backtest(df, strat, cash_each, cfg["order_fraction"], cfg["fee"],
                           risk=build_risk(cfg))
        total_start += res.start_equity
        total_end += res.end_equity
        print(f"{sym:<14}{res.return_pct:>+11.2f}%{res.max_drawdown_pct:>11.2f}%{res.trades:>10}")
    print("-" * 48)
    total_ret = (total_end - total_start) / total_start * 100
    print(f"{'SAMLET':<14}{total_ret:>+11.2f}%   (startkapital {total_start:,.0f} → {total_end:,.0f})")
    print("\nÅ spre kapitalen over flere par demper svingningene i porteføljen.")


def _build_runners(cfg: dict, brokers: list, mode: str) -> list[Runner]:
    notifier = build_notifier(cfg)
    runners = []
    for sym, broker in zip(cfg["symbols"], brokers):
        runners.append(Runner(
            broker, build_strategy(cfg["strategy"]["name"], cfg["strategy"]["params"]),
            cfg["exchange"], sym, cfg["timeframe"], cfg["order_fraction"], mode=mode,
            risk=build_risk(cfg), notifier=notifier,
        ))
    return runners


def cmd_paper(cfg: dict, args) -> None:
    cash_each = _split_cash(cfg)
    brokers = [PaperBroker(cash=cash_each, fee=cfg["fee"]) for _ in cfg["symbols"]]
    runner = PortfolioRunner(_build_runners(cfg, brokers, "paper"))
    print(f"Paper trading {', '.join(cfg['symbols'])} — liksom-penger, null risiko. Ctrl+C for å stoppe.\n")
    runner.loop(interval_seconds=args.interval, rounds=args.rounds)


def cmd_live(cfg: dict, args) -> None:
    live = cfg["live"]
    if not args.i_understand_the_risk:
        sys.exit("Avbrutt: ekte handel krever flagget --i-understand-the-risk")
    if not live.get("enabled"):
        sys.exit("Avbrutt: sett live.enabled: true i config.yaml først")
    brokers = [
        LiveBroker(cfg["exchange"], sym, live["api_key"], live["api_secret"],
                   max_order_value=live["max_order_value"], fee=cfg["fee"])
        for sym in cfg["symbols"]
    ]
    runner = PortfolioRunner(_build_runners(cfg, brokers, "LIVE"))
    print(f"!!! EKTE HANDEL på {', '.join(cfg['symbols'])}. "
          f"Maks {live['max_order_value']} per ordre. Ctrl+C for å stoppe.\n")
    runner.loop(interval_seconds=args.interval, rounds=args.rounds)


def main() -> None:
    parser = argparse.ArgumentParser(description="En liten, ærlig krypto-trading-bot")
    parser.add_argument("--config", default="config.yaml", help="Sti til config-fil")
    sub = parser.add_subparsers(dest="command", required=True)

    p_bt = sub.add_parser("backtest", help="Test strategien på historiske data")
    p_bt.add_argument("--demo", action="store_true", help="Bruk innebygde testdata (offline)")
    p_bt.add_argument("--plot", nargs="?", const="equity_curve.svg", default=None,
                      metavar="FIL", help="Lagre equity-graf som SVG (default: equity_curve.svg)")

    p_cmp = sub.add_parser("compare", help="Sammenlign alle strategiene i en tabell")
    p_cmp.add_argument("--demo", action="store_true", help="Bruk innebygde testdata (offline)")

    p_opt = sub.add_parser("optimize", help="Finn de beste parametrene (forsiktig: overtilpasning)")
    p_opt.add_argument("--demo", action="store_true", help="Bruk innebygde testdata (offline)")

    p_pf = sub.add_parser("portfolio", help="Backtest flere par samtidig (fra 'symbols' i config)")
    p_pf.add_argument("--demo", action="store_true", help="Bruk innebygde testdata (offline)")

    p_paper = sub.add_parser("paper", help="Paper trading med liksom-penger")
    p_paper.add_argument("--interval", type=int, default=3600, help="Sekunder mellom runder (default 1t)")
    p_paper.add_argument("--rounds", type=int, default=None, help="Antall runder (default: uendelig)")

    p_live = sub.add_parser("live", help="EKTE handel (les README!)")
    p_live.add_argument("--i-understand-the-risk", action="store_true")
    p_live.add_argument("--interval", type=int, default=3600)
    p_live.add_argument("--rounds", type=int, default=None)

    args = parser.parse_args()
    cfg = load_config(args.config)

    {
        "backtest": cmd_backtest,
        "compare": cmd_compare,
        "optimize": cmd_optimize,
        "portfolio": cmd_portfolio,
        "paper": cmd_paper,
        "live": cmd_live,
    }[args.command](cfg, args)


if __name__ == "__main__":
    main()
