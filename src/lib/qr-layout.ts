import { QR_MODULE_COUNT } from "@/lib/qr";

/** Right panel is ~28% of the overlay; center QR in the remaining left canvas. */
export const PANEL_WIDTH_RATIO = 0.28;

export const QR_BOARD_GAP_PX = 4;

/** Matches `.qr-cell` `rounded-[5px]` on the playground board. */
export const QR_BOARD_ROUNDNESS_PX = 5;

/** Cell size the board targets at minimum — used to scale export corner radius. */
export const QR_BOARD_REFERENCE_CELL_PX = 16;

export const QR_SCAN_TARGET_PADDING_PX = 14;

export const QR_BOARD_MAX_DISPLAY_COLS = 80;
export const QR_BOARD_MAX_DISPLAY_ROWS = 50;
export const QR_BOARD_RESIZE_DEBOUNCE_MS = 120;

export interface QrBoardLayout {
  width: number;
  height: number;
  cols: number;
  rows: number;
}

export interface QrRegionCells {
  startRow: number;
  startCol: number;
  size: number;
}

export interface QrRegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function moduleCountForSpan(span: number, gapPx = QR_BOARD_GAP_PX) {
  const minModulePx = 16;
  return Math.max(1, Math.floor((span + gapPx) / (minModulePx + gapPx)));
}

export function boardModuleCountForSpan(
  span: number,
  axis: "cols" | "rows",
  gapPx = QR_BOARD_GAP_PX,
) {
  const cap =
    axis === "cols" ? QR_BOARD_MAX_DISPLAY_COLS : QR_BOARD_MAX_DISPLAY_ROWS;
  return Math.min(moduleCountForSpan(span, gapPx), cap);
}

export function boardLayoutFromSize(
  width: number,
  height: number,
  gapPx = QR_BOARD_GAP_PX,
): QrBoardLayout {
  return {
    width,
    height,
    cols: boardModuleCountForSpan(width, "cols", gapPx),
    rows: boardModuleCountForSpan(height, "rows", gapPx),
  };
}

export function observeBoardLayout(
  el: HTMLElement,
  onLayout: (layout: QrBoardLayout) => void,
  debounceMs = QR_BOARD_RESIZE_DEBOUNCE_MS,
) {
  let timer = 0;

  const measure = () => {
    const { width, height } = el.getBoundingClientRect();
    onLayout(boardLayoutFromSize(width, height));
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(measure, debounceMs);
  };

  measure();
  const observer = new ResizeObserver(schedule);
  observer.observe(el);

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
  };
}

console.assert(
  boardModuleCountForSpan(1440, "cols") === moduleCountForSpan(1440) &&
    boardModuleCountForSpan(2560, "cols") === QR_BOARD_MAX_DISPLAY_COLS &&
    boardModuleCountForSpan(900, "rows") === moduleCountForSpan(900) &&
    boardModuleCountForSpan(1440, "rows") === QR_BOARD_MAX_DISPLAY_ROWS,
  "boardModuleCountForSpan cap",
);

export function qrRegionCells(
  displayRows: number,
  displayCols: number,
): QrRegionCells | null {
  if (displayRows === 0 || displayCols === 0) return null;

  const size = QR_MODULE_COUNT;
  const leftCenterCol = (displayCols * (1 - PANEL_WIDTH_RATIO)) / 2;
  const startRow = Math.floor((displayRows - size) / 2);
  const startCol = Math.round(leftCenterCol - size / 2);

  if (
    startRow + size <= 0 ||
    startCol + size <= 0 ||
    startRow >= displayRows ||
    startCol >= displayCols
  ) {
    return null;
  }

  return { startRow, startCol, size };
}

export function qrRegionRect(
  containerWidth: number,
  containerHeight: number,
  displayRows: number,
  displayCols: number,
  gapPx = QR_BOARD_GAP_PX,
): QrRegionRect | null {
  const region = qrRegionCells(displayRows, displayCols);
  if (!region) return null;

  const cellWidth = (containerWidth - (displayCols - 1) * gapPx) / displayCols;
  const cellHeight =
    (containerHeight - (displayRows - 1) * gapPx) / displayRows;
  const spanX = cellWidth + gapPx;
  const spanY = cellHeight + gapPx;

  return {
    x: region.startCol * spanX,
    y: region.startRow * spanY,
    width: region.size * cellWidth + (region.size - 1) * gapPx,
    height: region.size * cellHeight + (region.size - 1) * gapPx,
  };
}

export function expandQrRegionRect(
  rect: QrRegionRect,
  padding = QR_SCAN_TARGET_PADDING_PX,
): QrRegionRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function qrModuleIndex(
  displayRow: number,
  displayCol: number,
  displayRows: number,
  displayCols: number,
): number | null {
  const region = qrRegionCells(displayRows, displayCols);
  if (!region) return null;

  const localRow = displayRow - region.startRow;
  const localCol = displayCol - region.startCol;

  if (
    localRow < 0 ||
    localCol < 0 ||
    localRow >= region.size ||
    localCol >= region.size
  ) {
    return null;
  }

  return localRow * region.size + localCol;
}

export function pointInQrRegion(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number,
  displayRows: number,
  displayCols: number,
): boolean {
  const rect = qrRegionRect(
    containerWidth,
    containerHeight,
    displayRows,
    displayCols,
  );
  if (!rect) return false;

  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}
