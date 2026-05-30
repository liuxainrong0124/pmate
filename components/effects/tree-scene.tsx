"use client";

import { useEffect, useRef } from "react";

/* ── types ── */

interface Branch {
  x: number; y: number;
  endX: number; endY: number;
  thickness: number;
  angle: number;
  depth: number;
  children: Branch[];
}

interface FoliageBlob {
  x: number; y: number;
  rx: number; ry: number;
  angle: number;
  hue: number;
  sat: number;
  light: number;
  alpha: number;
  layer: number; // 0=back, 2=front
}

interface Bud {
  x: number; y: number;
  worldX: number; worldY: number;
}

interface Blossom {
  x: number; y: number;
  size: number; growth: number; target: number;
  hue: number; petals: number;
  phase: number;
}

interface Sparkle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

interface LightSpot {
  x: number; y: number;
  r: number; alpha: number;
  phase: number;
}

/* ── tree generation ── */

function growBranch(
  x: number, y: number, angle: number,
  length: number, thickness: number, depth: number,
  allBranches: Branch[]
): Branch {
  const curveAngle = angle + (Math.random() - 0.5) * 0.25;
  const endX = x + Math.cos(curveAngle) * length;
  const endY = y + Math.sin(curveAngle) * length;

  const b: Branch = {
    x, y, endX, endY,
    thickness, angle: curveAngle,
    depth, children: [],
  };
  allBranches.push(b);

  if (depth <= 0) return b;

  const childCount = depth > 3 ? 2 : (depth > 1 ? (Math.random() < 0.35 ? 2 : 1) : 1);

  for (let c = 0; c < childCount; c++) {
    const t = 0.4 + c * 0.3;
    const bx = x + Math.cos(curveAngle) * length * t;
    const by = y + Math.sin(curveAngle) * length * t;

    const spreadAngle = 0.3 + Math.random() * 0.35;
    const sign = c === 0 ? 1 : -1;
    const childAngle = curveAngle + spreadAngle * sign * (0.7 + Math.random() * 0.5);

    const childLen = length * (0.55 + Math.random() * 0.25);
    const childThick = thickness * (0.55 + Math.random() * 0.2);

    b.children.push(
      growBranch(bx, by, childAngle, childLen, childThick, depth - 1, allBranches)
    );
  }

  return b;
}

/* ── component ── */

