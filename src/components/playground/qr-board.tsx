"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GAP_PX = 4;
const MIN_MODULE_PX = 16;

function moduleCount(span: number) {
  return Math.max(1, Math.floor((span + GAP_PX) / (MIN_MODULE_PX + GAP_PX)));
}

export function QrBoard({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={containerRef}
      className={cn("min-h-0 h-full w-full", className)}
      style={style}
    >
      {grid.cols > 0 && grid.rows > 0 && (
        <div
          className="grid h-full w-full"
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
              className="block min-h-0 min-w-0 rounded-[5px] bg-[#e3e3e3]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
