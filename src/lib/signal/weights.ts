import type { CalculationMethod } from "@/lib/types/database";

/** Resolves the effective clinical weight for a symptom: patient override wins, else the catalog default. */
export function resolveWeight(defaultWeight: number, customWeight: number | null | undefined): number {
  return customWeight ?? defaultWeight;
}

/** Resolves the effective calculation method for a symptom: patient override wins, else the catalog default. */
export function resolveCalculationMethod(
  defaultMethod: CalculationMethod,
  customMethod: CalculationMethod | null | undefined
): CalculationMethod {
  return customMethod ?? defaultMethod;
}
