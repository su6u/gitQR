"use client";

import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { placeBoardDoodles } from "@/lib/qr-doodles";
import { isFinderModule, isFinderModuleInCircle } from "@/lib/qr-finder";
import {
  moduleCountForSpan,
  QR_BOARD_GAP_PX,
  qrModuleIndex,
  qrRegionRect,
} from "@/lib/qr-layout";
import {
  buildRevealSchedule,
  collectRevealIndices,
  QR_REVEAL_TOTAL_MS,
} from "@/lib/qr-reveal";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const MAGNET_RADIUS = 5.5;
const MAX_PUSH_RATIO = 0.55;
const MAGNET_SPRING = 0.11;
const DEFAULT_FILL = "#e3e3e3";

function resetCell(cell: HTMLElement) {
  cell.style.setProperty("--qr-x", "0px");
  cell.style.setProperty("--qr-y", "0px");
}

export function QrBoard({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const { grid: styledGrid, loading, scanMode } = usePlayground();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lastAffectedRef = useRef<Set<number>>(new Set());
  const hoverEnabledRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const gridDimsRef = useRef({ cols: 0, rows: 0 });
  const prevGridRef = useRef<typeof styledGrid>(null);
  const gridGenerationRef = useRef(0);
  const lastRevealKeyRef = useRef<string | null>(null);
  const [layout, setLayout] = useState({ cols: 0, rows: 0 });
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealFinished, setRevealFinished] = useState(false);
  const [revealDelays, setRevealDelays] = useState<Map<number, number>>(
    () => new Map(),
  );

  const hasGeneratedGrid = Boolean(styledGrid?.modules.length);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setLayout({
        cols: moduleCountForSpan(width),
        rows: moduleCountForSpan(height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const moduleCountTotal = layout.cols * layout.rows;

  const doodleFills = useMemo(
    () => placeBoardDoodles(layout.rows, layout.cols),
    [layout.rows, layout.cols],
  );

  useLayoutEffect(() => {
    gridDimsRef.current = layout;
  }, [layout]);

  useLayoutEffect(() => {
    if (layout.cols === 0 || layout.rows === 0) return;

    if (styledGrid && styledGrid !== prevGridRef.current) {
      prevGridRef.current = styledGrid;
      gridGenerationRef.current += 1;
    }
    if (!styledGrid) {
      prevGridRef.current = null;
    }

    const revealIndices = collectRevealIndices(
      styledGrid,
      layout.rows,
      layout.cols,
      doodleFills,
    );

    if (revealIndices.length === 0) {
      setRevealing(false);
      setRevealed(false);
      setRevealDelays(new Map());
      setRevealFinished(true);
      return;
    }

    const revealKey = styledGrid
      ? `grid:${layout.cols}x${layout.rows}:d${doodleFills.size}:g${gridGenerationRef.current}`
      : `empty:${layout.cols}x${layout.rows}:d${doodleFills.size}`;
    if (revealKey === lastRevealKeyRef.current) return;
    lastRevealKeyRef.current = revealKey;

    setRevealFinished(false);
    setRevealed(false);
    setRevealDelays(buildRevealSchedule(revealIndices));
    setRevealing(true);

    const startReveal = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setRevealed(true));
    });
    const timer = window.setTimeout(() => {
      setRevealing(false);
      setRevealed(false);
      setRevealFinished(true);
    }, QR_REVEAL_TOTAL_MS);

    return () => {
      window.cancelAnimationFrame(startReveal);
      window.clearTimeout(timer);
    };
  }, [styledGrid, layout.cols, layout.rows, doodleFills]);

  // Reset magnet offsets when the QR content changes without a resize.
  // biome-ignore lint/correctness/useExhaustiveDependencies: styledGrid triggers cell reset on regenerate
  useLayoutEffect(() => {
    cellsRef.current.length = moduleCountTotal;
    lastAffectedRef.current.clear();
  }, [moduleCountTotal, styledGrid]);

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl || layout.cols === 0 || layout.rows === 0 || scanMode) return;

    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateMedia = () => {
      hoverEnabledRef.current = finePointerQuery.matches;
      reducedMotionRef.current = reducedMotionQuery.matches;
    };
    updateMedia();
    finePointerQuery.addEventListener("change", updateMedia);
    reducedMotionQuery.addEventListener("change", updateMedia);

    let rafId = 0;
    let magnetActive = false;
    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;

    const resetAffected = () => {
      for (const idx of lastAffectedRef.current) {
        const cell = cellsRef.current[idx];
        if (cell) resetCell(cell);
      }
      lastAffectedRef.current.clear();
    };

    const applyMagneticField = (mx: number, my: number) => {
      const { cols, rows } = gridDimsRef.current;
      const cellWidth =
        (gridEl.offsetWidth - (cols - 1) * QR_BOARD_GAP_PX) / cols;
      const cellHeight =
        (gridEl.offsetHeight - (rows - 1) * QR_BOARD_GAP_PX) / rows;
      const spanX = cellWidth + QR_BOARD_GAP_PX;
      const spanY = cellHeight + QR_BOARD_GAP_PX;
      const avgCell = (cellWidth + cellHeight) / 2;
      const radiusPx = MAGNET_RADIUS * avgCell;
      const maxPush = avgCell * MAX_PUSH_RATIO;
      const radiusCells = Math.ceil(MAGNET_RADIUS);

      const centerCol = Math.min(cols - 1, Math.max(0, Math.floor(mx / spanX)));
      const centerRow = Math.min(rows - 1, Math.max(0, Math.floor(my / spanY)));

      const nextAffected = new Set<number>();

      for (let dr = -radiusCells; dr <= radiusCells; dr++) {
        for (let dc = -radiusCells; dc <= radiusCells; dc++) {
          const c = centerCol + dc;
          const r = centerRow + dr;
          if (c < 0 || c >= cols || r < 0 || r >= rows) continue;

          const cellCX = c * spanX + cellWidth / 2;
          const cellCY = r * spanY + cellHeight / 2;
          const dx = mx - cellCX;
          const dy = my - cellCY;
          const dist = Math.hypot(dx, dy);
          if (dist > radiusPx || dist < 0.001) continue;

          const t = 1 - dist / radiusPx;
          const strength = t * t;
          const push = strength * maxPush;
          const tx = -(dx / dist) * push;
          const ty = -(dy / dist) * push;

          const idx = r * cols + c;
          nextAffected.add(idx);
          const cell = cellsRef.current[idx];
          if (!cell) continue;

          cell.style.setProperty("--qr-x", `${tx.toFixed(2)}px`);
          cell.style.setProperty("--qr-y", `${ty.toFixed(2)}px`);
        }
      }

      for (const idx of lastAffectedRef.current) {
        if (!nextAffected.has(idx)) {
          const cell = cellsRef.current[idx];
          if (cell) resetCell(cell);
        }
      }
      lastAffectedRef.current = nextAffected;
    };

    const tick = () => {
      if (!magnetActive) return;

      if (reducedMotionRef.current) {
        applyMagneticField(targetX, targetY);
      } else {
        smoothX += (targetX - smoothX) * MAGNET_SPRING;
        smoothY += (targetY - smoothY) * MAGNET_SPRING;
        applyMagneticField(smoothX, smoothY);
      }

      rafId = requestAnimationFrame(tick);
    };

    const settleMagnet = () => {
      magnetActive = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }

      if (
        lastAffectedRef.current.size === 0 ||
        reducedMotionRef.current ||
        !hoverEnabledRef.current
      ) {
        delete gridEl.dataset.magnet;
        resetAffected();
        return;
      }

      delete gridEl.dataset.magnet;
      gridEl.dataset.magnet = "settling";

      requestAnimationFrame(() => {
        resetAffected();
      });

      window.setTimeout(() => {
        if (gridEl.dataset.magnet === "settling") {
          delete gridEl.dataset.magnet;
        }
      }, 260);
    };

    const startMagnet = () => {
      if (magnetActive) return;
      magnetActive = true;
      delete gridEl.dataset.magnet;
      gridEl.dataset.magnet = "active";
      rafId = requestAnimationFrame(tick);
    };

    const stopMagnet = () => {
      settleMagnet();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!hoverEnabledRef.current) return;

      const rect = gridEl.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;

      if (reducedMotionRef.current) {
        applyMagneticField(targetX, targetY);
        return;
      }

      startMagnet();
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (!hoverEnabledRef.current) return;
      const rect = gridEl.getBoundingClientRect();
      targetX = smoothX = e.clientX - rect.left;
      targetY = smoothY = e.clientY - rect.top;
      startMagnet();
    };

    const onMouseLeave = () => {
      stopMagnet();
    };

    gridEl.addEventListener("mouseenter", onMouseEnter);
    gridEl.addEventListener("mousemove", onMouseMove);
    gridEl.addEventListener("mouseleave", onMouseLeave);

    return () => {
      stopMagnet();
      finePointerQuery.removeEventListener("change", updateMedia);
      reducedMotionQuery.removeEventListener("change", updateMedia);
      gridEl.removeEventListener("mouseenter", onMouseEnter);
      gridEl.removeEventListener("mousemove", onMouseMove);
      gridEl.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [layout.cols, layout.rows, scanMode]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-h-0 h-full w-full",
        className,
        loading && "opacity-60",
      )}
      style={style}
    >
      {layout.cols > 0 && layout.rows > 0 && (
        <div
          ref={gridRef}
          className="qr-grid grid h-full w-full"
          data-reveal={revealing ? "" : undefined}
          style={{
            gap: `${QR_BOARD_GAP_PX}px`,
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
          }}
          {...(hasGeneratedGrid
            ? {
                role: "img" as const,
                "aria-label": "Generated GitQR code",
              }
            : {})}
          aria-busy={loading}
        >
          {Array.from({ length: moduleCountTotal }, (_, i) => {
            const row = Math.floor(i / layout.cols);
            const col = i % layout.cols;
            const qrIndex = hasGeneratedGrid
              ? qrModuleIndex(row, col, layout.rows, layout.cols)
              : null;
            const mod =
              qrIndex !== null ? styledGrid?.modules[qrIndex] : undefined;
            const isFinderOutsideCircle =
              mod !== undefined &&
              styledGrid != null &&
              isFinderModule(mod.row, mod.col, styledGrid.size) &&
              !isFinderModuleInCircle(mod.row, mod.col, styledGrid.size);
            const doodleFill = qrIndex === null ? doodleFills.get(i) : undefined;
            const fill = isFinderOutsideCircle
              ? DEFAULT_FILL
              : (mod?.fill ?? doodleFill ?? DEFAULT_FILL);
            const isAnimatedCell =
              doodleFill !== undefined ||
              (Boolean(mod?.isDark) && !isFinderOutsideCircle);
            const shouldReveal =
              revealing &&
              revealDelays.has(i) &&
              isAnimatedCell &&
              !isFinderOutsideCircle;
            const awaitReveal =
              isAnimatedCell && !revealFinished && !shouldReveal;

            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: playground grid, position is stable per resize
                key={i}
                ref={(el) => {
                  cellsRef.current[i] = el;
                }}
                className={cn(
                  "qr-cell block min-h-0 min-w-0 rounded-[5px]",
                  shouldReveal && "qr-cell--reveal",
                  shouldReveal && revealed && "qr-cell--lit",
                )}
                style={{
                  ...(shouldReveal
                    ? {
                        "--qr-target-fill": fill,
                        "--qr-reveal-delay": `${revealDelays.get(i) ?? 0}ms`,
                      }
                    : {
                        backgroundColor: awaitReveal ? DEFAULT_FILL : fill,
                      }),
                }}
                title={
                  mod
                    ? `${mod.contribution.date || "no date"} · level ${mod.contribution.level}${mod.isDark ? " · QR dark" : ""}`
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function useQrBoardLayout(containerRef: RefObject<HTMLElement | null>) {
  const [layout, setLayout] = useState({
    cols: 0,
    rows: 0,
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setLayout({
        width,
        height,
        cols: moduleCountForSpan(width),
        rows: moduleCountForSpan(height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const region =
    layout.width > 0 && layout.height > 0
      ? qrRegionRect(layout.width, layout.height, layout.rows, layout.cols)
      : null;

  return { layout, region };
}
