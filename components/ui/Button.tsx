"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-ring disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink2",
  ghost: "bg-transparent text-ink hover:bg-paper2",
  danger: "bg-red text-paper hover:opacity-90",
  soft: "bg-paper2 text-ink hover:bg-paper3 border hairline",
};

const sizes: Record<Size, string> = {
  sm: "h-8 text-[13px] px-3",
  md: "h-10 text-sm px-4",
  lg: "h-12 text-[15px] px-5",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    />
  );
});

type ButtonLinkProps = CommonProps & {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  prefetch,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}
