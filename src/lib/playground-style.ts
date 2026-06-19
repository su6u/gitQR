import type { ContributionPaletteId } from "@/lib/contribution-palettes";
import { DEFAULT_CONTRIBUTION_PALETTE_ID } from "@/lib/contribution-palettes";
import {
  DEFAULT_USERNAME_LABEL,
  type QrUsernameLabelStyle,
} from "@/lib/qr-username-label";

export const PLAYGROUND_ROUNDNESS_MIN = 2;
export const PLAYGROUND_ROUNDNESS_MAX = 6;
export const PLAYGROUND_ROUNDNESS_DEFAULT = 5;

export interface PlaygroundStyle extends QrUsernameLabelStyle {
  roundnessPx: number;
  paletteId: ContributionPaletteId;
}

export const DEFAULT_PLAYGROUND_STYLE: PlaygroundStyle = {
  roundnessPx: PLAYGROUND_ROUNDNESS_DEFAULT,
  paletteId: DEFAULT_CONTRIBUTION_PALETTE_ID,
  ...DEFAULT_USERNAME_LABEL,
};

export {
  clampUsernameFontPx,
  USERNAME_COLOR_DEFAULT,
  USERNAME_FONT_DEFAULT,
  USERNAME_FONT_MAX,
  USERNAME_FONT_MIN,
} from "@/lib/qr-username-label";

export function clampRoundnessPx(value: number): number {
  return Math.min(
    PLAYGROUND_ROUNDNESS_MAX,
    Math.max(PLAYGROUND_ROUNDNESS_MIN, value),
  );
}

/** Scale playground roundness to a module pixel size (board + export). */
export function roundnessForModulePx(
  roundnessPx: number,
  modulePx: number,
  referenceCellPx: number,
): number {
  return Math.min(
    modulePx / 2,
    (roundnessPx * modulePx) / referenceCellPx,
  );
}
