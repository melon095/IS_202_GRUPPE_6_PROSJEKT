# Kartverket

Denne repoen inneholder koden for Gruppe 6 sitt IS-202 Prosjekt.

Du kan starte prosjektet ved å kjøre følgende kommandoer:

```bash
docker compose up
```

# Drift

Applikasjonen kan enten startes manuelt via Visual Studio, Rider, eller med docker ved bruk av kommando `docker compose up` i terminalen.
Den kobler seg til en MariaDB Database der tabeller blir skapt automatisk fra https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Database/DatabaseContext.cs

En kan få tilgang til applikasjonen via nettleser på `http://localhost:8080`.

# Systemarkitektur

Systemer tar i bruk C# med ASP.NET Core MVC rammeverket for å bygge en webapplikasjon som tillater brukere å registrere seg, logge inn, rapportere hindringer på et kart, og administrere disse rapportene basert på brukerroller.

Applikasjonen bruker Entity Framework Core for å kommunisere med en MariaDB database der all data lagres.

React blir brukt for å bygge et interaktivt kartgrensesnitt der brukere kan plassere og visualisere hindringer.

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

[_Map{Container,Scripts,Styles}Partial](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/tree/main/Kartverket.Web/Views/Report) - Delvise visninger for å integrere kart i rapportvisningene.

[ErrorView](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Report/ErrorView.cshtml) - Side som vises ved feil.

### Map

[Index](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Map/Index.cshtml) - Side for å vise kart for å registrere hindringer.

### Home

[Index](https://github.com/melon095/IS_202_GRUPPE_6_PROSJEKT/blob/main/Kartverket.Web/Views/Home/Index.cshtml) - Startsiden for applikasjonen.

# Database

Applikasjonen bruker Entity Framework Core til abstraksjon av MariaDB database samt automatisk migrere database tabeller.

Dette blir brukt for å lagre og hente data fra MariaDB database.

# Test

Enhetstester er implementert ved bruk av xUnit rammeverket. Testene dekker serviselaget.

## Sikkerhetstesting

| # | Beskrivelse                                                                                         | Resultat |
|---|-----------------------------------------------------------------------------------------------------|----------|
| 1 | Test for SQL-injeksjon ved å sende ondsinnet input til brukerregistrering og pålogging.             | Entity Framework beskytter mot dette |
| 2 | Test for XSS ved å sende ondsinnet skript i rapporteringsskjemaet.                                  | Unngått ved å ikke bruke funksjoner som tillater HTML input |
| 3 | Test for CSRF ved å prøve å utføre handlinger uten gyldig CSRF-token.                               | Beskyttet ved bruk av AntiForgeryToken i skjemaer |
| 4 | Test for tilgangskontroll ved å prøve å få tilgang til administrasjonsfunksjoner uten riktig rolle. | Beskyttet ved bruk av Authorize attributter samt rollebasert tilgangskontroll |
| 5 | Test for passordstyrke ved å prøve å registrere brukere med svake passord.                          | Håndtert ved å sette minimumskrav for passord i Identity innstillingene |

## Systemtesting

| # | Beskrivelse                                                                  | Resultat |
| - |------------------------------------------------------------------------------|----------|
| 1 | Test av brukerregistrering og pålogging med gyldige og ugyldige data.        | Bestått  |
| 2 | Test av rapportering av hindringer med ulike typer og lokasjoner.            | Bestått  |
| 3 | Test av visning av rapporterte hindringer på kartet.                         | Bestått  |
| 4 | Test av administrasjonsfunksjoner som godkjenning og avvisning av rapporter. | Bestått  |
| 5 | Test av tilbakemeldingssystemet for rapporterte hindringer.                  | Bestått  |

## Brukervennlighetstesting

| # | Beskrivelse                                                             | Resultat     | Kommentar                                           |
| - |-------------------------------------------------------------------------|--------------|-----------------------------------------------------|
| 1 | Evaluering av navigasjonsstruktur og brukervennlighet av grensesnittet. | God          |                                                     |
| 2 | Test av responsiv design på ulike enheter og skjermstørrelser.          | God          |                                                     |
| 3 | Innsamling av tilbakemeldinger fra brukere om funksjonalitet og design. | Positive     |                                                     |
| 4 | Test av lastetider og ytelse under ulike nettverksforhold.              | Akseptabel   | Kartdata kan ta tid å laste inn ved tregt nettverk. |

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
