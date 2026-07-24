#!/usr/bin/env python3
"""dip_finder.py — finn store, kjente selskaper som har falt mye, og som viser
tegn til å snu opp igjen («kjøp kvalitet på salg»-tanken).

For hvert selskap regner vi ut:
  * hvor langt UNDER sin egen 1-års-topp aksjen er nå (hvor mye den har falt)
  * om den viser tidlige tegn til å snu OPP (kort snitt over mellomlangt snitt)

Kandidatene sorteres etter størst fall. De som BÅDE har falt mye OG snur opp
er de mest interessante å undersøke nærmere.

Bruk:
    python dip_finder.py

⚠️  STOR ADVARSEL: «Falt mye» kan bety et godt selskap på salg — ELLER et
selskap i reell krise som fortsetter ned (en «fallende kniv»). Denne screeneren
kan IKKE skille dem, og kan IKKE forutsi fremtiden. Den lager en kandidatliste
for DIN egen research. Ikke aksjeråd.
"""

from __future__ import annotations

from scan import fetch_ohlcv, trade_link

MIN_DROP = 15.0          # bare vis selskaper som har falt minst så mye (%) fra 1-års-topp

# Kjente, større selskaper (USA + Oslo Børs)
UNIVERSE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "V", "MA",
    "JNJ", "WMT", "PG", "KO", "PEP", "DIS", "NFLX", "ADBE", "CRM", "INTC",
    "AMD", "PYPL", "PFE", "MRK", "NKE", "MCD", "BA", "XOM", "CVX", "CSCO",
    "ORCL", "IBM", "QCOM", "SBUX", "T", "VZ", "COST", "HD", "PLTR", "SHOP",
    "EQNR.OL", "DNB.OL", "NHY.OL", "TEL.OL", "YAR.OL", "MOWI.OL", "ORK.OL",
    "AKRBP.OL", "KOG.OL", "STB.OL", "NOD.OL", "AUTO.OL", "TOM.OL", "SCATC.OL", "NEL.OL",
]


def analyze(df):
    close = df["close"]
    price = close.iloc[-1]
    high_1y = close.iloc[-252:].max() if len(close) >= 252 else close.max()
    off_high = (high_1y - price) / high_1y * 100          # hvor mye under toppen
    sma5 = close.rolling(5).mean().iloc[-1]
    sma20 = close.rolling(20).mean().iloc[-1]
    turning_up = bool(sma5 > sma20)                       # tidlig tegn til vending opp
    return price, high_1y, off_high, turning_up


def main() -> None:
    print(f"Leter blant {len(UNIVERSE)} kjente selskaper etter de som har falt "
          f">= {MIN_DROP:.0f} % fra 1-års-toppen.\n")
    print("Henter data ... (kan ta et par minutter)\n")

    kandidater = []
    for ticker in UNIVERSE:
        df = fetch_ohlcv(ticker)
        if df is None or len(df) < 60:
            continue
        price, high, off_high, turning = analyze(df)
        if off_high >= MIN_DROP:
            kandidater.append((ticker, price, high, off_high, turning))

    if not kandidater:
        print("Ingen selskaper har falt så mye akkurat nå. Marked i god form.")
        return

    # Størst fall øverst
    kandidater.sort(key=lambda k: k[3], reverse=True)

    print(f"{'Aksje':<10}{'Pris':>10}{'1-års-topp':>12}{'Falt':>9}  {'Tegn til vending?':<20}Undersøk")
    print("-" * 92)
    interessante = []
    for ticker, price, high, off_high, turning in kandidater:
        vending = "🟢 snur opp" if turning else "⏳ faller fortsatt"
        print(f"{ticker:<10}{price:>10,.2f}{high:>12,.2f}{off_high:>8.0f}%  "
              f"{vending:<20}{trade_link(ticker)}")
        if turning:
            interessante.append(ticker)

    print("-" * 92)
    if interessante:
        print(f"Mest interessante (falt mye OG snur opp): {', '.join(interessante)}")
    else:
        print("Ingen av de falne viser tegn til vending ennå — de faller fortsatt.")
    print("\n⚠️  En «fallende kniv» kan fortsette ned. Dette er kandidater for research,")
    print("   ikke kjøpsråd. Undersøk HVORFOR hver aksje har falt før du vurderer noe.")


if __name__ == "__main__":
    main()
