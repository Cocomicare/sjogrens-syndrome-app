"use client";

import clsx from "clsx";
import {
  SEVERITY_BAND_COLOR,
  SEVERITY_BAND_ORDER,
  SEVERITY_BAND_SCORE,
  severityBand,
  symptomBandLabel,
} from "@/lib/types/domain";
import { SymptomIcon } from "./SymptomIcon";

export function ScoreScale({
  label,
  value,
  onChange,
  symptomName,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  symptomName?: string;
}) {
  const currentBand = severityBand(value);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 font-medium text-zinc-900">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {SEVERITY_BAND_ORDER.map((band) => {
          const selected = band === currentBand;
          const colors = SEVERITY_BAND_COLOR[band];
          return (
            <button
              key={band}
              type="button"
              onClick={() => onChange(SEVERITY_BAND_SCORE[band])}
              aria-pressed={selected}
              aria-label={`${label}: ${symptomBandLabel(symptomName, band)}`}
              className={clsx(
                "tap-target flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center transition-colors",
                selected ? `${colors.border} ${colors.bg}` : `${colors.softBorder} ${colors.soft} ${colors.hoverBorder}`
              )}
            >
              <SymptomIcon symptomName={symptomName} band={band} className="h-9 w-9" />
              <span className={clsx("text-[9px] font-medium leading-tight", selected ? colors.text : "text-zinc-500")}>
                {symptomBandLabel(symptomName, band)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
