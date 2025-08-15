# Database Setup for Ung Utehjelp

## 🗄️ Sette opp Supabase Database

### Steg 1: Gå til Supabase Dashboard
1. Åpne [supabase.com](https://supabase.com)
2. Logg inn og velg ditt prosjekt
3. Gå til **"SQL Editor"** i venstre meny

### Steg 2: Kjør Database Schema
1. Klikk **"New Query"**
2. Kopier og lim inn hele innholdet fra `schema.sql` filen
3. Klikk **"Run"** for å kjøre SQL-koden

### Steg 3: Verifiser at tabellene er opprettet
1. Gå til **"Table Editor"** i venstre meny
2. Du skal nå se disse tabellene:
   - `profiles`
   - `jobs`
   - `applications`
   - `messages`
   - `notifications`

### Steg 4: Test appen
1. Gå tilbake til din Vercel app: https://ungservice2025.vercel.app
2. Prøv å legge ut et oppdrag
3. Det skal nå fungere!

## 🔧 Hvis du får feil:

### Feil 1: "Could not find the table 'public.jobs'"
**Løsning:** Kjør schema.sql i Supabase SQL Editor

### Feil 2: "RLS policy error"
**Løsning:** Sjekk at Row Level Security er aktivert på alle tabeller

### Feil 3: "Auth error"
**Løsning:** Sjekk at Supabase URL og API nøkkel er riktig i Vercel environment variables

## 📋 Environment Variables i Vercel:
Sørg for at disse er satt i Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Når databasen er satt opp:
- Du kan opprette brukerkontoer
- Legge ut oppdrag
- Søke på oppdrag
- Sende meldinger
- Alt fungerer som forventet!
