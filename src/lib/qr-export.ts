import { renderQrCaptureCanvas } from "@/lib/qr-capture";
import {
  drawSolidFinders,
  type FinderDrawLayout,
  isFinderModule,
  solidFinderSvgCircles,
} from "@/lib/qr-finder";
import {
  QR_BOARD_GAP_PX,
  QR_BOARD_REFERENCE_CELL_PX,
} from "@/lib/qr-layout";
import type { ContributionPaletteId } from "@/lib/contribution-palettes";
import { exportBackgroundForPalette } from "@/lib/contribution-palettes";
import { roundnessForModulePx } from "@/lib/playground-style";
import type { StyledQrGrid, StyledQrModule } from "@/lib/qr-map";
import {
  drawUsernameLabelOnCanvas,
  type QrUsernameLabelDrawLayout,
  type QrUsernameLabelStyle,
  qrModuleInUsernameCutout,
  usernameFromQrUrl,
  usernameLabelCutout,
  usernameLabelSvg,
} from "@/lib/qr-username-label";

export const QR_EXPORT_BACKGROUND = "#F9FBF8";

/** QR symbol span as a fraction of the export canvas — margin around the symbol. */
export const QR_EXPORT_SYMBOL_RATIO = 0.72;

export type QrExportFormat = "png" | "svg";

export const QR_EXPORT_SIZES = [512, 1024, 2048] as const;
export type QrExportSize = (typeof QR_EXPORT_SIZES)[number];

export interface QrExportOptions {
  /** QR symbol edge length — canvas grows with margin so the symbol stays centered. */
  size: QrExportSize;
  format: QrExportFormat;
  paletteId?: ContributionPaletteId;
  roundnessPx?: number;
  usernameLabel?: QrUsernameLabelStyle;
}

/** Gap/cell ratio locked to the 1024 export (~4.16px gap on 27px cells). */
const QR_EXPORT_REF_MODULE_PX = Math.round(
  (1024 - QR_BOARD_GAP_PX * 32) / 33,
);
const QR_EXPORT_REF_GAP = (1024 - QR_EXPORT_REF_MODULE_PX * 33) / 32;
const QR_EXPORT_GAP_RATIO = QR_EXPORT_REF_GAP / QR_EXPORT_REF_MODULE_PX;

export interface QrExportLayout {
  canvasSize: number;
  symbolSize: number;
  patternSize: number;
  offsetX: number;
  offsetY: number;
  moduleOffsetX: number;
  moduleOffsetY: number;
  modulePx: number;
  gap: number;
  roundness: number;
}

/** Symbol exactly `symbolSize`; gap scales with cell size like the 1024 export. */
export function computeQrExportLayout(
  moduleCount: number,
  symbolSize: number,
  roundnessPx = 5,
): QrExportLayout {
  const modulePx = Math.round(
    symbolSize / (moduleCount + (moduleCount - 1) * QR_EXPORT_GAP_RATIO),
  );
  const gap = modulePx * QR_EXPORT_GAP_RATIO;
  const patternSize = modulePx * moduleCount + gap * (moduleCount - 1);
  const patternInset = (symbolSize - patternSize) / 2;
  const canvasSize = Math.round(symbolSize / QR_EXPORT_SYMBOL_RATIO);
  const offsetX = Math.round((canvasSize - symbolSize) / 2);
  const offsetY = offsetX;
  const roundness = roundnessForModulePx(
    roundnessPx,
    modulePx,
    QR_BOARD_REFERENCE_CELL_PX,
  );

  return {
    canvasSize,
    symbolSize,
    patternSize,
    offsetX,
    offsetY,
    moduleOffsetX: offsetX + patternInset,
    moduleOffsetY: offsetY + patternInset,
    modulePx,
    gap,
    roundness,
  };
}

console.assert(
  (() => {
    const ratio = QR_EXPORT_GAP_RATIO;
    const layouts = [512, 1024, 2048].map((size) =>
      computeQrExportLayout(33, size),
    );
    return layouts.every(
      (layout) =>
        layout.symbolSize >= layout.patternSize &&
        layout.patternSize <= layout.symbolSize &&
        Math.abs(layout.gap / layout.modulePx - ratio) < 0.001 &&
        layout.canvasSize > layout.symbolSize,
    );
  })(),
  "export layout: proportional gap, pattern fits symbol",
);

function moduleRect(
  row: number,
  col: number,
  layout: QrExportLayout,
): { x: number; y: number; size: number; roundness: number } {
  const span = layout.modulePx + layout.gap;
  return {
    x: layout.moduleOffsetX + col * span,
    y: layout.moduleOffsetY + row * span,
    size: layout.modulePx,
    roundness: Math.min(layout.roundness, layout.modulePx / 2),
  };
}

