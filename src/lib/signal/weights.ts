/** Resolves the effective clinical weight for a symptom: patient override wins, else the catalog default. */
export function resolveWeight(defaultWeight: number, customWeight: number | null | undefined): number {
  return customWeight ?? defaultWeight;
}
