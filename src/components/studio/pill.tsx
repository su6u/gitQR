import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Pill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-studio-surface bg-[#f4f4f4]", className)}
      {...props}
    />
  );
}
