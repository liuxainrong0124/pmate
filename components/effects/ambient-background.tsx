"use client";

import { useEffect, useRef } from "react";

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Orb particles
    interface Orb {
      x: number; y: number; r: number;
      vx: number; vy: number;
      hue: number; alpha: number;
    }

    const orbs: Orb[] = [];
    const orbCount = 5;
    const w = () => canvas.width / dpr;
    const h = () => canvas.height / dpr;

    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        r: 120 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: [220, 260, 180, 340, 40][i],
        alpha: 0.03 + Math.random() * 0.04,
      });
    }

    // Grid dots
    const particles: { x: number; y: number; ox: number; oy: number }[] = [];
    const spacing = 50;
    for (let x = spacing; x < 2000; x += spacing) {
      for (let y = spacing; y < 2000; y += spacing) {
        particles.push({ x, y, ox: x, oy: y });
      }
    }

    let time = 0;
    const animate = () => {
      time++;
      const W = w();
      const H = h();
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Draw orbs
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = W + orb.r;
        if (orb.x > W + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = H + orb.r;
        if (orb.y > H + orb.r) orb.y = -orb.r;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `hsla(${orb.hue}, 60%, 60%, ${orb.alpha * 2})`);
        grad.addColorStop(0.5, `hsla(${orb.hue}, 50%, 50%, ${orb.alpha})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2);
      }

      // Draw grid particles with subtle wave
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      for (const p of particles) {
        const wave = Math.sin(time * 0.01 + p.ox * 0.01) * Math.cos(time * 0.008 + p.oy * 0.01) * 3;
        const px = p.ox + wave;
        const py = p.oy + wave * 0.5;
        if (px > -20 && px < W + 20 && py > -20 && py < H + 20) {
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
