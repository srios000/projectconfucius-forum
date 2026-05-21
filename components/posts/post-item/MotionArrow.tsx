"use client";
import { motion } from "motion/react";

type Props = {
  filled: boolean;
  direction: "up" | "down";
  color?: string;
  onClick?: (e: React.MouseEvent<SVGElement>) => void;
  disabled?: boolean;
};

export default function MotionArrow({ filled, direction, color, onClick, disabled }: Props) {
  const path = direction === "up"
    ? "M12 3l9 12h-5v6h-8v-6H3z"
    : "M12 21l9-12h-5V3h-8v6H3z";
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      onClick={disabled ? undefined : onClick}
      style={{ color, cursor: disabled ? "not-allowed" : "pointer" }}
      animate={filled ? { scale: [1, 1.32, 1] } : { scale: 1 }}
      transition={{ duration: 0.36, ease: [0.2, 0.7, 0.3, 1.4] }}
      whileHover={disabled ? undefined : { scale: 1.15 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
    >
      <path
        d={path}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? 0 : 2}
      />
    </motion.svg>
  );
}
