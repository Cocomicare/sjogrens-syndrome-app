"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";

export function InviteForm({ doctors }: { doctors: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", dateOfBirth: "", sex: "", primaryDoctorId: "" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresInDays: 14 }),
    });
    const body = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create the invite.");
      return;
    }

    setResult(body.inviteCode);
    setForm({ firstName: "", lastName: "", dateOfBirth: "", sex: "", primaryDoctorId: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a new patient / family</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">First name</label>
              <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Last name</label>
              <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Date of birth</label>
              <input
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Sex</label>
              <select value={form.sex} onChange={(e) => update("sex", e.target.value)} className={inputClass}>
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          {doctors.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Primary doctor</label>
              <select
                value={form.primaryDoctorId}
                onChange={(e) => update("primaryDoctorId", e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {result && (
            <div className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">
              Invite code: <span className="font-mono font-semibold">{result}</span> — valid for 14 days.
            </div>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
