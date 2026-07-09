-- Sjögren's Signal: core schema
-- Roles, clinics, profiles, patients, appointments, symptom tracking,
-- check-ins, baselines/signals, medications, reports, audit log, subscriptions.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type app_role as enum ('super_admin', 'clinic_admin', 'doctor', 'patient_family');

create type signal_category as enum (
  'stable',
  'mildly_elevated',
  'moderately_elevated',
  'significantly_elevated',
  'safety_flag'
);

create type symptom_category as enum (
  'core',
  'optional',
  'safety'
);

create type report_type as enum (
  'since_last_appointment',
  'last_30_days',
  'last_60_days',
  'last_90_days',
  'custom_range',
  'appointment_to_appointment'
);

create type tracking_frequency as enum ('daily', 'weekly', 'as_needed');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------------

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clinics_set_updated_at
  before update on clinics
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (one row per authenticated app user, linked to auth.users)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete set null,
  role app_role not null default 'patient_family',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_clinic_id_idx on profiles(clinic_id);
create index profiles_role_idx on profiles(role);
create index profiles_auth_user_id_idx on profiles(auth_user_id);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------

create table patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  primary_doctor_id uuid references profiles(id) on delete set null,
  patient_family_profile_id uuid references profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  sex text,
  diagnosis_notes text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_clinic_id_idx on patients(clinic_id);
create index patients_primary_doctor_id_idx on patients(primary_doctor_id);
create index patients_patient_family_profile_id_idx on patients(patient_family_profile_id);

create trigger patients_set_updated_at
  before update on patients
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- patient_invites
-- ---------------------------------------------------------------------------

create table patient_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  invite_code text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index patient_invites_patient_id_idx on patient_invites(patient_id);
create index patient_invites_clinic_id_idx on patient_invites(clinic_id);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid references profiles(id) on delete set null,
  appointment_date date not null,
  appointment_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_patient_id_idx on appointments(patient_id, appointment_date);
create index appointments_clinic_id_idx on appointments(clinic_id);

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- symptom_definitions (global catalog, managed by super admin)
-- ---------------------------------------------------------------------------

create table symptom_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  patient_label text not null,
  clinical_label text not null,
  category symptom_category not null default 'core',
  default_weight numeric(4,2) not null default 1.0,
  is_core boolean not null default false,
  is_optional boolean not null default false,
  is_safety_flag boolean not null default false,
  active_status boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger symptom_definitions_set_updated_at
  before update on symptom_definitions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- patient_symptom_settings (per-patient overrides of the global catalog)
-- ---------------------------------------------------------------------------

create table patient_symptom_settings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  symptom_definition_id uuid not null references symptom_definitions(id) on delete cascade,
  enabled boolean not null default true,
  custom_weight numeric(4,2),
  tracking_frequency tracking_frequency not null default 'daily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, symptom_definition_id)
);

create index patient_symptom_settings_patient_id_idx on patient_symptom_settings(patient_id);

create trigger patient_symptom_settings_set_updated_at
  before update on patient_symptom_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- daily_checkins
-- ---------------------------------------------------------------------------

create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  entered_by_profile_id uuid references profiles(id) on delete set null,
  entry_date date not null,
  overall_feeling smallint not null check (overall_feeling between 0 and 4),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, entry_date)
);

create index daily_checkins_patient_id_idx on daily_checkins(patient_id, entry_date desc);

create trigger daily_checkins_set_updated_at
  before update on daily_checkins
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- symptom_entries
-- ---------------------------------------------------------------------------

create table symptom_entries (
  id uuid primary key default gen_random_uuid(),
  daily_checkin_id uuid not null references daily_checkins(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  symptom_definition_id uuid not null references symptom_definitions(id) on delete cascade,
  score smallint check (score between 0 and 10),
  is_present boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (daily_checkin_id, symptom_definition_id)
);

create index symptom_entries_patient_id_idx on symptom_entries(patient_id, created_at desc);
create index symptom_entries_checkin_id_idx on symptom_entries(daily_checkin_id);
create index symptom_entries_definition_id_idx on symptom_entries(symptom_definition_id);

-- ---------------------------------------------------------------------------
-- family_observation_entries
-- ---------------------------------------------------------------------------

create table family_observation_entries (
  id uuid primary key default gen_random_uuid(),
  daily_checkin_id uuid not null references daily_checkins(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  missed_school boolean not null default false,
  reduced_activity boolean not null default false,
  poor_sleep boolean not null default false,
  appetite_change boolean not null default false,
  visible_discomfort boolean not null default false,
  medication_missed boolean not null default false,
  other_concern boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (daily_checkin_id)
);

create index family_observation_entries_patient_id_idx on family_observation_entries(patient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- symptom_baselines
-- ---------------------------------------------------------------------------

create table symptom_baselines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  symptom_definition_id uuid not null references symptom_definitions(id) on delete cascade,
  baseline_score numeric(5,2) not null,
  standard_deviation numeric(5,2),
  sample_size int not null default 0,
  calculation_window_days int not null default 90,
  updated_at timestamptz not null default now(),
  unique (patient_id, symptom_definition_id)
);

create index symptom_baselines_patient_id_idx on symptom_baselines(patient_id);

-- ---------------------------------------------------------------------------
-- symptom_signals (calculated composite Sjögren's Symptom Signal per day)
-- ---------------------------------------------------------------------------

create table symptom_signals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  signal_date date not null,
  composite_score numeric(6,3),
  category signal_category not null default 'stable',
  included_symptoms jsonb not null default '[]'::jsonb,
  excluded_symptoms jsonb not null default '[]'::jsonb,
  safety_flags jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  unique (patient_id, signal_date)
);

create index symptom_signals_patient_id_idx on symptom_signals(patient_id, signal_date desc);

-- ---------------------------------------------------------------------------
-- medications
-- ---------------------------------------------------------------------------

create table medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  medication_name text not null,
  dose text,
  frequency text,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medications_patient_id_idx on medications(patient_id);

create trigger medications_set_updated_at
  before update on medications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- medication_entries
-- ---------------------------------------------------------------------------

create table medication_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  medication_id uuid not null references medications(id) on delete cascade,
  entry_date date not null,
  taken boolean not null default true,
  missed_reason text,
  side_effects text,
  created_at timestamptz not null default now(),
  unique (medication_id, entry_date)
);

create index medication_entries_patient_id_idx on medication_entries(patient_id, entry_date desc);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------

create table reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  generated_by_profile_id uuid references profiles(id) on delete set null,
  date_range_start date not null,
  date_range_end date not null,
  report_type report_type not null default 'custom_range',
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index reports_patient_id_idx on reports(patient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles(id) on delete set null,
  clinic_id uuid references clinics(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on audit_logs(actor_profile_id, created_at desc);
create index audit_logs_patient_idx on audit_logs(patient_id, created_at desc);
create index audit_logs_clinic_idx on audit_logs(clinic_id, created_at desc);

-- ---------------------------------------------------------------------------
-- subscriptions (future billing; scaffolded now)
-- ---------------------------------------------------------------------------

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text,
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id)
);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();
