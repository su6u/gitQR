"use client";

import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { placeBoardDoodles } from "@/lib/qr-doodles";
import { isFinderModule, isFinderModuleInCircle } from "@/lib/qr-finder";
import {
  moduleCountForSpan,
  QR_BOARD_GAP_PX,
  QR_BOARD_REFERENCE_CELL_PX,
  qrModuleIndex,
  qrRegionRect,
} from "@/lib/qr-layout";
import { roundnessForModulePx } from "@/lib/playground-style";
import {
  boardSymbolLayoutFromRegion,
  formatUsernameLabel,
  qrModuleInUsernameCutout,
  QR_USERNAME_CUTOUT_FILL,
  usernameLabelCutout,
  type UsernameLabelCutout,
} from "@/lib/qr-username-label";
import { caveat } from "@/lib/fonts";
import { isPlaygroundEnterReload } from "@/lib/playground-enter-seen";
import {
  buildRevealSchedule,
  collectRevealIndices,
  collectUsernameCutoutIndices,
  QR_REVEAL_TOTAL_MS,
  QR_REVEAL_TRANSITION_MS,
  reverseRevealSchedule,
  USERNAME_CUTOUT_SPREAD_MS,
  USERNAME_TEXT_SPREAD_MS,
} from "@/lib/qr-reveal";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

const MAGNET_RADIUS = 5.5;
const MAX_PUSH_RATIO = 0.55;
const USERNAME_MAGNET_RADIUS_MULT = 2.5;
const USERNAME_MAX_PUSH_RATIO = 0.85;
const MAGNET_SPRING = 0.11;
const DEFAULT_FILL = "#e3e3e3";

