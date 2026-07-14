import "server-only";

import { format, subDays } from "date-fns";

export type PatientRangePreset = "30" | "90" | "180" | "custom";

export interface ResolvedPatientRange {
  start: string;
  end: string;
  preset: PatientRangePreset;
}

export function resolvePatientDateRange(params: { preset?: string; start?: string; end?: string }): ResolvedPatientRange {
  const today = format(new Date(), "yyyy-MM-dd");
  const preset = (params.preset as PatientRangePreset) || "90";

  if (preset === "custom" && params.start && params.end) {
    return { start: params.start, end: params.end, preset };
  }

  const days = preset === "30" ? 30 : preset === "180" ? 180 : 90;
  return { start: format(subDays(new Date(), days - 1), "yyyy-MM-dd"), end: today, preset: preset === "custom" ? "90" : preset };
}
