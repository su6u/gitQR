"use client";

import dynamic from "next/dynamic";

// ponytail: playground is client-only (layout measure, random reveal, async grid)
const Playground = dynamic(
  () => import("./playground").then((mod) => mod.Playground),
  {
    ssr: false,
    loading: () => (
      <main className="h-svh w-full bg-white" aria-busy="true" />
    ),
  },
);

export function PlaygroundClient() {
  return <Playground />;
}
