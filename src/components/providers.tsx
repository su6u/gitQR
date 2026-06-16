"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ShapeProvider } from "@/lib/shape-context";
import { SurfaceProvider } from "@/lib/surface-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ShapeProvider defaultShape="pill">
      <SurfaceProvider value={2}>
        {children}
        <Toaster />
      </SurfaceProvider>
    </ShapeProvider>
  );
}
