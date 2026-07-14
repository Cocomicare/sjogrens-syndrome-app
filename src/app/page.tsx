import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ScopeDisclaimer } from "@/components/layout/ScopeDisclaimer";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/icon-64.png" alt="" className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          <span className="text-brand-dark">My</span><span className="text-[#a78bfa]">Sjogren&apos;s</span>
        </h1>
        <p className="mt-3 text-zinc-600">
          A simple daily check-in for patients and families managing pediatric Sjögren&apos;s syndrome —
          so your care team can see how you&apos;ve really been doing between visits.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Log in
            </Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              I have an invite code
            </Button>
          </Link>
        </div>

        <ScopeDisclaimer className="mx-auto mt-10 max-w-sm" />
      </div>
    </div>
  );
}
