import type { ContributionLevel } from "@/lib/contributions";

export function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (channel) => {
      const s = channel / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    },
  );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

const ZERO_DAY_DARK_FILL = "#6e7781";

/** Level 0 is heatmap gray — on dark QR modules use light-medium gray for contrast. */
export function darkFillForLevel(
  level: ContributionLevel,
  sourceColor: string,
): string {
  if (level === 0) return ZERO_DAY_DARK_FILL;
  return sourceColor;
}
