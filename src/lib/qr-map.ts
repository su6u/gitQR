import {
  type ContributionDay,
  type ContributionGrid,
  colorForLevel,
  contributionForQrModule,
  GITHUB_CONTRIBUTION_COLORS,
} from "@/lib/contributions";
import { QR_MODULE_COUNT } from "@/lib/qr";
import { encodeQrMatrix, type QrBitMatrix } from "@/lib/qr-generate";
import { darkFillForLevel, relativeLuminance } from "@/lib/qr-palette";

export interface StyledQrModule {
  row: number;
  col: number;
  isDark: boolean;
  contribution: ContributionDay;
  fill: string;
}

export interface StyledQrGrid {
  size: number;
  modules: StyledQrModule[];
  url: string;
  displayGeneration: number;
}

/** Lower = darker dark-modules on average → better for camera decoders. */
export function styledGridCameraScore(grid: StyledQrGrid): number {
  let score = 0;
  for (const mod of grid.modules) {
    if (!mod.isDark) continue;
    const lum = relativeLuminance(mod.fill);
    score += lum;
    if (lum > 0.55) score += 5;
  }
  return score;
}

async function pickBestMaskMatrix(
  url: string,
  contributions: ContributionGrid,
  options: {
    background?: string;
    palette?: readonly string[];
  } = {},
): Promise<QrBitMatrix> {
  let bestMatrix: QrBitMatrix | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask++) {
    const matrix = await encodeQrMatrix(url, { maskPattern: mask });
    const modules = mapQrToContributions(matrix, contributions, options);
    const score = styledGridCameraScore({
      size: matrix.size,
      modules,
      url,
      displayGeneration: 0,
    });
    if (score < bestScore) {
      bestScore = score;
      bestMatrix = matrix;
    }
  }

  if (!bestMatrix) {
    throw new Error("Failed to pick QR mask");
  }

  return bestMatrix;
}

function moduleFill(
  isDark: boolean,
  contribution: ContributionDay,
  background: string,
  palette: readonly string[],
): string {
  if (!isDark) return background;
  const levelColor = colorForLevel(contribution.level, palette);
  return darkFillForLevel(contribution.level, levelColor);
}

export function mapQrToContributions(
  matrix: QrBitMatrix,
  contributions: ContributionGrid,
  options: {
    background?: string;
    palette?: readonly string[];
  } = {},
): StyledQrModule[] {
  const background = options.background ?? GITHUB_CONTRIBUTION_COLORS[0];
  const palette = options.palette ?? GITHUB_CONTRIBUTION_COLORS;
  const { size, dark } = matrix;
  const modules: StyledQrModule[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = dark[row * size + col] ?? false;
      const contribution = contributionForQrModule(
        contributions,
        row,
        col,
        size,
      );

      modules.push({
        row,
        col,
        isDark,
        contribution,
        fill: moduleFill(isDark, contribution, background, palette),
      });
    }
  }

  return modules;
}

export function isPaletteRecolor(
  prev: StyledQrGrid | null,
  next: StyledQrGrid,
): boolean {
  return (
    prev !== null &&
    prev !== next &&
    next.displayGeneration > prev.displayGeneration &&
    prev.url === next.url &&
    prev.size === next.size
  );
}

/** Same QR layout — new contribution colors only (sync, no mask re-pick). */
export function recolorStyledGrid(
  grid: StyledQrGrid,
  options: {
    background?: string;
    palette?: readonly string[];
  } = {},
): StyledQrGrid {
  const background = options.background ?? GITHUB_CONTRIBUTION_COLORS[0];
  const palette = options.palette ?? GITHUB_CONTRIBUTION_COLORS;
  return {
    ...grid,
    displayGeneration: (grid.displayGeneration ?? 0) + 1,
    modules: grid.modules.map((mod) => ({
      ...mod,
      fill: moduleFill(mod.isDark, mod.contribution, background, palette),
    })),
  };
}

export async function buildStyledQrGrid(
  url: string,
  contributions: ContributionGrid,
  options: {
    background?: string;
    palette?: readonly string[];
  } = {},
): Promise<StyledQrGrid> {
  const matrix = await pickBestMaskMatrix(url, contributions, options);
  if (matrix.size !== QR_MODULE_COUNT) {
    throw new Error(
      `Expected QR version 4 (${QR_MODULE_COUNT} modules), got ${matrix.size}`,
    );
  }

  return {
    size: matrix.size,
    modules: mapQrToContributions(matrix, contributions, options),
    url,
    displayGeneration: 1,
  };
}

if (import.meta.main) {
  const sample: StyledQrModule = {
    row: 0,
    col: 0,
    isDark: true,
    contribution: {
      date: "2024-01-01",
      level: 3,
      count: 5,
      color: "#39d353",
    },
    fill: "#old",
  };
  const grid: StyledQrGrid = {
    size: 33,
    modules: [sample],
    url: "https://x",
    displayGeneration: 1,
  };
  const pink = ["#fff", "#ff1", "#ff2", "#ff3", "#ff4"];
  const recolored = recolorStyledGrid(grid, { palette: pink });
  console.assert(recolored.modules[0]?.fill !== "#old");
  console.assert(recolored.modules[0]?.fill === darkFillForLevel(3, pink[3]!));
  console.assert(recolored.displayGeneration === 2);
  console.assert(isPaletteRecolor(grid, recolored));
  console.assert(!isPaletteRecolor(recolored, recolored));
  console.assert(!isPaletteRecolor(null, recolored));
  const rebuilt = { ...recolored, displayGeneration: 1, url: "https://other" };
  console.assert(!isPaletteRecolor(recolored, rebuilt));
}
