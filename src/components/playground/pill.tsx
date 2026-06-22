import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Pill({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-playground-panel
      className={cn(
        "relative isolate overflow-hidden rounded-[56px]",
        "bg-[#FFFFFF]",
        "border border-[#E0E0E0]",
        "[box-shadow:inset_0px_-3px_0px_0px_#E0E0E0,_0px_2px_12px_0px_rgba(0,_0,_0,_10%)]",
        className,
      )}
      {...props}
    />
  );
}
