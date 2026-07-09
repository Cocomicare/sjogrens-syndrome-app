import { format } from "date-fns";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { InviteForm } from "@/components/admin/InviteForm";

export default async function AdminInvitesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: doctors }, { data: invites }] = await Promise.all([
    profile.clinic_id
      ? supabase.from("profiles").select("id, first_name, last_name").eq("clinic_id", profile.clinic_id).eq("role", "doctor")
      : Promise.resolve({ data: [] }),
    profile.clinic_id
      ? supabase
          .from("patient_invites")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .order("created_at", { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [] }),
  ]);

  const invitePatientIds = (invites ?? []).map((inv) => inv.patient_id);
  const { data: invitePatients } = invitePatientIds.length
    ? await supabase.from("patients").select("id, first_name, last_name").in("id", invitePatientIds)
    : { data: [] };
  const patientById = new Map((invitePatients ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Patient invites</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InviteForm doctors={(doctors ?? []).map((d) => ({ id: d.id, name: `${d.first_name} ${d.last_name}` }))} />
        <Card>
          <CardHeader>
            <CardTitle>Recent invites</CardTitle>
          </CardHeader>
          <CardContent>
            {!invites || invites.length === 0 ? (
              <p className="text-sm text-zinc-500">No invites yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {invites.map((inv) => {
                  const patient = patientById.get(inv.patient_id);
                  return (
                    <li key={inv.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                      <div>
                        <p className="font-medium text-zinc-800">{patient ? `${patient.first_name} ${patient.last_name}` : "Unknown patient"}</p>
                        <p className="font-mono text-xs text-zinc-500">{inv.invite_code}</p>
                      </div>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium " +
                          (inv.used_at ? "bg-emerald-50 text-emerald-700" : new Date(inv.expires_at) < new Date() ? "bg-zinc-100 text-zinc-500" : "bg-amber-50 text-amber-700")
                        }
                      >
                        {inv.used_at ? "Redeemed" : new Date(inv.expires_at) < new Date() ? "Expired" : `Expires ${format(new Date(inv.expires_at), "MMM d")}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
