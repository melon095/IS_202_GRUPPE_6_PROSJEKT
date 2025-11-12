# --------------------------------
# Bygge react prosjektet
FROM docker.io/node:24-alpine AS frontend-build
WORKDIR /src/
ARG NODE_ENV=production

COPY ["Kartverket.Web/map-ui/package.json", "Kartverket.Web/map-ui/pnpm-lock.yaml", "./"]

RUN corepack enable && corepack prepare pnpm@10.21 --activate
RUN pnpm install --frozen-lockfile

COPY ["Kartverket.Web/map-ui/", "./"]
RUN pnpm run build

# --------------------------------
# Legge til ASP.NET Core runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app

# --------------------------------
# Bygge ASP.NET Core applikasjonen
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Kartverket.Web/Kartverket.Web.csproj", "Kartverket.Web/"]
RUN dotnet restore "./Kartverket.Web/Kartverket.Web.csproj"
COPY . .

COPY --from=frontend-build /wwwroot/ ./Kartverket.Web/wwwroot/
WORKDIR "/src"
RUN dotnet build "./Kartverket.Web/" -c $BUILD_CONFIGURATION -o /app/build

# --------------------------------
# Publisere applikasjonen
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Kartverket.Web" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# --------------------------------
# Kjøre applikasjonen
FROM base AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Kartverket.Web.dll"]

# --------------------------------
