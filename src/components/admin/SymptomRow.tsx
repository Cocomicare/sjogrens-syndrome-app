"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { SymptomDefinition } from "@/lib/types/database";

export function SymptomRow({ symptom }: { symptom: SymptomDefinition }) {
  const router = useRouter();
  const [weight, setWeight] = useState(symptom.default_weight);
  const [active, setActive] = useState(symptom.active_status);
  const [saving, setSaving] = useState(false);

  async function save(update: { defaultWeight?: number; activeStatus?: boolean }) {
    setSaving(true);
    await fetch(`/api/admin/symptoms/${symptom.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className={clsx(!active && "opacity-50")}>
      <td className="py-2 pr-3 font-medium text-zinc-800">{symptom.patient_label}</td>
      <td className="py-2 pr-3 text-zinc-500">{symptom.clinical_label}</td>
      <td className="py-2 pr-3 text-xs uppercase text-zinc-400">{symptom.category}</td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={weight}
          disabled={symptom.is_safety_flag || saving}
          onChange={(e) => setWeight(Number(e.target.value))}
          onBlur={() => save({ defaultWeight: weight })}
          className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-50"
        />
        %
      </td>
      <td className="py-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setActive(!active);
            save({ activeStatus: !active });
          }}
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
          )}
        >
          {active ? "Active" : "Inactive"}
        </button>
      </td>
    </tr>
  );
}
