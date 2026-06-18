"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ScanLine, X } from "lucide-react";
import type { CSSProperties } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { QuestionMarkIcon } from "@/components/icons/question-mark-icon";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const GITHUB_REPO_URL = "https://github.com/su6u/git-qr";

const navLinkClass =
  "playground-nav-pill inline-flex h-9 items-center gap-1.5 rounded-[20px] px-4 text-[13px] text-foreground outline-none";

const iconTransition = {
  type: "spring" as const,
  duration: 0.3,
  bounce: 0,
};

function ScanModeIcon({ scanMode }: { scanMode: boolean }) {
  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        {scanMode ? (
          <motion.span
            key="exit-icon"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={iconTransition}
          >
            <X size={16} aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="scan-icon"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
            transition={iconTransition}
          >
            <ScanLine size={16} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function ScanModeLabel({ scanMode }: { scanMode: boolean }) {
  return (
    <span className="relative inline-grid">
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        Exit scan
      </span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={scanMode ? "exit-label" : "scan-label"}
          className="col-start-1 row-start-1"
          initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
          transition={{
            duration: 0.18,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          {scanMode ? "Exit scan" : "Scan QR"}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
        <ScanModeIcon scanMode={scanMode} />
        <ScanModeLabel scanMode={scanMode} />
      </button>
    </nav>
  );
}
