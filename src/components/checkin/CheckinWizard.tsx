"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ScoreScale } from "./ScoreScale";
import { SAFETY_DISCLAIMER, severityBand, type SeverityBand } from "@/lib/types/domain";
import type { SymptomDefinition } from "@/lib/types/database";

type Step = "core" | "optional" | "confirmation";

/** Overall daily_checkins.overall_feeling (0-4) derived from the "How was your day?" symptom score. */
const BAND_TO_FEELING: Record<SeverityBand, number> = {
  none: 4,
  mild: 3,
  moderate: 2,
  significant: 1,
  severe: 0,
};

export interface CheckinInitialData {
  coreScores: Record<string, number>;
  optionalScores: Record<string, number>;
  safetyPresent: Record<string, boolean>;
}

interface Props {
  patientId: string;
  patientFirstName: string;
  coreSymptoms: SymptomDefinition[];
  optionalSymptoms: SymptomDefinition[];
  safetySymptoms: SymptomDefinition[];
  entryDate: string;
  isEditing?: boolean;
  initial?: CheckinInitialData;
}

const STEP_ORDER: Step[] = ["core", "optional", "confirmation"];

export function CheckinWizard({
  patientId,
  patientFirstName,
  coreSymptoms,
  optionalSymptoms,
  safetySymptoms,
  entryDate,
  isEditing = false,
  initial,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("core");
  const [coreScores, setCoreScores] = useState<Record<string, number>>(
    initial?.coreScores ?? Object.fromEntries(coreSymptoms.map((s) => [s.id, 3]))
  );
  const [optionalOpen, setOptionalOpen] = useState(
    Boolean(initial && (Object.keys(initial.optionalScores).length > 0 || Object.values(initial.safetyPresent).some(Boolean)))
  );
  const [optionalScores, setOptionalScores] = useState<Record<string, number>>(initial?.optionalScores ?? {});
  const [safetyPresent, setSafetyPresent] = useState<Record<string, boolean>>(initial?.safetyPresent ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entryDateLabel = format(new Date(entryDate + "T00:00:00"), "MMMM d, yyyy");

  const stepIndex = STEP_ORDER.indexOf(step);
  const hasSafetyFlag = Object.values(safetyPresent).some(Boolean);

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }
  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function toggleOptionalSymptom(id: string, enabled: boolean) {
    setOptionalScores((prev) => {
      const next = { ...prev };
      if (enabled) next[id] = next[id] ?? 3;
      else delete next[id];
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const overallSymptom = coreSymptoms.find((s) => s.name === "overall_wellness");
    const overallScore = overallSymptom ? coreScores[overallSymptom.id] ?? 6 : 6;
    const overallFeeling = BAND_TO_FEELING[severityBand(overallScore)];

    const payload = {
      patientId,
      entryDate,
      overallFeeling,
      coreScores,
      optionalScores,
      safetyPresent,
      familyObservations: {},
    };

    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong saving your check-in. Please try again.");
      return;
    }

    setStep("confirmation");
  }

  return (
    <div className="flex flex-col gap-5">
      {step !== "confirmation" && (
        <div className="flex gap-1.5">
          {STEP_ORDER.slice(0, 2).map((s, i) => (
            <div
              key={s}
              className={clsx("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-brand" : "bg-zinc-200")}
            />
          ))}
        </div>
      )}

      {step === "core" && (
        <div className="flex flex-col gap-5">
          {isEditing && (
            <p className="text-sm font-medium text-brand-dark">Editing check-in for {entryDateLabel}</p>
          )}
          <h1 className="text-xl font-semibold text-zinc-900">
            {isEditing ? `${patientFirstName}'s symptoms that day` : "A few quick symptoms"}
          </h1>
          <div className="flex flex-col gap-3">
            {coreSymptoms.map((symptom) => (
              <ScoreScale
                key={symptom.id}
                label={symptom.patient_label}
                symptomName={symptom.name}
                value={coreScores[symptom.id] ?? 0}
                onChange={(v) => setCoreScores((prev) => ({ ...prev, [symptom.id]: v }))}
              />
            ))}
          </div>
          <Button size="lg" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === "optional" && (
        <div className="flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-zinc-900">Anything else bothering you today?</h1>
          {!optionalOpen ? (
            <button
              type="button"
              onClick={() => setOptionalOpen(true)}
              className="tap-target rounded-2xl border-2 border-dashed border-zinc-300 px-5 py-4 text-center text-zinc-500 hover:border-brand hover:text-brand"
            >
              + Add another symptom
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {optionalSymptoms.map((s) => {
                  const active = s.id in optionalScores;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleOptionalSymptom(s.id, !active)}
                      className={clsx(
                        "rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors",
                        active ? "border-brand bg-brand-soft text-brand-dark" : "border-zinc-200 bg-white text-zinc-700"
                      )}
                    >
                      {s.patient_label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3">
                {optionalSymptoms
                  .filter((s) => s.id in optionalScores)
                  .map((s) => (
                    <ScoreScale
                      key={s.id}
                      label={s.patient_label}
                      symptomName={s.name}
                      value={optionalScores[s.id]}
                      onChange={(v) => setOptionalScores((prev) => ({ ...prev, [s.id]: v }))}
                    />
                  ))}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700">Any of these?</p>
                <div className="flex flex-wrap gap-2">
                  {safetySymptoms.map((s) => {
                    const active = !!safetyPresent[s.id];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSafetyPresent((prev) => ({ ...prev, [s.id]: !active }))}
                        className={clsx(
                          "rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors",
                          active ? "border-rose-400 bg-rose-50 text-rose-700" : "border-zinc-200 bg-white text-zinc-700"
                        )}
                      >
                        {s.patient_label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasSafetyFlag && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {SAFETY_DISCLAIMER}
                </div>
              )}
            </>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <Button size="lg" variant="secondary" onClick={goBack} disabled={submitting}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save check-in"}
            </Button>
          </div>
        </div>
      )}

      {step === "confirmation" && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-4xl">✅</div>
          <h1 className="text-xl font-semibold text-zinc-900">
            {isEditing ? "Saved. Your check-in has been updated." : "Saved. Your check-in is complete."}
          </h1>
          <p className="text-sm text-zinc-500">{entryDateLabel}</p>
          {hasSafetyFlag && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {SAFETY_DISCLAIMER}
            </div>
          )}
          <Button size="lg" onClick={() => router.push("/patient")} className="mt-2 w-full">
            Back to dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
