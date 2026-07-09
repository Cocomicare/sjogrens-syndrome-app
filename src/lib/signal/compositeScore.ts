import type { SignalComputationInput, SignalComputationResult } from "./types";
import { categorizeScore, combineWithSafetyFlags } from "./categorize";

/**
 * Computes the Sjögren's Symptom Signal for a single check-in.
 *
 *   weighted deviation = (current score - baseline score) x symptom weight
 *   composite signal   = sum(weighted deviations) / sum(weights included)
 *
 * Symptoms without both a current score AND an established baseline are
 * excluded entirely (never treated as zero). Safety-flag symptoms are
 * evaluated separately from the composite score and, when present, force
 * the category to "safety_flag" regardless of the numeric result.
 *
 * This function is pure and has no knowledge of Supabase — it only knows
 * about symptom keys, scores, weights, and baselines, so the underlying
 * clinical model can be revised without touching data-access code.
 */
export function computeSymptomSignal(input: SignalComputationInput): SignalComputationResult {
  const { observations, baselines } = input;
  const baselineByKey = new Map(baselines.map((b) => [b.symptomKey, b]));

  const includedSymptoms: string[] = [];
  const excludedSymptoms: string[] = [];
  const safetyFlags: string[] = [];

  let weightedDeviationSum = 0;
  let weightSum = 0;

  for (const obs of observations) {
    if (obs.isSafetyFlagSymptom) {
      const flagged = obs.isPresent === true || (obs.score !== null && obs.score > 0);
      if (flagged) safetyFlags.push(obs.symptomKey);
      continue;
    }

    const baseline = baselineByKey.get(obs.symptomKey);
    if (obs.score === null || !baseline) {
      excludedSymptoms.push(obs.symptomKey);
      continue;
    }

    const weightedDeviation = (obs.score - baseline.baselineScore) * baseline.weight;
    weightedDeviationSum += weightedDeviation;
    weightSum += baseline.weight;
    includedSymptoms.push(obs.symptomKey);
  }

  const compositeScore = weightSum > 0 ? round3(weightedDeviationSum / weightSum) : null;
  const scoreCategory = categorizeScore(compositeScore);
  const category = combineWithSafetyFlags(scoreCategory, safetyFlags);

  return { compositeScore, category, includedSymptoms, excludedSymptoms, safetyFlags };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
