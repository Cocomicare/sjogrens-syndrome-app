"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import type { RangePreset } from "@/lib/reports/dateRange";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];

export function DateRangeSelector({ currentStart, currentEnd }: { currentStart: string; currentEnd: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePreset = (searchParams.get("preset") as RangePreset) || "90";
  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);

  function setPreset(preset: RangePreset) {
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
