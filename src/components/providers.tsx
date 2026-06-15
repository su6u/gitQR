"use client";

import type { ReactNode } from "react";
import { ShapeProvider } from "@/lib/shape-context";
import { SurfaceProvider } from "@/lib/surface-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ShapeProvider defaultShape="pill">
      <SurfaceProvider value={2}>{children}</SurfaceProvider>
    </ShapeProvider>
  );
}
