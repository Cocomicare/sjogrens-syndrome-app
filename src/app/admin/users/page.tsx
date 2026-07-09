import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserForm } from "@/components/admin/UserForm";
import { ROLE_LABEL } from "@/lib/types/domain";

export default async function AdminUsersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: users } = profile.clinic_id
    ? await supabase.from("profiles").select("*").eq("clinic_id", profile.clinic_id).order("role")
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserForm />
        <Card>
          <CardHeader>
            <CardTitle>Clinic users</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {(users ?? []).map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                  <div>
                    <p className="font-medium text-zinc-800">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {ROLE_LABEL[u.role]}
                  </span>
                </li>
              ))}
              {(!users || users.length === 0) && <p className="text-sm text-zinc-500">No users yet.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
