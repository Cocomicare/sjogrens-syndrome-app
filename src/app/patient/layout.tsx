import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== "patient_family") redirect("/redirect");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <span className="text-lg">💧</span> Sjögren&apos;s Signal
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Hi, {profile.first_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
