import { QR_BOARD_GAP_PX } from "@/lib/qr-layout";
import { QR_MODULE_COUNT } from "@/lib/qr";

import { OPEN_RUNDE_FAMILY } from "@/lib/fonts";

export const QR_USERNAME_FONT_FAMILY = `${OPEN_RUNDE_FAMILY}, sans-serif`;
export const QR_USERNAME_FONT_WEIGHT = 700;
export const QR_USERNAME_CUTOUT_FILL = "#ffffff";

export const USERNAME_FONT_MIN = 18;
export const USERNAME_FONT_MAX = 36;
export const USERNAME_FONT_DEFAULT = 28;
export const USERNAME_COLOR_DEFAULT = "#1a1a1a";

export interface QrUsernameLabelStyle {
  showUsername: boolean;
  usernameFontPx: number;
  usernameColor: string;
}

export const DEFAULT_USERNAME_LABEL: QrUsernameLabelStyle = {
  showUsername: false,
  usernameFontPx: USERNAME_FONT_DEFAULT,
  usernameColor: USERNAME_COLOR_DEFAULT,
};

export const QR_USERNAME_REFERENCE_SYMBOL_PX = 1024;

export interface QrUsernameLabelDrawLayout {
  offsetX: number;
  offsetY: number;
  symbolSize: number;
  modulePx: number;
  gap: number;
}

export interface UsernameLabelCutout {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  fontSize: number;
}

export function clampUsernameFontPx(value: number): number {
  return Math.min(USERNAME_FONT_MAX, Math.max(USERNAME_FONT_MIN, value));
}

export function usernameFromQrUrl(url: string): string | null {
  const match = url.match(/github\.com\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function formatUsernameLabel(username: string): string {
  return `@${username}`;
}

export function usernameFontSizeForSymbol(
  fontSizePx: number,
  symbolSizePx: number,
  referenceSymbolPx = QR_USERNAME_REFERENCE_SYMBOL_PX,
): number {
  return Math.max(
    8,
    Math.round(fontSizePx * (symbolSizePx / referenceSymbolPx)),
  );
}

function measureLabelWidth(label: string, fontSize: number): number {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${QR_USERNAME_FONT_WEIGHT} ${fontSize}px ${QR_USERNAME_FONT_FAMILY}`;
      return ctx.measureText(label).width;
    }
  }
  return label.length * fontSize * 0.52;
}

export function usernameLabelCutout(
  layout: QrUsernameLabelDrawLayout,
  username: string,
  style: Pick<QrUsernameLabelStyle, "usernameFontPx">,
): UsernameLabelCutout {
  const fontSize = usernameFontSizeForSymbol(
    style.usernameFontPx,
    layout.symbolSize,
  );
  const label = formatUsernameLabel(username);
  const textWidth = measureLabelWidth(label, fontSize);
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.35;
  const width = textWidth + padX * 2;
  const height = fontSize * 1.2 + padY * 2;
  const cx = layout.offsetX + layout.symbolSize / 2;
  const cy = layout.offsetY + layout.symbolSize / 2;

  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
    radius: height / 2,
    fontSize,
  };
}

export function qrModuleInUsernameCutout(
  row: number,
  col: number,
  layout: QrUsernameLabelDrawLayout,
  cutout: UsernameLabelCutout,
): boolean {
  const span = layout.modulePx + layout.gap;
  const mx = layout.offsetX + col * span;
  const my = layout.offsetY + row * span;
  const mw = layout.modulePx;
  const mh = layout.modulePx;

  return (
    mx < cutout.x + cutout.width &&
    mx + mw > cutout.x &&
    my < cutout.y + cutout.height &&
    my + mh > cutout.y
  );
}

export function boardSymbolLayoutFromRegion(region: {
  x: number;
  y: number;
  width: number;
}): QrUsernameLabelDrawLayout {
  const modulePx =
    (region.width - QR_BOARD_GAP_PX * (QR_MODULE_COUNT - 1)) /
    QR_MODULE_COUNT;

  return {
    offsetX: region.x,
    offsetY: region.y,
    symbolSize: region.width,
    modulePx,
    gap: QR_BOARD_GAP_PX,
  };
}

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

export async function drawUsernameLabelOnCanvas(
  ctx: CanvasRenderingContext2D,
  layout: QrUsernameLabelDrawLayout,
  username: string,
  style: Pick<QrUsernameLabelStyle, "usernameFontPx" | "usernameColor">,
  cutoutFill = QR_USERNAME_CUTOUT_FILL,
): Promise<void> {
  const cutout = usernameLabelCutout(layout, username, style);
  const label = formatUsernameLabel(username);

  if (typeof document !== "undefined") {
    await document.fonts.load(
      `${QR_USERNAME_FONT_WEIGHT} ${cutout.fontSize}px ${QR_USERNAME_FONT_FAMILY}`,
    );
  }

  const x = layout.offsetX + layout.symbolSize / 2;
  const y = layout.offsetY + layout.symbolSize / 2;

  ctx.save();
  ctx.fillStyle = cutoutFill;
  fillRoundRect(
    ctx,
    cutout.x,
    cutout.y,
    cutout.width,
    cutout.height,
    cutout.radius,
  );
  ctx.font = `${QR_USERNAME_FONT_WEIGHT} ${cutout.fontSize}px ${QR_USERNAME_FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = style.usernameColor;
  ctx.fillText(label, x, y);
  ctx.restore();
}

export function usernameLabelSvg(
  layout: QrUsernameLabelDrawLayout,
  username: string,
  style: Pick<QrUsernameLabelStyle, "usernameFontPx" | "usernameColor">,
  cutoutFill = QR_USERNAME_CUTOUT_FILL,
): string {
  const cutout = usernameLabelCutout(layout, username, style);
  const label = formatUsernameLabel(username);
  const x = layout.offsetX + layout.symbolSize / 2;
  const y = layout.offsetY + layout.symbolSize / 2;
  const escaped = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<rect x="${cutout.x}" y="${cutout.y}" width="${cutout.width}" height="${cutout.height}" rx="${cutout.radius}" ry="${cutout.radius}" fill="${cutoutFill}"/><text x="${x}" y="${y}" fill="${style.usernameColor}" font-family="${QR_USERNAME_FONT_FAMILY}" font-size="${cutout.fontSize}" font-weight="${QR_USERNAME_FONT_WEIGHT}" text-anchor="middle" dominant-baseline="middle">${escaped}</text>`;
}
