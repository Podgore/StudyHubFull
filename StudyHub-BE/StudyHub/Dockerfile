FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

COPY StudyHub.sln ./
COPY Entities/ Entities/
COPY StudyHub/ StudyHub/
COPY StudyHub.BLL/ StudyHub.BLL/
COPY StudyHub.Common/ StudyHub.Common/
COPY StudyHub.DAL/ StudyHub.DAL/
COPY StudyHub.FluentEmail/ StudyHub.FluentEmail/
COPY StudyHub.Hangfire/ StudyHub.Hangfire/
COPY StudyHub.Seeding/ StudyHub.Seeding/

RUN dotnet restore StudyHub.sln
RUN dotnet publish StudyHub/StudyHub.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "StudyHub.dll"]
