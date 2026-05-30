"use client";

import { useRef, useState, useCallback, ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
}

export function GlowCard({ children, className = "", glowColor = "rgba(99,102,241,0.15)", maxTilt = 5 }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (y - 0.5) * -maxTilt;
      const rotateY = (x - 0.5) * maxTilt;

      setStyle({
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1)`,
        transition: "transform 0.1s ease-out",
      });

      setGlowStyle({
        opacity: 1,
        background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${glowColor}, transparent 60%)`,
      });
    },
    [maxTilt, glowColor]
  );

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
    });
    setGlowStyle({ opacity: 0, transition: "opacity 0.6s ease-out" });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={glowStyle}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
