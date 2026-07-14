import Link from "next/link";
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
          <Link
            href="/patient"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-brand-dark"
            aria-label="Home"
          >
            <span className="text-lg">💧</span> Sjögren&apos;s Signal
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v1H4v-1Z" />
                </svg>
              </span>
              {profile.first_name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
