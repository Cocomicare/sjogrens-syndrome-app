import { APP_SCOPE_DISCLAIMER } from "@/lib/types/domain";

export function ScopeDisclaimer({ className }: { className?: string }) {
  return <p className={`text-xs text-zinc-500 ${className ?? ""}`}>{APP_SCOPE_DISCLAIMER}</p>;
}
