import { GITHUB_CONTRIBUTION_COLORS } from "@/lib/contributions";

/** Level-0 gray — shared across every preset (light modules + zero-day dark fill). */
export const CONTRIBUTION_LEVEL_ZERO_GRAY = GITHUB_CONTRIBUTION_COLORS[0];

export type ContributionPaletteId =
  | "green"
  | "orange"
  | "yellow"
  | "pink"
  | "blue"
  | "red"
  | "indigo";

export interface ContributionPalettePreset {
  id: ContributionPaletteId;
  label: string;
  /** Five heatmap steps; index 0 is always {@link CONTRIBUTION_LEVEL_ZERO_GRAY}. */
  colors: readonly [string, string, string, string, string];
}

export const DEFAULT_CONTRIBUTION_PALETTE_ID: ContributionPaletteId = "green";

export const CONTRIBUTION_PALETTE_PRESETS: ContributionPalettePreset[] = [
  {
    id: "green",
    label: "Green",
    colors: GITHUB_CONTRIBUTION_COLORS,
  },
  {
    id: "pink",
    label: "Pink",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#f8bbd0",
      "#f06292",
      "#e91e63",
      "#880e4f",
    ],
  },
  {
    id: "orange",
    label: "Orange",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#ffcc80",
      "#ff9800",
      "#ef6c00",
      "#bf360c",
    ],
  },
  {
    id: "yellow",
    label: "Yellow",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#fff176",
      "#ffca28",
      "#ffa000",
      "#ff6f00",
    ],
  },
  {
    id: "blue",
    label: "Blue",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#90caf9",
      "#42a5f5",
      "#1565c0",
      "#0d47a1",
    ],
  },
  {
    id: "red",
    label: "Red",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#ef9a9a",
      "#ef5350",
      "#d32f2f",
      "#b71c1c",
    ],
  },
  {
    id: "indigo",
    label: "Indigo",
    colors: [
      CONTRIBUTION_LEVEL_ZERO_GRAY,
      "#9fa8da",
      "#5c6bc0",
      "#3949ab",
      "#1a237e",
    ],
  },
];

export function contributionPaletteForId(
  id: ContributionPaletteId,
): readonly string[] {
  return (
    CONTRIBUTION_PALETTE_PRESETS.find((preset) => preset.id === id)?.colors ??
    GITHUB_CONTRIBUTION_COLORS
  );
}

export function assertContributionPalettes(): void {
  for (const preset of CONTRIBUTION_PALETTE_PRESETS) {
    if (preset.colors[0] !== CONTRIBUTION_LEVEL_ZERO_GRAY) {
      throw new Error(`${preset.id}: level 0 must stay shared gray`);
    }
    if (preset.colors.length !== 5) {
      throw new Error(`${preset.id}: expected 5 levels`);
    }
  }
}
