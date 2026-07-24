#!/usr/bin/env python3
"""notify_scan.py — sender resultatet av scan.py som Telegram-varsel (valgfritt).

Brukes av den daglige GitHub Action-en. Leser scan_output.txt og sender det til
Telegram HVIS hemmelighetene TELEGRAM_TOKEN og TELEGRAM_CHAT_ID er satt i repoet.
Er de ikke satt, gjør den ingenting (resultatet ligger uansett i «Job Summary»).
Krasjer aldri kjøringen.
"""

from __future__ import annotations

import os
import urllib.parse
import urllib.request

token = os.environ.get("TG_TOKEN", "")
chat = os.environ.get("TG_CHAT", "")

try:
    with open("scan_output.txt", encoding="utf-8") as f:
        text = f.read()
except FileNotFoundError:
    text = "(fant ingen skanning å sende)"

if token and chat:
    body = ("📊 Daglig aksje-skanning:\n\n" + text)[:4000]   # Telegram maks ~4096 tegn
    data = urllib.parse.urlencode({"chat_id": chat, "text": body}).encode()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=15).read()
        print("Telegram-varsel sendt ✅")
    except Exception as exc:
        print(f"Telegram feilet (men kjøringen fortsetter): {exc}")
else:
    print("Ingen Telegram-hemmeligheter satt — resultatet ligger i Job Summary på GitHub.")
