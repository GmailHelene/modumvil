"""Enkle tester som kjører helt uten internett eller API-nøkler.

Kjør med:  python test_bot.py
"""

from bot.backtest import run_backtest
from bot.broker import PaperBroker
from bot.data import synthetic_ohlcv
from bot.risk import RiskManager
from bot.strategy import build_strategy


def test_paper_broker_roundtrip():
    b = PaperBroker(cash=1000, fee=0.0)
    b.buy(price=100, value=500)          # kjøp for 500 -> 5 enheter
    assert abs(b.position - 5) < 1e-9
    assert abs(b.cash - 500) < 1e-9
    b.sell(price=200, fraction=1.0)      # selg alt til dobbel pris
    assert b.position == 0
    assert abs(b.cash - 1500) < 1e-9     # 500 kontanter + 5*200 = 1500
    print("OK: PaperBroker kjøp/salg regner riktig")


def test_backtest_runs():
    df = synthetic_ohlcv(n=300)
    strat = build_strategy("sma_crossover", {"fast": 10, "slow": 30})
    res = run_backtest(df, strat, starting_cash=1000, order_fraction=0.5, fee=0.001)
    assert res.start_equity == 1000
    assert res.end_equity > 0
    assert res.trades >= 0
    assert 0 <= res.max_drawdown_pct <= 100
    print(f"OK: backtest kjørte — avkastning {res.return_pct:+.2f} %, {res.trades} handler")


def test_strategy_signals_are_valid():
    df = synthetic_ohlcv(n=300)
    for name in ("sma_crossover", "rsi_reversion", "trend_filter"):
        strat = build_strategy(name)
        sig = strat.signal(df)
        assert sig in (-1, 0, 1), f"{name} ga ugyldig signal {sig}"
    print("OK: strategiene gir gyldige signaler (-1/0/+1)")


def test_risk_manager():
    r = RiskManager(stop_loss_pct=0.05, take_profit_pct=0.10, trailing_stop_pct=0.0)
    r.reset(entry_price=100)
    assert r.check(98) is None            # -2 %: ingenting skjer
    assert r.check(94) == "stop_loss"     # -6 %: stop-loss
    r.reset(entry_price=100)
    assert r.check(111) == "take_profit"  # +11 %: take-profit

    # Trailing stop: stiger til 120, faller 5 % til 114 -> utløses
    t = RiskManager(stop_loss_pct=0.0, take_profit_pct=0.0, trailing_stop_pct=0.05)
    t.reset(entry_price=100)
    t.check(120)
    assert t.check(114) == "trailing_stop"
    print("OK: risikostyring (stop-loss / take-profit / trailing) utløses riktig")


def test_backtest_with_risk_tracks_winrate():
    df = synthetic_ohlcv(n=400)
    strat = build_strategy("trend_filter", {"fast": 10, "slow": 30, "trend": 100})
    risk = RiskManager(stop_loss_pct=0.05, take_profit_pct=0.10)
    res = run_backtest(df, strat, starting_cash=1000, order_fraction=0.5, fee=0.001, risk=risk)
    assert 0 <= res.win_rate <= 100
    assert res.trades == sum(res.exit_reasons.values())
    print(f"OK: backtest m/risiko — {res.return_pct:+.2f} %, {res.trades} handler, "
          f"{res.win_rate:.0f} % gevinst")


def test_all_strategies_run():
    from bot.strategy import STRATEGIES
    df = synthetic_ohlcv(n=400)
    for name in STRATEGIES:
        res = run_backtest(df, build_strategy(name), 1000, 0.5, 0.001)
        assert res.end_equity > 0
    print(f"OK: alle {len(STRATEGIES)} strategiene kjører i backtest")


def test_equity_svg_is_valid():
    from bot.plot import equity_svg
    svg = equity_svg([1000, 1050, 1020, 1100], [1000, 1010, 1030, 1040])
    assert svg.startswith("<svg") and svg.rstrip().endswith("</svg>")
    assert "polyline" in svg
    print("OK: equity-graf genererer gyldig SVG")


if __name__ == "__main__":
    test_paper_broker_roundtrip()
    test_backtest_runs()
    test_strategy_signals_are_valid()
    test_risk_manager()
    test_backtest_with_risk_tracks_winrate()
    test_all_strategies_run()
    test_equity_svg_is_valid()
    print("\nAlle tester bestått ✅")
