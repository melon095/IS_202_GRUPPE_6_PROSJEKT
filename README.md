# Kartverket

Denne repoen inneholder Gruppe 6 sin Kartverk oppgave. Den er ikke ferdig!

Du kan starte prosjektet ved å kjøre følgende kommandoer:

```bash
docker compose up
```

## Lokal utvikling

For å gjøre lokal utvikling krever det at du har Node.js og pnpm installert. Her er instruksjoner for å komme i gang:

```bash
Installer: https://nodejs.org/en
Lukk terminalen din, åpne en ny terminal og cd inn i repository. npm install --global corepack@latest
Åpne en adminstrator terminal og kjør corepack enable pnpm
cd Kartverket.Web/map-ui
pnpm install
```

Dette vil installere alle nødvendige avhengigheter for prosjektet.

For å utvikle kartet lokalt må du først åpne en terminal og ha denne kommandoen kjørende i bakgrunnen:

```bash
cd Kartverket.Web/map-ui
pnpm run dev
```

Alternativet, dersom du ikke ønsker å ha tilgang til kartet kan du legge dette til i appsettings.Development.json filen.

```json
"Vite": {
  "Server": {
    "AutoRun": false
  }
}
```

Mens dette kjører kan du åpne Visual Studio og starte nettsiden.
