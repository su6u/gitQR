import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionMarkIcon({ size = 16, className }: LucideProps) {
  return (
    <img
      src="/icons/question-mark.svg"
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    />
  );
}
