import type { BaselineStats } from "./types";

/** Minimum number of prior data points required before a baseline is considered valid. */
export const MIN_BASELINE_SAMPLE_SIZE = 5;

/** Default lookback window for baseline calculation, per symptom_baselines.calculation_window_days. */
export const DEFAULT_BASELINE_WINDOW_DAYS = 90;

/**
 * Computes a patient's personal baseline for one symptom from their own
 * historical scores. Returns null if there isn't enough data yet — the
 * symptom should then be excluded from signal calculation until a baseline
 * can be established.
 */
export function calculateBaseline(historicalScores: number[]): BaselineStats | null {
  const sampleSize = historicalScores.length;
  if (sampleSize < MIN_BASELINE_SAMPLE_SIZE) return null;

  const mean = historicalScores.reduce((sum, s) => sum + s, 0) / sampleSize;

  const variance =
    historicalScores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / Math.max(sampleSize - 1, 1);
  const standardDeviation = Math.sqrt(variance);

  return {
    baselineScore: round2(mean),
    standardDeviation: round2(standardDeviation),
    sampleSize,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
