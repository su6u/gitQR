"use client";

import { useRef, useState } from "react";
import { isPlaygroundEnterReload } from "@/lib/playground-enter-seen";
import { Pill } from "./pill";
import { PlaygroundNavbar } from "./playground-navbar";
import { PlaygroundPanel } from "./playground-panel";
import { PlaygroundProvider } from "./playground-provider";
import { QrBoard } from "./qr-board";
import { QrScanOverlay } from "./qr-scan-overlay";

export function Playground() {
  return (
    <PlaygroundProvider>
      <PlaygroundMain />
    </PlaygroundProvider>
  );
}

function PlaygroundMain() {
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const skipEnter = useState(isPlaygroundEnterReload)[0];

  return (
    <main
      className="relative h-svh w-full overflow-hidden bg-white"
      {...(skipEnter ? { "data-enter-seen": true } : {})}
    >
      <div
        ref={boardAreaRef}
        className="playground-enter-item absolute inset-0"
        style={{ animationDelay: "0ms" }}
      >
        <QrBoard className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 p-4">
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_clamp(260px,28%,380px)] gap-3">
          <PlaygroundNavbar
            className="playground-enter-item pointer-events-auto self-start ml-6"
            style={{ animationDelay: "40ms" }}
          />
          <Pill
            className="playground-enter-item pointer-events-auto min-h-0 h-full rounded-[56px]"
            style={{ animationDelay: "60ms" }}
          >
            <PlaygroundPanel />
          </Pill>
        </div>
      </div>

      <QrScanOverlay boardAreaRef={boardAreaRef} />
    </main>
  );
}
