import type { CalculationMethod, SignalCategory } from "@/lib/types/database";

/** A single symptom's reported value for one check-in, decoupled from DB row shape. */
export interface SymptomObservation {
  symptomKey: string;
  /** 0-10 severity score. Null when the symptom wasn't rated (e.g. an optional symptom not opened). */
  score: number | null;
  /** For safety-flag symptoms recorded as present/absent rather than a 0-10 scale. */
  isPresent?: boolean;
  isSafetyFlagSymptom: boolean;
}

/** The patient's resolved historical baseline for one symptom. */
export interface SymptomBaselineInput {
  symptomKey: string;
  baselineScore: number;
  /** Clinical weight for this symptom, after applying any patient-specific override. */
  weight: number;
  /** Standard deviation of the patient's own historical scores for this symptom, when known. */
  standardDeviation?: number | null;
  /** "average" compares the raw point difference from baseline; "stddev" normalizes it by the patient's own historical variability for this symptom. */
  calculationMethod?: CalculationMethod;
}

export interface SignalComputationInput {
  observations: SymptomObservation[];
  baselines: SymptomBaselineInput[];
}

export interface SignalComputationResult {
  compositeScore: number | null;
  category: SignalCategory;
  includedSymptoms: string[];
  excludedSymptoms: string[];
  safetyFlags: string[];
}

export interface BaselineStats {
  baselineScore: number;
  standardDeviation: number | null;
  sampleSize: number;
}
