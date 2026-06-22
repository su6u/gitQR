"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DownloadIcon } from "@/components/icons/download-icon";
import { Button } from "@/components/ui/button";
import { ColorPickerPopover } from "@/components/ui/color-picker";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  CONTRIBUTION_PALETTE_PRESETS,
  type ContributionPalettePreset,
} from "@/lib/contribution-palettes";
import { fontWeights } from "@/lib/font-weight";
import {
  PLAYGROUND_ROUNDNESS_MAX,
  PLAYGROUND_ROUNDNESS_MIN,
  USERNAME_FONT_MAX,
  USERNAME_FONT_MIN,
} from "@/lib/playground-style";
import {
  computeQrExportLayout,
  downloadStyledQrGrid,
  QR_EXPORT_SIZES,
  type QrExportFormat,
  type QrExportSize,
} from "@/lib/qr-export";
import { cn } from "@/lib/utils";
import { usePlayground } from "./playground-provider";

export const PLAYGROUND_ACCENT = "#FA70B3";
export const PLAYGROUND_ACCENT_HOVER = "#FA70B3";
export const PLAYGROUND_ACCENT_ACTIVE = "#FA70B3";

const PLAYGROUND_CONTROL_SURFACE =
  "bg-playground-control [@media(hover:hover)_and_(pointer:fine)]:hover:bg-hover active:bg-active transition-colors duration-80 ease-[cubic-bezier(0.23,1,0.32,1)]";
const SELECT_TRIGGER = `h-8 min-h-8 w-full min-w-0 px-3 text-[13px] ${PLAYGROUND_CONTROL_SURFACE}`;
const PICKER_TRIGGER = `h-8 min-h-8 px-2.5 text-[13px] [&_span]:text-[13px] ${PLAYGROUND_CONTROL_SURFACE}`;
const SLIDER_TRACK_STYLE = {
  backgroundColor: "var(--playground-track)",
} as const;
const SLIDER_THUMB_COLOR = "#000";
const SLIDER_THUMB_BORDER = "rgba(0, 0, 0, 0.08)";

function PlaygroundSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function PlaygroundRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[12px] text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function PaletteOption({
  preset,
  selected,
  onSelect,
}: {
  preset: ContributionPalettePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={preset.label}
      aria-pressed={selected}
      title={preset.label}
      onClick={onSelect}
      className={cn(
        "relative size-7 shrink-0 overflow-hidden rounded-full transition-[opacity,box-shadow,transform] duration-80 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] motion-reduce:active:scale-100",
        "before:absolute before:-inset-1.5 before:content-['']",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA70B3]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "opacity-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_0_0_2px_var(--background),0_0_0_3px_#FA70B3]"
          : "opacity-70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100",
      )}
      style={{
        background: `linear-gradient(to right, ${preset.colors.join(", ")})`,
      }}
    />
  );
}

function PlaygroundSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  disabled?: boolean;
}) {
  return (
    <PlaygroundRow label={label}>
      <Slider
        value={value}
        onChange={(next) => onChange(next as number)}
        min={min}
        max={max}
        step={step}
        showValue
        valuePosition="right"
        formatValue={formatValue}
        showSteps
        disabled={disabled}
        className="min-w-0"
        trackStyle={SLIDER_TRACK_STYLE}
        thumbColor={SLIDER_THUMB_COLOR}
        thumbBorderColor={SLIDER_THUMB_BORDER}
      />
    </PlaygroundRow>
  );
}

