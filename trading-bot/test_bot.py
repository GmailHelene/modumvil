"""Enkle tester som kjører helt uten internett eller API-nøkler.

Kjør med:  python test_bot.py
"""

from bot.backtest import run_backtest
from bot.broker import PaperBroker
from bot.data import synthetic_ohlcv
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
    df = synthetic_ohlcv(n=200)
    for name in ("sma_crossover", "rsi_reversion"):
        strat = build_strategy(name)
        sig = strat.signal(df)
        assert sig in (-1, 0, 1), f"{name} ga ugyldig signal {sig}"
    print("OK: strategiene gir gyldige signaler (-1/0/+1)")


if __name__ == "__main__":
    test_paper_broker_roundtrip()
    test_backtest_runs()
    test_strategy_signals_are_valid()
    print("\nAlle tester bestått ✅")
