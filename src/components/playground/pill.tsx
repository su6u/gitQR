import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Pill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-playground-panel
      className={cn(
        "playground-gap-edge-pill rounded-[56px]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.05)]",
        className,
      )}
      {...props}
    />
  );
}
