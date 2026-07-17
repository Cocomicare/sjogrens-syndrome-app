import type { SignalCategory } from "@/lib/types/database";

/**
 * Thresholds on the composite weighted-deviation score. Tunable independently
 * of the calculation itself — adjust these as real-world data accumulates.
 *
 * Scaled to the 1-5 symptom score range (max single-symptom deviation is 4,
 * vs. 10 under the old 0-10 raw score range) — proportionally 0.4x the
 * original 1.0 / 2.5 / 4.0 thresholds, to preserve the same sensitivity.
 */
export const SIGNAL_THRESHOLDS = {
  mildlyElevated: 0.4,
  moderatelyElevated: 1.0,
  significantlyElevated: 1.6,
};

/** Maps a composite score to a category. Does not consider safety flags — see combineWithSafetyFlags. */
export function categorizeScore(compositeScore: number | null): SignalCategory {
  if (compositeScore === null) return "stable";
  if (compositeScore >= SIGNAL_THRESHOLDS.significantlyElevated) return "significantly_elevated";
  if (compositeScore >= SIGNAL_THRESHOLDS.moderatelyElevated) return "moderately_elevated";
  if (compositeScore >= SIGNAL_THRESHOLDS.mildlyElevated) return "mildly_elevated";
  return "stable";
}

/** A safety flag always takes priority over the composite-score category. */
export function combineWithSafetyFlags(
  scoreCategory: SignalCategory,
  safetyFlags: string[]
): SignalCategory {
  return safetyFlags.length > 0 ? "safety_flag" : scoreCategory;
}
