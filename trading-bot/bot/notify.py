"""Varsler: få beskjed når boten handler, uten å måtte sitte og se på skjermen.

Støtter Telegram (enklest og gratis). Bruker kun standardbiblioteket (urllib),
så ingen ekstra avhengigheter. Feiler aldri boten hvis varselet ikke går gjennom.

Sett opp Telegram (tar 2 minutter):
  1. Åpne Telegram, søk opp "@BotFather", send /newbot, følg stegene -> du får en TOKEN
  2. Send en melding til din nye bot
  3. Åpne https://api.telegram.org/bot<TOKEN>/getUpdates i nettleser -> finn "chat":{"id": ...}
  4. Lim token + chat_id inn i config.yaml under notifications.telegram
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request


class Notifier:
    def __init__(self, telegram_token: str = "", telegram_chat_id: str = "",
                 enabled: bool = False):
        self.token = telegram_token
        self.chat_id = telegram_chat_id
        self.enabled = enabled and bool(telegram_token) and bool(telegram_chat_id)

    def send(self, text: str) -> None:
        # Skriv alltid til konsollen
        print(text)
        if not self.enabled:
            return
        try:
            url = f"https://api.telegram.org/bot{self.token}/sendMessage"
            data = urllib.parse.urlencode({"chat_id": self.chat_id, "text": text}).encode()
            req = urllib.request.Request(url, data=data)
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as exc:                    # aldri krasj boten på et mislykket varsel
            print(f"[varsel feilet, men boten kjører videre] {exc}")
