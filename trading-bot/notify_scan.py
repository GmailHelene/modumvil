#!/usr/bin/env python3
"""notify_scan.py — sender resultatet av den daglige jobben som Telegram-varsel.

Leser skanningen OG porteføljen, og sender dem til Telegram HVIS hemmelighetene
TELEGRAM_TOKEN og TELEGRAM_CHAT_ID er satt. Er de ikke satt, gjør den ingenting
(resultatet ligger uansett i «Job Summary»). Krasjer aldri kjøringen.
"""

from __future__ import annotations

import os
import urllib.parse
import urllib.request

token = os.environ.get("TG_TOKEN", "")
chat = os.environ.get("TG_CHAT", "")

# Samle sammen begge rapportene (de som finnes)
deler = []
for filnavn, tittel in [("scan_output.txt", "📊 Aksje-skanning"),
                        ("portfolio_output.txt", "💼 Din portefølje")]:
    try:
        with open(filnavn, encoding="utf-8") as f:
            deler.append(f"{tittel}:\n{f.read()}")
    except FileNotFoundError:
        pass
text = "\n\n".join(deler) or "(ingen data å sende)"

if token and chat:
    data = urllib.parse.urlencode({"chat_id": chat, "text": text[:4000]}).encode()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=15).read()
        print("Telegram-varsel sendt ✅")
    except Exception as exc:
        print(f"Telegram feilet (men kjøringen fortsetter): {exc}")
else:
    print("Ingen Telegram-hemmeligheter satt — resultatet ligger i Job Summary på GitHub.")
