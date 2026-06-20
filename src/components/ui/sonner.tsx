"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export const scanCopyToastClassNames = {
  toast:
    "scan-copy-toast bg-[#fa70b3] flex w-max items-center justify-center rounded-full px-3.5 py-2 text-center",
  title: "text-[12px] font-medium leading-none text-foreground text-center",
  content: "flex items-center justify-center text-center",
  icon: "hidden size-0",
} as const;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      closeButton={false}
      expand={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-[#fa70b3] flex w-auto max-w-[min(92vw,22rem)] items-center rounded-full px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.06)]",
          title: "text-[12px] font-medium leading-snug text-foreground",
          description: "text-[11px] leading-snug text-muted-foreground",
          icon: "hidden size-0",
          content: "gap-0",
        },
      }}
      {...props}
    />
  );
}

/** Scan copy toasts — positioned over the left QR canvas via .scan-copy-toaster */
export function ScanCopyToaster() {
  return (
    <Sonner
      id="scan-copy"
      className="scan-copy-toaster"
      position="bottom-center"
      closeButton={false}
      expand={false}
      toastOptions={{
        unstyled: true,
        classNames: scanCopyToastClassNames,
      }}
    />
  );
}
