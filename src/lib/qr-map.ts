import {
  type ContributionDay,
  type ContributionGrid,
  contributionForQrModule,
  GITHUB_CONTRIBUTION_COLORS,
} from "@/lib/contributions";
import { QR_MODULE_COUNT } from "@/lib/qr";
import { encodeQrMatrix, type QrBitMatrix } from "@/lib/qr-generate";

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

const MIN_DARK_FILL = GITHUB_CONTRIBUTION_COLORS[2];

function moduleFill(
  isDark: boolean,
  contribution: ContributionDay,
  background: string,
): string {
  if (!isDark) return background;
  if (contribution.level === 0) return MIN_DARK_FILL;
  return contribution.color;
}

export function mapQrToContributions(
  matrix: QrBitMatrix,
  contributions: ContributionGrid,
  options: { background?: string } = {},
): StyledQrModule[] {
  const background = options.background ?? GITHUB_CONTRIBUTION_COLORS[0];
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
        fill: moduleFill(isDark, contribution, background),
      });
    }
  }

  return modules;
}

export async function buildStyledQrGrid(
  url: string,
  contributions: ContributionGrid,
  options: { background?: string } = {},
): Promise<StyledQrGrid> {
  const matrix = await encodeQrMatrix(url);
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
