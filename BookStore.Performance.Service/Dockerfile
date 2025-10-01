# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["BookStore.Performance.Service/BookStore.Performance.Service.csproj", "BookStore.Performance.Service/"]
COPY ["BookStore.Common/BookStore.Common.csproj", "BookStore.Common/"]
COPY ["BookStore.Common.Instrumentation/BookStore.Common.Instrumentation.csproj", "BookStore.Common.Instrumentation/"]
RUN dotnet restore "BookStore.Performance.Service/BookStore.Performance.Service.csproj"

# Copy all source code and build
COPY . .
WORKDIR "/src/BookStore.Performance.Service"
RUN dotnet build "BookStore.Performance.Service.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "BookStore.Performance.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks and docker CLI for K6 orchestration
RUN apt-get update && \
    apt-get install -y curl ca-certificates gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 7003
EXPOSE 7004

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BookStore.Performance.Service.dll"]
