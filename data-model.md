# Datamodel & Struktur

## Kørselsregistrering Data

Baseret på den eksisterende Google Sheets struktur vil applikationen bruge følgende datamodel:

```javascript
{
  kørselsData: [
    {
      id: "unique-id-123", // Unik identifier for hver kørselsregistrering
      dato: "2024-06-24",  // Dato for kørsel (YYYY-MM-DD)
      startAdresse: "Tordenskjoldsgade 21, 1055 København K", // Fra adresse
      slutAdresse: "Agern Alle 5A, 2970 Hørsholm", // Til adresse
      antalKm: 25.5, // Beregnet distance via Google Maps
      sats: 3.79, // Anvendt kilometersats (Kr/km)
      formål: "Kunde", // Formål med kørslen
      beløb: 96.645, // Beregnet kørselsgodtgørelse (antalKm * sats)
      turRetur: false, // Flag for om det er en tur/retur kørsel
      synkroniseret: false, // Flag der indikerer om data er synkroniseret til Google Sheets
      tidspunktOprettet: "2024-06-24T10:30:00" // Tidspunkt for oprettelse
    }
  ]
}
```

## Google Sheets Struktur

Appen vil synkronisere data til Google Sheets i følgende format (tabelnavn og kolonner):

```
Kørselsregnskab

| Kørselsdato | Kørt fra | Kørt til | Antal km | Anvendt sats, kr. | Formål med kørslen | Kørselsgodtgørelse |
|-------------|----------|----------|----------|-------------------|-------------------|-------------------|
| 24.06.2024  | Tordenskjoldsgade 21, 1055 København K | Agern Alle 5A, 2970 Hørsholm | 25.50 | 3.79 | Kunde | 96.65 |
```

## Ofte Besøgte Adresser

Appen gemmer ofte besøgte adresser i browseren via localStorage:

```javascript
{
  oftebesøgteAdresser: [
    {
      id: "addr-123",
      adresse: "Agern Alle 5A, 2970 Hørsholm",
      beskrivelse: "Kunde A",
      sidstBesøgt: "2024-06-24"
    },
    {
      id: "addr-124",
      adresse: "Lyngby Hovedgade 10, 2800 Kgs. Lyngby",
      beskrivelse: "Kunde B",
      sidstBesøgt: "2024-06-20"
    }
  ]
}
```

## Brugerindstillinger

Appen gemmer brugerindstillinger lokalt:

```javascript
{
  indstillinger: {
    standardSats: 3.79, // Standard kilometersats
    standardStartAdresse: "Tordenskjoldsgade 21, 1055 København K", // Standard startadresse
    googleSheetsId: "1ABC123DEF456GHI789", // ID på det Google Sheet der synkroniseres til
    visAdvarselVed60DagesReglen: true // Om der skal vises advarsel ved 60-dages reglen
  }
}
```

## Google Sheets Integration & Offline Håndtering

Ved oprettelse af en ny kørselsregistrering i appen vil følgende flow ske:

1. Data gemmes først lokalt i browseren med `synkroniseret: false`
2. Der etableres forbindelse til Google Sheets API via OAuth
3. Data appendes til det konfigurerede Google Sheet
4. Ved succesfuld synkronisering opdateres registreringen til `synkroniseret: true`

Hvis brugeren er offline ved indtastning:
1. Data gemmes lokalt med `synkroniseret: false`
2. Næste gang appen åbnes og der er internetforbindelse, tjekkes for ikke-synkroniserede poster
3. Alle ikke-synkroniserede poster forsøges synkroniseret til Google Sheets
4. Der vises en simpel status over, hvor mange poster der blev synkroniseret

Dette sikrer at data ikke går tabt selv ved midlertidige forbindelsesproblemer.
