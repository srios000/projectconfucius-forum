"use client";
import { AnimatePresence, motion } from "motion/react";

export default function VoteBurst({ show, value, id }: { show: boolean; value: 1 | -1; id?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          key={id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -22 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.3, 1] }}
          className={
            "pointer-events-none absolute left-4 top-3 text-[11px] font-bold " +
            (value > 0 ? "text-primary" : "text-destructive")
          }
        >
          {value > 0 ? "+1" : "−1"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

