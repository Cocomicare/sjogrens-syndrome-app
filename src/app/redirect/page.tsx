import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { ROLE_HOME_PATH } from "@/lib/types/domain";

export default async function RedirectPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(ROLE_HOME_PATH[profile.role] ?? "/login");
}
