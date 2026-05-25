"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  colorClass,
  accentGlow,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  accentGlow: string;
  delay: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 1. Efeito Spotlight (Lanterna) */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.08), transparent 40%)`,
        }}
      />
      
      {/* Corner glow */}
      <div
        className={cn(
          "absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          accentGlow,
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:scale-110 transition-transform duration-300",
          colorClass,
        )}
      >
        {icon}
      </div>
      <div className="relative pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("font-heading text-3xl font-black tracking-tight mt-0.5", colorClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}
