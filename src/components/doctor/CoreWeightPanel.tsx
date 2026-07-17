"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { PatientSymptomSetting, SymptomDefinition } from "@/lib/types/database";

export function CoreWeightPanel({
  patientId,
  symptoms,
  settingBySymptomId,
}: {
  patientId: string;
  symptoms: SymptomDefinition[];
  settingBySymptomId: Map<string, PatientSymptomSetting>;
}) {
  const router = useRouter();
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(symptoms.map((s) => [s.id, settingBySymptomId.get(s.id)?.custom_weight ?? s.default_weight]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => Math.round(Object.values(weights).reduce((sum, w) => sum + w, 0) * 100) / 100,
    [weights]
  );
  const isValid = total === 100;

  async function save() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/doctor/patients/${patientId}/symptom-weights`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save weights.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-700">Composite score weights</p>
        <span className={clsx("text-sm font-semibold", isValid ? "text-emerald-600" : "text-rose-600")}>
          Total: {total}% {isValid ? "✓" : "— must equal 100%"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {symptoms.map((s) => (
          <label key={s.id} className="flex items-center justify-between gap-2 text-sm text-zinc-600">
            {s.patient_label}
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={weights[s.id]}
                disabled={saving}
                onChange={(e) => setWeights((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))}
                className="w-16 rounded border border-zinc-300 px-1.5 py-0.5 text-xs disabled:bg-zinc-100"
              />
              %
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={!isValid || saving}
        className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {saving ? "Saving…" : "Save weights"}
      </button>
    </div>
  );
}
