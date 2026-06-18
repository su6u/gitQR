import { decodeFromImageData } from "@qrstuff/qured";
import {
  qrFastDecodeImageData,
  qrStyledDecodeImageData,
  renderQrCaptureCanvas,
} from "@/lib/qr-capture";
import {
  QR_BOARD_GAP_PX,
  QR_BOARD_REFERENCE_CELL_PX,
  QR_BOARD_ROUNDNESS_PX,
} from "@/lib/qr-layout";
import type { StyledQrGrid } from "@/lib/qr-map";

export type QrDecodeSource = "pixels";

export interface QrDecodeOutcome {
  url: string;
  source: QrDecodeSource;
}

function prefersMainThreadDecode(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.maxTouchPoints > 0;
}

async function decodeWithQured(
  imageData: ImageData,
  options: { aggressive?: boolean; worker?: boolean },
): Promise<string | null> {
  const qured = await decodeFromImageData(imageData, {
    aggressive: options.aggressive ?? false,
    worker: options.worker ?? !prefersMainThreadDecode(),
  });
  return qured?.text ?? null;
}

async function decodeImageData(
  imageData: ImageData,
  options: { aggressive?: boolean } = {},
): Promise<string | null> {
  const aggressive = options.aggressive ?? false;

  try {
    const qured = await decodeWithQured(imageData, { aggressive });
    if (qured) return qured;
  } catch {
    if (!prefersMainThreadDecode()) {
      try {
        const qured = await decodeWithQured(imageData, {
          aggressive,
          worker: false,
        });
        if (qured) return qured;
      } catch {
        // fall through
      }
    }
  }

  const { readBarcodes } = await import("zxing-wasm/reader");
  const results = await readBarcodes(imageData, {
    formats: ["QRCode"],
    tryHarder: aggressive,
    tryRotate: aggressive,
    tryInvert: true,
    tryDownscale: aggressive,
    maxNumberOfSymbols: 1,
  });

  return results[0]?.text ?? null;
}

/** Decode a bitmap rendered with the same rules as PNG export. */
export async function decodeExportCanvas(
  grid: StyledQrGrid,
  canvasSize = 2048,
): Promise<string | null> {
  const symbolRatio = 0.72;
  const symbolSize = Math.round(canvasSize * symbolRatio);
  const offset = Math.round((canvasSize - symbolSize) / 2);
  const gap = QR_BOARD_GAP_PX;
  const modulePx = (symbolSize - gap * (grid.size - 1)) / grid.size;
  const roundness = Math.min(
    modulePx / 2,
    (QR_BOARD_ROUNDNESS_PX * modulePx) / QR_BOARD_REFERENCE_CELL_PX,
  );

  const canvas = renderQrCaptureCanvas(grid, {
    size: canvasSize,
    layoutSize: symbolSize,
    offsetX: offset,
    offsetY: offset,
    gap,
    roundness,
    background: "#ffffff",
    fillForModule: (mod) => (mod.isDark ? mod.fill : "#ffffff"),
    pixelAlign: true,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  return decodeImageData(
    ctx.getImageData(0, 0, canvas.width, canvas.height),
    { aggressive: true },
  );
}

export async function decodeStyledQrGrid(
  grid: StyledQrGrid,
): Promise<QrDecodeOutcome> {
  const fastBitmap = qrFastDecodeImageData(grid);
  const fast = await decodeImageData(fastBitmap);
  if (fast) return { url: fast, source: "pixels" };

  const styledBitmap = qrStyledDecodeImageData(grid);
  const styled = await decodeImageData(styledBitmap, { aggressive: true });
  if (styled) return { url: styled, source: "pixels" };

  throw new Error("Could not read this QR");
}

/** Warm decoder WASM while scan mode is open. */
export function preloadQrDecoders() {
  void import("zxing-wasm/reader");
}
