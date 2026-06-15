"use client";

import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fontWeights } from "@/lib/font-weight";
import type { IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { cn } from "@/lib/utils";

interface InputGroupContextValue {
  registerItem: (index: number, element: HTMLLabelElement | null) => void;
  activeIndex: number | null;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroup() {
  const ctx = useContext(InputGroupContext);
  if (!ctx) throw new Error("useInputGroup must be used within an InputGroup");
  return ctx;
}

interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, className, ...props }, ref) => {
    const itemsRef = useRef(new Map<number, HTMLLabelElement>());
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const registerItem = useCallback(
      (index: number, element: HTMLLabelElement | null) => {
        if (element) {
          itemsRef.current.set(index, element);
        } else {
          itemsRef.current.delete(index);
        }
      },
      [],
    );

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const mouseY = e.clientY;

      let closestIndex: number | null = null;
      let closestDistance = Infinity;

      itemsRef.current.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(mouseY - itemCenterY);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setActiveIndex(null);
    }, []);

    return (
      <InputGroupContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn("flex flex-col gap-3 w-72 max-w-full", className)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );
  },
);

InputGroup.displayName = "InputGroup";

interface InputFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "index" | "value"
  > {
  label: string;
  placeholder?: string;
  icon?: IconComponent;
  index: number;
  value: string;
  onChange: (value: string) => void;
      error?: string;
      disabled?: boolean;
      compact?: boolean;
      trailing?: ReactNode;
      className?: string;
}

const InputField = forwardRef<HTMLLabelElement, InputFieldProps>(
  (
    {
      label,
      placeholder,
      icon: Icon,
      index,
      value,
      onChange,
      error,
      disabled,
      compact = false,
      trailing,
      className,
      onBlur: onBlurProp,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLLabelElement>(null);
    const { registerItem, activeIndex } = useInputGroup();
    const [isFocused, setIsFocused] = useState(false);
    const shape = useShape();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    const isActive = activeIndex === index;
    const labelActive = isActive || isFocused;

    const errorId = error ? `input-error-${index}` : undefined;

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlurProp?.(event);
    };

    // Input container classes
    let bgClass: string;
    let ringClass: string;

    if (disabled) {
      bgClass = "bg-transparent";
      ringClass = "ring-border";
    } else if (error) {
      bgClass = isActive ? "bg-destructive-light/60" : "bg-transparent";
      ringClass =
        isFocused || isActive ? "ring-destructive/50" : "ring-transparent";
    } else if (isFocused) {
      bgClass = "bg-transparent";
      ringClass = "ring-border";
    } else if (isActive) {
      bgClass = "bg-muted/50";
      ringClass = "ring-border";
    } else {
      bgClass = "bg-transparent";
      ringClass = "ring-transparent";
    }

    return (
      <label
        ref={(node) => {
          (
            internalRef as React.MutableRefObject<HTMLLabelElement | null>
          ).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLLabelElement | null>).current =
              node;
        }}
        className={cn(
          "flex flex-col cursor-text",
          compact ? "gap-0.5" : "gap-1",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
      >
        {/* Label */}
        <span
          className={cn(
            "inline-grid",
            compact ? "pl-2 text-[11px]" : "pl-3 text-[13px]",
          )}
        >
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1",
              error ? "text-destructive" : "text-muted-foreground",
            )}
            style={{
              fontVariationSettings: fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>

        {/* Input container */}
        <div
          className={cn(
            `flex items-center gap-1.5 ${shape.input} ring-1 transition-all duration-80`,
            compact ? "px-2 py-1" : "gap-2 px-3 py-2",
            bgClass,
            ringClass,
          )}
        >
          {Icon && (
            <Icon
              size={compact ? 14 : 16}
              strokeWidth={labelActive ? 2 : 1.5}
              className={cn(
                "shrink-0 transition-[color,stroke-width] duration-80",
                labelActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error || undefined}
            aria-describedby={errorId}
            className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-[inherit]"
            style={{
              fontVariationSettings: fontWeights.normal,
              fontSize: compact ? "12px" : "13px",
            }}
            {...props}
          />
          {trailing}
        </div>

        {/* Error message */}
        {error && (
          <span
            id={errorId}
            className={cn(
              "text-destructive",
              compact ? "pl-2 text-[11px]" : "pl-3 text-[12px]",
            )}
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {error}
          </span>
        )}
      </label>
    );
  },
);

InputField.displayName = "InputField";

export { InputField, InputGroup };
export default InputGroup;
