import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScanIcon({ size = 16, className }: LucideProps) {
  return (
    <img
      src="/icons/scan.svg"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    />
  );
}
