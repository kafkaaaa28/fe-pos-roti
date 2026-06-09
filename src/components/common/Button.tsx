import { type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variants = {
  primary: "bg-primary hover:bg-[#173985] text-white shadow-lg shadow-primary/20 border border-white/10",
  accent: "bg-accent hover:bg-cream text-dark shadow-lg shadow-accent/20",
  ghost:
    "border border-white/20 hover:border-accent hover:bg-accent/10 hover:text-accent text-white",
  danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20",
};

const sizes = {
  sm: "min-h-10 px-3.5 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-8 py-3.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-body font-semibold transition-all active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}