"""Varsler: få beskjed når boten handler, uten å måtte sitte og se på skjermen.

Støtter to kanaler (begge valgfrie, kan brukes samtidig):
  * Telegram  — enklest, gratis, kommer rett på mobilen
  * E-post    — via SMTP (f.eks. Gmail med app-passord)

Bruker kun standardbiblioteket (urllib + smtplib), så ingen ekstra avhengigheter.
Et varsel som feiler skal ALDRI stoppe boten.

--- Sett opp Telegram (2 min) ---
  1. Telegram → søk "@BotFather" → /newbot → følg stegene → du får en TOKEN
  2. Send en melding til din nye bot
  3. Åpne https://api.telegram.org/bot<TOKEN>/getUpdates → finn "chat":{"id": ...}
  4. Lim token + chat_id inn i config.yaml

--- Sett opp e-post (Gmail-eksempel) ---
  1. Slå på 2-trinns bekreftelse på Google-kontoen
  2. Lag et "app-passord" (Google-konto → Sikkerhet → App-passord)
  3. I config.yaml: smtp_host: smtp.gmail.com, port 587, username = din e-post,
     password = app-passordet, to = mottaker
"""

from __future__ import annotations

import smtplib
import urllib.parse
import urllib.request
from email.mime.text import MIMEText


class Notifier:
    def __init__(self, telegram: dict | None = None, email: dict | None = None):
        self.telegram = telegram or {}
        self.email = email or {}

    def send(self, text: str, subject: str = "Trading-bot varsel") -> None:
        print(text)                              # alltid til konsollen
        self._send_telegram(text)
        self._send_email(text, subject)

    # -- Telegram ----------------------------------------------------------
    def _send_telegram(self, text: str) -> None:
        tg = self.telegram
        if not (tg.get("enabled") and tg.get("token") and tg.get("chat_id")):
            return
        try:
            url = f"https://api.telegram.org/bot{tg['token']}/sendMessage"
            data = urllib.parse.urlencode({"chat_id": tg["chat_id"], "text": text}).encode()
            urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10).read()
        except Exception as exc:
            print(f"[Telegram-varsel feilet, boten kjører videre] {exc}")

    # -- E-post ------------------------------------------------------------
    def _send_email(self, text: str, subject: str) -> None:
        em = self.email
        if not (em.get("enabled") and em.get("username") and em.get("password") and em.get("to")):
            return
        try:
            msg = MIMEText(text)
            msg["Subject"] = subject
            msg["From"] = em["username"]
            msg["To"] = em["to"]
            with smtplib.SMTP(em.get("smtp_host", "smtp.gmail.com"),
                              int(em.get("smtp_port", 587)), timeout=15) as server:
                server.starttls()
                server.login(em["username"], em["password"])
                server.send_message(msg)
        except Exception as exc:
            print(f"[E-postvarsel feilet, boten kjører videre] {exc}")
