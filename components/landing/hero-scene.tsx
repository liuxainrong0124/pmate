"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number; hue: number; alpha: number;
  ox: number; oy: number; oz: number;
}

interface Connection {
  a: number; b: number;
}

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);

  const COLOR_PALETTE = [260, 220, 180, 340, 160, 40];

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    // Create particles
    const count = 80;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = Math.random() * 0.6 + 0.2;
      const x = 0.5 + Math.cos(angle) * radius;
      const y = 0.5 + Math.sin(angle) * radius * 0.7;
      const z = Math.random() * 0.5;
      particles.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.002,
        size: 2 + Math.random() * 4,
        hue: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
        alpha: 0.3 + Math.random() * 0.5,
        ox: x, oy: y, oz: z,
      });
    }
    particlesRef.current = particles;

    // Build connections
    const connections: Connection[] = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].ox - particles[j].ox;
        const dy = particles[i].oy - particles[j].oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.12) {
          connections.push({ a: i, b: j });
        }
      }
    }

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle, scale: number) => {
      const x = p.x * W();
      const y = p.y * H();
      const size = p.size * scale * (1 + p.z * 0.8);
      const alpha = p.alpha * (0.5 + p.z * 0.5);

      // Outer glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      glow.addColorStop(0, `hsla(${p.hue}, 70%, 65%, ${alpha * 0.3})`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      const core = ctx.createRadialGradient(x, y, 0, x, y, size);
      core.addColorStop(0, `hsla(${p.hue}, 60%, 80%, ${alpha})`);
      core.addColorStop(0.5, `hsla(${p.hue}, 70%, 60%, ${alpha * 0.8})`);
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      timeRef.current++;
      const t = timeRef.current;
      const w = W();
      const h = H();

      // Smooth mouse follow
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.05;
      m.y += (m.ty - m.y) * 0.05;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background ambient glow near mouse
      if (m.active) {
        const bgGlow = ctx.createRadialGradient(
          m.x * w, m.y * h, 0,
          m.x * w, m.y * h, 300
        );
        bgGlow.addColorStop(0, "rgba(99,102,241,0.04)");
        bgGlow.addColorStop(1, "transparent");
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, w, h);
      }

      // Update & draw particles
      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(t * 0.02 + p.oy * 10) * 0.0004;
        p.y += p.vy + Math.cos(t * 0.02 + p.ox * 10) * 0.0004;
        p.z += p.vz + Math.sin(t * 0.015 + p.oz * 5) * 0.001;

        // Mouse attraction
        if (m.active) {
          const dx = m.x - p.x;
          const dy = m.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.25) {
            const force = (1 - dist / 0.25) * 0.001;
            p.x += dx * force;
            p.y += dy * force;
          }
        }

        // Bounds with soft repel
        const margin = 0.08;
        if (p.x < margin) p.vx += 0.0003;
        if (p.x > 1 - margin) p.vx -= 0.0003;
        if (p.y < margin) p.vy += 0.0003;
        if (p.y > 1 - margin) p.vy -= 0.0003;

        // Damping
        p.vx *= 0.998;
        p.vy *= 0.998;
        p.vz *= 0.998;
      }

      // Draw connections first
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 0.5;
      for (const { a, b } of connections) {
        const pa = particlesRef.current[a];
        const pb = particlesRef.current[b];
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.15) {
          const alpha = (1 - dist / 0.15) * 0.3;
          ctx.strokeStyle = `hsla(${pa.hue}, 50%, 60%, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(pa.x * w, pa.y * h);
          ctx.lineTo(pb.x * w, pb.y * h);
          ctx.stroke();
        }
      }

      // Draw particles
      for (const p of particlesRef.current) {
        drawParticle(ctx, p, 1);
      }

      // Mouse ripple effect
      if (m.active) {
        const rippleR = (t % 120) * 2;
        const rippleAlpha = 1 - (t % 120) / 120;
        const ripple = ctx.createRadialGradient(m.x * w, m.y * h, rippleR * 0.5, m.x * w, m.y * h, rippleR);
        ripple.addColorStop(0, "transparent");
        ripple.addColorStop(0.5, `rgba(99,102,241,${rippleAlpha * 0.06})`);
        ripple.addColorStop(1, "transparent");
        ctx.fillStyle = ripple;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, rippleR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return () => { if (cleanup) cleanup(); };
  }, [init]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.tx = (e.clientX - rect.left) / rect.width;
    mouseRef.current.ty = (e.clientY - rect.top) / rect.height;
    mouseRef.current.active = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
