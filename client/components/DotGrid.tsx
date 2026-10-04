"use client";

import React from "react";
import DotPattern from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export function DotGrid({
  dotSize = 2,
  gap = 16,
  className,
  style,
  ...props
}: DotGridProps) {
  return (
    <DotPattern
      width={gap}
      height={gap}
      cx={gap / 2}
      cy={gap / 2}
      cr={dotSize / 2}
      className={cn(
        "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
        "fill-[#27ff9a]/40",
        className
      )}
      style={style}
      {...props}
    />
  );
}

export default DotGrid;
