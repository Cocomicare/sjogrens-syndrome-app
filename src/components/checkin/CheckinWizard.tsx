"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ScoreScale } from "./ScoreScale";
import { OVERALL_FEELING_OPTIONS, FAMILY_OBSERVATION_OPTIONS, SAFETY_DISCLAIMER } from "@/lib/types/domain";
import type { SymptomDefinition } from "@/lib/types/database";

type Step = "greeting" | "core" | "optional" | "family" | "confirmation";

interface Props {
  patientId: string;
  patientFirstName: string;
  coreSymptoms: SymptomDefinition[];
  optionalSymptoms: SymptomDefinition[];
  safetySymptoms: SymptomDefinition[];
}

const STEP_ORDER: Step[] = ["greeting", "core", "optional", "family", "confirmation"];

export function CheckinWizard({ patientId, patientFirstName, coreSymptoms, optionalSymptoms, safetySymptoms }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("greeting");
  const [overallFeeling, setOverallFeeling] = useState<number | null>(null);
  const [coreScores, setCoreScores] = useState<Record<string, number>>(
    Object.fromEntries(coreSymptoms.map((s) => [s.id, 3]))
  );
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [optionalScores, setOptionalScores] = useState<Record<string, number>>({});
  const [safetyPresent, setSafetyPresent] = useState<Record<string, boolean>>({});
  const [familyFlags, setFamilyFlags] = useState<Record<string, boolean>>({});
  const [familyNote, setFamilyNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const payload = {
      patientId,
      entryDate: format(new Date(), "yyyy-MM-dd"),
      overallFeeling,
      coreScores,
      optionalScores,
      safetyPresent,
      familyObservations: familyFlags,
      familyNote,
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
          {STEP_ORDER.slice(0, 4).map((s, i) => (
            <div
              key={s}
              className={clsx("h-1.5 flex-1 rounded-full", i <= stepIndex ? "bg-brand" : "bg-zinc-200")}
            />
          ))}
        </div>
      )}

      {step === "greeting" && (
        <div className="flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-zinc-900">How is {patientFirstName} feeling today?</h1>
          <div className="grid grid-cols-1 gap-3">
            {OVERALL_FEELING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOverallFeeling(opt.value)}
                className={clsx(
                  "tap-target flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors",
                  overallFeeling === opt.value
                    ? "border-brand bg-brand-soft"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                )}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-lg font-medium text-zinc-900">{opt.label}</span>
              </button>
            ))}
          </div>
          <Button size="lg" disabled={overallFeeling === null} onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === "core" && (
        <div className="flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-zinc-900">A few quick symptoms</h1>
          <div className="flex flex-col gap-3">
            {coreSymptoms.map((symptom) => (
              <ScoreScale
                key={symptom.id}
                label={symptom.patient_label}
                value={coreScores[symptom.id] ?? 0}
                onChange={(v) => setCoreScores((prev) => ({ ...prev, [symptom.id]: v }))}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button size="lg" variant="secondary" onClick={goBack}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={goNext}>
              Continue
            </Button>
          </div>
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
          <div className="flex gap-3">
            <Button size="lg" variant="secondary" onClick={goBack}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={goNext}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "family" && (
        <div className="flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-zinc-900">Anything the family noticed today?</h1>
          <div className="grid grid-cols-2 gap-3">
            {FAMILY_OBSERVATION_OPTIONS.map((opt) => {
              const active = !!familyFlags[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFamilyFlags((prev) => ({ ...prev, [opt.key]: !active }))}
                  className={clsx(
                    "tap-target flex flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-4 text-center transition-colors",
                    active ? "border-brand bg-brand-soft" : "border-zinc-200 bg-white"
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-medium text-zinc-700">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Optional note</label>
            <textarea
              value={familyNote}
              onChange={(e) => setFamilyNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Anything else worth mentioning..."
            />
          </div>
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
          <h1 className="text-xl font-semibold text-zinc-900">Saved. Your check-in is complete.</h1>
          <p className="text-sm text-zinc-500">{format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
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
