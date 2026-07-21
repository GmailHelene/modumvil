# 🚀 Kjøre boten døgnet rundt (uten at PC-en må stå på)

Boten må kjøre kontinuerlig for å følge markedet. Du vil ikke la den henge på
laptopen din — den skal kjøre på noe som alltid er på. Her er tre måter, fra
enklest til mest robust.

> Uansett metode: **start alltid i paper trading** og la den gå i uker før ekte penger.

---

## Alternativ A: Raspberry Pi eller en gammel PC hjemme (billigst)

En Raspberry Pi bruker nesten ingen strøm og er perfekt til dette.

```bash
# På Pi-en (Raspberry Pi OS / Linux):
sudo apt update && sudo apt install -y python3-pip git
git clone https://github.com/GmailHelene/crypto-trading-bot.git
cd crypto-trading-bot
pip3 install -r requirements.txt
cp config.example.yaml config.yaml   # fyll inn dine innstillinger
```

Så gjør du den til en **systemd-tjeneste** så den starter automatisk og restarter
hvis den krasjer (se `deploy/trading-bot.service`):

```bash
sudo cp deploy/trading-bot.service /etc/systemd/system/
# rediger stien i filen om nødvendig, så:
sudo systemctl daemon-reload
sudo systemctl enable --now trading-bot
sudo systemctl status trading-bot     # se at den kjører
journalctl -u trading-bot -f          # se loggen live
```

---

## Alternativ B: En billig sky-server (VPS)

En liten VPS (f.eks. Hetzner, DigitalOcean, ~5–7 USD/mnd) står alltid på og har
stabil nettforbindelse. Samme oppsett som Pi-en over — klon repoet, installer,
og bruk systemd-tjenesten.

**Tips:** Lag API-nøkler hos børsen med IP-begrensning til serverens IP. Da kan
nøklene ikke misbrukes andre steder selv om de skulle lekke.

---

## Alternativ C: Docker (enklest å flytte mellom maskiner)

Med Docker slipper du å tenke på Python-versjoner. Se `Dockerfile`.

```bash
docker build -t trading-bot .
# Kjør paper trading, med din egen config montert inn:
docker run -d --name trading-bot --restart unless-stopped \
  -v $(pwd)/config.yaml:/app/config.yaml \
  trading-bot paper
docker logs -f trading-bot            # se loggen
```

---

## Hvor ofte "våkner" boten?

Det styres av `timeframe` i config og `--interval` (sekunder mellom sjekker).
For `1h`-strategi holder det å sjekke én gang i timen:

```bash
python main.py paper --interval 3600
```

Boten sover mellom sjekkene og bruker nesten ingen ressurser.

---

## Sikkerhet ved døgndrift

- **Aldri** gi API-nøklene rett til å ta ut penger — kun til å handle.
- Bruk **IP-begrensning** på nøklene der børsen tilbyr det.
- `config.yaml` med nøkler skal aldri havne på GitHub (den er i `.gitignore`).
- Slå på **Telegram/e-postvarsler** så du oppdager raskt hvis noe er galt.
- Sjekk loggen jevnlig de første ukene (`journalctl -u trading-bot -f`).
