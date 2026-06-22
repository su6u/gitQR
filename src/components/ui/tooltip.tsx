"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import {
  markTooltipHidden,
  tooltipShouldInstant,
} from "@/lib/tooltip-session";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";

// ---------------------------------------------------------------------------
// Portal container context
// ---------------------------------------------------------------------------

const TooltipPortalContainerContext = createContext<HTMLElement | null>(null);

function TooltipPortalContainer({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <TooltipPortalContainerContext.Provider value={value}>
      {children}
    </TooltipPortalContainerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipSide;
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  /** When true, forces the tooltip open. When false, forces it closed. When undefined, uses default hover/focus behavior. */
  forceOpen?: boolean;
  /** Called when the tooltip's internal open state changes (before forceOpen is applied). */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function getSlideTransform(side: TooltipSide, px: number) {
  switch (side) {
    case "top":
      return `translateY(${px}px)`;
    case "bottom":
      return `translateY(${-px}px)`;
    case "left":
      return `translateX(${px}px)`;
    case "right":
      return `translateX(${-px}px)`;
  }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 8,
  delayDuration = 200,
  className,
  forceOpen,
  onOpenChange: onOpenChangeProp,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const [mounted, setMounted] = useState(false);
  const [delayMs, setDelayMs] = useState(delayDuration);
  const instantOpenRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const shape = useShape();
  const portalContainer = useContext(TooltipPortalContainerContext);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const handleExitComplete = () => {
    if (!open) setMounted(false);
  };

  const slidePx = reduceMotion ? 0 : 4;
  const motionTransition = reduceMotion
    ? { duration: 0 }
    : instantOpenRef.current
      ? { duration: 0 }
      : open
        ? spring.fast
        : spring.fast.exit;

  return (
    <TooltipPrimitive.Provider delayDuration={delayMs} skipDelayDuration={300}>
      <TooltipPrimitive.Root
        open={open}
        onOpenChange={(v) => {
          if (v) {
            instantOpenRef.current = tooltipShouldInstant();
            setDelayMs(instantOpenRef.current ? 0 : delayDuration);
          } else {
            markTooltipHidden();
          }
          setInternalOpen(v);
          onOpenChangeProp?.(v);
        }}
      >
        <TooltipPrimitive.Trigger>
          {children}
        </TooltipPrimitive.Trigger>
        {mounted && (
          <TooltipPrimitive.Portal forceMount container={portalContainer ?? undefined}>
            <TooltipPrimitive.Content
              side={side}
              sideOffset={sideOffset}
              forceMount
              className="z-50"
            >
              <motion.div
                className={cn(
                  "bg-foreground text-background text-[12px] px-2 py-1",
                  shape.bg,
                  className
                )}
                style={{ fontWeight: fontWeights.medium }}
                initial={{
                  opacity: 0,
                  transform: getSlideTransform(side, slidePx),
                }}
                animate={{
                  opacity: open ? 1 : 0,
                  transform: "translate(0, 0)",
                }}
                transition={motionTransition}
                onAnimationComplete={handleExitComplete}
              >
                {content}
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip, TooltipPortalContainer };
export type { TooltipProps, TooltipSide };
