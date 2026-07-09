"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const inputClass = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm";

export function UserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "doctor", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setDone(false);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create the account.");
      return;
    }

    setDone(true);
    setForm({ firstName: "", lastName: "", email: "", phone: "", role: "doctor", password: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a clinic user</CardTitle>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Email</label>
            <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Role</label>
              <select value={form.role} onChange={(e) => update("role", e.target.value)} className={inputClass}>
                <option value="doctor">Doctor</option>
                <option value="clinic_admin">Clinic Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Temporary password</label>
              <input
                type="text"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {done && <p className="text-sm text-emerald-600">Account created.</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
