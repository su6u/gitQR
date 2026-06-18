export const popoverEnter = {
  hidden: { opacity: 0, transform: "translateY(-4px) scaleY(0.96)" },
  visible: { opacity: 1, transform: "translateY(0) scaleY(1)" },
} as const;

export function popoverEnterFrom(placement: "top" | "bottom") {
  const y = placement === "bottom" ? -4 : 4;
  return {
    hidden: { opacity: 0, transform: `translateY(${y}px) scaleY(0.96)` },
    visible: { opacity: 1, transform: "translateY(0) scaleY(1)" },
  };
}
