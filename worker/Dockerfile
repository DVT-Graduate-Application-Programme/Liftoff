# worker/Dockerfile
#
# Build context is the repository root, not worker/ — the worker references
# backend/src/Domain for the shared message contracts.
#
# Targets mirror backend/Dockerfile:
#   --target development   DOTNET_ENVIRONMENT=Development
#   --target production    DOTNET_ENVIRONMENT=Production (default target)

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# The worker only depends on the Domain project (shared message contracts).
COPY backend/src/Domain/*.csproj ./backend/src/Domain/
COPY worker/*.csproj ./worker/
RUN dotnet restore worker/Worker.csproj

COPY backend/src/Domain ./backend/src/Domain
COPY worker ./worker
RUN dotnet publish worker/Worker.csproj -c Release -o /app/publish /p:UseAppHost=false

# ── Shared runtime ────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN useradd --no-create-home --shell /bin/false appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app && chmod -R 755 /app
RUN mkdir -p /logs && chown appuser:appuser /logs
USER appuser
ENTRYPOINT ["dotnet", "Worker.dll"]

# ── Development ───────────────────────────────────────────────────────────────

FROM runtime AS development
ENV DOTNET_ENVIRONMENT=Development

# ── Production (default) ──────────────────────────────────────────────────────

FROM runtime AS production
ENV DOTNET_ENVIRONMENT=Production \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_EnableDiagnostics=0
