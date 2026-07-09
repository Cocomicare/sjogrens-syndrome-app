/** Patient-facing domain constants shared across the check-in flow and dashboards. */

export interface FeelingOption {
  value: number;
  emoji: string;
  label: string;
}

export const OVERALL_FEELING_OPTIONS: FeelingOption[] = [
  { value: 4, emoji: "😊", label: "Great" },
  { value: 3, emoji: "🙂", label: "Okay" },
  { value: 2, emoji: "😐", label: "Not great" },
  { value: 1, emoji: "🙁", label: "Bad" },
  { value: 0, emoji: "😣", label: "Very bad" },
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

export const SAFETY_DISCLAIMER =
  "This entry includes symptoms that may require clinical attention. Contact your medical team or seek urgent care if symptoms are severe or concerning.";

export const APP_SCOPE_DISCLAIMER =
  "This app does not diagnose flares or disease activity. It organizes patient/family-reported information and highlights patterns for physician review.";
