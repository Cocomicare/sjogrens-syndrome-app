import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/profile";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== "super_admin" && profile.role !== "clinic_admin") redirect("/redirect");

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/invites", label: "Patient invites" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/clinics", label: "Clinics" },
    ...(profile.role === "super_admin" ? [{ href: "/admin/symptoms", label: "Symptom catalog" }] : []),
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <span className="text-lg">💧</span> Sjögren&apos;s Signal Admin
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-brand-dark">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{profile.first_name} {profile.last_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
