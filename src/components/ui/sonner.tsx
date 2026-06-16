"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      closeButton={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-auto max-w-[min(92vw,22rem)] items-center rounded-full px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.06)]",
          title: "text-[12px] font-medium leading-snug text-black",
          description: "text-[11px] leading-snug text-black/70",
          icon: "hidden size-0",
          content: "gap-0",
        },
      }}
      {...props}
    />
  );
}

export const scanCopyToastClassNames = {
  toast: "bg-[#63E895]",
  title: "text-black",
} as const;
