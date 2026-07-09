# Sjögren's Signal

A production-oriented MVP for pediatric rheumatology patients with Sjögren's syndrome. Patients and families
record simple daily check-ins between office visits; doctors review symptom trends, a composite "Sjögren's
Symptom Signal," and generate office visit reports scoped to any date range (defaulting to "since last
appointment").

> **Development version — not for clinical use.**
> This app does not diagnose flares or disease activity. It organizes patient/family-reported information and
> highlights patterns for physician review.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Row Level Security) ·
Recharts

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations** in `supabase/migrations/` in order, either via the Supabase SQL editor or the
   Supabase CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. **Copy `.env.example` to `.env.local`** and fill in your project's URL, anon key, and service role key
   (Project Settings → API in the Supabase dashboard).
4. **Install dependencies and start the app:**
   ```bash
   npm install
   npm run dev
   ```
5. **Seed demo data** (one clinic, Dr. Ben, four patients with 100+ days of check-in history, appointments,
   and a safety-flag example):
   ```bash
   npm run seed
   ```
   All seeded accounts share the password printed at the end of the script. The doctor login is
   `dr.ben@example.com`; each patient/family login is printed per patient (e.g. `kokomi.family@example.com`).

## Project structure

```
supabase/migrations/   Database schema, RLS policies, and the symptom catalog
src/lib/signal/        The Sjögren's Symptom Signal engine — pure, isolated, unit-testable
src/lib/reports/       Date-range resolution, office visit report aggregation
src/lib/supabase/      Browser / server / admin Supabase clients + session middleware
src/app/patient/       Patient/family daily check-in + dashboard
src/app/doctor/        Doctor dashboard, patient detail, office visit report
src/app/admin/         Clinic, invite, user, and symptom catalog management
scripts/seed.ts        Demo data seed script
```

## Roles

- **Patient / Family** — one unified account type; completes daily check-ins, sees their own history.
- **Doctor** — reviews assigned clinic patients, trends, signals, and generates reports.
- **Clinic Admin** — manages clinic users and patient invites.
- **Super Admin** — manages clinics and the global symptom catalog.

Access control is enforced in two layers: coarse route protection in `src/proxy.ts`, and row-level
authorization in Postgres via the RLS policies in `supabase/migrations/0003_rls_policies.sql`.

## The Sjögren's Symptom Signal

For each tracked symptom: `weighted deviation = (current score - patient's own baseline) × clinical weight`.
The composite signal is the sum of weighted deviations divided by the sum of included weights. Symptoms
without an established baseline (fewer than 5 historical data points) are excluded rather than treated as
zero. Safety-flag symptoms (fever, shortness of breath, chest pain, etc.) are evaluated separately and force
the category to "safety flag" regardless of the numeric score. See `src/lib/signal/` — the entire model is
isolated behind pure functions so the thresholds and formula can be revised without touching data-access or
UI code.
