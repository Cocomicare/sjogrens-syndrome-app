"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalculationMethod, PatientSymptomSetting, SymptomDefinition } from "@/lib/types/database";

export function SymptomCalcSettings({
  patientId,
  symptom,
  setting,
}: {
  patientId: string;
  symptom: SymptomDefinition;
  setting?: PatientSymptomSetting;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<CalculationMethod>(setting?.calculation_method ?? symptom.default_calculation_method);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const methodOverridden = setting?.calculation_method != null;

  async function save(calculationMethod: CalculationMethod | null) {
    setSaving(true);
    setSavedNote(null);
    const res = await fetch(`/api/doctor/patients/${patientId}/symptom-settings/${symptom.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calculationMethod }),
    });
    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      setSavedNote(`Recalculated ${body.recalculated} day${body.recalculated === 1 ? "" : "s"}`);
      router.refresh();
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
      <label className="flex items-center gap-1.5">
        Method
        <select
          value={method}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value as CalculationMethod;
            setMethod(next);
            save(next);
          }}
          className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs disabled:bg-zinc-100"
        >
          <option value="average">Average</option>
          <option value="stddev">Std. deviation</option>
        </select>
      </label>
      {methodOverridden && (
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setMethod(symptom.default_calculation_method);
            save(null);
          }}
          className="text-brand-dark hover:underline"
        >
          Reset to default
        </button>
      )}
      {saving && <span className="text-zinc-400">Recalculating…</span>}
      {!saving && savedNote && <span className="text-emerald-600">{savedNote}</span>}
    </div>
  );
}
