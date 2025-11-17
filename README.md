# Kartverket

Denne repoen inneholder koden for Gruppe 6 sin IS-202 Kartverket oppgave

Du kan starte prosjektet ved å kjøre følgende kommandoer:

```bash
docker compose up
```

## Lokal utvikling

For å gjøre lokal utvikling krever det at du har Node.js og pnpm installert. 

1. Installer Node.js fra [nodejs.org](https://nodejs.org/). Last ned `.msi` filen.
2. Lukk terminalen og åpne en ny slik at PATH oppdateres.
3. Aktiver Corepack og PNPM: 

```bash
corepack enable pnpm
```

4. Gå til prosjektet og installer avhengighetene:

```bash
cd Kartverket.Web/map-ui
pnpm install
```
