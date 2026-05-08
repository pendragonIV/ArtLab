# Sử dụng SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ArtLab.Backend.csproj", "./"]
RUN dotnet restore "ArtLab.Backend.csproj"
COPY . .
RUN dotnet publish "ArtLab.Backend.csproj" -c Release -o /app/publish

# Sử dụng runtime để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ArtLab.Backend.dll"]