export function TreeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const mouse = { x: -999, y: -999 };
    let hasMouse = false;

    /* ── resize ── */
    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    const W = canvas.width;
    const H = canvas.height;

    /* ── tree params ── */
    const treeX = W * 0.63;
    const treeY = H * 0.82;
    const allBranches: Branch[] = [];
    const root = growBranch(treeX, treeY, -Math.PI / 2, H * 0.4, 26, 7, allBranches);

    /* ── foliage blobs (volumetric canopy) ── */
    const foliageBlobs: FoliageBlob[] = [];

    function addCanopyCluster(cx: number, cy: number, baseR: number, layer: number) {
      const count = 15 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * baseR * 0.7;
        const bx = cx + Math.cos(angle) * dist;
        const by = cy + Math.sin(angle) * dist * 0.6 - Math.random() * baseR * 0.3;
        const hue = 75 + Math.random() * 55;
        const sat = 35 + Math.random() * 35;
        const light = 28 + Math.random() * 25;
        foliageBlobs.push({
          x: bx, y: by,
          rx: baseR * (0.3 + Math.random() * 0.5),
          ry: baseR * (0.25 + Math.random() * 0.4),
          angle: Math.random() * Math.PI,
          hue, sat, light,
          alpha: 0.25 + Math.random() * 0.3,
          layer,
        });
      }
    }

    // Place canopy clusters at branch endpoints
    for (const br of allBranches) {
      if (br.depth <= 3) {
        const cx = br.endX + (Math.random() - 0.5) * 30;
        const cy = br.endY + (Math.random() - 0.5) * 20;
        const r = br.depth <= 1 ? 45 + Math.random() * 30 : 25 + Math.random() * 20;
        const layer = br.depth <= 1 ? 0 : br.depth <= 2 ? 1 : 2;
        addCanopyCluster(cx, cy, r, layer);
      }
    }

    // Extra clusters for density
    for (const br of allBranches) {
      if (br.depth <= 2 && br.depth > 0) {
        const midX = (br.x + br.endX) / 2;
        const midY = (br.y + br.endY) / 2;
        const perpX = Math.cos(br.angle + Math.PI / 2) * (20 + Math.random() * 35);
        const perpY = Math.sin(br.angle + Math.PI / 2) * (20 + Math.random() * 35);
        addCanopyCluster(midX + perpX, midY + perpY, 20 + Math.random() * 25, 1);
      }
    }

    /* ── buds (mouse-interactive points) ── */
    const buds: Bud[] = [];
    for (const br of allBranches) {
      if (br.depth <= 4) {
        const steps = br.depth <= 2 ? 5 : 3;
        for (let s = 0; s < steps; s++) {
          const t = 0.15 + (s / steps) * 0.8;
          const bx = br.x + (br.endX - br.x) * t + (Math.random() - 0.5) * 10;
          const by = br.y + (br.endY - br.y) * t + (Math.random() - 0.5) * 10;
          buds.push({ x: bx, y: by, worldX: bx, worldY: by });
        }
      }
    }

    /* ── dynamic state ── */
    const blossoms: Blossom[] = [];
    const sparkles: Sparkle[] = [];
    const activeBuds = new Set<number>();

    /* ── light spots (dappled light under tree) ── */
    const lightSpots: LightSpot[] = [];
    for (let i = 0; i < 25; i++) {
      lightSpots.push({
        x: treeX - 180 + Math.random() * 360,
        y: treeY - 350 + Math.random() * 400,
        r: 8 + Math.random() * 20,
        alpha: 0.03 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* ── floating ambient particles ── */
    interface Floater { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number; }
    const floaters: Floater[] = [];
    for (let i = 0; i < 50; i++) {
      floaters.push({
        x: treeX - 250 + Math.random() * 500,
        y: treeY - 400 + Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        size: 1 + Math.random() * 2,
        opacity: 0.15 + Math.random() * 0.3,
        hue: 40 + Math.random() * 50,
      });
    }

    /* ── drawing helpers ── */

    function drawTrunk(br: Branch, sway: number) {
      if (!ctx) return;

      const sx = br.x + Math.sin(sway * (br.depth * 0.12)) * 1.5;
      const sy = br.y;
      const ex = br.endX + Math.sin(sway * (br.depth * 0.14 + 0.4)) * 2;
      const ey = br.endY;

      // Shadow side (darker)
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo((sx + ex) / 2 + Math.sin(sway * 0.4 + br.angle) * 6, (sy + ey) / 2, ex, ey);
      ctx.strokeStyle = `hsl(22, 35%, ${14 + br.depth * 2.5}%)`;
      ctx.lineWidth = br.thickness;
      ctx.lineCap = "round";
      ctx.stroke();

      // Highlight side (lighter, offset)
      const perpAngle = br.angle + Math.PI / 2;
      const hlOff = br.thickness * 0.22;
      const hlx = Math.cos(perpAngle) * hlOff;
      const hly = Math.sin(perpAngle) * hlOff;

      ctx.beginPath();
      ctx.moveTo(sx + hlx, sy + hly);
      ctx.quadraticCurveTo(
        (sx + ex) / 2 + Math.sin(sway * 0.4 + br.angle) * 6 + hlx,
        (sy + ey) / 2 + hly,
        ex + hlx, ey + hly
      );
      ctx.strokeStyle = `hsla(28, 30%, ${28 + br.depth * 2.5}%, 0.55)`;
      ctx.lineWidth = br.thickness * 0.55;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bark texture lines
      if (br.thickness > 3) {
        const grainCount = Math.floor(br.thickness / 3);
        for (let g = 0; g < grainCount; g++) {
          const t = (g / (grainCount - 1) - 0.5) * br.thickness * 0.5;
          const gx = Math.cos(perpAngle) * t;
          const gy = Math.sin(perpAngle) * t;

          ctx.beginPath();
          ctx.moveTo(sx + gx, sy + gy);
          ctx.quadraticCurveTo(
            (sx + ex) / 2 + Math.sin(sway * 0.4 + br.angle) * 6 + gx,
            (sy + ey) / 2 + gy,
            ex + gx, ey + gy
          );
          ctx.strokeStyle = `hsla(20, 25%, ${10 + br.depth * 2}%, 0.2)`;
          ctx.lineWidth = 0.5 + Math.random() * 0.3;
          ctx.stroke();
        }
      }

      // Children
      for (const child of br.children) {
        drawTrunk(child, sway);
      }
    }

    function drawRoots() {
      if (!ctx) return;
      const baseX = treeX;
      const baseY = treeY;
      const rootCount = 5;

      for (let i = 0; i < rootCount; i++) {
        const spreadAngle = -Math.PI / 2 + (i - (rootCount - 1) / 2) * 0.25;
        const len = 40 + Math.random() * 50;
        const endX = baseX + Math.cos(spreadAngle) * len;
        const endY = baseY + Math.sin(spreadAngle) * len + 15;

        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          baseX + Math.cos(spreadAngle) * len * 0.6,
          baseY + 10,
          endX, endY
        );
        ctx.strokeStyle = `hsl(22, 30%, 18%)`;
        ctx.lineWidth = 3 + Math.random() * 4;
        ctx.lineCap = "round";
        ctx.stroke();

        // Thinner root branches
        if (Math.random() < 0.6) {
          const subAngle = spreadAngle + (Math.random() - 0.5) * 0.3;
          const subLen = len * 0.5;
          const subX = baseX + Math.cos(spreadAngle) * len * 0.5;
          const subY = baseY + 8;
          ctx.beginPath();
          ctx.moveTo(subX, subY);
          ctx.quadraticCurveTo(subX + Math.cos(subAngle) * subLen * 0.5, subY + 8, subX + Math.cos(subAngle) * subLen, subY + Math.sin(subAngle) * subLen + 10);
          ctx.strokeStyle = `hsl(22, 28%, 16%)`;
          ctx.lineWidth = 1 + Math.random() * 1.5;
          ctx.stroke();
        }
      }
    }

    function drawBackground() {
      if (!ctx || !canvas) return;
      // Soft warm gradient
      const grad = ctx.createRadialGradient(W * 0.55, H * 0.4, 50, W * 0.5, H * 0.5, W * 0.95);
      grad.addColorStop(0, "#fefdfc");
      grad.addColorStop(0.35, "#faf7f2");
      grad.addColorStop(0.7, "#f2ede4");
      grad.addColorStop(1, "#e5dfd4");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    function drawGround() {
      if (!ctx || !canvas) return;
      const gy = canvas.height * 0.81;

      // Tree shadow on ground
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(treeX, gy + 15, 120, 25, 0, 0, Math.PI * 2);
      const shadowGrad = ctx.createRadialGradient(treeX, gy + 15, 20, treeX, gy + 15, 120);
      shadowGrad.addColorStop(0, "rgba(80,60,40,0.15)");
      shadowGrad.addColorStop(1, "rgba(80,60,40,0)");
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // Ground plane
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 0; x <= canvas.width; x += 15) {
        ctx.lineTo(x, gy + Math.sin(x * 0.006) * 6 + Math.cos(x * 0.012) * 3);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();

      const gg = ctx.createLinearGradient(0, gy, 0, canvas.height);
      gg.addColorStop(0, "#dcd4c8");
      gg.addColorStop(0.5, "#d0c7b9");
      gg.addColorStop(1, "#c4b9a8");
      ctx.fillStyle = gg;
      ctx.fill();
    }

    function drawFoliage() {
      if (!ctx) return;

      // Sort by layer (back to front) then by y (top to bottom within layer)
      const sorted = [...foliageBlobs].sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer;
        return a.y - b.y;
      });

      for (const fb of sorted) {
        ctx.save();
        ctx.translate(fb.x, fb.y);
        ctx.rotate(fb.angle);

        // Soft foliage blob with shadowBlur for organic edges
        ctx.beginPath();
        ctx.ellipse(0, 0, fb.rx, fb.ry, 0, 0, Math.PI * 2);

        // Base color
        const baseGrad = ctx.createRadialGradient(0, -fb.ry * 0.2, fb.rx * 0.1, 0, 0, fb.rx);
        baseGrad.addColorStop(0, `hsla(${fb.hue + 15}, ${fb.sat}%, ${fb.light + 12}%, ${fb.alpha})`);
        baseGrad.addColorStop(0.6, `hsla(${fb.hue}, ${fb.sat}%, ${fb.light}%, ${fb.alpha})`);
        baseGrad.addColorStop(1, `hsla(${fb.hue - 8}, ${fb.sat - 5}%, ${fb.light - 8}%, ${fb.alpha * 0.6})`);
        ctx.fillStyle = baseGrad;
        ctx.fill();

        // Subtle edge highlight
        ctx.beginPath();
        ctx.ellipse(-fb.rx * 0.25, -fb.ry * 0.3, fb.rx * 0.4, fb.ry * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${fb.hue + 20}, ${fb.sat}%, ${fb.light + 18}%, ${fb.alpha * 0.3})`;
        ctx.fill();

        ctx.restore();
      }
    }

    function drawDappledLight() {
      if (!ctx) return;
      for (const ls of lightSpots) {
        const pulse = Math.sin(time * 0.8 + ls.phase) * 0.5 + 0.5;
        const alpha = ls.alpha * (0.5 + pulse * 0.5);
        ctx.beginPath();
        ctx.arc(ls.x, ls.y, ls.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,250,235,${alpha})`;
        ctx.fill();
      }
    }

    function drawBlossom(b: Blossom) {
      if (!ctx || b.growth < 0.01) return;
      const t = easeOut(b.growth);
      if (t < 0.005) return;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.phase);

      // Outer glow
      ctx.beginPath();
      ctx.arc(0, 0, b.size * t * 0.7, 0, Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(0, 0, b.size * t * 0.1, 0, 0, b.size * t * 0.7);
      glowGrad.addColorStop(0, `rgba(255,240,245,0.6)`);
      glowGrad.addColorStop(1, `rgba(255,200,220,0)`);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Watercolor petals
      for (let p = 0; p < b.petals; p++) {
        const a = (Math.PI * 2 * p) / b.petals;
        const r = b.size * t * 0.45;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;

        // Blob layer
        for (let l = 0; l < 4; l++) {
          const ox = px + (l - 1.5) * r * 0.25;
          const oy = py + (Math.random() - 0.5) * r * 0.3;
          ctx.beginPath();
          ctx.arc(ox, oy, b.size * t * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${b.hue}, 50%, 82%, ${t * 0.35})`;
          ctx.fill();
        }

        // Defined petal
        ctx.beginPath();
        ctx.ellipse(px * 0.55, py * 0.55, b.size * t * 0.28, b.size * t * 0.18, a, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${b.hue}, 55%, 80%, ${t * 0.6})`;
        ctx.fill();
      }

      // Center
      ctx.beginPath();
      ctx.arc(0, 0, b.size * t * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(42, 70%, 68%, ${t * 0.85})`;
      ctx.fill();

      ctx.restore();
    }

    function drawSparkle(s: Sparkle) {
      if (!ctx) return;
      const alpha = s.life / s.maxLife;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,250,240,${alpha * 0.7})`;
      ctx.fill();
    }

    function drawFloater(f: Floater) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue}, 40%, 70%, ${f.opacity})`;
      ctx.fill();
    }

    /* ── sun rays ── */
    function drawSunRays() {
      if (!ctx || !canvas) return;
      const sx = canvas.width * 0.88;
      const sy = -20;
      for (let i = 0; i < 6; i++) {
        const angle = -0.25 + i * 0.07;
        const endX = sx + Math.cos(angle) * canvas.width * 0.75;
        const endY = sy + Math.sin(angle) * canvas.height * 0.55;
        const grad = ctx.createLinearGradient(sx, sy, endX, endY);
        grad.addColorStop(0, "rgba(255,252,245,0.05)");
        grad.addColorStop(1, "rgba(255,252,245,0)");
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(endX, endY);
        ctx.lineTo(endX + 50, endY + 50);
        ctx.lineTo(sx + 50, sy);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    /* ── animate ── */
    function animate() {
      if (!ctx || !canvas) return;
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground();
      drawSunRays();
      drawDappledLight();

      const sway = Math.sin(time * 0.25) * 0.4;

      // Foliage gentle sway
      for (const fb of foliageBlobs) {
        fb.x += Math.sin(time * 0.35 + fb.y * 0.008) * 0.12;
        fb.y += Math.cos(time * 0.3 + fb.x * 0.007) * 0.08;
      }

      drawGround();
      drawRoots();
      drawFoliage();
      drawTrunk(root, sway);

      // Dappled light on top of foliage
      drawDappledLight();

      // Floaters
      for (const fp of floaters) {
        fp.x += fp.vx + Math.sin(time * 0.6 + fp.y * 0.01) * 0.15;
        fp.y += fp.vy;
        if (fp.y < canvas.height * 0.2 || fp.x < treeX - 350 || fp.x > treeX + 350) {
          fp.y = treeY - 100 + Math.random() * 350;
          fp.x = treeX - 250 + Math.random() * 500;
        }
        fp.opacity = 0.12 + Math.sin(time * 1.3 + fp.x * 0.01) * 0.08;
        drawFloater(fp);
      }

      // Blossoms
      for (let i = blossoms.length - 1; i >= 0; i--) {
        const b = blossoms[i];
        b.growth += (b.target - b.growth) * 0.06;
        if (b.target === 0 && b.growth < 0.01) {
          blossoms.splice(i, 1);
        } else {
          drawBlossom(b);
        }
      }

      // Sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.016;
        if (s.life <= 0) {
          sparkles.splice(i, 1);
        } else {
          drawSparkle(s);
        }
      }

      // Mouse interaction
      if (hasMouse) {
        const newActive = new Set<number>();
        for (let i = 0; i < buds.length; i++) {
          const bud = buds[i];
          const dist = Math.hypot(bud.worldX - mouse.x, bud.worldY - mouse.y);
          if (dist < 60) {
            newActive.add(i);
            if (!activeBuds.has(i) && blossoms.length < 300 && Math.random() < 0.25) {
              blossoms.push({
                x: bud.worldX + (Math.random() - 0.5) * 20,
                y: bud.worldY + (Math.random() - 0.5) * 20,
                size: 9 + Math.random() * 15,
                growth: 0, target: 1,
                hue: 335 + Math.random() * 45,
                petals: 5 + Math.floor(Math.random() * 4),
                phase: Math.random() * Math.PI * 2,
              });

              for (let s = 0; s < 3; s++) {
                sparkles.push({
                  x: bud.worldX, y: bud.worldY,
                  vx: (Math.random() - 0.5) * 0.6,
                  vy: -(0.4 + Math.random() * 0.8),
                  life: 1 + Math.random() * 1.5,
                  maxLife: 1.5,
                  size: 1 + Math.random() * 2.5,
                });
              }
            }
          }
        }

        // Fade blossoms far from mouse
        const prevActive = activeBuds;
        prevActive.forEach((idx) => {
          if (!newActive.has(idx)) {
            for (const b of blossoms) {
              if (b.target === 1) {
                const bud = buds[idx];
                if (bud && Math.hypot(b.x - bud.worldX, b.y - bud.worldY) < 2.5) b.target = 0;
              }
            }
          }
        });

        activeBuds.clear();
        newActive.forEach((idx) => activeBuds.add(idx));
      } else {
        // No mouse - fade all
        if (activeBuds.size > 0) {
          for (const b of blossoms) {
            if (b.target === 1) b.target = 0;
          }
          activeBuds.clear();
        }
      }

      // Limit
      while (blossoms.length > 250) blossoms.shift();
      while (sparkles.length > 80) sparkles.shift();

      animId = requestAnimationFrame(animate);
    }

    /* ── events ── */
    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      hasMouse = true;
    }
    function onMouseLeave() { hasMouse = false; }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
