import { decodeFromImageData } from "@qrstuff/qured";
import {
  qrFastDecodeImageData,
  qrStyledDecodeImageData,
} from "@/lib/qr-capture";
import type { StyledQrGrid } from "@/lib/qr-map";

export type QrDecodeSource = "pixels";

export interface QrDecodeOutcome {
  url: string;
  source: QrDecodeSource;
}

async function decodeImageData(
  imageData: ImageData,
  options: { aggressive?: boolean } = {},
): Promise<string | null> {
  const qured = await decodeFromImageData(imageData, {
    aggressive: options.aggressive ?? false,
    worker: true,
  });
  if (qured?.text) return qured.text;

  const { readBarcodes } = await import("zxing-wasm/reader");
  const results = await readBarcodes(imageData, {
    formats: ["QRCode"],
    tryHarder: false,
    tryRotate: false,
    tryInvert: true,
    tryDownscale: false,
    maxNumberOfSymbols: 1,
  });

  return results[0]?.text ?? null;
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
