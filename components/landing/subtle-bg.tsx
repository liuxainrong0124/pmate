"use client";

import { useEffect, useRef } from "react";

export function SubtleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;
    let t = 0;

    const animate = () => {
      t += 0.003;
      const w = W();
      const h = H();
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Single large, slow-moving gradient ellipse
      const cx = w * 0.55 + Math.sin(t * 0.7) * w * 0.15;
      const cy = h * 0.35 + Math.cos(t * 0.6) * h * 0.1;
      const rx = w * 0.8;
      const ry = h * 0.5;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      grad.addColorStop(0, "rgba(99,102,241,0.04)");
      grad.addColorStop(0.4, "rgba(139,92,246,0.02)");
      grad.addColorStop(0.7, "rgba(249,115,22,0.015)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle horizontal line texture at bottom
      ctx.strokeStyle = "rgba(0,0,0,0.02)";
      ctx.lineWidth = 1;
      for (let y = h * 0.8; y < h; y += 2) {
        const alpha = 1 - (y - h * 0.8) / (h * 0.2);
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(t * 4 + y * 0.05) * 1.5);
        ctx.lineTo(w, y + Math.cos(t * 3 + y * 0.04) * 1.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
