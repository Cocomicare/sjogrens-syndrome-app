import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-zinc-300",
  secondary: "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
