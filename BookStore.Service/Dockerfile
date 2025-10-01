# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["BookStore.Service/BookStore.Service.csproj", "BookStore.Service/"]
COPY ["BookStore.Common/BookStore.Common.csproj", "BookStore.Common/"]
COPY ["BookStore.Common.Instrumentation/BookStore.Common.Instrumentation.csproj", "BookStore.Common.Instrumentation/"]
RUN dotnet restore "BookStore.Service/BookStore.Service.csproj"

# Copy all source code and build
COPY . .
WORKDIR "/src/BookStore.Service"
RUN dotnet build "BookStore.Service.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "BookStore.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

EXPOSE 7001
EXPOSE 7002

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BookStore.Service.dll"]
