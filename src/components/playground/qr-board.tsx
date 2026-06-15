"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GAP_PX = 4;
const MIN_MODULE_PX = 16;
const MAGNET_RADIUS = 5.5;
const MAX_PUSH_RATIO = 0.55;
const MAGNET_SPRING = 0.11;

function moduleCount(span: number) {
  return Math.max(1, Math.floor((span + GAP_PX) / (MIN_MODULE_PX + GAP_PX)));
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lastAffectedRef = useRef<Set<number>>(new Set());
  const hoverEnabledRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const gridDimsRef = useRef({ cols: 0, rows: 0 });
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setGrid({
        cols: moduleCount(width),
        rows: moduleCount(height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const moduleCountTotal = grid.cols * grid.rows;

  useLayoutEffect(() => {
    gridDimsRef.current = grid;
  }, [grid]);

  useLayoutEffect(() => {
    cellsRef.current.length = moduleCountTotal;
    lastAffectedRef.current.clear();
  }, [moduleCountTotal]);

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl || grid.cols === 0 || grid.rows === 0) return;

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
      const cellWidth = (gridEl.offsetWidth - (cols - 1) * GAP_PX) / cols;
      const cellHeight = (gridEl.offsetHeight - (rows - 1) * GAP_PX) / rows;
      const spanX = cellWidth + GAP_PX;
      const spanY = cellHeight + GAP_PX;
      const avgCell = (cellWidth + cellHeight) / 2;
      const radiusPx = MAGNET_RADIUS * avgCell;
      const maxPush = avgCell * MAX_PUSH_RATIO;
      const radiusCells = Math.ceil(MAGNET_RADIUS);

      const centerCol = Math.min(
        cols - 1,
        Math.max(0, Math.floor(mx / spanX)),
      );
      const centerRow = Math.min(
        rows - 1,
        Math.max(0, Math.floor(my / spanY)),
      );

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
          // Repel: move away from cursor (opposite of pull direction)
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

      // Enable CSS transition only for snap-back (transitions-dev avatar pattern)
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
  }, [grid.cols, grid.rows]);

  return (
    <div
      ref={containerRef}
      className={cn("min-h-0 h-full w-full", className)}
      style={style}
    >
      {grid.cols > 0 && grid.rows > 0 && (
        <div
          ref={gridRef}
          className="qr-grid grid h-full w-full"
          style={{
            gap: `${GAP_PX}px`,
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: moduleCountTotal }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: playground grid, position is stable per resize
              key={i}
              ref={(el) => {
                cellsRef.current[i] = el;
              }}
              className="qr-cell block min-h-0 min-w-0 rounded-[5px] bg-[#e3e3e3]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
