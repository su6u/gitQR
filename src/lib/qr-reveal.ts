import type { StyledQrGrid } from "@/lib/qr-map";
import { isFinderModule, isFinderModuleInCircle } from "@/lib/qr-finder";
import { qrModuleIndex } from "@/lib/qr-layout";

/** Same as empty board cells — reveal starts here, then transitions to target fill. */
export const QR_REVEAL_START_COLOR = "#e3e3e3";

/** How long each square takes gray → green. */
export const QR_REVEAL_TRANSITION_MS = 280;

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
export function buildRevealSchedule(
  cellIndices: number[],
  spreadMs = QR_REVEAL_SPREAD_MS,
): Map<number, number> {
  const shuffled = shuffle(cellIndices);
  const stagger =
    shuffled.length > 1 ? spreadMs / (shuffled.length - 1) : 0;
  const schedule = new Map<number, number>();
  for (let order = 0; order < shuffled.length; order++) {
    schedule.set(shuffled[order], Math.round(order * stagger));
  }
  return schedule;
}

/** Flip stagger order so the last cell to light is the first to dim. */
export function reverseRevealSchedule(
  schedule: Map<number, number>,
): Map<number, number> {
  const max = Math.max(0, ...schedule.values());
  const reversed = new Map<number, number>();
  for (const [index, delay] of schedule) {
    reversed.set(index, max - delay);
  }
  return reversed;
}

/** Middle username hole — faster than the full-board QR reveal. */
export const USERNAME_CUTOUT_SPREAD_MS = 520;

export const USERNAME_TEXT_SPREAD_MS = 360;

/** Board cell indices whose QR modules sit inside the username cutout. */
export function collectUsernameCutoutIndices(
  styledGrid: StyledQrGrid,
  rows: number,
  cols: number,
  cutoutModuleKeys: Set<number>,
): number[] {
  const indices: number[] = [];
  const total = rows * cols;

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const qrIndex = qrModuleIndex(row, col, rows, cols);
    if (qrIndex === null) continue;
    const mod = styledGrid.modules[qrIndex];
    if (!mod) continue;
    const key = mod.row * styledGrid.size + mod.col;
    if (cutoutModuleKeys.has(key)) indices.push(i);
  }

  return indices;
}

if (import.meta.main) {
  const doodles = new Map<number, string>([
    [0, "#f00"],
    [5, "#0f0"],
  ]);
  const indices = collectRevealIndices(null, 10, 10, doodles);
  console.assert(indices.length === 2 && indices.includes(0) && indices.includes(5));

  const schedule = buildRevealSchedule([1, 2, 3], 300);
  const reversed = reverseRevealSchedule(schedule);
  console.assert(reversed.size === 3);
  for (const [index, delay] of schedule) {
    console.assert(reversed.get(index) === 300 - delay);
  }
}
