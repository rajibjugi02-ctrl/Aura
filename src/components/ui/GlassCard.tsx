"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  elevation?: "low" | "medium" | "high";
}

export function GlassCard({
  children,
  className,
  elevation = "medium",
  ...props
}: GlassCardProps) {
  const elevationStyles = {
    low: "border border-white/60 shadow-sm",
    medium: "border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
    high: "border border-white/80 shadow-[0_16px_40px_rgb(0,0,0,0.08)]",
  };

  return (
    <motion.div
      className={cn(
        "bg-white/80 backdrop-blur-xl rounded-2xl transition-colors",
        elevationStyles[elevation],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

