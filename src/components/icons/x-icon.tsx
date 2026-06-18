import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function XIcon({ size = 16, className }: LucideProps) {
  return (
    <img
      src="/icons/x.svg"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    />
  );
}
