# worker/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# The worker only depends on the Domain project (shared message contracts).
COPY backend/src/Domain/*.csproj ./backend/src/Domain/
COPY worker/*.csproj ./worker/
RUN dotnet restore worker/Worker.csproj

COPY backend/src/Domain ./backend/src/Domain
COPY worker ./worker
RUN dotnet publish worker/Worker.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN useradd --no-create-home --shell /bin/false appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app && chmod -R 755 /app
RUN mkdir -p /logs && chown appuser:appuser /logs
USER appuser
ENTRYPOINT ["dotnet", "Worker.dll"]
