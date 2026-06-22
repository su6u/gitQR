"use client";

import { kookyCloud } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { GithubUrlField } from "./github-url-field";
import { PlaygroundCustomization } from "./playground-customization";
import { usePlayground } from "./playground-provider";

export function PlaygroundPanel() {
  const { generate, loading, error } = usePlayground();

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-3 pb-3 md:px-5 md:pt-4 md:pb-4">
      <header
        className="playground-panel-section shrink-0 pb-3 text-center md:pb-4"
        style={{ ["--playground-panel-delay" as string]: "80ms" }}
      >
        <h2
          className={cn(
            kookyCloud.className,
            "translate-y-1 text-[28px] text-[#20190E] text-balance md:translate-y-2 md:text-[32px]",
          )}
        >
          GitQR PlayGround
        </h2>
      </header>
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
        <div className="relative z-10 shrink-0">
          <GithubUrlField onSubmit={generate} loading={loading} />
          {error ? (
            <p className="mt-2 text-[12px] text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div
          className="playground-panel-section flex min-h-0 flex-1 flex-col overflow-y-auto pt-2"
          style={{ ["--playground-panel-delay" as string]: "120ms" }}
        >
          <PlaygroundCustomization />
        </div>
      </div>
    </div>
  );
}
