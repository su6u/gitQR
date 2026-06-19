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
  };
}
