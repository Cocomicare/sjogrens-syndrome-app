import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/Card";

export default async function AdminOverviewPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const isSuperAdmin = profile.role === "super_admin";

  const [{ count: clinicCount }, { count: patientCount }, { count: userCount }, { count: pendingInvites }] =
    await Promise.all([
      isSuperAdmin
        ? supabase.from("clinics").select("*", { count: "exact", head: true })
        : Promise.resolve({ count: 1 }),
      supabase.from("patients").select("*", { count: "exact", head: true }).eq("active_status", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("patient_invites").select("*", { count: "exact", head: true }).is("used_at", null),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isSuperAdmin && <Stat label="Clinics" value={clinicCount ?? 0} />}
        <Stat label="Patients" value={patientCount ?? 0} />
        <Stat label="Users" value={userCount ?? 0} />
        <Stat label="Pending invites" value={pendingInvites ?? 0} />
      </div>
      <Card>
        <CardContent className="pt-5 text-sm text-zinc-600">
          Use <span className="font-medium">Patient invites</span> to add a new patient/family, and{" "}
          <span className="font-medium">Users</span> to add doctors or clinic staff.
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
