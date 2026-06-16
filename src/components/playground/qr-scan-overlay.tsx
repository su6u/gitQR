"use client";

import { type RefObject, useEffect } from "react";
import { useQrBoardLayout } from "@/components/playground/qr-board";
import { expandQrRegionRect } from "@/lib/qr-layout";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

export function QrScanOverlay({
  boardAreaRef,
}: {
  boardAreaRef: RefObject<HTMLElement | null>;
}) {
  const { grid, scanMode, scanStatus, exitScanMode, scanQr } = usePlayground();
  const { region } = useQrBoardLayout(boardAreaRef);

  useEffect(() => {
    if (!scanMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitScanMode();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scanMode, exitScanMode]);

  if (!scanMode) return null;

  const canScan = Boolean(grid);
  const scanTarget = region && canScan ? expandQrRegionRect(region) : null;

  return (
    <div
      className="qr-scan-overlay pointer-events-none absolute inset-0 z-20"
      aria-hidden={!scanMode}
    >
      {scanTarget ? (
        <button
          type="button"
          className={cn(
            "qr-scan-target group pointer-events-auto absolute cursor-crosshair overflow-hidden rounded-xl border-2 border-scan-accent/40 p-0 opacity-90 outline-none transition-[border-color,box-shadow,opacity] duration-120",
            "hover:border-scan-accent hover:opacity-100 hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--scan-accent)_18%,transparent)]",
            "focus-visible:border-scan-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-scan-accent/40",
            scanStatus === "scanning" && "pointer-events-none opacity-60",
          )}
          style={{
            left: scanTarget.x,
            top: scanTarget.y,
            width: scanTarget.width,
            height: scanTarget.height,
          }}
          aria-label="Scan QR code and copy URL"
          disabled={scanStatus === "scanning"}
          onClick={() => {
            if (scanStatus === "scanning") return;
            void scanQr();
          }}
        >
          <span className="qr-scan-crosshair absolute inset-0" aria-hidden />
          <span className="sr-only">Scan QR code</span>
        </button>
      ) : null}
    </div>
  );
}
