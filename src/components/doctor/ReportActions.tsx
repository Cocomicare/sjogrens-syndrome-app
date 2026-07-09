"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ReportActions({
  patientId,
  preset,
  start,
  end,
}: {
  patientId: string;
  preset: string;
  start: string;
  end: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, preset, start, end }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="secondary" onClick={() => window.print()}>
        Print / Save as PDF
      </Button>
      <Button onClick={handleSave} disabled={saving}>
        {saved ? "Saved to patient record ✓" : saving ? "Saving…" : "Save report to patient record"}
      </Button>
    </div>
  );
}
