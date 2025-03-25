# Kørebogs-app Projektspecifikation

## Projektformål
At udvikle en brugervenlig, mobiloptimeret webapplikation til personlig registrering af erhvervskørsel for en enkeltmandsvirksomhed med VSO-ordning, med automatisk beregning af afstande via Google Maps API og synkronisering til Google Sheets. Applikationen skal være simpel, fejlfri og hurtig at udvikle.

## Kernefeatures

### Bruger & Autentificering
- Enkel Google OAuth login for sikker adgang
- Kun til personlig brug for ejeren

### Kørselsregistrering
- Indtastning af kørselsdata med dato, start- og slutdestination
- "Find min nuværende lokation" funktion
- Automatisk afstandsberegning via Google Maps API (routes foreslået af Google Maps accepteres som korrekte)
- Mulighed for at markere tur/retur
- Ofte besøgte adresser gemmes for hurtigere registrering
- Mulighed for at redigere og slette tidligere registreringer

### Data & Synkronisering
- Automatisk synkronisering til Google Sheets/Drive
- Simpel håndtering af offline-registreringer
- CSV-eksportmulighed
- Samme datastruktur som eksisterende kørebog

### Rapportering
- Simpel oversigt over kørte kilometer og beløb
- Basal filtrering på periode

### Vejledning
- Informationssektion med regler for VSO-kørsel og 60-dages reglen

## UI & Design
- Dansk brugerinterface
- Responsivt design primært optimeret til mobil
- Enkel navigation og indtastningsformular
- Genvej til ofte besøgte destinationer
- Fokus på enkelhed og brugervenlighed frem for avancerede features

## Tekniske Krav
- Hostes på GitHub Pages
- Integration med Google OAuth, Maps API og Sheets API
- Responsivt design der fungerer godt på mobiltelefoner
- Simpel håndtering af midlertidige offline perioder
- Prioritering af simplicitet og fejlfri funktionalitet frem for avancerede features

## Vigtige Prioriteringer
- Appen er til personlig brug, så avancerede sikkerhedstiltag har lav prioritet
- Simplicitet og brugervenlighed prioriteres højt
- Hurtig udvikling prioriteres over omfattende funktionalitet