function exportFilename(
  grid: StyledQrGrid,
  exportSize: QrExportSize,
  format: QrExportFormat,
): string {
  const username = grid.url.match(/github\.com\/([^/?#]+)/i)?.[1];
  const slug = username ?? "qr";
  return `git-qr-${slug}-${exportSize}.${format}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportFill(mod: StyledQrModule): string {
  return mod.fill;
}

function finderDrawLayout(
  layout: QrExportLayout,
  background: string,
): FinderDrawLayout {
  return {
    offsetX: layout.moduleOffsetX,
    offsetY: layout.moduleOffsetY,
    modulePx: layout.modulePx,
    gap: layout.gap,
    background,
    fillForModule: exportFill,
    pixelAlign: true,
  };
}

function exportModuleLayout(
  layout: QrExportLayout,
): QrUsernameLabelDrawLayout {
  return {
    offsetX: layout.moduleOffsetX,
    offsetY: layout.moduleOffsetY,
    symbolSize: layout.symbolSize,
    modulePx: layout.modulePx,
    gap: layout.gap,
  };
}

function exportSymbolLayout(
  layout: QrExportLayout,
): QrUsernameLabelDrawLayout {
  return {
    offsetX: layout.offsetX,
    offsetY: layout.offsetY,
    symbolSize: layout.symbolSize,
    modulePx: layout.modulePx,
    gap: layout.gap,
  };
}

function moduleHiddenByUsernameCutout(
  mod: StyledQrModule,
  grid: StyledQrGrid,
  layout: QrExportLayout,
  usernameLabel?: QrUsernameLabelStyle,
): boolean {
  const username = usernameFromQrUrl(grid.url);
  if (!usernameLabel?.showUsername || !username) return false;

  const cutout = usernameLabelCutout(
    exportSymbolLayout(layout),
    username,
    usernameLabel,
  );

  return qrModuleInUsernameCutout(
    mod.row,
    mod.col,
    exportModuleLayout(layout),
    cutout,
  );
}

function renderSvg(
  grid: StyledQrGrid,
  layout: QrExportLayout,
  background: string,
  usernameLabel?: QrUsernameLabelStyle,
): string {
  const { canvasSize } = layout;
  const finderLayout = finderDrawLayout(layout, background);
  const symbolLayout = exportSymbolLayout(layout);

  const rects = grid.modules
    .filter(
      (mod) =>
        mod.isDark &&
        !isFinderModule(mod.row, mod.col, grid.size) &&
        !moduleHiddenByUsernameCutout(mod, grid, layout, usernameLabel),
    )
    .map((mod) => {
      const { x, y, size, roundness } = moduleRect(mod.row, mod.col, layout);
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${roundness}" ry="${roundness}" fill="${exportFill(mod)}"/>`;
    })
    .join("");

  const finderCircles = solidFinderSvgCircles(grid, finderLayout);
  const username = usernameFromQrUrl(grid.url);
  const usernameSvg =
    usernameLabel?.showUsername && username
      ? usernameLabelSvg(
          symbolLayout,
          username,
          usernameLabel,
          background,
        )
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" shape-rendering="crispEdges"><rect width="${canvasSize}" height="${canvasSize}" fill="${background}"/>${rects}${finderCircles}${usernameSvg}</svg>`;
}

async function renderCanvas(
  grid: StyledQrGrid,
  layout: QrExportLayout,
  background: string,
  usernameLabel?: QrUsernameLabelStyle,
): Promise<HTMLCanvasElement> {
  const symbolLayout = exportSymbolLayout(layout);

  const canvas = renderQrCaptureCanvas(grid, {
    size: layout.canvasSize,
    offsetX: layout.moduleOffsetX,
    offsetY: layout.moduleOffsetY,
    gap: layout.gap,
    roundness: layout.roundness,
    modulePx: layout.modulePx,
    background,
    pixelAlign: true,
    fillForModule: exportFill,
    shouldDrawModule: (mod) =>
      mod.isDark &&
      !isFinderModule(mod.row, mod.col, grid.size) &&
      !moduleHiddenByUsernameCutout(mod, grid, layout, usernameLabel),
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  drawSolidFinders(ctx, grid, finderDrawLayout(layout, background));

  const username = usernameFromQrUrl(grid.url);
  if (usernameLabel?.showUsername && username) {
    await drawUsernameLabelOnCanvas(
      ctx,
      symbolLayout,
      username,
      usernameLabel,
      background,
    );
  }

  return canvas;
}

export async function downloadStyledQrGrid(
  grid: StyledQrGrid,
  options: QrExportOptions,
): Promise<void> {
  const layout = computeQrExportLayout(
    grid.size,
    options.size,
    options.roundnessPx,
  );
  const background = exportBackgroundForPalette(options.paletteId ?? "green");
  const filename = exportFilename(grid, options.size, options.format);

  if (options.format === "svg") {
    triggerDownload(
      new Blob([renderSvg(grid, layout, background, options.usernameLabel)], {
        type: "image/svg+xml",
      }),
      filename,
    );
    return;
  }

  const canvas = await renderCanvas(
    grid,
    layout,
    background,
    options.usernameLabel,
  );
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Could not export PNG");
  }

  triggerDownload(blob, filename);
}
