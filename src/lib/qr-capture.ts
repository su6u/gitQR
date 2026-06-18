import type { StyledQrGrid } from "@/lib/qr-map";

const CAPTURE_SIZE_PX = 1024;
const CAPTURE_GAP_PX = 3;
const CAPTURE_ROUNDNESS_PX = 4;

const FAST_DECODE_MODULE_PX = 12;

const STYLED_DECODE_SIZE_PX = 528;
const STYLED_DECODE_GAP_PX = 2;
const STYLED_DECODE_ROUNDNESS_PX = 3;

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}

function renderModulesToCanvas(
  grid: StyledQrGrid,
  options: {
    size?: number;
    /** Module layout span — defaults to `size`. */
    layoutSize?: number;
    offsetX?: number;
    offsetY?: number;
    gap?: number;
    roundness?: number;
    fillForModule?: (mod: StyledQrGrid["modules"][number]) => string;
    background?: string;
    /** When set with `pixelAlign`, skips fractional layout recompute. */
    modulePx?: number;
    moduleScale?: (mod: StyledQrGrid["modules"][number]) => number;
    shouldDrawModule?: (mod: StyledQrGrid["modules"][number]) => boolean;
    pixelAlign?: boolean;
  } = {},
): HTMLCanvasElement {
  const size = options.size ?? CAPTURE_SIZE_PX;
  const layoutSize = options.layoutSize ?? size;
  const gap = options.gap ?? CAPTURE_GAP_PX;
  const roundness = options.roundness ?? CAPTURE_ROUNDNESS_PX;
  const background = options.background ?? "#ffffff";
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  const snap = (value: number) =>
    options.pixelAlign ? Math.round(value) : value;
  const moduleCount = grid.size;
  const modulePx =
    options.modulePx ??
    (layoutSize - gap * (moduleCount - 1)) / moduleCount;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  if (options.pixelAlign) {
    ctx.imageSmoothingEnabled = false;
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  for (const mod of grid.modules) {
    if (options.shouldDrawModule && !options.shouldDrawModule(mod)) continue;

    const scale = options.moduleScale?.(mod) ?? 1;
    const drawPx = modulePx * scale;
    const inset = (modulePx - drawPx) / 2;
    const x = snap(offsetX + mod.col * (modulePx + gap) + inset);
    const y = snap(offsetY + mod.row * (modulePx + gap) + inset);
    const w = snap(drawPx);
    ctx.fillStyle = options.fillForModule?.(mod) ?? mod.fill;

    const drawRoundness = Math.min(roundness * scale, drawPx / 2);
    if (drawRoundness > 0) {
      fillRoundRect(ctx, x, y, w, w, drawRoundness);
    } else {
      ctx.fillRect(x, y, w, w);
    }
  }

  return canvas;
}

/** High-contrast bitmap from module pattern — primary fast decode path. */
export function qrFastDecodeImageData(grid: StyledQrGrid): ImageData {
  const moduleCount = grid.size;
  const size = moduleCount * FAST_DECODE_MODULE_PX;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";

  for (const mod of grid.modules) {
    if (!mod.isDark) continue;
    ctx.fillRect(
      mod.col * FAST_DECODE_MODULE_PX,
      mod.row * FAST_DECODE_MODULE_PX,
      FAST_DECODE_MODULE_PX,
      FAST_DECODE_MODULE_PX,
    );
  }

  return ctx.getImageData(0, 0, size, size);
}

/** Styled fallback bitmap when fast decode misses. */
export function qrStyledDecodeImageData(grid: StyledQrGrid): ImageData {
  const canvas = renderModulesToCanvas(grid, {
    size: STYLED_DECODE_SIZE_PX,
    gap: STYLED_DECODE_GAP_PX,
    roundness: STYLED_DECODE_ROUNDNESS_PX,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Render the styled QR grid to a high-res bitmap for decoding. */
export function renderQrCaptureCanvas(
  grid: StyledQrGrid,
  options: {
    size?: number;
    layoutSize?: number;
    offsetX?: number;
    offsetY?: number;
    gap?: number;
    roundness?: number;
    background?: string;
    fillForModule?: (mod: StyledQrGrid["modules"][number]) => string;
    modulePx?: number;
    moduleScale?: (mod: StyledQrGrid["modules"][number]) => number;
    shouldDrawModule?: (mod: StyledQrGrid["modules"][number]) => boolean;
    pixelAlign?: boolean;
  } = {},
): HTMLCanvasElement {
  return renderModulesToCanvas(grid, options);
}

export function qrCaptureImageData(grid: StyledQrGrid): ImageData {
  const canvas = renderQrCaptureCanvas(grid);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