type UsernameExitSnapshot = {
  cutoutCellIndices: number[];
  cutoutModuleKeys: Set<number>;
  label: string;
  cutout: UsernameLabelCutout;
  color: string;
};

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
  const { grid: styledGrid, loading, scanMode, style: playgroundStyle } =
    usePlayground();
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const usernameLabelRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lastAffectedRef = useRef<Set<number>>(new Set());
  const lastAffectedUsernameCharsRef = useRef<Set<HTMLElement>>(new Set());
  const hoverEnabledRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const gridDimsRef = useRef({ cols: 0, rows: 0 });
  const prevGridRef = useRef<typeof styledGrid>(null);
  const gridGenerationRef = useRef(0);
  const lastCompletedRevealKeyRef = useRef<string | null>(null);
  const revealingRef = useRef(false);
  const [layout, setLayout] = useState({ cols: 0, rows: 0, width: 0, height: 0 });
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealFinished, setRevealFinished] = useState(false);
  const [revealDelays, setRevealDelays] = useState<Map<number, number>>(
    () => new Map(),
  );
  const [usernameCutoutDelays, setUsernameCutoutDelays] = useState<
    Map<number, number>
  >(() => new Map());
  const [usernameTextDelays, setUsernameTextDelays] = useState<
    Map<number, number>
  >(() => new Map());
  const [usernameRevealActive, setUsernameRevealActive] = useState(false);
  const [usernameCutoutLit, setUsernameCutoutLit] = useState(false);
  const [usernameTextLit, setUsernameTextLit] = useState(false);
  const [usernameShowText, setUsernameShowText] = useState(false);
  const [usernameExitActive, setUsernameExitActive] = useState(false);
  const [usernameExitSnapshot, setUsernameExitSnapshot] =
    useState<UsernameExitSnapshot | null>(null);
  const usernameExitActiveRef = useRef(false);
  const exitSnapshotRef = useRef<UsernameExitSnapshot | null>(null);
  const prevShowUsernameRef = useRef(playgroundStyle.showUsername);

  const hasGeneratedGrid = Boolean(styledGrid?.modules.length);

  const moduleRoundnessPx = useMemo(() => {
    if (layout.cols === 0 || layout.width === 0) {
      return roundnessForModulePx(
        playgroundStyle.roundnessPx,
        QR_BOARD_REFERENCE_CELL_PX,
        QR_BOARD_REFERENCE_CELL_PX,
      );
    }
    const cellPx =
      (layout.width - (layout.cols - 1) * QR_BOARD_GAP_PX) / layout.cols;
    return roundnessForModulePx(
      playgroundStyle.roundnessPx,
      cellPx,
      QR_BOARD_REFERENCE_CELL_PX,
    );
  }, [layout.cols, layout.width, playgroundStyle.roundnessPx]);

  const qrRegion = useMemo(() => {
    if (layout.cols === 0 || layout.width === 0 || layout.height === 0) {
      return null;
    }
    return qrRegionRect(
      layout.width,
      layout.height,
      layout.rows,
      layout.cols,
    );
  }, [layout.cols, layout.rows, layout.width, layout.height]);

  const usernameLabel = useMemo(() => {
    if (!styledGrid?.url) return null;
    const match = styledGrid.url.match(/github\.com\/([^/?#]+)/i);
    return match?.[1] ?? null;
  }, [styledGrid?.url]);

  const usernameCutout = useMemo(() => {
    if (
      !playgroundStyle.showUsername ||
      !usernameLabel ||
      !qrRegion
    ) {
      return null;
    }
    return usernameLabelCutout(
      boardSymbolLayoutFromRegion(qrRegion),
      usernameLabel,
      playgroundStyle,
    );
  }, [playgroundStyle.showUsername, playgroundStyle.usernameFontPx, usernameLabel, qrRegion]);

  const qrSymbolLayout = useMemo(() => {
    if (!qrRegion) return null;
    return boardSymbolLayoutFromRegion(qrRegion);
  }, [qrRegion]);

  const usernameCutoutModules = useMemo(() => {
    if (!usernameCutout || !qrRegion || !styledGrid) return null;

    const layout = boardSymbolLayoutFromRegion(qrRegion);
    const hidden = new Set<number>();

    for (const mod of styledGrid.modules) {
      if (qrModuleInUsernameCutout(mod.row, mod.col, layout, usernameCutout)) {
        hidden.add(mod.row * styledGrid.size + mod.col);
      }
    }

    return hidden;
  }, [usernameCutout, qrRegion, styledGrid]);

  useLayoutEffect(() => {
    if (
      !playgroundStyle.showUsername ||
      !styledGrid ||
      !usernameCutoutModules ||
      !usernameCutout ||
      !usernameLabel ||
      layout.cols === 0
    ) {
      return;
    }

    exitSnapshotRef.current = {
      cutoutCellIndices: collectUsernameCutoutIndices(
        styledGrid,
        layout.rows,
        layout.cols,
        usernameCutoutModules,
      ),
      cutoutModuleKeys: usernameCutoutModules,
      label: formatUsernameLabel(usernameLabel),
      cutout: usernameCutout,
      color: playgroundStyle.usernameColor,
    };
  }, [
    playgroundStyle.showUsername,
    playgroundStyle.usernameColor,
    playgroundStyle.usernameFontPx,
    styledGrid,
    usernameCutoutModules,
    usernameCutout,
    usernameLabel,
    layout.cols,
    layout.rows,
  ]);

  useLayoutEffect(() => {
    const isOn = playgroundStyle.showUsername;
    const wasOn = prevShowUsernameRef.current;

    if (!isOn && wasOn) {
      prevShowUsernameRef.current = isOn;

      const snap = exitSnapshotRef.current;
      if (
        !snap ||
        snap.cutoutCellIndices.length === 0 ||
        reducedMotionRef.current
      ) {
        setUsernameRevealActive(false);
        setUsernameCutoutLit(false);
        setUsernameShowText(false);
        setUsernameTextLit(false);
        setUsernameCutoutDelays(new Map());
        setUsernameTextDelays(new Map());
        setUsernameExitActive(false);
        setUsernameExitSnapshot(null);
        usernameExitActiveRef.current = false;
        exitSnapshotRef.current = null;
        return;
      }

      const textCompleteMs =
        USERNAME_TEXT_SPREAD_MS + QR_REVEAL_TRANSITION_MS;
      const cutoutCompleteMs =
        USERNAME_CUTOUT_SPREAD_MS + QR_REVEAL_TRANSITION_MS;

      const cutoutDelays = reverseRevealSchedule(
        buildRevealSchedule(snap.cutoutCellIndices, USERNAME_CUTOUT_SPREAD_MS),
      );
      const textDelays = reverseRevealSchedule(
        buildRevealSchedule(
          snap.label.split("").map((_, index) => index),
          USERNAME_TEXT_SPREAD_MS,
        ),
      );

      usernameExitActiveRef.current = true;
      setUsernameExitActive(true);
      setUsernameExitSnapshot(snap);
      setUsernameShowText(true);
      setUsernameTextLit(true);
      setUsernameCutoutLit(true);
      setUsernameCutoutDelays(cutoutDelays);
      setUsernameTextDelays(textDelays);
      setUsernameRevealActive(true);

      const textExit = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setUsernameTextLit(false));
      });
      const hideText = window.setTimeout(() => {
        setUsernameShowText(false);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setUsernameCutoutLit(false));
        });
      }, textCompleteMs);
      const finish = window.setTimeout(() => {
        setUsernameRevealActive(false);
        setUsernameCutoutLit(false);
        setUsernameShowText(false);
        setUsernameTextLit(false);
        setUsernameCutoutDelays(new Map());
        setUsernameTextDelays(new Map());
        setUsernameExitActive(false);
        setUsernameExitSnapshot(null);
        usernameExitActiveRef.current = false;
        exitSnapshotRef.current = null;
      }, textCompleteMs + cutoutCompleteMs);

      return () => {
        window.cancelAnimationFrame(textExit);
        window.clearTimeout(hideText);
        window.clearTimeout(finish);
      };
    }

    prevShowUsernameRef.current = isOn;

    if (!isOn) {
      if (usernameExitActiveRef.current) return;
      setUsernameRevealActive(false);
      setUsernameCutoutLit(false);
      setUsernameShowText(false);
      setUsernameTextLit(false);
      setUsernameCutoutDelays(new Map());
      setUsernameTextDelays(new Map());
      return;
    }

    if (!styledGrid || !usernameCutoutModules || layout.cols === 0) return;

    const cutoutIndices = collectUsernameCutoutIndices(
      styledGrid,
      layout.rows,
      layout.cols,
      usernameCutoutModules,
    );
    if (cutoutIndices.length === 0) return;

    if (wasOn) {
      setUsernameRevealActive(false);
      setUsernameCutoutDelays(new Map());
      setUsernameTextDelays(new Map());
      setUsernameCutoutLit(true);
      setUsernameShowText(true);
      setUsernameTextLit(true);
      return;
    }

    const cutoutCompleteMs =
      USERNAME_CUTOUT_SPREAD_MS + QR_REVEAL_TRANSITION_MS;

    const label = usernameLabel ? formatUsernameLabel(usernameLabel) : "";
    const cutoutDelays = buildRevealSchedule(
      cutoutIndices,
      USERNAME_CUTOUT_SPREAD_MS,
    );
    const textDelays = buildRevealSchedule(
      label.split("").map((_, index) => index),
      USERNAME_TEXT_SPREAD_MS,
    );

    setUsernameCutoutLit(false);
    setUsernameShowText(false);
    setUsernameTextLit(false);
    setUsernameCutoutDelays(cutoutDelays);
    setUsernameTextDelays(textDelays);
    setUsernameRevealActive(true);

    const startCutout = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setUsernameCutoutLit(true));
    });
    const textStart = window.setTimeout(() => {
      setUsernameShowText(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setUsernameTextLit(true));
      });
    }, cutoutCompleteMs);
    const finish = window.setTimeout(
      () => setUsernameRevealActive(false),
      cutoutCompleteMs + USERNAME_TEXT_SPREAD_MS + QR_REVEAL_TRANSITION_MS,
    );

    return () => {
      window.cancelAnimationFrame(startCutout);
      window.clearTimeout(textStart);
      window.clearTimeout(finish);
    };
  }, [
    playgroundStyle.showUsername,
    playgroundStyle.usernameFontPx,
    styledGrid,
    usernameCutoutModules,
    usernameLabel,
    layout.cols,
    layout.rows,
  ]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setLayout({
        cols: moduleCountForSpan(width),
        rows: moduleCountForSpan(height),
        width,
        height,
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

    const hadGrid = prevGridRef.current !== null;
    const gridChanged = styledGrid !== prevGridRef.current;
    const isRegenerate = hadGrid && gridChanged && styledGrid !== null;

    if (!styledGrid) {
      prevGridRef.current = null;
    } else if (gridChanged) {
      prevGridRef.current = styledGrid;
      gridGenerationRef.current += 1;
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
      revealingRef.current = false;
      return;
    }

    const revealKey = styledGrid
      ? `grid:${layout.cols}x${layout.rows}:d${doodleFills.size}:g${gridGenerationRef.current}`
      : `empty:${layout.cols}x${layout.rows}:d${doodleFills.size}`;
    if (revealKey === lastCompletedRevealKeyRef.current) return;

    if (isPlaygroundEnterReload() && !isRegenerate) {
      setRevealing(false);
      setRevealed(false);
      setRevealDelays(new Map());
      setRevealFinished(true);
      revealingRef.current = false;
      lastCompletedRevealKeyRef.current = revealKey;
      return;
    }

    setRevealed(false);
    if (!isRegenerate) {
      setRevealFinished(false);
    }
    setRevealDelays(buildRevealSchedule(revealIndices));
    setRevealing(true);
    revealingRef.current = true;

    const gridEl = gridRef.current;
    const boardEl = containerRef.current;
    if (gridEl) delete gridEl.dataset.magnet;
    if (boardEl) delete boardEl.dataset.magnet;

    const startReveal = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setRevealed(true));
    });
    const timer = window.setTimeout(() => {
      setRevealing(false);
      setRevealed(false);
      setRevealFinished(true);
      revealingRef.current = false;
      lastCompletedRevealKeyRef.current = revealKey;
    }, QR_REVEAL_TOTAL_MS);

    return () => {
      window.cancelAnimationFrame(startReveal);
      window.clearTimeout(timer);
      revealingRef.current = false;
    };
  }, [styledGrid, layout.cols, layout.rows, doodleFills]);

  // Reset magnet offsets when the QR content changes without a resize.
  // biome-ignore lint/correctness/useExhaustiveDependencies: styledGrid triggers cell reset on regenerate
  useLayoutEffect(() => {
    cellsRef.current.length = moduleCountTotal;
    lastAffectedRef.current.clear();
    for (const char of lastAffectedUsernameCharsRef.current) {
      resetCell(char);
    }
    lastAffectedUsernameCharsRef.current.clear();
  }, [moduleCountTotal, styledGrid]);

  useLayoutEffect(() => {
    const boardEl = containerRef.current;
    const gridEl = gridRef.current;
    if (!boardEl || !gridEl || layout.cols === 0 || layout.rows === 0 || scanMode) {
      return;
    }

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
      for (const char of lastAffectedUsernameCharsRef.current) {
        resetCell(char);
      }
      lastAffectedUsernameCharsRef.current.clear();
    };

    const applyUsernameMagneticField = (
      mx: number,
      my: number,
      radiusPx: number,
      maxPush: number,
    ) => {
      const labelEl = usernameLabelRef.current;
      if (!labelEl) {
        for (const char of lastAffectedUsernameCharsRef.current) {
          resetCell(char);
        }
        lastAffectedUsernameCharsRef.current.clear();
        return;
      }

      const textRadiusPx = radiusPx * USERNAME_MAGNET_RADIUS_MULT;
      const textMaxPush = maxPush * (USERNAME_MAX_PUSH_RATIO / MAX_PUSH_RATIO);
      const chars = labelEl.querySelectorAll<HTMLElement>(".qr-username-char");
      const nextAffected = new Set<HTMLElement>();

      for (const char of chars) {
        const rect = char.getBoundingClientRect();
        const boardRect = boardEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2 - boardRect.left;
        const cy = rect.top + rect.height / 2 - boardRect.top;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        const charRadius = Math.max(textRadiusPx, rect.width, rect.height);
        if (dist > charRadius || dist < 0.001) continue;

        const t = 1 - dist / charRadius;
        const strength = t * t;
        const push = strength * textMaxPush;
        const tx = -(dx / dist) * push;
        const ty = -(dy / dist) * push;

        nextAffected.add(char);
        char.style.setProperty("--qr-x", `${tx.toFixed(2)}px`);
        char.style.setProperty("--qr-y", `${ty.toFixed(2)}px`);
      }

      for (const char of lastAffectedUsernameCharsRef.current) {
        if (!nextAffected.has(char)) resetCell(char);
      }
      lastAffectedUsernameCharsRef.current = nextAffected;
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
      applyUsernameMagneticField(mx, my, radiusPx, maxPush);
    };

    const setMagnetState = (state: "active" | "settling" | null) => {
      if (state) {
        boardEl.dataset.magnet = state;
        gridEl.dataset.magnet = state;
        return;
      }
      delete boardEl.dataset.magnet;
      delete gridEl.dataset.magnet;
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
        (lastAffectedRef.current.size === 0 &&
          lastAffectedUsernameCharsRef.current.size === 0) ||
        reducedMotionRef.current ||
        !hoverEnabledRef.current
      ) {
        setMagnetState(null);
        resetAffected();
        return;
      }

      setMagnetState("settling");

      requestAnimationFrame(() => {
        resetAffected();
      });

      window.setTimeout(() => {
        if (boardEl.dataset.magnet === "settling") {
          setMagnetState(null);
        }
      }, 260);
    };

    const startMagnet = () => {
      if (magnetActive || revealingRef.current) return;
      magnetActive = true;
      setMagnetState("active");
      rafId = requestAnimationFrame(tick);
    };

    const stopMagnet = () => {
      settleMagnet();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!hoverEnabledRef.current) return;

      const rect = boardEl.getBoundingClientRect();
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
      const rect = boardEl.getBoundingClientRect();
      targetX = smoothX = e.clientX - rect.left;
      targetY = smoothY = e.clientY - rect.top;
      startMagnet();
    };

    const onMouseLeave = () => {
      stopMagnet();
    };

    boardEl.addEventListener("mouseenter", onMouseEnter);
    boardEl.addEventListener("mousemove", onMouseMove);
    boardEl.addEventListener("mouseleave", onMouseLeave);

    return () => {
      stopMagnet();
      finePointerQuery.removeEventListener("change", updateMedia);
      reducedMotionQuery.removeEventListener("change", updateMedia);
      boardEl.removeEventListener("mouseenter", onMouseEnter);
      boardEl.removeEventListener("mousemove", onMouseMove);
      boardEl.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [layout.cols, layout.rows, scanMode]);

  return (
    <div
      ref={containerRef}
      className={cn("qr-board relative min-h-0 h-full w-full", className)}
      style={style}
    >
      {layout.cols > 0 && layout.rows > 0 && (
        <div
          ref={gridRef}
          className="qr-grid grid h-full w-full"
          data-reveal={revealing ? "" : undefined}
          data-username-reveal={
            usernameRevealActive || usernameExitActive ? "" : undefined
          }
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
            const activeCutout = usernameExitSnapshot?.cutout ?? usernameCutout;
            const inUsernameCutout =
              mod !== undefined &&
              styledGrid != null &&
              qrSymbolLayout != null &&
              activeCutout != null &&
              (usernameExitActive && usernameExitSnapshot
                ? usernameExitSnapshot.cutoutModuleKeys.has(
                    mod.row * styledGrid.size + mod.col,
                  )
                : qrModuleInUsernameCutout(
                    mod.row,
                    mod.col,
                    qrSymbolLayout,
                    activeCutout,
                  ));
            const usernameVisible =
              playgroundStyle.showUsername || usernameExitActive;
            const shouldUsernameReveal =
              usernameVisible &&
              usernameRevealActive &&
              usernameCutoutDelays.has(i);
            const usernameCutoutDone =
              usernameVisible &&
              inUsernameCutout &&
              usernameCutoutLit &&
              !usernameRevealActive;
            const moduleFill = mod?.fill ?? doodleFill ?? DEFAULT_FILL;
            const fill = isFinderOutsideCircle
              ? DEFAULT_FILL
              : usernameCutoutDone
                ? QR_USERNAME_CUTOUT_FILL
                : moduleFill;
            const isAnimatedCell =
              doodleFill !== undefined ||
              (Boolean(mod?.isDark) && !isFinderOutsideCircle);
            const shouldReveal =
              revealing &&
              revealDelays.has(i) &&
              isAnimatedCell &&
              !isFinderOutsideCircle &&
              !shouldUsernameReveal;
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
                  "qr-cell block min-h-0 min-w-0",
                  shouldReveal && "qr-cell--reveal",
                  shouldReveal && revealed && "qr-cell--lit",
                  shouldUsernameReveal && "qr-cell--username-reveal",
                  shouldUsernameReveal &&
                    usernameCutoutLit &&
                    "qr-cell--username-lit",
                )}
                style={{
                  borderRadius: `${moduleRoundnessPx}px`,
                  ...(shouldReveal
                    ? {
                        "--qr-target-fill": fill,
                        "--qr-reveal-delay": `${revealDelays.get(i) ?? 0}ms`,
                      }
                    : shouldUsernameReveal
                      ? {
                          "--qr-username-start-fill": moduleFill,
                          "--qr-reveal-delay": `${usernameCutoutDelays.get(i) ?? 0}ms`,
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
      {(playgroundStyle.showUsername || usernameExitActive) &&
        usernameShowText &&
        (usernameCutout ?? usernameExitSnapshot?.cutout) && (
        <div
          ref={usernameLabelRef}
          className="qr-username-label absolute"
          style={{
            left: (usernameCutout ?? usernameExitSnapshot!.cutout).x,
            top: (usernameCutout ?? usernameExitSnapshot!.cutout).y,
            width: (usernameCutout ?? usernameExitSnapshot!.cutout).width,
            height: (usernameCutout ?? usernameExitSnapshot!.cutout).height,
            fontSize: (usernameCutout ?? usernameExitSnapshot!.cutout).fontSize,
            borderRadius: (usernameCutout ?? usernameExitSnapshot!.cutout).radius,
            backgroundColor: QR_USERNAME_CUTOUT_FILL,
          }}
        >
          {(usernameLabel
            ? formatUsernameLabel(usernameLabel)
            : usernameExitSnapshot!.label
          )
            .split("")
            .map((char, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: label length is stable per user
              key={`${char}-${index}`}
              className={cn(
                "qr-username-char inline-block",
                caveat.className,
                "font-bold leading-none",
                usernameRevealActive && "qr-username-char--reveal",
                usernameTextLit && "qr-username-char--lit",
              )}
              style={
                usernameRevealActive
                  ? ({
                      "--qr-reveal-delay": `${usernameTextDelays.get(index) ?? 0}ms`,
                      "--qr-username-text-color":
                        playgroundStyle.usernameColor ||
                        usernameExitSnapshot?.color,
                    } as CSSProperties)
                  : {
                      color:
                        playgroundStyle.usernameColor ||
                        usernameExitSnapshot?.color,
                    }
              }
            >
              {char}
            </span>
          ))}
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
