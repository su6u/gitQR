import QRCode, { type QRCodeMaskPattern } from "qrcode";
import { QR_MODULE_COUNT } from "@/lib/qr";

export interface QrBitMatrix {
  size: number;
  /** Row-major: index = row * size + col. True = dark module. */
  dark: boolean[];
}

/** Encode a URL into a version-4, level-H QR bit matrix (33×33 modules). */
export async function encodeQrMatrix(
  url: string,
  options: { maskPattern?: number } = {},
): Promise<QrBitMatrix> {
  const qr = QRCode.create(url, {
    errorCorrectionLevel: "H",
    version: QR_MODULE_COUNT === 33 ? 4 : undefined,
    ...(options.maskPattern !== undefined
      ? { maskPattern: options.maskPattern as QRCodeMaskPattern }
      : {}),
  });

  const size = qr.modules.size;
  const dark: boolean[] = new Array(size * size);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      dark[row * size + col] = qr.modules.get(row, col) === 1;
    }
  }

  return { size, dark };
}
