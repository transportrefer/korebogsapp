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

## Setup for Development

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Google Cloud Platform account with Maps JavaScript API and OAuth 2.0 credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/transportrefer/korebogsapp.git
   cd korebogsapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your Google API keys (never commit this file to git):
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   VITE_GOOGLE_API_KEY=your-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Google API Setup (Important Security Information)

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use an existing one
3. Enable the Google Maps JavaScript API and Places API
4. Create an API key
5. **Important**: Apply restrictions to your API key:
   - Under "Application restrictions", select "Website restrictions"
   - Add your domain (e.g., `https://yourdomain.com/*` or `http://localhost:*` for development)
   - Under "API restrictions", restrict the key to only the APIs you need:
     - Maps JavaScript API
     - Places API
     - Distance Matrix API
     - Geocoding API

### Google OAuth Client ID

1. In the Google Cloud Console, navigate to "APIs & Services" > "Credentials"
2. Create an OAuth 2.0 Client ID
3. Configure the OAuth consent screen
4. Add authorized JavaScript origins:
   - `https://yourdomain.com` (production)
   - `http://localhost:5173` (development)
5. Add authorized redirect URIs:
   - `https://yourdomain.com/callback.html` (production)
   - `http://localhost:5173/callback.html` (development)

## Deployment

### GitHub Pages

1. Update the `.env.production` file with your production API keys (these will be included in the build)
2. Make sure your API keys have proper restrictions to prevent unauthorized usage
3. Run the deployment script:
   ```bash
   npm run deploy
   ```

### Security Best Practices

- **Never** commit API keys to your repository
- Always use environment variables for sensitive information
- Apply appropriate restrictions to your API keys
- For production, use a CI/CD pipeline with secrets management
- Regularly review your Google Cloud Console for any unusual activity

## Licens

Dette projekt er udviklet som et personligt værktøj og er ikke licenceret til kommerciel brug uden tilladelse.
