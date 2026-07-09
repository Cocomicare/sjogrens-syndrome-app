"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AppointmentForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, appointmentDate: date, appointmentType: type, notes }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save the appointment.");
      return;
    }

    setDate("");
    setType("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Follow-up"
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="min-w-[180px] flex-1">
        <label className="mb-1 block text-xs font-medium text-zinc-500">Notes</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add appointment"}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </form>
  );
}
