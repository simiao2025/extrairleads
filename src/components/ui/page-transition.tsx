"use client";

import { motion } from "framer-motion";

const pageVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(6px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: {
      duration: 0.2,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate="enter" exit="exit" variants={pageVariants}>
      {children}
    </motion.div>
  );
}
