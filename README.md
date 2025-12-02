Denne repoen inneholder koden for Gruppe 6 sitt IS-202 Prosjekt.

- [Komme i gang](#komme-i-gang)
- [Drift](#drift)
- [Systemarkitektur](#systemarkitektur)
  - [REST API](#rest-api)
  - [Konfigurasjon](#konfigurasjon)
  - [Databaser](#databaser)
  - [Modeller](#modeller)
  - [Kontrollere](#kontrollere)
  - [Views](#views)
    - [User](#user)
    - [Report](#report)
    - [Map](#map)
    - [Home](#home)
  - [React](#react)
  - [Autentisering og Autorisering](#autentisering-og-autorisering)
- [Database](#database)
- [Test](#test)
  - [Sikkerhetstesting](#sikkerhetstesting)
  - [Systemtesting](#systemtesting)
  - [Brukervennlighetstesting](#brukervennlighetstesting)
- [Lokal utvikling](#lokal-utvikling)

# Komme i gang

Du kan starte prosjektet ved å kjøre følgende kommando i terminalen i prosjektets rotmappe:

```bash
docker compose up
```

# Drift

Applikasjonen kan enten startes manuelt via Visual Studio, Rider, eller med docker ved bruk av kommando `docker compose up` i terminalen.
Den kobler seg til en MariaDB Database der tabeller blir skapt automatisk fra [DatabaseContext](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/DatabaseContext.cs)

Det er mulig å få tilgang til nettsiden ved å navigere til `http://localhost:8080` i en nettleser. Porten kan varieres avhengig av konfigurasjonen i `docker-compose.yml` filen dersom du bruker docker. Ved kjøring via IDE vil standardporten være bestemt av [projectSettings.json](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Properties/launchSettings.json) filen, men dette skal være automatisk dokumentert i terminalen ved oppstart av applikasjonen.

# Systemarkitektur

Systemer tar i bruk C# med ASP.NET Core MVC rammeverket for å bygge en webapplikasjon som tillater brukere å registrere seg, logge inn, rapportere hindringer på et kart, og administrere disse rapportene basert på brukerroller.

Applikasjonen bruker Entity Framework Core for å kommunisere med en MariaDB database der all data lagres.

React blir brukt for å bygge et interaktivt kartgrensesnitt der brukere kan plassere og visualisere hindringer.

## REST API

Applikasjonen tilbyr et REST API som tillater klienter å hente og sende data relatert til hindringer, brukere, og rapporter. API-et håndteres av ulike kontrollere i applikasjonen. Her er noen av de viktigste endepunktene:

- `POST /Map/SyncObject` - Synkroniserer et hindringsobjekt med databasen når en bruker legger til eller oppdaterer en hindring på kartet.
- `GET /Map/GetObjects` - Henter alle hindringer for visning på kartet.
- `GET /ObjectTypes/List` - Henter en liste over alle tilgjengelige hindringstyper.

Endepunktene er beskyttet med autentisering og autorisering for å sikre at bare gyldige brukere kan utføre handlinger basert på deres roller.

Det er tatt i bruk JSON som dataformat for kommunikasjon mellom klient og server.

## Konfigurasjon

Systemet tar i bruk av `appsettings.json` filen for å lagre konfigurasjonsinnstillinger som databaseforbindelsesstrenger og andre applikasjonsspesifikke innstillinger.

For å endre databaseforbindelsen, skal du lage en `appsettings.Development.json` eller `appsettings.Production.json` avhengig av miljøet du kjører applikasjonen i. Opprett denne filen i samme mappe som `appsettings.json` og legge til følgende innhold:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=DIN_SERVER;port=DIN_PORT;database=DIN_DATABASE;user=DITT_BRUKERNAVN;password=DITT_PASSORD;"
  }
}
```

Dersom docker er tatt i bruk, er dette allerede konfigurert automatisk via `docker-compose.yml` filen.

## Databaser

[DatabaseContext](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/DatabaseContext.cs) klasse som kommuniserer mellom C# og databasen.

## Modeller

[HindranceObjectTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/HindranceObjectTable.cs) representerer tabellen i databasen som lagrer informasjon om hindringer.

[HindrancePointTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/HindrancePointTable.cs) representerer tabellen i databasen som lagrer geografiske punkter for hindringer.

[HindranceTypeTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/HindranceTypeTable.cs) representerer tabellen i databasen som lagrer hva slags type en hindring er.

[ReportFeedbackTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/ReportFeedbackTable.cs) representerer tabellen i databasen som lagrer tilbakemeldinger på rapporterte hindringer.

[ReportTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/ReportTable.cs) representerer tabellen i databasen som lagrer en samling av hindringer.

[RoleTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/RoleTable.cs) representerer tabellen i databasen som lagrer brukerroller.

[UserTable](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/Tables/UserTable.cs) representerer tabellen i databasen som lagrer brukerinformasjon.

## Kontrollere

[AdminController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/AdminController.cs) håndterer administrasjon spesifikke funksjoner for registrerte hindringer.

[HomeController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/HomeController.cs) håndterer startsiden.

[MapController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/MapController.cs) håndterer kartvisning.

[ObjectTypesController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/ObjectTypesController.cs) håndterer typer til hindringer.

[ReportController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/ReportController.cs) håndterer tilbakemeldinger av hindringer.

[UserController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/UserController.cs) handterer brukerrelaterte funksjoner som registrering og pålogging.

## Views

### User

[Login](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/User/Login.cshtml) - Side for brukerpålogging.

[Register](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/User/Register.cshtml) - Side for brukerregistrering.

[AccessDenied](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/User/AccessDenied.cshtml) - Side som vises når en bruker prøver å få tilgang til en side de ikke har tillatelse til.

### Report

[Index](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/Index.cshtml) - Side for å se alle rapporterte hindringer.

[Details](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/Details.cshtml) - Side for å se detaljer om en rapport.

[Object](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/Object.cshtml) - Side for å se detaljer om en spesifikk hindring.

[\_Map{Container,Scripts,Styles}Partial](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/tree/main/Kartverket.Web/Views/Report) - Delvise visninger for å integrere kart i rapportvisningene.

[ErrorView](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/ErrorView.cshtml) - Side som vises ved feil.

### Map

[Index](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Map/Index.cshtml) - Side for å vise kart for å registrere hindringer.

### Home

[Index](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Home/Index.cshtml) - Startsiden for applikasjonen.

## React

Gruppen har tatt i bruk React for å bygge et interaktivt kartgrensesnitt. Koden for React applikasjonen ligger i [map-ui]() mappen i prosjektet. Denne applikasjonen kommuniserer med backend via REST API-et for å hente og sende data relatert til hindringer. Kartet er bygget ved bruk av Leaflet biblioteket for kartvisualisering og håndtering av geografiske data. Det er implementert i [MapController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/MapController.cs#L44), [Kart View](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Map/Index.cshtml), [ReportController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/ReportController.cs#L72) og [Rapport Detaljer View](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/Details.cshtml#L133) for å tillate brukere å legge til, vise, og administrere hindringer på kartet. Det er tatt i bruk [Vite.AspNetCore](https://github.com/Eptagone/Vite.AspNetCore) biblioteket for å integrere React applikasjonen med ASP.NET Core backend.

## Autentisering og Autorisering

Gruppen har tatt i bruk ASP.NET Core Identity rammeverket for å håndtere brukerautentisering og autorisering. Dette inkluderer funksjoner som brukerregistrering, pålogging, rollebasert tilgangskontroll, og passordhåndtering. Brukere kan registrere seg og logge inn via [UserController](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Controllers/UserController.cs) og tilhørende views. Autorisering er implementert ved bruk av `[Authorize]` attributter på kontrollere og handlinger for å begrense tilgang basert på brukerroller som "User", "Pilot" og "Kartverket". Passord er lagret sikkert ved bruk av hashing og salting mekanismer som tilbys av Identity rammeverket.

# Database

Applikasjonen bruker Entity Framework Core som ORM (Object-Relational Mapping) verktøy for å kommunisere med en MariaDB database. Dette gir en abstraksjon over databaseoperasjoner og tillater utviklere å jobbe med databasen ved hjelp av C# objekter i stedet for rå SQL-spørringer.

Entity Framework Core håndterer opprettelsen og migreringen av database tabeller basert på modellene definert i applikasjonen. Når applikasjonen startes, sjekker EF Core om databasens skjema samsvarer med modellene, og utfører nødvendige migrasjoner for å oppdatere databasen til den nyeste versjonen.

DbGate er lagt til i docker-compose filen for enkel tilgang til databasen via en webgrensesnitt. Dette kan nås ved å navigere til `http://localhost:3000` i en nettleser når applikasjonen kjører via docker.

# Test

Enhetstester er implementert ved bruk av xUnit rammeverket. Testene dekker serviselaget. Testene kan finnes i [Kartverket.Web.Tests](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/tree/main/Kartverket.Web.Tests) og kjøres ved hjelp av testløperen i Visual Studio, Rider, eller via kommandolinjen med `dotnet test` kommandoen.

Det er utført unit tester, integrasjonstester, samt sikkerhetstester for å sikre at applikasjonen fungerer som forventet og er beskyttet mot vanlige sikkerhetstrusler.

Unit tester dekker serviselaget for å sikre at forretningslogikken fungerer korrekt.

## Sikkerhetstesting

Sikkerhetstester er utført for å identifisere og mitigere potensielle sikkerhetssårbarheter i applikasjonen. Følgende tester er gjennomført:

| #   | Beskrivelse                                                                                         | Resultat                                                                      |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Test for SQL-injeksjon ved å sende ondsinnet input til brukerregistrering og pålogging.             | Entity Framework beskytter mot dette                                          |
| 2   | Test for XSS ved å sende ondsinnet skript i rapporteringsskjemaet.                                  | Unngått ved å ikke bruke funksjoner som tillater HTML input                   |
| 3   | Test for CSRF ved å prøve å utføre handlinger uten gyldig CSRF-token.                               | Beskyttet ved bruk av AntiForgeryToken i skjemaer                             |
| 4   | Test for tilgangskontroll ved å prøve å få tilgang til administrasjonsfunksjoner uten riktig rolle. | Beskyttet ved bruk av Authorize attributter samt rollebasert tilgangskontroll |
| 5   | Test for passordstyrke ved å prøve å registrere brukere med svake passord.                          | Håndtert ved å sette minimumskrav for passord i Identity innstillingene       |

## Systemtesting

Systemtester er utført for å verifisere at applikasjonen fungerer som forventet i et helhetlig miljø. Følgende tester er gjennomført:

| #   | Beskrivelse                                                                  | Resultat |
| --- | ---------------------------------------------------------------------------- | -------- |
| 1   | Test av brukerregistrering og pålogging med gyldige og ugyldige data.        | Bestått  |
| 2   | Test av rapportering av hindringer med ulike typer og lokasjoner.            | Bestått  |
| 3   | Test av visning av rapporterte hindringer på kartet.                         | Bestått  |
| 4   | Test av administrasjonsfunksjoner som godkjenning og avvisning av rapporter. | Bestått  |
| 5   | Test av tilbakemeldingssystemet for rapporterte hindringer.                  | Bestått  |

## Brukervennlighetstesting

Brukervennlighetstester er utført for å evaluere hvor intuitiv og enkel applikasjonen er å bruke. Følgende tester er gjennomført:

| #   | Beskrivelse                                                             | Resultat   | Kommentar                                           |
| --- | ----------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| 1   | Evaluering av navigasjonsstruktur og brukervennlighet av grensesnittet. | God        |                                                     |
| 2   | Test av responsiv design på ulike enheter og skjermstørrelser.          | God        |                                                     |
| 3   | Innsamling av tilbakemeldinger fra brukere om funksjonalitet og design. | Positive   |                                                     |
| 4   | Test av lastetider og ytelse under ulike nettverksforhold.              | Akseptabel | Kartdata kan ta tid å laste inn ved tregt nettverk. |

# Lokal utvikling

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
