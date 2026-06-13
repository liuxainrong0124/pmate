"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

interface Petal {
  x: number; y: number;
  vx: number; vy: number;
  r: number; rot: number; rv: number;
  life: number; maxLife: number;
  hue: number; sat: number; light: number;
}

interface Firefly {
  x: number; y: number;
  baseX: number; baseY: number;
  r: number; phase: number; speed: number;
  alpha: number;
}

interface Branch {
  x: number; y: number;
  endX: number; endY: number;
  cx: number; cy: number;
  w: number;
}

interface Blossom { x: number; y: number; r: number; }
interface BlossomDot { x: number; y: number; r: number; hue: number; alpha: number; light: number; }

export function EntryScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const lastMouseRef = useRef(0);
  const [canvasDebug, setCanvasDebug] = useState<string | null>(null);
  const treeDataRef = useRef<{ segments: Branch[]; blossoms: Blossom[]; dots: BlossomDot[]; built: boolean }>({
    segments: [], blossoms: [], dots: [], built: false,
  });

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleEnter = useCallback(() => {
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    // Offscreen canvas for static scene caching
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d")!;
    if (!offCtx) return;
    let lastIsDark: boolean | null = null;

    let W = 0, H = 0;
    let treeBaseX = 0, treeBaseY = 0;
    let animId = 0;

    // House position (right side)
    let houseX = 0, houseY = 0;
    // Lamp position
    let lampX = 0, lampY = 0;

    function resize() {
      const r = canvas!.getBoundingClientRect();
      W = canvas!.width = r.width;
      H = canvas!.height = r.height;
      setCanvasDebug(`Canvas: ${W}x${H}, ready=${treeDataRef.current.built}`);
      offscreen.width = W;
      offscreen.height = H;
      // Tree positioned with room for full canopy
      treeBaseX = W * 0.48;
      treeBaseY = H * 0.85;
      // House on the right
      houseX = W * 0.72;
      houseY = treeBaseY;
      // Lamp between tree and house
      lampX = W * 0.6;
      lampY = treeBaseY - 10;
      treeDataRef.current.built = false;
      treeDataRef.current.segments = [];
      treeDataRef.current.blossoms = [];
      treeDataRef.current.dots = [];
      lastIsDark = null; // force rebuild
      buildFireflies();
    }

    // Seeded random
    let seed = 42;
    function sRandom() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }
    function sRandomRange(min: number, max: number) { return min + sRandom() * (max - min); }

    function buildBranch(x: number, y: number, len: number, angle: number, w: number, depth: number) {
      if (depth <= 0 || len < 4) return;
      const endX = x + len * Math.cos(angle);
      const endY = y - len * Math.sin(angle);
      const cx = x + len * 0.35 * Math.cos(angle) - len * 0.1 * Math.sin(angle);
      const cy = y - len * 0.35 * Math.sin(angle) - len * 0.1 * Math.cos(angle);
      treeDataRef.current.segments.push({ x, y, endX, endY, cx, cy, w });
      if (depth === 1 || depth === 2) {
        const n = depth === 1 ? 3 : 1;
        for (let j = 0; j < n; j++) {
          treeDataRef.current.blossoms.push({
            x: endX + sRandomRange(-12, 12),
            y: endY + sRandomRange(-12, 12),
            r: 4 + sRandom() * 5,
          });
        }
      }
      const newLen = len * (0.6 + sRandom() * 0.2);
      const angVar = 0.2 + sRandom() * 0.3;
      buildBranch(endX, endY, newLen, angle - angVar, w * 0.66, depth - 1);
      buildBranch(endX, endY, newLen, angle + angVar * 0.9, w * 0.66, depth - 1);
      if (sRandom() < 0.35 && depth > 2) {
        buildBranch(endX, endY, newLen * 0.5, angle + angVar * 1.6, w * 0.4, depth - 2);
      }
    }

    function buildBlossomDots() {
      treeDataRef.current.blossoms.forEach((b) => {
        const count = 7 + Math.floor(sRandom() * 5);
        for (let i = 0; i < count; i++) {
          treeDataRef.current.dots.push({
            x: b.x + sRandomRange(-b.r * 3.5, b.r * 3.5),
            y: b.y + sRandomRange(-b.r * 3.5, b.r * 3.5),
            r: b.r * (0.4 + sRandom() * 0.9),
            hue: 340 + sRandom() * 35,
            alpha: 0.35 + sRandom() * 0.55,
            light: 65 + sRandom() * 25,
          });
        }
      });
    }

    function ensureTreeBuilt() {
      if (treeDataRef.current.built) return;
      treeDataRef.current.built = true;
      treeDataRef.current.segments = [];
      treeDataRef.current.blossoms = [];
      treeDataRef.current.dots = [];
      seed = 42;
      const topX = treeBaseX, topY = treeBaseY - 200;
      // Symmetric branches — moderate length, flowers only at tips
      buildBranch(topX, topY, 130, Math.PI / 2 + 0.04, 14, 8);
      buildBranch(topX, topY, 122, Math.PI / 2 - 0.04, 13, 8);
      buildBranch(topX, topY, 118, Math.PI / 2 + 0.25, 11, 7);
      buildBranch(topX, topY, 112, Math.PI / 2 - 0.25, 11, 7);
      buildBranch(topX, topY, 105, Math.PI / 2 + 0.45, 9, 7);
      buildBranch(topX, topY, 98, Math.PI / 2 - 0.45, 9, 7);
      buildBranch(topX, topY, 90, Math.PI / 2 + 0.65, 8, 6);
      buildBranch(topX, topY, 82, Math.PI / 2 - 0.65, 8, 6);
      buildBranch(topX, topY, 72, Math.PI / 2 + 0.85, 6, 5);
      buildBranch(topX, topY, 65, Math.PI / 2 - 0.85, 6, 5);
      buildBranch(topX, topY, 55, Math.PI / 2 + 1.05, 4, 4);
      buildBranch(topX, topY, 48, Math.PI / 2 - 1.05, 4, 4);
      // Hollow shell: flowers ONLY at outer surface of canopy sphere
      // Inner 70% is empty — no flowers near trunk
      const shellCX = topX, shellCY = topY - 55;
      const shellR = 105;
      for (let i = 0; i < 100; i++) {
        const a = sRandom() * Math.PI * 2;
        const elev = sRandom() * Math.PI * 0.75; // upper 3/4 of sphere
        const dist = 0.72 + sRandom() * 0.28; // only outer 28% shell
        treeDataRef.current.blossoms.push({
          x: shellCX + Math.cos(a) * Math.sin(elev) * shellR * dist + sRandomRange(-8, 8),
          y: shellCY - Math.cos(elev) * shellR * dist * 0.82 + sRandomRange(-5, 5),
          r: 5 + sRandom() * 7,
        });
      }
      buildBlossomDots();
    }

    function buildFireflies() {
      const flies: Firefly[] = [];
      for (let i = 0; i < 12; i++) {
        flies.push({
          x: treeBaseX + (Math.random() - 0.5) * W * 0.6,
          y: treeBaseY - 200 + Math.random() * 320,
          baseX: treeBaseX + (Math.random() - 0.5) * W * 0.6,
          baseY: treeBaseY - 200 + Math.random() * 320,
          r: 1 + Math.random() * 2.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.7,
          alpha: 0,
        });
      }
      firefliesRef.current = flies;
    }

    // --- Static scene drawing (to offscreen canvas) ---
    // Uses ctxTarget so the same functions work for both offscreen and main canvas

    function drawSky(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      const sky = ctxTarget.createLinearGradient(0, 0, 0, H);
      if (isDark) {
        sky.addColorStop(0, "#0D0D1A"); sky.addColorStop(0.5, "#141428"); sky.addColorStop(1, "#1A1430");
      } else {
        sky.addColorStop(0, "#E8D5C8"); sky.addColorStop(0.4, "#F0E0D6"); sky.addColorStop(1, "#D8C8B8");
      }
      ctxTarget.fillStyle = sky;
      ctxTarget.fillRect(0, 0, W, H);
    }

    function drawStars(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      if (!isDark) return;
      let ss = 777;
      const sr = () => { ss = (ss * 16807 + 0) % 2147483647; return (ss - 1) / 2147483646; };
      for (let i = 0; i < 80; i++) {
        const sx = sr() * W;
        const sy = sr() * H * 0.55;
        const sr2 = 0.4 + sr() * 0.8;
        const twinkle = 0.3 + Math.sin(Date.now() * 0.001 + i * 1.7) * 0.3;
        ctxTarget.fillStyle = `rgba(255,255,240,${twinkle * 0.7})`;
        ctxTarget.beginPath();
        ctxTarget.arc(sx, sy, sr2, 0, Math.PI * 2);
        ctxTarget.fill();
      }
    }

    function drawFlower(ctxTarget: CanvasRenderingContext2D, cx: number, cy: number, size: number, petalH: number, petalS: number, petalL: number, alpha: number, petalCount: number) {
      // Natural bezier petals radiating from center
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        ctxTarget.save();
        ctxTarget.translate(cx, cy);
        ctxTarget.rotate(angle);

        const s = size * 0.7;
        ctxTarget.fillStyle = `hsla(${petalH},${petalS}%,${petalL}%,${alpha})`;
        ctxTarget.beginPath();
        ctxTarget.moveTo(0, 0);
        // Left half of petal
        ctxTarget.bezierCurveTo(s * 0.25, -s * 0.1, s * 0.35, -s * 0.6, 0, -s);
        // Right half of petal
        ctxTarget.bezierCurveTo(-s * 0.35, -s * 0.6, -s * 0.25, -s * 0.1, 0, 0);
        ctxTarget.fill();
        ctxTarget.restore();
      }
      // Center
      ctxTarget.fillStyle = `hsla(${petalH + 20},${petalS}%,${petalL - 15}%,${alpha * 1.2})`;
      ctxTarget.beginPath();
      ctxTarget.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
      ctxTarget.fill();
    }

    function drawTree(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      ensureTreeBuilt();
      const trunkH = 200;
      const topY = treeBaseY - trunkH;

      // Wide organic trunk — not a triangle, substantial width at top
      const bl = treeBaseX - 38;
      const br = treeBaseX + 35;
      const tl = treeBaseX - 10;
      const tr = treeBaseX + 9;

      ctxTarget.beginPath();
      ctxTarget.moveTo(bl, treeBaseY);
      // Left side: slight outward bulge then taper to top (still wide)
      ctxTarget.bezierCurveTo(bl - 6, treeBaseY - 55, tl - 4, topY + 40, tl, topY);
      // Top — curved, not a point
      ctxTarget.quadraticCurveTo(treeBaseX - 1, topY - 6, treeBaseX + 1, topY - 5);
      ctxTarget.quadraticCurveTo(treeBaseX + 3, topY - 2, tr, topY);
      // Right side
      ctxTarget.bezierCurveTo(tr + 5, topY + 40, br + 6, treeBaseY - 55, br, treeBaseY);
      ctxTarget.closePath();

      // Trunk gradient
      const trunkGrad = ctxTarget.createLinearGradient(treeBaseX - 25, 0, treeBaseX + 20, 0);
      trunkGrad.addColorStop(0, "#4A2E20");
      trunkGrad.addColorStop(0.3, "#6B4430");
      trunkGrad.addColorStop(0.55, "#7A5040");
      trunkGrad.addColorStop(0.75, "#6B4430");
      trunkGrad.addColorStop(1, "#3D2518");
      ctxTarget.fillStyle = trunkGrad;
      ctxTarget.fill();

      // Bark texture lines
      ctxTarget.strokeStyle = "rgba(0,0,0,0.05)";
      ctxTarget.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const ty = treeBaseY - 20 - i * 36;
        const hw = 30 - i * 4;
        ctxTarget.beginPath();
        ctxTarget.moveTo(treeBaseX - hw, ty);
        ctxTarget.quadraticCurveTo(treeBaseX + (i % 2 === 0 ? 6 : -5), ty + 4, treeBaseX + hw - 3, ty);
        ctxTarget.stroke();
      }

      // Root flares
      ctxTarget.strokeStyle = "#4A2E20";
      ctxTarget.lineWidth = 5;
      ctxTarget.lineCap = "round";
      ctxTarget.beginPath();
      ctxTarget.moveTo(bl, treeBaseY);
      ctxTarget.quadraticCurveTo(bl - 22, treeBaseY - 10, bl - 32, treeBaseY + 8);
      ctxTarget.stroke();
      ctxTarget.beginPath();
      ctxTarget.moveTo(br, treeBaseY);
      ctxTarget.quadraticCurveTo(br + 20, treeBaseY - 8, br + 30, treeBaseY + 6);
      ctxTarget.stroke();
      // Smaller surface roots
      ctxTarget.lineWidth = 3;
      ctxTarget.strokeStyle = "#5A3828";
      ctxTarget.beginPath();
      ctxTarget.moveTo(bl + 12, treeBaseY + 1);
      ctxTarget.quadraticCurveTo(bl - 5, treeBaseY - 4, bl - 16, treeBaseY + 4);
      ctxTarget.stroke();
      ctxTarget.beginPath();
      ctxTarget.moveTo(br - 10, treeBaseY + 1);
      ctxTarget.quadraticCurveTo(br + 8, treeBaseY - 3, br + 16, treeBaseY + 3);
      ctxTarget.stroke();

      // Branches
      treeDataRef.current.segments.forEach((s) => {
        ctxTarget.beginPath();
        ctxTarget.moveTo(s.x, s.y);
        ctxTarget.quadraticCurveTo(s.cx, s.cy, s.endX, s.endY);
        ctxTarget.strokeStyle = "#5A3D32";
        ctxTarget.lineWidth = s.w;
        ctxTarget.lineCap = "round";
        ctxTarget.stroke();
      });

      // Deterministic hash for stable flower colors across frames
      const posHash = (x: number, y: number) => {
        const n = Math.abs(Math.floor(x * 7937 + y * 9311));
        return (n % 100) / 100;
      };

      // Multiple color palettes for variety
      const palettes = isDark
        ? [[270, 55, 72], [280, 50, 68], [260, 60, 76], [285, 45, 65], [255, 55, 78]]   // purples/lavenders
        : [[348, 65, 72], [355, 55, 75], [340, 70, 78], [10, 60, 73], [350, 50, 68]];    // pinks/corals
      const petalCounts = [5, 5, 5, 5, 5, 5, 4, 6]; // mostly 5, occasional 4 or 6

      treeDataRef.current.blossoms.forEach((b, idx) => {
        const palette = palettes[idx % palettes.length];
        const pc = petalCounts[idx % petalCounts.length];
        const h = posHash(b.x, b.y);
        drawFlower(ctxTarget, b.x, b.y, b.r * 1.4, palette[0] + (h - 0.5) * 10, palette[1], palette[2] + (h - 0.5) * 10, 0.85, pc);
      });
    }

    function drawGround(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      const g = ctxTarget.createLinearGradient(0, treeBaseY, 0, H);
      if (isDark) {
        g.addColorStop(0, "#2A2A20"); g.addColorStop(0.3, "#25251C"); g.addColorStop(1, "#1A1A14");
      } else {
        g.addColorStop(0, "#B8A88A"); g.addColorStop(0.3, "#A89878"); g.addColorStop(0.7, "#988868"); g.addColorStop(1, "#887858");
      }
      ctxTarget.fillStyle = g;
      ctxTarget.beginPath();
      ctxTarget.moveTo(0, treeBaseY - 8);
      ctxTarget.quadraticCurveTo(W * 0.25, treeBaseY - 20, W * 0.5, treeBaseY - 10);
      ctxTarget.quadraticCurveTo(W * 0.75, treeBaseY + 2, W, treeBaseY - 14);
      ctxTarget.lineTo(W, H); ctxTarget.lineTo(0, H); ctxTarget.closePath();
      ctxTarget.fill();
    }

    function drawHouse(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      const hx = houseX;
      const hy = houseY;
      const bodyW = 90;
      const bodyH = 70;
      const roofH = 45;

      // House shadow (cast by lamp from left)
      ctxTarget.save();
      ctxTarget.fillStyle = "rgba(0,0,0,0.06)";
      ctxTarget.beginPath();
      ctxTarget.moveTo(hx + bodyW, hy - bodyH);
      ctxTarget.lineTo(hx + bodyW + 15, hy - bodyH + 5);
      ctxTarget.lineTo(hx + bodyW + 15, hy + 5);
      ctxTarget.lineTo(hx + bodyW, hy);
      ctxTarget.closePath();
      ctxTarget.fill();
      ctxTarget.restore();

      // Body
      const bodyGrad = ctxTarget.createLinearGradient(0, hy - bodyH, 0, hy);
      if (isDark) {
        bodyGrad.addColorStop(0, "#3D3030"); bodyGrad.addColorStop(1, "#2A2020");
      } else {
        bodyGrad.addColorStop(0, "#E8DCC8"); bodyGrad.addColorStop(1, "#D4C8B0");
      }
      ctxTarget.fillStyle = bodyGrad;
      ctxTarget.fillRect(hx, hy - bodyH, bodyW, bodyH);
      ctxTarget.strokeStyle = isDark ? "#4A3A3A" : "#B8A888";
      ctxTarget.lineWidth = 1.5;
      ctxTarget.strokeRect(hx, hy - bodyH, bodyW, bodyH);

      // Roof
      ctxTarget.fillStyle = isDark ? "#4A2828" : "#8B4513";
      ctxTarget.beginPath();
      ctxTarget.moveTo(hx - 12, hy - bodyH);
      ctxTarget.lineTo(hx + bodyW / 2, hy - bodyH - roofH);
      ctxTarget.lineTo(hx + bodyW + 12, hy - bodyH);
      ctxTarget.closePath();
      ctxTarget.fill();
      ctxTarget.strokeStyle = isDark ? "#5A3535" : "#6B3410";
      ctxTarget.lineWidth = 1.5;
      ctxTarget.stroke();

      // Door
      ctxTarget.fillStyle = isDark ? "#5A3A2A" : "#8B6914";
      ctxTarget.fillRect(hx + bodyW / 2 - 10, hy - 32, 20, 32);
      ctxTarget.strokeStyle = isDark ? "#6B4A3A" : "#6B4A10";
      ctxTarget.lineWidth = 1;
      ctxTarget.strokeRect(hx + bodyW / 2 - 10, hy - 32, 20, 32);
      // Doorknob
      ctxTarget.fillStyle = "#D4A030";
      ctxTarget.beginPath();
      ctxTarget.arc(hx + bodyW / 2 + 5, hy - 16, 2.5, 0, Math.PI * 2);
      ctxTarget.fill();

      // Windows
      const windows = [
        { wx: hx + 15, wy: hy - bodyH + 20 },
        { wx: hx + bodyW - 35, wy: hy - bodyH + 20 },
      ];
      windows.forEach((win) => {
        // Window frame
        ctxTarget.fillStyle = isDark ? "#2A1A1A" : "#8B7355";
        ctxTarget.fillRect(win.wx, win.wy, 22, 20);
        ctxTarget.strokeStyle = isDark ? "#5A3A3A" : "#6B5335";
        ctxTarget.lineWidth = 1.5;
        ctxTarget.strokeRect(win.wx, win.wy, 22, 20);

        if (isDark) {
          // Glowing window effect
          const glowGrad = ctxTarget.createRadialGradient(win.wx + 11, win.wy + 10, 2, win.wx + 11, win.wy + 10, 30);
          glowGrad.addColorStop(0, "rgba(255,200,100,0.9)");
          glowGrad.addColorStop(0.5, "rgba(255,180,80,0.3)");
          glowGrad.addColorStop(1, "rgba(255,150,50,0)");
          ctxTarget.fillStyle = glowGrad;
          ctxTarget.fillRect(win.wx - 8, win.wy - 8, 38, 36);
        }

        // Window pane (warm light in dark mode)
        ctxTarget.fillStyle = isDark ? "rgba(255,200,130,0.7)" : "rgba(200,220,255,0.5)";
        ctxTarget.fillRect(win.wx + 2, win.wy + 2, 8, 16);
        ctxTarget.fillRect(win.wx + 12, win.wy + 2, 8, 16);
        // Cross bars
        ctxTarget.strokeStyle = isDark ? "#6B4A30" : "#6B5335";
        ctxTarget.lineWidth = 1;
        ctxTarget.beginPath();
        ctxTarget.moveTo(win.wx + 11, win.wy); ctxTarget.lineTo(win.wx + 11, win.wy + 20);
        ctxTarget.moveTo(win.wx, win.wy + 10); ctxTarget.lineTo(win.wx + 22, win.wy + 10);
        ctxTarget.stroke();

        // Window glow on ground in dark mode
        if (isDark) {
          const wgGrad = ctxTarget.createLinearGradient(0, hy, 0, hy + 30);
          wgGrad.addColorStop(0, "rgba(255,180,80,0.12)");
          wgGrad.addColorStop(1, "rgba(255,150,50,0)");
          ctxTarget.fillStyle = wgGrad;
          ctxTarget.fillRect(win.wx - 5, hy, 32, 30);
        }
      });
    }

    function drawStonePath(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      // Curving path from near tree base toward house door
      let ps = 555;
      const pr = () => { ps = (ps * 16807 + 0) % 2147483647; return (ps - 1) / 2147483646; };

      const startX = treeBaseX + 40;
      const startY = treeBaseY + 5;
      const endX = houseX + 45;
      const endY = houseY - 2;

      // Draw individual stones along a curve
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        // Curved path
        const cx1 = startX + (endX - startX) * 0.3;
        const cy1 = startY + 20;
        const cx2 = endX - (endX - startX) * 0.2;
        const cy2 = endY + 10;

        const bx = (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * endX;
        const by = (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * endY;

        const sx = bx + pr() * 8 - 4;
        const sy = by + pr() * 6 - 3;
        const sw = 7 + pr() * 7;
        const sh = 5 + pr() * 5;

        ctxTarget.fillStyle = isDark ? `rgba(80,75,65,${0.7 + pr() * 0.3})` : `rgba(160,150,140,${0.7 + pr() * 0.3})`;
        ctxTarget.strokeStyle = isDark ? "rgba(60,55,50,0.5)" : "rgba(140,130,120,0.5)";
        ctxTarget.lineWidth = 0.8;
        ctxTarget.beginPath();
        // Rounded stone shape
        ctxTarget.ellipse(sx, sy, sw / 2, sh / 2, pr() * 0.3, 0, Math.PI * 2);
        ctxTarget.fill();
        ctxTarget.stroke();
      }
    }

    function drawLamp(ctxTarget: CanvasRenderingContext2D, isDark: boolean) {
      const lx = lampX;
      const ly = lampY;

      // Lamp pole
      ctxTarget.strokeStyle = isDark ? "#5A5A50" : "#3A3A30";
      ctxTarget.lineWidth = 4;
      ctxTarget.beginPath();
      ctxTarget.moveTo(lx, ly);
      ctxTarget.lineTo(lx, ly - 80);
      ctxTarget.stroke();
      // Pole highlight
      ctxTarget.strokeStyle = isDark ? "#7A7A6A" : "#5A5A4A";
      ctxTarget.lineWidth = 1.5;
      ctxTarget.beginPath();
      ctxTarget.moveTo(lx + 1, ly);
      ctxTarget.lineTo(lx + 1, ly - 78);
      ctxTarget.stroke();

      // Lamp head
      ctxTarget.fillStyle = isDark ? "#3A3A32" : "#2A2A22";
      ctxTarget.fillRect(lx - 8, ly - 88, 16, 8);
      // Lamp glass
      ctxTarget.fillStyle = isDark ? "rgba(255,220,150,0.25)" : "rgba(255,240,200,0.15)";
      ctxTarget.fillRect(lx - 6, ly - 92, 12, 8);

      if (isDark) {
        // Lamp glow cone
        const lampGlow = ctxTarget.createRadialGradient(lx, ly - 88, 3, lx, ly + 10, 120);
        lampGlow.addColorStop(0, "rgba(255,220,140,0.35)");
        lampGlow.addColorStop(0.3, "rgba(255,200,100,0.15)");
        lampGlow.addColorStop(0.7, "rgba(255,160,60,0.03)");
        lampGlow.addColorStop(1, "rgba(255,100,30,0)");
        ctxTarget.fillStyle = lampGlow;
        ctxTarget.beginPath();
        ctxTarget.moveTo(lx - 40, ly);
        ctxTarget.lineTo(lx + 40, ly);
        ctxTarget.quadraticCurveTo(lx + 50, ly + 80, lx + 5, ly + 100);
        ctxTarget.quadraticCurveTo(lx, ly + 100, lx - 5, ly + 100);
        ctxTarget.quadraticCurveTo(lx - 50, ly + 80, lx - 40, ly);
        ctxTarget.fill();

        // Brighter center glow
        const centerGlow = ctxTarget.createRadialGradient(lx, ly - 88, 1, lx, ly - 80, 25);
        centerGlow.addColorStop(0, "rgba(255,240,180,0.8)");
        centerGlow.addColorStop(0.5, "rgba(255,200,120,0.25)");
        centerGlow.addColorStop(1, "rgba(255,150,60,0)");
        ctxTarget.fillStyle = centerGlow;
        ctxTarget.beginPath();
        ctxTarget.arc(lx, ly - 85, 22, 0, Math.PI * 2);
        ctxTarget.fill();

        // Lamp light on ground
        const groundGlow = ctxTarget.createRadialGradient(lx, ly, 0, lx, ly, 50);
        groundGlow.addColorStop(0, "rgba(255,200,120,0.2)");
        groundGlow.addColorStop(0.5, "rgba(255,180,80,0.08)");
        groundGlow.addColorStop(1, "rgba(255,150,40,0)");
        ctxTarget.fillStyle = groundGlow;
        ctxTarget.beginPath();
        ctxTarget.ellipse(lx, ly + 2, 50, 18, 0, 0, Math.PI * 2);
        ctxTarget.fill();
      }
    }

    // Build the static scene on the offscreen canvas
    function buildStaticScene(isDark: boolean) {
      if (lastIsDark === isDark && treeDataRef.current.built) return; // already cached
      lastIsDark = isDark;
      ensureTreeBuilt();
      drawSky(offCtx, isDark);
      drawGround(offCtx, isDark);
      drawStonePath(offCtx, isDark);
      drawLamp(offCtx, isDark);
      drawHouse(offCtx, isDark);
      drawTree(offCtx, isDark);
    }

    function drawFireflies(ts: number) {
      const t = ts * 0.001;
      const isDark = document.documentElement.classList.contains("dark");
      firefliesRef.current.forEach((f) => {
        f.x = f.baseX + Math.sin(t * f.speed + f.phase) * 35;
        f.y = f.baseY + Math.cos(t * f.speed * 1.3 + f.phase) * 30;
        f.alpha = 0.1 + Math.sin(t * 1.5 + f.phase) * 0.1 + Math.sin(t * 2.3 + f.phase * 1.7) * 0.07;
        const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
        const color = isDark
          ? `rgba(255,220,150,${f.alpha})`
          : `rgba(255,200,100,${f.alpha * 0.5})`;
        glow.addColorStop(0, color);
        glow.addColorStop(0.3, `rgba(255,200,100,${f.alpha * 0.25})`);
        glow.addColorStop(1, "rgba(255,200,100,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDark ? `rgba(255,240,200,${f.alpha * 1.5})` : `rgba(255,220,150,${f.alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function updatePetals(ts: number) {
      const t = ts * 0.001;
      const petals = petalsRef.current;
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.life++;
        p.x += p.vx * 0.55 + Math.sin(p.life * 0.03 + t * 0.15) * 0.3;
        p.y += p.vy * 0.55 + Math.cos(p.life * 0.02 + t) * 0.12;
        p.rot += p.rv * 0.5 + Math.sin(p.life * 0.04) * 0.012;
        const fadeIn = Math.min(1, p.life / 35);
        const fadeOut = 1 - Math.max(0, (p.life - p.maxLife * 0.5) / (p.maxLife * 0.5));
        const alpha = fadeIn * fadeOut;
        if (alpha <= 0.005) { petals.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        const isDark = document.documentElement.classList.contains("dark");
        ctx.fillStyle = isDark
          ? `hsl(${260 + p.hue * 0.15},50%,${p.light + 5}%)`
          : `hsl(${p.hue},${p.sat}%,${p.light}%)`;
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r * 0.7, -p.r * 0.5, p.r * 0.7, p.r * 0.3, 0, p.r * 0.8);
        ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.3, -p.r * 0.7, -p.r * 0.5, 0, -p.r);
        ctx.fill();
        ctx.restore();
        if (p.life > p.maxLife || p.y > H + 30) { petals.splice(i, 1); }
      }
    }

    function render(ts: number) {
      try {
        const isDark = document.documentElement.classList.contains("dark");

        // Rebuild static scene cache when theme changes
        buildStaticScene(isDark);

        // Blit static scene from offscreen canvas to main canvas
        ctx.drawImage(offscreen, 0, 0);

        // Draw dynamic elements on top
        drawStars(ctx, isDark);
        drawFireflies(ts);
        updatePetals(ts);

        // Debug: draw a small colored rectangle to confirm canvas works
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(W - 20, 10, 10, 10);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setCanvasDebug(`Render error: ${msg}`);
        cancelAnimationFrame(animId);
        return;
      }
      animId = requestAnimationFrame(render);
    }

    // Mouse petals — faster, more petals
    function onMouseMove(e: MouseEvent) {
      const now = performance.now();
      if (now - lastMouseRef.current < 50) return; // ~20 petals/sec
      lastMouseRef.current = now;
      const mx = e.clientX, my = e.clientY;
      const petals = petalsRef.current;
      // 2-3 petals per event
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        petals.push({
          x: mx + (Math.random() - 0.5) * 30,
          y: my + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.2 + Math.random() * 0.6,
          r: 3 + Math.random() * 7,
          rot: Math.random() * Math.PI * 2,
          rv: (Math.random() - 0.5) * 0.05,
          life: 0,
          maxLife: 130 + Math.random() * 140,
          hue: 340 + Math.random() * 30,
          sat: 55 + Math.random() * 35,
          light: 65 + Math.random() * 20,
        });
      }
      if (petals.length > 250) petals.splice(0, petals.length - 250);
    }

    // Ambient drifting petals
    const ambInterval = setInterval(() => {
      if (petalsRef.current.length > 250) return;
      petalsRef.current.push({
        x: W * 0.1 + Math.random() * W * 0.8,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.2 + Math.random() * 0.5,
        r: 3 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.03,
        life: 0,
        maxLife: 200 + Math.random() * 180,
        hue: 340 + Math.random() * 30,
        sat: 55 + Math.random() * 35,
        light: 65 + Math.random() * 20,
      });
    }, 1000);

    resize();
    buildFireflies();
    animId = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(ambInterval);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div id="entry-screen" className="fixed inset-0 z-[200] cursor-default bg-[#E8D5C8] dark:bg-[#0D0D1A]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {canvasDebug && (
        <div className="absolute bottom-4 left-4 z-[300] bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg font-mono">
          {canvasDebug}
        </div>
      )}
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-[18px] right-[18px] z-10 w-9 h-9 rounded-[10px] border border-black/8 dark:border-white/8 bg-white/50 dark:bg-[rgba(30,25,20,0.5)] backdrop-blur-[8px] cursor-pointer flex items-center justify-center text-[15px] text-[#666] dark:text-[#aaa] transition-transform hover:scale-[1.06]"
        title="切换主题"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      {/* Text overlay - top left */}
      <div className="absolute top-[8%] left-[6%] z-[250] pointer-events-none max-w-[380px]">
        <h1
          className="text-[48px] font-light tracking-[0.06em] mb-3 pointer-events-auto text-[#3D2C20] dark:text-[#D5C4B8]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", textShadow: "0 2px 16px rgba(255,255,255,0.6)" }}
        >
          Pulse
        </h1>
        <p className="text-[15px] text-[#8B7B6E] dark:text-[#9D8F82] leading-relaxed mb-8 pointer-events-auto">
          用数据与智能<br/>让每一次产品决策都温柔而坚定
        </p>
        <button
          onClick={handleEnter}
          className="px-[42px] py-[13px] rounded-3xl border-[1.5px] border-[rgba(150,120,100,0.25)] dark:border-[rgba(180,150,120,0.2)] bg-white/65 dark:bg-[rgba(30,25,20,0.65)] text-[#4D3028] dark:text-[#D5C4B8] text-sm font-medium cursor-pointer pointer-events-auto tracking-[0.04em] backdrop-blur-[8px] transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(100,70,40,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-white/90 dark:hover:bg-[rgba(40,35,28,0.85)]"
        >
          进入工作台
        </button>
      </div>
    </div>
  );
}
