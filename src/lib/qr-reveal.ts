/** Gray all dark modules start from during reveal. */
export const QR_REVEAL_START_COLOR = "#c4c4c4";

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
