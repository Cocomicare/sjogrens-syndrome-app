import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ClinicForm } from "@/components/admin/ClinicForm";

export default async function AdminClinicsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: clinics } = await supabase.from("clinics").select("*").order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Clinics</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {profile.role === "super_admin" && <ClinicForm />}
        <Card>
          <CardHeader>
            <CardTitle>All clinics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {(clinics ?? []).map((c) => (
                <li key={c.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                  <p className="font-medium text-zinc-800">{c.name}</p>
                  {c.address && <p className="text-xs text-zinc-500">{c.address}</p>}
                  {c.phone && <p className="text-xs text-zinc-500">{c.phone}</p>}
                </li>
              ))}
              {(!clinics || clinics.length === 0) && <p className="text-sm text-zinc-500">No clinics yet.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
