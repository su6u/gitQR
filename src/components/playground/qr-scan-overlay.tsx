"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type RefObject, useEffect, useState } from "react";
import { useQrBoardLayout } from "@/components/playground/qr-board";
import { expandQrRegionRect, PANEL_WIDTH_RATIO } from "@/lib/qr-layout";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const SCAN_EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SCAN_EASE_IN = [0.55, 0, 1, 0.45] as const;
const ARROW_INFO_SRC = "/images/arrow_info.svg";
/** Matches public/images/arrow_info.svg viewBox="0 0 958 235". */
const ARROW_INFO_ASPECT = 235 / 958;
/** Hand-drawn arrow tip in SVG viewBox coordinates. */
const ARROW_TIP_X_RATIO = 19 / 958;
const ARROW_TIP_Y_RATIO = 234 / 235;

function scanHintMetrics(
  scanTarget: { x: number; y: number; width: number; height: number },
  boardWidth: number,
): { width: number; height: number; left: number; top: number } {
  const leftCanvasWidth = boardWidth * (1 - PANEL_WIDTH_RATIO);
  const width = Math.min(
    leftCanvasWidth * 0.36,
    Math.max(168, scanTarget.width * 0.38),
  );
  const height = width * ARROW_INFO_ASPECT;
  // Restore tuned horizontal placement (center-based), then convert to tip anchor.
  const hintCenterX =
    scanTarget.x + scanTarget.width * 0.72 + leftCanvasWidth * 0.16;
  const tipTargetX = hintCenterX + width * (ARROW_TIP_X_RATIO - 0.5);
  const tipTargetY = scanTarget.y;
  const left = tipTargetX - width * ARROW_TIP_X_RATIO;
  const top = tipTargetY - height * ARROW_TIP_Y_RATIO;
  const minLeft = 12;
  const maxLeft = leftCanvasWidth - width - 12;

  return {
    width,
    height,
    left: Math.min(Math.max(left, minLeft), maxLeft),
    top,
  };
}

export function QrScanOverlay({
  boardAreaRef,
}: {
  boardAreaRef: RefObject<HTMLElement | null>;
}) {
  const { grid, scanMode, scanStatus, exitScanMode, scanQr } = usePlayground();
  const { region, layout } = useQrBoardLayout(boardAreaRef);
  const reduceMotion = useReducedMotion();
  const [targetReady, setTargetReady] = useState(false);

  useEffect(() => {
    if (!scanMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitScanMode();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scanMode, exitScanMode]);

  useEffect(() => {
    if (!scanMode) {
      setTargetReady(false);
      return;
    }
    if (!region || !grid) return;

    const timer = window.setTimeout(
      () => setTargetReady(true),
      reduceMotion ? 0 : 90,
    );
    return () => window.clearTimeout(timer);
  }, [scanMode, region, grid, reduceMotion]);

  const canScan = Boolean(grid);
  const scanTarget = region && canScan ? expandQrRegionRect(region) : null;
  const scanHint =
    scanTarget && layout.width > 0
      ? scanHintMetrics(scanTarget, layout.width)
      : null;
  const isScanning = scanStatus === "scanning";

  const enterTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: SCAN_EASE_OUT };
  const exitTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: SCAN_EASE_IN };

  return (
    <AnimatePresence>
      {scanMode ? (
        <motion.div
          key="qr-scan-overlay"
          className="qr-scan-overlay pointer-events-none absolute inset-0 z-20"
          aria-hidden={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={exitTransition}
        >
          {scanTarget ? (
            <>
              {scanHint ? (
                <motion.div
                  className="pointer-events-none absolute"
                  style={{
                    left: scanHint.left,
                    top: scanHint.top,
                    width: scanHint.width,
                    height: scanHint.height,
                  }}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, transform: "translateY(-6px)" }
                  }
                  animate={{ opacity: 1, transform: "translateY(0)" }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          transform: "translateY(-4px)",
                          transition: exitTransition,
                        }
                  }
                  transition={{
                    ...enterTransition,
                    delay: reduceMotion ? 0 : 0.12,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ARROW_INFO_SRC}
                    alt=""
                    aria-hidden
                    className="block h-full w-full select-none"
                    draggable={false}
                  />
                  <span className="sr-only">Click the QR code to scan</span>
                </motion.div>
              ) : null}

              <motion.div
                className="qr-scan-spotlight pointer-events-none absolute rounded-xl"
                style={{
                  left: scanTarget.x,
                  top: scanTarget.y,
                  width: scanTarget.width,
                  height: scanTarget.height,
                }}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, transform: "scale(0.95)" }
                }
                animate={{ opacity: 1, transform: "scale(1)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        transform: "scale(0.98)",
                        transition: exitTransition,
                      }
                }
                transition={enterTransition}
              />

              <motion.button
                type="button"
                className={cn(
                  "qr-scan-target group pointer-events-auto absolute cursor-crosshair overflow-hidden rounded-xl border-2 border-scan-accent/40 p-0 opacity-90 outline-none",
                  "hover:border-scan-accent hover:opacity-100 hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--scan-accent)_18%,transparent)]",
                  "focus-visible:border-scan-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-scan-accent/40",
                  isScanning && "qr-scan-target--scanning",
                )}
                style={{
                  left: scanTarget.x,
                  top: scanTarget.y,
                  width: scanTarget.width,
                  height: scanTarget.height,
                }}
                data-ready={targetReady ? "" : undefined}
                data-scanning={isScanning ? "" : undefined}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        transform: "scale(0.95)",
                        filter: "blur(4px)",
                      }
                }
                animate={{
                  opacity: isScanning ? 0.72 : 0.9,
                  transform: "scale(1)",
                  filter: "blur(0px)",
                }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        transform: "scale(0.97)",
                        filter: "blur(2px)",
                        transition: exitTransition,
                      }
                }
                transition={{
                  ...enterTransition,
                  delay: reduceMotion ? 0 : 0.04,
                }}
                whileTap={
                  isScanning || reduceMotion ? undefined : { scale: 0.96 }
                }
                aria-label="Scan QR code and copy URL"
                disabled={isScanning}
                onClick={() => {
                  if (isScanning) return;
                  void scanQr();
                }}
              >
                <span
                  className="qr-scan-crosshair absolute inset-0"
                  aria-hidden
                />
                <span
                  className={cn(
                    "qr-scan-sweep absolute inset-x-0 h-px",
                    isScanning && "qr-scan-sweep--active",
                  )}
                  aria-hidden
                />
                <span className="sr-only">Scan QR code</span>
              </motion.button>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
