# Implementationsplan & Tjekliste

## Projektstruktur
- [ ] `index.html` - Hovedside med login og app interface
- [ ] `style.css` - Styling og responsivt design
- [ ] `auth.js` - Google OAuth håndtering
- [ ] `maps.js` - Google Maps API integration
- [ ] `storage.js` - Data håndtering og Google Sheets integration
- [ ] `app.js` - Hovedapplikationslogik
- [ ] `README.md` - Projektdokumentation

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

### 1. Basisopsætning
- [x] Opret GitHub repository
- [x] Opsæt basal HTML struktur med responsive design
- [x] Konfigurer GitHub Pages

### 2. Google API Opsætning
- [ ] Opret projekt i Google Developer Console
- [ ] Aktiver og konfigurer OAuth 2.0
- [ ] Få API-nøgler til Google Maps
- [ ] Aktiver Google Sheets API

### 3. Autentificering
- [ ] Implementer Google OAuth login flow
- [ ] Opret session management
- [ ] Test login/logout funktionalitet

### 4. Lokationsbaserede Funktioner
- [ ] Implementer Google Maps integration
- [ ] Tilføj "Find min position" funktion
- [ ] Implementer adressesøgning
- [ ] Implementer afstandsberegning mellem to punkter

### 5. Kørebogsfunktionalitet
- [ ] Design og implementer formular til kørselsdata
- [ ] Implementer automatisk beregning af kørt distance
- [ ] Tilføj funktion til tur/retur beregning
- [ ] Implementer lagring af ofte besøgte adresser
- [ ] Tilføj funktionalitet til at redigere tidligere registreringer
- [ ] Tilføj funktionalitet til at slette registreringer

### 6. Datahåndtering
- [ ] Implementer temporær lagring i browser (localStorage)
- [ ] Implementer synkronisering med Google Sheets
- [ ] Håndtering af offline-registreringer ved næste online-forbindelse
- [ ] Tilføj CSV eksport funktionalitet

### 7. UI & Brugeroplevelse
- [ ] Implementer responsivt design optimeret til mobil
- [ ] Tilføj loading states og simpel fejlhåndtering
- [ ] Implementer dansk brugergrænseflade
- [ ] Tilføj hjælpesektion med VSO-regler og 60-dages reglen

### 8. Test & Finpudsning
- [ ] Test på forskellige mobile enheder
- [ ] Simpel sikkerhedstest af OAuth implementering
- [ ] Brugervenlighedsoptimeringer

### 9. Deployment
- [ ] Final deploy til GitHub Pages
- [ ] Dokumenter simpel brugsvejledning

## Fejlhåndtering

Ved manglende internetforbindelse:
- [ ] Gem data lokalt og marker som ikke-synkroniseret
- [ ] Vis simpel status ved næste opstart med internet
