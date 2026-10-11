"use client";

import * as motion from "motion/react-client";
import type { ReactNode } from "react";

type EnterAnimationProps = {
  children: ReactNode;
  className?: string;
};

export default function EnterAnimation({
  children,
  className = "",
}: EnterAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        scale: {
          type: "spring",
          visualDuration: 0.4,
          bounce: 0.35,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}