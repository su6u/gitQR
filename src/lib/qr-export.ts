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

/** QR symbol span as a fraction of the export canvas — centered with margin. */
export const QR_EXPORT_SYMBOL_RATIO = 0.72;

export type QrExportFormat = "png" | "svg";

export const QR_EXPORT_SIZES = [512, 1024, 2048] as const;
export type QrExportSize = (typeof QR_EXPORT_SIZES)[number];

export interface QrExportOptions {
  /** Canvas edge length — QR is centered smaller inside this area. */
  size: QrExportSize;
  format: QrExportFormat;
  roundnessPx?: number;
  usernameLabel?: QrUsernameLabelStyle;
}

export interface QrExportLayout {
  canvasSize: number;
  symbolSize: number;
  offsetX: number;
  offsetY: number;
  modulePx: number;
  gap: number;
  roundness: number;
}

/** Canvas at `canvasSize`, QR symbol centered with integer module pixels. */
export function computeQrExportLayout(
  moduleCount: number,
  canvasSize: number,
  roundnessPx = 5,
): QrExportLayout {
  const gap = QR_BOARD_GAP_PX;
  const symbolTarget = Math.round(canvasSize * QR_EXPORT_SYMBOL_RATIO);
  const modulePx = Math.round(
    (symbolTarget - gap * (moduleCount - 1)) / moduleCount,
  );
  const symbolSize = modulePx * moduleCount + gap * (moduleCount - 1);
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
    offsetX,
    offsetY,
    modulePx,
    gap,
    roundness,
  };
}

function moduleRect(
  row: number,
  col: number,
  layout: QrExportLayout,
): { x: number; y: number; size: number; roundness: number } {
  const span = layout.modulePx + layout.gap;
  return {
    x: layout.offsetX + col * span,
    y: layout.offsetY + row * span,
    size: layout.modulePx,
    roundness: Math.min(layout.roundness, layout.modulePx / 2),
  };
}

function exportFilename(
  grid: StyledQrGrid,
  layout: QrExportLayout,
  format: QrExportFormat,
): string {
  const username = grid.url.match(/github\.com\/([^/?#]+)/i)?.[1];
  const slug = username ?? "qr";
  return `git-qr-${slug}-${layout.canvasSize}.${format}`;
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

function finderDrawLayout(layout: QrExportLayout): FinderDrawLayout {
  return {
    offsetX: layout.offsetX,
    offsetY: layout.offsetY,
    modulePx: layout.modulePx,
    gap: layout.gap,
    background: QR_EXPORT_BACKGROUND,
    fillForModule: exportFill,
    pixelAlign: true,
  };
}

function exportLayoutForUsername(
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
    exportLayoutForUsername(layout),
    username,
    usernameLabel,
  );

  return qrModuleInUsernameCutout(
    mod.row,
    mod.col,
    exportLayoutForUsername(layout),
    cutout,
  );
}

function renderSvg(
  grid: StyledQrGrid,
  layout: QrExportLayout,
  usernameLabel?: QrUsernameLabelStyle,
): string {
  const { canvasSize } = layout;
  const finderLayout = finderDrawLayout(layout);
  const symbolLayout = exportLayoutForUsername(layout);

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
          QR_EXPORT_BACKGROUND,
        )
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" shape-rendering="crispEdges"><rect width="${canvasSize}" height="${canvasSize}" fill="${QR_EXPORT_BACKGROUND}"/>${rects}${finderCircles}${usernameSvg}</svg>`;
}

async function renderCanvas(
  grid: StyledQrGrid,
  layout: QrExportLayout,
  usernameLabel?: QrUsernameLabelStyle,
): Promise<HTMLCanvasElement> {
  const symbolLayout = exportLayoutForUsername(layout);

  const canvas = renderQrCaptureCanvas(grid, {
    size: layout.canvasSize,
    offsetX: layout.offsetX,
    offsetY: layout.offsetY,
    gap: layout.gap,
    roundness: layout.roundness,
    modulePx: layout.modulePx,
    background: QR_EXPORT_BACKGROUND,
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

  drawSolidFinders(ctx, grid, finderDrawLayout(layout));

  const username = usernameFromQrUrl(grid.url);
  if (usernameLabel?.showUsername && username) {
    await drawUsernameLabelOnCanvas(
      ctx,
      symbolLayout,
      username,
      usernameLabel,
      QR_EXPORT_BACKGROUND,
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
  const filename = exportFilename(grid, layout, options.format);

  if (options.format === "svg") {
    triggerDownload(
      new Blob([renderSvg(grid, layout, options.usernameLabel)], {
        type: "image/svg+xml",
      }),
      filename,
    );
    return;
  }

  const canvas = await renderCanvas(grid, layout, options.usernameLabel);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Could not export PNG");
  }

  triggerDownload(blob, filename);
}
