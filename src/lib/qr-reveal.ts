import type { StyledQrGrid } from "@/lib/qr-map";
import { isFinderModule, isFinderModuleInCircle } from "@/lib/qr-finder";
import { qrModuleIndex } from "@/lib/qr-layout";

/** Same as empty board cells — reveal starts here, then transitions to target fill. */
export const QR_REVEAL_START_COLOR = "#e3e3e3";

/** How long each square takes gray → green. */
export const QR_REVEAL_TRANSITION_MS = 320;

/** Time from first square lighting to last square starting. */
export const QR_REVEAL_SPREAD_MS = 5200;

export const QR_REVEAL_TOTAL_MS =
  QR_REVEAL_SPREAD_MS + QR_REVEAL_TRANSITION_MS;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Doodle cells + QR dark modules (never finder corners outside the circle). */
export function collectRevealIndices(
  styledGrid: StyledQrGrid | null,
  rows: number,
  cols: number,
  doodleFills: Map<number, string>,
): number[] {
  const indices = [...doodleFills.keys()];
  if (!styledGrid || rows === 0 || cols === 0) return indices;

  const total = rows * cols;
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const qrIndex = qrModuleIndex(row, col, rows, cols);
    if (qrIndex === null) continue;
    const mod = styledGrid.modules[qrIndex];
    if (!mod?.isDark) continue;
    if (
      isFinderModule(mod.row, mod.col, styledGrid.size) &&
      !isFinderModuleInCircle(mod.row, mod.col, styledGrid.size)
    ) {
      continue;
    }
    indices.push(i);
  }
  return indices;
}

/** Random order — cell index → delay ms before it lights up. */
export function buildRevealSchedule(cellIndices: number[]): Map<number, number> {
  const shuffled = shuffle(cellIndices);
  const stagger =
    shuffled.length > 1 ? QR_REVEAL_SPREAD_MS / (shuffled.length - 1) : 0;
  const schedule = new Map<number, number>();
  for (let order = 0; order < shuffled.length; order++) {
    schedule.set(shuffled[order], Math.round(order * stagger));
  }
  return schedule;
}

if (import.meta.main) {
  const doodles = new Map<number, string>([
    [0, "#f00"],
    [5, "#0f0"],
  ]);
  const indices = collectRevealIndices(null, 10, 10, doodles);
  console.assert(indices.length === 2 && indices.includes(0) && indices.includes(5));
}
