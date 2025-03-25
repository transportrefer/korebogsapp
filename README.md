# Kørebogs-app

En brugervenlig webapplikation til personlig registrering af erhvervskørsel for enkeltmandsvirksomheder med VSO-ordning.

## Teknologisk Tilgang: Vite + Vanilla JS

Projektet bruger en enkel og effektiv teknologisk tilgang:

1. **Vite** som build tool for hurtig udvikling og optimerede builds
2. **Vanilla JavaScript** med moderne ES modules for klar struktur uden framework overhead
3. **CSS Custom Properties** for konsistent styling og themeing
4. **Google APIs** for authentication, maps og sheets integration
5. **Responsive Design** med fokus på mobilbrug

## Projektstruktur

```
korebogsapp/
├── src/
│   ├── js/
│   │   ├── auth.js          # Google OAuth implementering
│   │   ├── maps.js          # Google Maps integration
│   │   ├── storage.js       # Local storage og Google Sheets
│   │   └── ui.js            # UI håndtering
│   ├── main.js              # App initialisering
│   └── style.css            # Styling
├── index.html               # Hoved-HTML
├── callback.html            # OAuth callback-håndtering
├── vite.config.js           # Vite konfiguration
└── package.json             # Afhængigheder
```

## Features

- Google OAuth login
- Automatisk afstandsberegning via Google Maps
- Synkronisering med Google Sheets
- Lokal lagring af data
- Mobil-optimeret brugergrænseflade
- Offline-understøttelse med synkronisering ved genetableret forbindelse
- Redigering og sletning af kørselsregistreringer

## Udvikling

### Forudsætninger

- Node.js (version 14.x eller nyere)
- npm eller yarn
- Google Developer account til API-nøgler

### Opsætning

1. Klon repositoriet:
   ```bash
   git clone https://github.com/transportrefer/korebogsapp.git
   cd korebogsapp
   ```

2. Installer afhængigheder:
   ```bash
   npm install
   ```

3. Start udviklingsserveren:
   ```bash
   npm run dev
   ```

4. Åbn browseren på `http://localhost:5173`

### Konfiguration af Google API

For at bruge applikationen skal du oprette et projekt i Google Cloud Platform og aktivere følgende APIs:

1. Google OAuth 2.0
2. Google Maps JavaScript API
3. Google Sheets API

#### Trin-for-trin setup af Google API:

1. Gå til [Google Cloud Console](https://console.cloud.google.com/)
2. Opret et nyt projekt
3. Aktiver de nødvendige APIs (OAuth, Maps, Sheets)
4. Konfigurer OAuth consent screen
   - Vælg "External" brugertype
   - Udfyld de påkrævede felter (app navn, bruger support email)
   - Tilføj `/auth/drive.file` og `/auth/spreadsheets` som scopes
5. Opret OAuth credentials
   - Vælg "Web application" som applikationstype
   - Tilføj JavaScript origins: `https://yourusername.github.io` (eller din egen URL)
   - Tilføj redirect URIs: `https://yourusername.github.io/drivers-book-app/callback.html`
6. Kopiér Client ID og opret API nøgler
7. Opret en `.env` fil i rod-mappen med følgende indhold:

```
VITE_GOOGLE_CLIENT_ID=din-client-id
VITE_GOOGLE_API_KEY=din-api-nøgle
```

**Bemærk**: Efter deployment skal du opdatere de tilladte JavaScript origins og redirect URIs i Google Cloud Console til at pege på din faktiske GitHub Pages URL.

## Deployment

Projektet er konfigureret til deployment på GitHub Pages:

```bash
# Byg projektet
npm run build

# Deploy til GitHub Pages
npm run deploy
```

## API Integration

Applikationen integrerer med følgende Google APIs:

1. **Google OAuth**: Til brugerautentificering
2. **Google Maps API**: Til afstandsberegning og adressesøgning
3. **Google Sheets API**: Til synkronisering af kørselsdata

## Licens

Dette projekt er udviklet som et personligt værktøj og er ikke licenceret til kommerciel brug uden tilladelse. 