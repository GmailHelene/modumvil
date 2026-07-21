# Enkelt Docker-oppsett for å kjøre boten hvor som helst.
#
# Bygg:  docker build -t trading-bot .
# Kjør:  docker run -d --name trading-bot --restart unless-stopped \
#          -v $(pwd)/config.yaml:/app/config.yaml trading-bot paper

FROM python:3.12-slim

WORKDIR /app

# Installer avhengigheter først (bedre bygge-cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopier resten av boten
COPY . .

# Standard: paper trading. Overstyr ved å gi en annen kommando til `docker run`.
ENTRYPOINT ["python", "main.py"]
CMD ["paper", "--interval", "3600"]
