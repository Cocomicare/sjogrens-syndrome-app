/** Patient-facing domain constants shared across the check-in flow and dashboards. */

export interface FeelingOption {
  value: number;
  emoji: string;
  label: string;
}

export const OVERALL_FEELING_OPTIONS: FeelingOption[] = [
  { value: 4, emoji: "🥳", label: "Great" },
  { value: 3, emoji: "😊", label: "Okay" },
  { value: 2, emoji: "😕", label: "Not great" },
  { value: 1, emoji: "😟", label: "Bad" },
  { value: 0, emoji: "😭", label: "Very bad" },
];

export function feelingOption(value: number | null | undefined): FeelingOption | undefined {
  return OVERALL_FEELING_OPTIONS.find((o) => o.value === value);
}

export interface FamilyObservationOption {
  key:
    | "missed_school"
    | "reduced_activity"
    | "poor_sleep"
    | "appetite_change"
    | "visible_discomfort"
    | "medication_missed"
    | "other_concern";
  label: string;
  icon: string;
}

export const FAMILY_OBSERVATION_OPTIONS: FamilyObservationOption[] = [
  { key: "missed_school", label: "Missed school", icon: "🏫" },
  { key: "reduced_activity", label: "Less active than usual", icon: "🛋️" },
  { key: "poor_sleep", label: "Poor sleep", icon: "😴" },
  { key: "appetite_change", label: "Appetite change", icon: "🍽️" },
  { key: "visible_discomfort", label: "Visible discomfort", icon: "😖" },
  { key: "medication_missed", label: "Medication missed", icon: "💊" },
  { key: "other_concern", label: "Other concern", icon: "❗" },
];

export const SIGNAL_CATEGORY_LABEL: Record<string, string> = {
  stable: "Stable",
  mildly_elevated: "Mildly elevated",
  moderately_elevated: "Moderately elevated",
  significantly_elevated: "Significantly elevated",
  safety_flag: "Safety flag",
};

export const SIGNAL_CATEGORY_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  stable: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  mildly_elevated: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  moderately_elevated: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  significantly_elevated: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  safety_flag: { bg: "bg-red-100", text: "text-red-800", ring: "ring-red-300" },
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  clinic_admin: "Clinic Admin",
  doctor: "Doctor",
  patient_family: "Patient / Family",
};

export const ROLE_HOME_PATH: Record<string, string> = {
  super_admin: "/admin",
  clinic_admin: "/admin",
  doctor: "/doctor",
  patient_family: "/patient",
};

export type SeverityBand = "none" | "mild" | "moderate" | "significant" | "severe";

export const SEVERITY_BAND_LABEL: Record<SeverityBand, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  significant: "Significant",
  severe: "Severe",
};

/** Playful per-symptom label overrides, keyed by symptom_definitions.name. Falls back to SEVERITY_BAND_LABEL. */
export const SYMPTOM_BAND_LABELS: Record<string, Record<SeverityBand, string>> = {
  eye_dryness: {
    none: "Happy Eyes",
    mild: "A Bit Dry",
    moderate: "Dry Eyes",
    significant: "Super Dry",
    severe: "Ouchy Dry",
  },
  mouth_dryness: {
    none: "Happy Mouth",
    mild: "A Bit Dry",
    moderate: "Sticky Mouth",
    significant: "Super Dry",
    severe: "Ouchy Dry",
  },
  energy_level: {
    none: "Full Energy",
    mild: "Pretty Good",
    moderate: "Tired",
    significant: "Wiped Out",
    severe: "Depleted",
  },
  joint_pain: {
    none: "Feels Good",
    mild: "A Little Achy",
    moderate: "Achy",
    significant: "Really Achy",
    severe: "Ouchy",
  },
  muscle_pain: {
    none: "Feels Good",
    mild: "A Little Sore",
    moderate: "Sore",
    significant: "Really Sore",
    severe: "Hurts a Lot",
  },
  thinking_focus: {
    none: "Clear",
    mild: "Focused",
    moderate: "Thinking Hard",
    significant: "Struggling",
    severe: "Overwhelmed",
  },
  overall_wellness: {
    none: "Great Day!",
    mild: "Pretty Good",
    moderate: "Okay",
    significant: "Tough Day",
    severe: "Really Hard Day",
  },
};

export function symptomBandLabel(symptomName: string | undefined, band: SeverityBand): string {
  return (symptomName && SYMPTOM_BAND_LABELS[symptomName]?.[band]) || SEVERITY_BAND_LABEL[band];
}

export const SEVERITY_BAND_COLOR: Record<SeverityBand, { bg: string; text: string; border: string }> = {
  none: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-400" },
  mild: { bg: "bg-brand-soft", text: "text-brand-dark", border: "border-brand" },
  moderate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-400" },
  significant: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-400" },
  severe: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-400" },
};

/** Hex equivalents of SEVERITY_BAND_COLOR, for contexts (SVG gradients, canvas) that can't use Tailwind classes. */
export const SEVERITY_BAND_HEX: Record<SeverityBand, string> = {
  none: "#10b981",
  mild: "#0f8b8d",
  moderate: "#f59e0b",
  significant: "#f97316",
  severe: "#f43f5e",
};

/** Maps a composite signal category onto the same 5-tier severity palette used for individual symptoms. */
export const SIGNAL_CATEGORY_BAND: Record<string, SeverityBand> = {
  stable: "none",
  mildly_elevated: "mild",
  moderately_elevated: "moderate",
  significantly_elevated: "significant",
  safety_flag: "severe",
};

export function signalCategoryHex(category: string): string {
  return SEVERITY_BAND_HEX[SIGNAL_CATEGORY_BAND[category] ?? "mild"];
}

/** Representative 0-10 score stored when a patient taps a severity-band icon (upper bound of each band). */
export const SEVERITY_BAND_SCORE: Record<SeverityBand, number> = {
  none: 0,
  mild: 3,
  moderate: 6,
  significant: 8,
  severe: 10,
};

/** Display order left-to-right: worst (severe) to best (none). */
export const SEVERITY_BAND_ORDER: SeverityBand[] = ["severe", "significant", "moderate", "mild", "none"];

export function severityBand(score: number): SeverityBand {
  if (score === 0) return "none";
  if (score <= 3) return "mild";
  if (score <= 6) return "moderate";
  if (score <= 8) return "significant";
  return "severe";
}

export const SAFETY_DISCLAIMER =
  "This entry includes symptoms that may require clinical attention. Contact your medical team or seek urgent care if symptoms are severe or concerning.";

export const APP_SCOPE_DISCLAIMER =
  "This app does not diagnose flares or disease activity. It organizes patient/family-reported information and highlights patterns for physician review.";
