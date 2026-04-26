import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withDot?: boolean;
};

const sizes = {
  sm: "text-[20px]",
  md: "text-[26px]",
  lg: "text-[40px]",
  xl: "text-[68px]",
};

export function Logo({ href, size = "md", className, withDot = true }: Props) {
  const inner = (
    <span className={cn("display tracking-tightish leading-none inline-flex items-baseline", sizes[size], className)}>
      <span>räkna</span>
      {withDot ? <span className="text-red">.</span> : null}
    </span>
  );
  if (href) return <Link href={href} className="inline-flex">{inner}</Link>;
  return inner;
}
