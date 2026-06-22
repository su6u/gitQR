"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const lightIconClass =
  "[&_img]:brightness-0 [&_img]:invert [&_svg]:text-current";

const buttonVariants = cva(
  "flex items-center justify-center px-4 text-sm font-medium transition-[box-shadow,background-color,transform] active:transition-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        default: [
          "bg-[#36322F]",
          "text-[#fff]",
          lightIconClass,
          "hover:bg-[#4a4542]",
          "disabled:bg-[#8c8885]",
          "disabled:hover:bg-[#8c8885]",
          "[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#171310,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(58,_33,_8,_58%)]",
          "hover:[box-shadow:inset_0px_-2.53012px_0px_0px_#171310,_0px_1.44578px_7.59036px_0px_rgba(58,_33,_8,_64%)]",
          "disabled:shadow-none",
          "disabled:hover:shadow-none",
          "active:bg-[#2A2724]",
          "active:[box-shadow:inset_0px_-1.5px_0px_0px_#171310,_0px_0.5px_2px_0px_rgba(58,_33,_8,_70%)]",
        ],
        primary: [
          "bg-[#FA70B3]",
          "text-[#fff]",
          lightIconClass,
          "hover:bg-[#FB85C0]",
          "disabled:bg-[#FDCCE6]",
          "disabled:hover:bg-[#FDCCE6]",
          "[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#E855A0,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(250,_112,_179,_58%)]",
          "hover:[box-shadow:inset_0px_-2.53012px_0px_0px_#FA70B3,_0px_1.44578px_7.59036px_0px_rgba(250,_112,_179,_64%)]",
          "disabled:shadow-none",
          "disabled:hover:shadow-none",
          "active:bg-[#E855A0]",
          "active:[box-shadow:inset_0px_-1.5px_0px_0px_#D94A94,_0px_0.5px_2px_0px_rgba(250,_112,_179,_70%)]",
        ],
        secondary: [
          "bg-[#FFFFFF]",
          "text-[#36322F]",
          "hover:bg-[#F8F8F8]",
          "disabled:bg-[#F0F0F0]",
          "disabled:hover:bg-[#F0F0F0]",
          "[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#E0E0E0,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(0,_0,_0,_10%)]",
          "hover:[box-shadow:inset_0px_-2.53012px_0px_0px_#E8E8E8,_0px_1.44578px_7.59036px_0px_rgba(0,_0,_0,_12%)]",
          "disabled:shadow-none",
          "disabled:hover:shadow-none",
          "border",
          "border-[#E0E0E0]",
          "active:bg-[#F0F0F0]",
          "active:[box-shadow:inset_0px_-1.5px_0px_0px_#D8D8D8,_0px_0.5px_2px_0px_rgba(0,_0,_0,_15%)]",
        ],
        danger: [
          "bg-[#E6492D]",
          "text-[#fff]",
          lightIconClass,
          "hover:bg-[#F05B41]",
          "disabled:bg-[#F5A799]",
          "disabled:hover:bg-[#F5A799]",
          "[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#D63A1F,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(214,_58,_31,_58%)]",
          "hover:[box-shadow:inset_0px_-2.53012px_0px_0px_#E6492D,_0px_1.44578px_7.59036px_0px_rgba(214,_58,_31,_64%)]",
          "disabled:shadow-none",
          "disabled:hover:shadow-none",
          "active:bg-[#D63A1F]",
          "active:[box-shadow:inset_0px_-1.5px_0px_0px_#B22E17,_0px_0.5px_2px_0px_rgba(214,_58,_31,_70%)]",
        ],
      },
      size: {
        small: [
          "h-10",
          "min-h-10",
          "rounded-[8px]",
          "px-3",
          "py-1",
          "text-xs",
          "[&:has(img)]:pl-2.5",
        ],
        medium: [
          "h-11",
          "min-h-10",
          "rounded-[9px]",
          "px-4",
          "py-2",
          "text-base",
          "[&:has(img)]:pl-3.5",
        ],
        large: [
          "h-14",
          "min-h-10",
          "rounded-[11px]",
          "px-6",
          "py-3",
          "text-lg",
          "[&:has(img)]:pl-5",
        ],
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      {
        intent: ["default", "primary", "secondary", "danger"],
        size: "medium",
        className: "uppercase",
      },
    ],
    defaultVariants: {
      intent: "default",
      size: "medium",
    },
  },
);

type SharedButtonProps = VariantProps<typeof buttonVariants> & {
  children: ReactNode;
  className?: string;
};

export type NeumorphButtonProps = SharedButtonProps &
  (
    | (Omit<HTMLMotionProps<"button">, "children"> & {
        href?: undefined;
        loading?: boolean;
      })
    | (Omit<HTMLMotionProps<"a">, "children"> & {
        href: string;
        loading?: never;
        disabled?: never;
      })
  );

function NeumorphButton(props: NeumorphButtonProps) {
  const {
    className,
    intent,
    size,
    fullWidth,
    children,
    loading = false,
    ...rest
  } = props;
  const classes = cn(buttonVariants({ intent, size, fullWidth }), className);
  const motionProps = {
    className: classes,
    whileTap: { scale: 0.96 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 },
  };
  const iconPx = size === "large" ? 20 : size === "medium" ? 18 : 16;
  const content = (
    <motion.span
      className="inline-flex items-center justify-center gap-2"
      initial={{ opacity: 1 }}
      animate={{ opacity: loading ? 0.7 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <Loader2
          className="shrink-0 animate-spin"
          style={{ width: iconPx, height: iconPx }}
        />
      ) : null}
      {children}
    </motion.span>
  );

  if ("href" in rest && rest.href) {
    return (
      <motion.a {...motionProps} {...rest}>
        {content}
      </motion.a>
    );
  }

  const { disabled, ...buttonProps } = rest as Omit<
    HTMLMotionProps<"button">,
    "children"
  > & { disabled?: boolean };

  return (
    <motion.button
      disabled={disabled || loading}
      {...motionProps}
      {...buttonProps}
    >
      {content}
    </motion.button>
  );
}

export type ButtonProps = NeumorphButtonProps;
const Button = NeumorphButton;

export { Button, buttonVariants, NeumorphButton };
