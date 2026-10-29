FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER root
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy all project files to restore dependencies
COPY ["GitSight.Api/GitSight.Api.csproj", "GitSight.Api/"]
COPY ["GitSight.Application/GitSight.Application.csproj", "GitSight.Application/"]
COPY ["GitSight.Domain/GitSight.Domain.csproj", "GitSight.Domain/"]
COPY ["GitSight.Infrastructure/GitSight.Infrastructure.csproj", "GitSight.Infrastructure/"]

# Restore dependencies for the API project (this will implicitly restore the others)
RUN dotnet restore "GitSight.Api/GitSight.Api.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/GitSight.Api"
RUN dotnet build "GitSight.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "GitSight.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GitSight.Api.dll"]
