"use client";

import { ScanLine, X } from "lucide-react";
import type { CSSProperties } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { QuestionMarkIcon } from "@/components/icons/question-mark-icon";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const GITHUB_REPO_URL = "https://github.com/su6u/git-qr";

const navLinkClass =
  "playground-nav-pill inline-flex h-9 items-center gap-1.5 rounded-[20px] px-4 text-[13px] text-foreground outline-none";

export function PlaygroundNavbar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const { scanMode, toggleScanMode } = usePlayground();

  return (
    <nav
      className={cn("flex items-center gap-2", className)}
      style={style}
      aria-label="Site links"
    >
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={navLinkClass}
      >
        <GithubIcon size={16} />
        Give a star
      </a>
      <button type="button" className={navLinkClass}>
        <QuestionMarkIcon size={16} />
        How it works
      </button>
      <button
        type="button"
        className={navLinkClass}
        data-scan-active={scanMode ? "true" : undefined}
        aria-pressed={scanMode}
        aria-label={scanMode ? "Exit scan mode" : "Enter scan mode"}
        onClick={toggleScanMode}
      >
        {scanMode ? <X size={16} /> : <ScanLine size={16} />}
        {scanMode ? "Exit scan" : "Scan QR"}
      </button>
    </nav>
  );
}
