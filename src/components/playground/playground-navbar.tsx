"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { QuestionMarkIcon } from "@/components/icons/question-mark-icon";
import { ScanIcon } from "@/components/icons/scan-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Button } from "@/components/ui/button";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const GITHUB_REPO_URL = "https://github.com/su6u/GitQR";
const README_HOW_IT_WORKS_URL = `${GITHUB_REPO_URL}#how-it-works`;

const navLinkStyle = {
  fontWeight: fontWeights.semibold,
} satisfies CSSProperties;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const iconEnter = { duration: 0.12, ease: EASE_OUT };
const iconExit = { duration: 0.08, ease: EASE_OUT };

function ScanModeIcon({ scanMode }: { scanMode: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        {scanMode ? (
          <motion.span
            key="exit-icon"
            className="absolute inset-0 flex items-center justify-center"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, transform: "scale(0.95)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, transform: "scale(1)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0, transition: iconExit }
                : {
                    opacity: 0,
                    transform: "scale(0.97)",
                    transition: iconExit,
                  }
            }
            transition={reduceMotion ? { duration: 0.08 } : iconEnter}
          >
            <XIcon size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="scan-icon"
            className="absolute inset-0 flex items-center justify-center"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, transform: "scale(0.95)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, transform: "scale(1)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0, transition: iconExit }
                : {
                    opacity: 0,
                    transform: "scale(0.97)",
                    transition: iconExit,
                  }
            }
            transition={reduceMotion ? { duration: 0.08 } : iconEnter}
          >
            <ScanIcon size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function ScanModeLabel({ scanMode }: { scanMode: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <span className="relative inline-grid">
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        Exit scan
      </span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={scanMode ? "exit-label" : "scan-label"}
          className="col-start-1 row-start-1"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: "translateY(4px)" }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, transform: "translateY(0)" }
          }
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.08, ease: EASE_OUT } }
              : {
                  opacity: 0,
                  transform: "translateY(-2px)",
                  transition: { duration: 0.1, ease: EASE_OUT },
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.08 }
              : { duration: 0.14, ease: EASE_OUT }
          }
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
      className={cn("flex flex-wrap items-center gap-1.5 md:gap-2", className)}
      style={style}
      aria-label="Site links"
    >
      <Button
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        intent="primary"
        size="small"
        className="normal-case"
        style={navLinkStyle}
      >
        <GithubIcon size={16} />
        Give a star
      </Button>
      <Button
        href={README_HOW_IT_WORKS_URL}
        target="_blank"
        rel="noopener noreferrer"
        intent="primary"
        size="small"
        className="normal-case"
        style={navLinkStyle}
      >
        <QuestionMarkIcon size={16} />
        How it works
      </Button>
      <Button
        type="button"
        intent="primary"
        size="small"
        className="normal-case"
        style={navLinkStyle}
        aria-pressed={scanMode}
        aria-label={scanMode ? "Exit scan mode" : "Enter scan mode"}
        onClick={toggleScanMode}
      >
        <ScanModeIcon scanMode={scanMode} />
        <ScanModeLabel scanMode={scanMode} />
      </Button>
    </nav>
  );
}
