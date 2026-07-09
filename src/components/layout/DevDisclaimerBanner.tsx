export function DevDisclaimerBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return null;

  return (
    <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
      Development version — not for clinical use.
    </div>
  );
}
