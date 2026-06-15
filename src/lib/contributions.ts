export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
  color: string;
}

/** GitHub profile heatmap: ~53 week-columns × 7 day-rows (Sunday first). */
export type ContributionGrid = ContributionDay[][];

export const GITHUB_CONTRIBUTION_COLORS = [
  "#ebedf0",
  "#9be9a8",
  "#40c463",
  "#30a14e",
  "#216e39",
] as const;

export const EMPTY_CONTRIBUTION_DAY: ContributionDay = {
  date: "",
  count: 0,
  level: 0,
  color: GITHUB_CONTRIBUTION_COLORS[0],
};

const LEVEL_FROM_ENUM: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function levelFromEnum(value: string): ContributionLevel {
  return LEVEL_FROM_ENUM[value] ?? 0;
}

export function colorForLevel(
  level: ContributionLevel,
  palette: readonly string[] = GITHUB_CONTRIBUTION_COLORS,
): string {
  return palette[level] ?? palette[0];
}

/** Flatten week-column data into a single chronological day list. */
export function flattenContributionGrid(
  grid: ContributionGrid,
): ContributionDay[] {
  const days: ContributionDay[] = [];
  for (const week of grid) {
    for (const day of week) {
      days.push(day);
    }
  }
  return days;
}

/**
 * Map one QR module to the contribution cell at the same relative position on
 * the profile heatmap (week column × weekday row).
 */
export function contributionForQrModule(
  grid: ContributionGrid,
  qrRow: number,
  qrCol: number,
  qrSize: number,
): ContributionDay {
  const weekCount = grid.length;
  if (weekCount === 0) return EMPTY_CONTRIBUTION_DAY;

  const maxIndex = qrSize - 1;
  const weekIdx = Math.min(
    weekCount - 1,
    Math.round(maxIndex === 0 ? 0 : (qrCol / maxIndex) * (weekCount - 1)),
  );
  const dayIdx = Math.min(
    6,
    Math.round(maxIndex === 0 ? 0 : (qrRow / maxIndex) * 6),
  );

  return grid[weekIdx]?.[dayIdx] ?? EMPTY_CONTRIBUTION_DAY;
}
