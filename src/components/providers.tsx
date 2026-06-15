"use client";

import type { ReactNode } from "react";
import { ShapeProvider } from "@/lib/shape-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ShapeProvider defaultShape="pill">{children}</ShapeProvider>;
}
