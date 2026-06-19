"use client";

import dynamic from "next/dynamic";
import { MobileGate } from "@/components/mobile-gate";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

// ponytail: playground is client-only (layout measure, random reveal, async grid)
const Playground = dynamic(
  () => import("./playground").then((mod) => mod.Playground),
  {
    ssr: false,
    loading: () => <main className="h-svh w-full bg-white" aria-busy="true" />,
  },
);

export function PlaygroundClient() {
  const isMobile = useMobileViewport();

  if (isMobile === null) {
    return <main className="h-svh w-full bg-white" aria-busy="true" />;
  }

  if (isMobile) {
    return <MobileGate />;
  }

  return <Playground />;
}