export function PlaygroundCustomization() {
  const {
    grid,
    style,
    setRoundnessPx,
    setPaletteId,
    setShowUsername,
    setUsernameFontPx,
    setUsernameColor,
  } = usePlayground();
  const [exportSize, setExportSize] = useState<QrExportSize>(1024);
  const [exportFormat, setExportFormat] = useState<QrExportFormat>("png");
  const [downloading, setDownloading] = useState(false);

  const exportLayout = grid
    ? computeQrExportLayout(grid.size, exportSize, style.roundnessPx)
    : null;

  const handleDownload = useCallback(async () => {
    if (!grid) {
      toast.error("Generate a QR first", { icon: null });
      return;
    }

    setDownloading(true);
    try {
      await downloadStyledQrGrid(grid, {
        size: exportSize,
        format: exportFormat,
        paletteId: style.paletteId,
        roundnessPx: style.roundnessPx,
        usernameLabel: {
          showUsername: style.showUsername,
          usernameFontPx: style.usernameFontPx,
          usernameColor: style.usernameColor,
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed", {
        icon: null,
      });
    } finally {
      setDownloading(false);
    }
  }, [grid, exportSize, exportFormat, style]);

  return (
    <div className="flex flex-col gap-5 pb-2">
      <PlaygroundSection title="Style">
        <div className="flex flex-col gap-2 pl-3">
          <span className="text-[12px] text-muted-foreground">Color</span>
          <div className="flex flex-wrap items-center gap-3">
            {CONTRIBUTION_PALETTE_PRESETS.map((preset) => (
              <PaletteOption
                key={preset.id}
                preset={preset}
                selected={style.paletteId === preset.id}
                onSelect={() => setPaletteId(preset.id)}
              />
            ))}
          </div>
        </div>

        <PlaygroundSlider
          label="Roundness"
          value={style.roundnessPx}
          onChange={setRoundnessPx}
          min={PLAYGROUND_ROUNDNESS_MIN}
          max={PLAYGROUND_ROUNDNESS_MAX}
          step={1}
          formatValue={(v) => `${v}px`}
        />
      </PlaygroundSection>

      <PlaygroundSection title="Username">
        <div
          style={
            {
              "--brand": PLAYGROUND_ACCENT,
              "--brand-hover": PLAYGROUND_ACCENT_HOVER,
            } as CSSProperties
          }
        >
          <Switch
            label="Show username"
            checked={style.showUsername}
            onToggle={() => setShowUsername(!style.showUsername)}
            thumbClassName="bg-black"
            className="gap-2.5 px-0 py-1 [&_span]:text-[13px] [&_[role=switch]]:focus-visible:ring-[#FA70B3]/40"
          />
        </div>

        <PlaygroundSlider
          label="Text size"
          value={style.usernameFontPx}
          onChange={setUsernameFontPx}
          min={USERNAME_FONT_MIN}
          max={USERNAME_FONT_MAX}
          step={1}
          formatValue={(v) => `${v}px`}
          disabled={!style.showUsername}
        />

        <PlaygroundRow label="Text color">
          <div
            className={cn(!style.showUsername && "pointer-events-none opacity-40")}
          >
            <ColorPickerPopover
              value={style.usernameColor}
              onValueChange={setUsernameColor}
              triggerClassName={`${PICKER_TRIGGER} w-full justify-between`}
              triggerShowValue
              hideEyedropper
            />
          </div>
        </PlaygroundRow>
      </PlaygroundSection>

      <PlaygroundSection title="Export">
        <PlaygroundRow label="Size">
          <Select
            value={String(exportSize)}
            onValueChange={(value) =>
              setExportSize(Number(value) as QrExportSize)
            }
          >
            <SelectTrigger className={SELECT_TRIGGER} placeholder="Size" />
            <SelectContent>
              {QR_EXPORT_SIZES.map((size, index) => (
                <SelectItem key={size} index={index} value={String(size)}>
                  {size} px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PlaygroundRow>

        <PlaygroundRow label="Format">
          <RadioGroup
            orientation="horizontal"
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as QrExportFormat)}
            className="flex w-full flex-row"
          >
            <RadioItem
              index={0}
              value="png"
              label="PNG"
              className="min-w-0 flex-1"
            />
            <RadioItem
              index={1}
              value="svg"
              label="SVG"
              className="min-w-0 flex-1"
            />
          </RadioGroup>
        </PlaygroundRow>

        {exportLayout && (
          <p className="text-[11px] leading-snug text-muted-foreground tabular-nums">
            {exportLayout.symbolSize}×{exportLayout.symbolSize} px QR, centered
            on {exportLayout.canvasSize}×{exportLayout.canvasSize} px canvas.
          </p>
        )}

        <div className="mt-5 mb-1 px-1">
          <Button
            type="button"
            intent="primary"
            size="medium"
            fullWidth
            className="font-bold"
            style={{ fontWeight: fontWeights.bold }}
            loading={downloading}
            disabled={!grid}
            onClick={() => {
              void handleDownload();
            }}
          >
            <DownloadIcon size={16} />
            Download
          </Button>
        </div>
      </PlaygroundSection>
    </div>
  );
}
