import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/Card";
import { SymptomRow } from "@/components/admin/SymptomRow";

export default async function AdminSymptomsPage() {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") redirect("/admin");

  const supabase = await createClient();
  const { data: symptoms } = await supabase.from("symptom_definitions").select("*").order("sort_order");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Symptom catalog</h1>
        <p className="text-sm text-zinc-500">Global symptom definitions and default clinical weights.</p>
      </div>
      <Card>
        <CardContent className="pt-5">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-400">
              <tr>
                <th className="py-1.5 pr-3">Patient label</th>
                <th className="py-1.5 pr-3">Clinical label</th>
                <th className="py-1.5 pr-3">Category</th>
                <th className="py-1.5 pr-3">Default weight</th>
                <th className="py-1.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(symptoms ?? []).map((s) => (
                <SymptomRow key={s.id} symptom={s} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
