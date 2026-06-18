import {
  type ContributionLevel,
  GITHUB_CONTRIBUTION_COLORS,
} from "@/lib/contributions";

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

/** Classic GitHub greens: level 0 uses mid-green, others use contribution color. */
export function darkFillForLevel(
  level: ContributionLevel,
  sourceColor: string,
): string {
  if (level === 0) return GITHUB_CONTRIBUTION_COLORS[2];
  return sourceColor;
}
