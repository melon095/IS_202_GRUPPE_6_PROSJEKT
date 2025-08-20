FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["IS_202_6.Web/IS_202_6.Web.csproj", "IS_202_6.Web/"]
RUN dotnet restore "IS_202_6.Web/IS_202_6.Web.csproj"
COPY . .
WORKDIR "/src/IS_202_6.Web"
RUN dotnet build "IS_202_6.Web.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "IS_202_6.Web.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IS_202_6.Web.dll"]
