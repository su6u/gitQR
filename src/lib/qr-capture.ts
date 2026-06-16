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
    gap?: number;
    roundness?: number;
    fillForModule?: (mod: StyledQrGrid["modules"][number]) => string;
    background?: string;
  } = {},
): HTMLCanvasElement {
  const size = options.size ?? CAPTURE_SIZE_PX;
  const gap = options.gap ?? CAPTURE_GAP_PX;
  const roundness = options.roundness ?? CAPTURE_ROUNDNESS_PX;
  const background = options.background ?? "#ffffff";
  const moduleCount = grid.size;
  const modulePx = (size - gap * (moduleCount - 1)) / moduleCount;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  for (const mod of grid.modules) {
    const x = mod.col * (modulePx + gap);
    const y = mod.row * (modulePx + gap);
    ctx.fillStyle = options.fillForModule?.(mod) ?? mod.fill;

    if (roundness > 0) {
      fillRoundRect(ctx, x, y, modulePx, modulePx, roundness);
    } else {
      ctx.fillRect(x, y, modulePx, modulePx);
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
    gap?: number;
    roundness?: number;
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
