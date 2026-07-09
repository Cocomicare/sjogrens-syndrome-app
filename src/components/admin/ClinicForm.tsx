"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";

export function ClinicForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/clinics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the clinic.");
      return;
    }

    setForm({ name: "", address: "", phone: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a clinic</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Address</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create clinic"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
