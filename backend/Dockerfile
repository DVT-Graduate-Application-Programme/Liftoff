# backend/Dockerfile
#
# Two build targets share one build stage, so dev and prod can never drift in what they
# compile — only in how they run:
#
#   --target development   ASPNETCORE_ENVIRONMENT=Development. Program.cs maps the OpenAPI
#                          document and the Scalar UI only under this name, so this is the
#                          image that serves /scalar. Used by docker-compose.yml and by the
#                          dev Azure deploy.
#   --target production    ASPNETCORE_ENVIRONMENT=Production. No API docs surface, and the
#                          .NET diagnostic/telemetry opt-outs are set. This is the default
#                          target (last stage), so a plain `docker build` is prod-safe.
#
# The environment name is also set explicitly on each Container App (see
# infrastructure/azure/environments.tf); the container-level variable wins over the one
# baked in here. Both are set deliberately: the image has a safe default on its own, and
# the deployed app states its environment where an operator can see it.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY *.slnx ./
COPY src/Domain/*.csproj ./src/Domain/
COPY src/Application/*.csproj ./src/Application/
COPY src/Infrastructure/*.csproj ./src/Infrastructure/
COPY src/Api/*.csproj ./src/Api/
RUN dotnet restore src/Api/Api.csproj

COPY . .
RUN dotnet publish src/Api/Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ── Shared runtime ────────────────────────────────────────────────────────────

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN useradd --no-create-home --shell /bin/false appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app && chmod -R 755 /app
RUN mkdir -p /logs && chown appuser:appuser /logs
USER appuser
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Api.dll"]

# ── Development ───────────────────────────────────────────────────────────────

FROM runtime AS development
ENV ASPNETCORE_ENVIRONMENT=Development

# ── Production (default) ──────────────────────────────────────────────────────

FROM runtime AS production

# Stack traces stop leaking into responses on their own here — the developer exception page
# is Development-only. DOTNET_EnableDiagnostics=0 additionally closes the diagnostic IPC
# socket, which has no use in a deployed replica.
ENV ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_EnableDiagnostics=0
