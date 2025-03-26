# Implementationsplan & Tjekliste

## Projektstruktur
- [x] `index.html` - Hovedside med login og app interface
- [x] `style.css` - Styling og responsivt design
- [x] `auth.js` - Google OAuth håndtering
- [ ] `maps.js` - Google Maps API integration
- [ ] `storage.js` - Data håndtering og Google Sheets integration
- [x] `app.js` - Hovedapplikationslogik
- [x] `README.md` - Projektdokumentation

## Feature Prioritering

For at sikre hurtig udvikling af en brugsbar app prioriteres features således:

### Højeste prioritet (MVP)
1. Basal kørselsregistrering med manuel indtastning
2. Google Maps afstandsberegning
3. Lokal lagring af data (localStorage)
4. Google Sheets synkronisering

### Sekundær prioritet
1. Ofte besøgte adresser
2. Redigering/sletning af tidligere registreringer
3. "Find min position" funktion
4. Tur/retur beregning

### Laveste prioritet
1. CSV-eksport
2. Filtrering og periodeoversigter
3. 60-dages regel advarsel
4. UI forbedringer og animationer

## Implementationstrin

### 1. Basisopsætning ✅
- [x] Opret GitHub repository
- [x] Opsæt basal HTML struktur med responsive design
- [x] Konfigurer GitHub Pages

### 2. Google API Opsætning ✅
- [x] Opret projekt i Google Developer Console
- [x] Aktiver og konfigurer OAuth 2.0
- [x] Få API-nøgler til Google Maps
- [x] Aktiver Google Sheets API

### 3. Autentificering ✅
- [x] Implementer Google OAuth login flow med Google Identity Services (GIS)
- [x] Opret session management
- [x] Test login/logout funktionalitet

### 3.1. Autentificering Bug Fixes 🔄
- [ ] Løs problem med session persistence (bruger skal logge ind igen ved nye tabs/vinduer)
  - Implementer cookie eller localStorage-baseret session management
  - Gem tokens sikkert og genskab session når appen indlæses
- [ ] Fikser logout funktionalitet, som ikke fungerer korrekt
  - Sikre at tokens revokeres korrekt ved logout
  - Opdater UI korrekt efter logout

### 4. Lokationsbaserede Funktioner 🔄
- [ ] Implementer Google Maps integration
  - [ ] Løs fejl ved indlæsning af Google Maps API
  - [ ] Undgå dobbelt indlæsning af Google Maps API
  - [ ] Tilføj loading=async parameter til script tags
  - [ ] Fejlhåndtering for "autocompleteAddress is not defined"
  - [ ] Fejlhåndtering for "getSettings is not defined"
  - [ ] Håndter "Cannot read properties of undefined (reading 'JH')" fejl
- [ ] Tilføj "Find min position" funktion
- [ ] Implementer adressesøgning
- [ ] Implementer afstandsberegning mellem to punkter

### 5. Kørebogsfunktionalitet 🔄
- [x] Design og implementer formular til kørselsdata
- [ ] Implementer automatisk beregning af kørt distance
- [ ] Tilføj funktion til tur/retur beregning
- [ ] Implementer lagring af ofte besøgte adresser
- [ ] Tilføj funktionalitet til at redigere tidligere registreringer
- [ ] Tilføj funktionalitet til at slette registreringer

### 6. Datahåndtering 🔄
- [ ] Implementer temporær lagring i browser (localStorage)
- [ ] Implementer synkronisering med Google Sheets
- [ ] Håndtering af offline-registreringer ved næste online-forbindelse
- [ ] Tilføj CSV eksport funktionalitet

### 7. UI & Brugeroplevelse 🔄
- [x] Implementer responsivt design optimeret til mobil
- [ ] Tilføj loading states og simpel fejlhåndtering
- [x] Implementer dansk brugergrænseflade
- [ ] Tilføj hjælpesektion med VSO-regler og 60-dages reglen

### 8. Test & Finpudsning ⏱️
- [ ] Test på forskellige mobile enheder
- [ ] Simpel sikkerhedstest af OAuth implementering
- [ ] Brugervenlighedsoptimeringer

### 9. Deployment 🔄
- [x] Initial deploy til GitHub Pages
- [ ] Final deploy til GitHub Pages
- [ ] Dokumenter simpel brugsvejledning

## Fejlhåndtering
- [ ] Gem data lokalt og marker som ikke-synkroniseret ved manglende internetforbindelse
- [ ] Vis simpel status ved næste opstart med internet

## Status og næste skridt (opdateret)

### Opnået milepæle:
- ✅ Basisopsætning af repositoriet og GitHub Pages
- ✅ Google OAuth 2.0 authentication er implementeret og fungerer med moderne Google Identity Services (GIS)
- ✅ Responsivt design er implementeret
- ✅ Dansk brugergrænseflade er implementeret
- ✅ Basal UI til kørselsregistrering er på plads

### Næste skridt:
1. **Google Maps Integration:**
   - Implementer Google Maps API for adressesøgning
   - Tilføj afstandsberegningsfunktionalitet
   - Implementer "Find min position" funktion

2. **Datahåndtering:**
   - Implementer lokal lagring af kørselsdata med localStorage
   - Udvikl integration med Google Sheets API til cloud-synkronisering
   - Tilføj offline-funktionalitet

3. **UI Polering:**
   - Tilføj loading states
   - Forbedre fejlhåndtering med brugervenlige beskeder
   - Tilføj hjælpetekster om kørselsregler

## Diagnose af authenticerings-bugs

### Session Persistence Problem
**Diagnose:** Appen gemmer ikke brugerens login-session mellem sideindlæsninger eller i nye tabs/vinduer.

**Årsag:** Der implementeres ikke session persistence ved brug af cookies eller localStorage. Tokens gemmes kun i memory.

**Løsning:**
1. Gem access_token og token expiration i localStorage eller i en secure cookie
2. Implementer en check ved app start, der validerer det gemte token
3. Auto-refresh tokens når de er ved at udløbe

### Logout Funktionalitet Problem
**Diagnose:** Logout-knappen ser ikke ud til at fungere korrekt. UI og session ændres ikke ved klik.

**Årsag:** Problemer med token revocation og/eller UI-opdatering efter logout.

**Løsning:**
1. Sikre at token revokation fungerer ved at implementere fejlhåndtering og logging
2. Sikre korrekt kald til 'updateUIForUnauthenticatedUser' efter vellykket logout
3. Ryd også tokens fra localStorage/cookies ved logout

## Diagnose af Google Maps API fejl

### Google Maps indlæsnings- og initialiseringsproblemer
**Diagnose:** Efter login vises fejlmeddelelser relateret til Google Maps API og manglende funktioner.

**Årsag:** 
1. API indlæses flere gange
2. Visse funktioner som 'autocompleteAddress' og 'getSettings' er ikke defineret
3. Timing-problemer ved initialisering af Google Maps API

**Løsning:**
1. Implementer lazy loading af Google Maps API
2. Sikre at alle nødvendige funktioner er implementeret i de relevante moduler
3. Tilføj 'loading=async' parameter til Google Maps script tag
4. Implementer en mere robust initialiseringssekvens for Maps API

Disse fejl bør prioriteres for at sikre en stabil brugeroplevelse og for at undgå problemer med Google Maps integration.
