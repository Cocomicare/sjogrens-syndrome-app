import clsx from "clsx";
import { SIGNAL_CATEGORY_COLOR, SIGNAL_CATEGORY_LABEL } from "@/lib/types/domain";
import type { SignalCategory } from "@/lib/types/database";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SignalBadge({ category }: { category: SignalCategory }) {
  const colors = SIGNAL_CATEGORY_COLOR[category];
  return (
    <Badge className={clsx(colors.bg, colors.text, colors.ring)}>
      {category === "safety_flag" && "⚠ "}
      {SIGNAL_CATEGORY_LABEL[category]}
    </Badge>
  );
}
