let lastHide = 0;

export function tooltipShouldInstant(): boolean {
  return Date.now() - lastHide < 300;
}

export function markTooltipHidden(): void {
  lastHide = Date.now();
}
