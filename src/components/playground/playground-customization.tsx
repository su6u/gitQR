"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/icons/download-icon";
import type { IconComponent } from "@/lib/icons";
import { fontWeights } from "@/lib/font-weight";
import { ColorPickerPopover, ColorSwatch } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const BACKGROUND_PRESETS = [
  { color: "#FFFFFF", label: "White" },
  { color: "#F4F4F4", label: "Soft gray" },
  { color: "#FAFAFA", label: "Soft" },
  { color: "#E8F5E9", label: "Mint" },
] as const;

const MODULE_DEFAULT = "#3D3D3D";
const BACKGROUND_DEFAULT = "#FFFFFF";

const PLAYGROUND_CONTROL_SURFACE =
  "bg-playground-control hover:bg-hover active:bg-active transition-colors duration-80";
const PICKER_TRIGGER = `h-8 min-h-8 px-2.5 text-[13px] [&_span]:text-[13px] ${PLAYGROUND_CONTROL_SURFACE}`;
const SELECT_TRIGGER = `h-8 min-h-8 w-full min-w-0 px-3 text-[13px] ${PLAYGROUND_CONTROL_SURFACE}`;
const SLIDER_TRACK_STYLE = {
  backgroundColor: "var(--playground-track)",
} as const;
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
        thumbBorderColor={SLIDER_THUMB_BORDER}
      />
    </PlaygroundRow>
  );
}

export function PlaygroundCustomization() {
  const [moduleColor, setModuleColor] = useState(MODULE_DEFAULT);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_DEFAULT);
  const [roundness, setRoundness] = useState(4);
  const [gap, setGap] = useState(3);
  const [profileImage, setProfileImage] = useState(true);
  const [imageSize, setImageSize] = useState(36);
  const [contributionLook, setContributionLook] = useState("classic");
  const [exportSize, setExportSize] = useState("1024");
  const [exportFormat, setExportFormat] = useState("png");

  return (
    <div className="flex flex-col gap-5">
      <PlaygroundSection title="Style">
        <PlaygroundRow label="Module">
          <ColorPickerPopover
            value={moduleColor}
            onValueChange={(value) => setModuleColor(value)}
            triggerClassName={`${PICKER_TRIGGER} w-full justify-between`}
            triggerShowValue
            hideEyedropper
          />
        </PlaygroundRow>

        <PlaygroundRow label="Background">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {BACKGROUND_PRESETS.map((preset) => (
              <ColorSwatch
                key={preset.color}
                color={preset.color}
                size={24}
                selected={
                  backgroundColor.toLowerCase() === preset.color.toLowerCase()
                }
                aria-label={preset.label}
                onClick={() => setBackgroundColor(preset.color)}
              />
            ))}
            <ColorPickerPopover
              value={backgroundColor}
              onValueChange={(value) => setBackgroundColor(value)}
              triggerClassName={PICKER_TRIGGER}
              triggerShowValue={false}
              hideEyedropper
            />
          </div>
        </PlaygroundRow>

        <PlaygroundSlider
          label="Roundness"
          value={roundness}
          onChange={setRoundness}
          min={0}
          max={8}
          step={1}
          formatValue={(v) => `${v}px`}
        />

        <PlaygroundSlider
          label="Gap"
          value={gap}
          onChange={setGap}
          min={0}
          max={12}
          step={1}
          formatValue={(v) => `${v}px`}
        />
      </PlaygroundSection>

      <PlaygroundSection title="GitHub">
        <Switch
          label="Profile image"
          checked={profileImage}
          onToggle={() => setProfileImage((on) => !on)}
          className="gap-2.5 px-0 py-1 [&_span]:text-[13px]"
        />

        <PlaygroundSlider
          label="Image size"
          value={imageSize}
          onChange={setImageSize}
          min={20}
          max={56}
          step={1}
          formatValue={(v) => `${v}%`}
          disabled={!profileImage}
        />

        <PlaygroundRow label="Look">
          <Select value={contributionLook} onValueChange={setContributionLook}>
            <SelectTrigger className={SELECT_TRIGGER} placeholder="Look" />
            <SelectContent>
              <SelectItem index={0} value="classic">
                Classic
              </SelectItem>
              <SelectItem index={1} value="mono">
                Mono
              </SelectItem>
              <SelectItem index={2} value="custom">
                Custom
              </SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundRow>
      </PlaygroundSection>

      <PlaygroundSection title="Export">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground">Size</span>
            <Select value={exportSize} onValueChange={setExportSize}>
              <SelectTrigger className={SELECT_TRIGGER} placeholder="Size" />
              <SelectContent>
                <SelectItem index={0} value="512">
                  512 px
                </SelectItem>
                <SelectItem index={1} value="1024">
                  1024 px
                </SelectItem>
                <SelectItem index={2} value="2048">
                  2048 px
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground">Format</span>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className={SELECT_TRIGGER} placeholder="Format" />
              <SelectContent>
                <SelectItem index={0} value="png">
                  PNG
                </SelectItem>
                <SelectItem index={1} value="svg">
                  SVG
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="md"
          className="mt-5 h-9 w-full rounded-full font-bold text-foreground focus-visible:ring-[#63E895]/40 [&_span]:rounded-full [&_span]:bg-[#63E895] [&_span]:transition-[background-color,transform] [&_span]:duration-80 [&_span]:group-hover:bg-[#52df88] [&_span]:group-active:bg-[#45d67c]"
          style={{ fontVariationSettings: fontWeights.bold }}
          leadingIcon={DownloadIcon as IconComponent}
        >
          Download
        </Button>
      </PlaygroundSection>
    </div>
  );
}
