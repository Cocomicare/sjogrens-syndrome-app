/**
 * Hand-written mirror of the Supabase schema (supabase/migrations/*.sql).
 * Regenerate/reconcile with `supabase gen types typescript` once a real
 * project is linked; keep this file as the source of truth until then.
 */

export type AppRole = "super_admin" | "clinic_admin" | "doctor" | "patient_family";

export type SignalCategory =
  | "stable"
  | "mildly_elevated"
  | "moderately_elevated"
  | "significantly_elevated"
  | "safety_flag";

export type SymptomCategory = "core" | "optional" | "safety";

export type ReportType =
  | "since_last_appointment"
  | "last_30_days"
  | "last_60_days"
  | "last_90_days"
  | "custom_range"
  | "appointment_to_appointment";

export type TrackingFrequency = "daily" | "weekly" | "as_needed";

export type Clinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  clinic_id: string | null;
  role: AppRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  clinic_id: string;
  primary_doctor_id: string | null;
  patient_family_profile_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string | null;
  diagnosis_notes: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientInvite = {
  id: string;
  clinic_id: string;
  patient_id: string;
  invite_code: string;
  expires_at: string;
  used_at: string | null;
  created_by_profile_id: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id: string | null;
  appointment_date: string;
  appointment_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SymptomDefinition = {
  id: string;
  name: string;
  patient_label: string;
  clinical_label: string;
  category: SymptomCategory;
  default_weight: number;
  is_core: boolean;
  is_optional: boolean;
  is_safety_flag: boolean;
  active_status: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PatientSymptomSetting = {
  id: string;
  patient_id: string;
  symptom_definition_id: string;
  enabled: boolean;
  custom_weight: number | null;
  tracking_frequency: TrackingFrequency;
  created_at: string;
  updated_at: string;
};

export type DailyCheckin = {
  id: string;
  patient_id: string;
  entered_by_profile_id: string | null;
  entry_date: string;
  overall_feeling: number; // 0-4, see OVERALL_FEELING_OPTIONS
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SymptomEntry = {
  id: string;
  daily_checkin_id: string;
  patient_id: string;
  symptom_definition_id: string;
  score: number | null;
  is_present: boolean;
  notes: string | null;
  created_at: string;
};

export type FamilyObservationEntry = {
  id: string;
  daily_checkin_id: string;
  patient_id: string;
  missed_school: boolean;
  reduced_activity: boolean;
  poor_sleep: boolean;
  appetite_change: boolean;
  visible_discomfort: boolean;
  medication_missed: boolean;
  other_concern: boolean;
  notes: string | null;
  created_at: string;
};

export type SymptomBaseline = {
  id: string;
  patient_id: string;
  symptom_definition_id: string;
  baseline_score: number;
  standard_deviation: number | null;
  sample_size: number;
  calculation_window_days: number;
  updated_at: string;
};

export type SymptomSignal = {
  id: string;
  patient_id: string;
  signal_date: string;
  composite_score: number | null;
  category: SignalCategory;
  included_symptoms: string[];
  excluded_symptoms: string[];
  safety_flags: string[];
  calculated_at: string;
};

export type Medication = {
  id: string;
  patient_id: string;
  medication_name: string;
  dose: string | null;
  frequency: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationEntry = {
  id: string;
  patient_id: string;
  medication_id: string;
  entry_date: string;
  taken: boolean;
  missed_reason: string | null;
  side_effects: string | null;
  created_at: string;
};

export type ReportRecord = {
  id: string;
  patient_id: string;
  generated_by_profile_id: string | null;
  date_range_start: string;
  date_range_end: string;
  report_type: ReportType;
  report_data: Record<string, unknown>;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_profile_id: string | null;
  clinic_id: string | null;
  patient_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Subscription = {
  id: string;
  clinic_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

/** Shape a hand-written table entry needs to satisfy @supabase/postgrest-js's GenericTable constraint. */
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

/** Minimal typed shape Supabase's client wants for table access. */
export type Database = {
  public: {
    Tables: {
      clinics: Table<Clinic>;
      profiles: Table<Profile>;
      patients: Table<Patient>;
      patient_invites: Table<PatientInvite>;
      appointments: Table<Appointment>;
      symptom_definitions: Table<SymptomDefinition>;
      patient_symptom_settings: Table<PatientSymptomSetting>;
      daily_checkins: Table<DailyCheckin>;
      symptom_entries: Table<SymptomEntry>;
      family_observation_entries: Table<FamilyObservationEntry>;
      symptom_baselines: Table<SymptomBaseline>;
      symptom_signals: Table<SymptomSignal>;
      medications: Table<Medication>;
      medication_entries: Table<MedicationEntry>;
      reports: Table<ReportRecord>;
      audit_logs: Table<AuditLog>;
      subscriptions: Table<Subscription>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
