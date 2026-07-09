import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== "doctor") redirect("/redirect");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/doctor" className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <span className="text-lg">💧</span> Sjögren&apos;s Signal
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600">
              <Link href="/doctor" className="hover:text-brand-dark">
                Patients
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Dr. {profile.last_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
