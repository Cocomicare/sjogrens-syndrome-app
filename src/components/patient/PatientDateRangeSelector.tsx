"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import type { PatientRangePreset } from "@/lib/reports/patientDateRange";

const PRESETS: { value: PatientRangePreset; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
  { value: "custom", label: "Custom range" },
];

export function PatientDateRangeSelector({ currentStart, currentEnd }: { currentStart: string; currentEnd: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePreset = (searchParams.get("preset") as PatientRangePreset) || "90";
  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);

  function setPreset(preset: PatientRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    if (preset !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("start", customStart);
    params.set("end", customEnd);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activePreset === p.value ? "border-brand bg-brand-soft text-brand-dark" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {activePreset === "custom" && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Start</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">End</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <Button onClick={applyCustom}>Apply</Button>
        </div>
      )}
    </div>
  );
}
