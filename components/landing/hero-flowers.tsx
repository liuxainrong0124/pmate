"use client";

import { useMemo } from "react";

function makeRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const darkGreens  = ["#0d3316","#10401c","#124a20","#14532d","#0f3d1a","#114822","#0b2d13"];
const midGreens   = ["#166534","#15803d","#1a5c32","#1b6e35","#19632f","#1c7034","#187130"];
const lightGreens = ["#22c55e","#16a34a","#20803e","#248a42","#2d8a48","#269040","#20b050"];
const highlightGreens = ["#4ade80","#86efac","#6ee7a0","#55d975","#3cd36a","#90f0b0"];

// ── Leaf dot data structure ──
interface LeafDot {
  x: number; y: number;
  rx: number; ry: number;
  rot: number;
  fill: string;
  opacity: number;
}

// ── Check if a point is inside a polygon (for canopy outline) ──
function pointInPolygon(px: number, py: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Dense canopy generation using a single unified outline ──
function generateDenseCanopy(rng: () => number): LeafDot[] {
  const dots: LeafDot[] = [];

  // Single unified canopy outline — defines the tree crown as ONE continuous shape
  const outline: [number, number][] = [
    // Start bottom-left, go clockwise
    [50, 310],
    [70, 330],
    [105, 345],
    [145, 350],
    [190, 348],
    [240, 340],
    [285, 335],
    [320, 338],
    [355, 335],
    [390, 338],
    [435, 340],
    [480, 345],
    [525, 342],
    [570, 332],
    [610, 315],
    [635, 290],
    [645, 260],
    [638, 230],
    [625, 200],
    [600, 170],
    [570, 145],
    [535, 122],
    [495, 105],
    [450, 92],
    [400, 82],
    [350, 78],
    [300, 80],
    [255, 88],
    [215, 100],
    [180, 118],
    [145, 140],
    [115, 165],
    [90, 195],
    [68, 228],
    [52, 262],
    [48, 285],
  ];

  // Bounding box
  const minX = 48, maxX = 645, minY = 78, maxY = 350;

  // Fill the outline with dense leaf dots using rejection sampling
  const targetCount = 3500;
  let attempts = 0;
  while (dots.length < targetCount && attempts < targetCount * 3) {
    attempts++;
    const x = minX + rng() * (maxX - minX);
    const y = minY + rng() * (maxY - minY);

    if (!pointInPolygon(x, y, outline)) continue;

    // Compute approximate distance to edge (using distance to nearest outline segment)
    let minDist = Infinity;
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const x1 = outline[i][0], y1 = outline[i][1];
      const x2 = outline[j][0], y2 = outline[j][1];
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = ((x - x1) * dx + (y - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const nx = x1 + t * dx;
      const ny = y1 + t * dy;
      const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
      if (dist < minDist) minDist = dist;
    }

    const edgeDist = Math.min(1, minDist / 30); // normalize: 0=edge, 1=30px from edge

    // Size: smaller at edges, larger in interior
    const baseSize = 2 + rng() * 5;
    const edgeFactor = 0.3 + edgeDist * 0.7;
    const rxLeaf = baseSize * edgeFactor * (0.7 + rng() * 0.6);
    const ryLeaf = rxLeaf * 0.32 * (0.8 + rng() * 0.4);

    // Color layers: lighter at top/right, darker at bottom
    const yNorm = (y - minY) / (maxY - minY);
    const lightBias = rng();

    let fill: string;
    if (lightBias > 0.88) {
      fill = highlightGreens[Math.floor(rng() * highlightGreens.length)];
    } else if (lightBias > 0.5 + yNorm * 0.25) {
      fill = lightGreens[Math.floor(rng() * lightGreens.length)];
    } else if (lightBias > 0.2 + yNorm * 0.35) {
      fill = midGreens[Math.floor(rng() * midGreens.length)];
    } else {
      fill = darkGreens[Math.floor(rng() * darkGreens.length)];
    }

    const opacity = 0.4 + rng() * 0.45;
    const rot = rng() * 160 - 80;

    dots.push({ x, y, rx: rxLeaf, ry: ryLeaf, rot, fill, opacity });
  }

  return dots;
}

// ── A single leaf ellipse (tiny, part of the dense canopy) ──
function LeafDot({ d }: { d: LeafDot }) {
  return (
    <ellipse
      cx={d.x} cy={d.y}
      rx={d.rx} ry={d.ry}
      fill={d.fill}
      opacity={d.opacity}
      transform={`rotate(${d.rot}, ${d.x}, ${d.y})`}
    />
  );
}

export function HeroTree() {
  const canopy = useMemo(() => generateDenseCanopy(makeRng(42)), []);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: "50%", bottom: "2%", transform: "translateX(-50%)", zIndex: 3 }}
    >
      <svg
        width="750"
        height="750"
        viewBox="0 0 690 690"
        style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.06))" }}
      >
        <style>{`
          @keyframes rustle1 { 0%,100%{transform:translate(0,0)} 35%{transform:translate(2px,-3px)} 65%{transform:translate(-1px,-1px)} }
          @keyframes rustle2 { 0%,100%{transform:translate(0,0)} 30%{transform:translate(-2px,-2px)} 60%{transform:translate(2px,-3px)} }
          @keyframes rustle3 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-1px,-3px)} 60%{transform:translate(2px,-1px)} }
        `}</style>

        {/* ── TRUNK ── */}
        <path d="M328,680 Q324,565 317,460 Q310,360 321,272 Q328,212 333,172" stroke="#3d1f0a" strokeWidth="32" fill="none" strokeLinecap="round" />
        <path d="M340,680 Q344,565 352,460 Q358,360 346,272 Q340,212 336,172" stroke="#5c3616" strokeWidth="19" fill="none" strokeLinecap="round" opacity={0.72} />
        {/* Trunk texture lines */}
        <path d="M324,515 Q333,445 331,385" stroke="#4a2810" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.48} />
        <path d="M344,475 Q336,405 338,345" stroke="#4a2810" strokeWidth="6" fill="none" strokeLinecap="round" opacity={0.38} />
        <path d="M329,600 Q335,540 332,500" stroke="#4a2810" strokeWidth="7" fill="none" strokeLinecap="round" opacity={0.4} />

        {/* ── ROOTS ── */}
        <path d="M310,655 Q278,662 238,667 Q216,670 206,680" stroke="#3d1f0a" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M354,655 Q384,662 424,667 Q446,670 456,680" stroke="#3d1f0a" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M320,662 Q300,670 284,678" stroke="#3d1f0a" strokeWidth="10" fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M346,662 Q364,670 380,678" stroke="#3d1f0a" strokeWidth="10" fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M304,660 Q268,668 248,680" stroke="#3d1f0a" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.5} />
        <path d="M360,660 Q396,668 416,680" stroke="#3d1f0a" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.5} />

        {/* ── BRANCHES ── */}
        <path d="M320,370 Q258,298 188,234 Q138,178 98,132" stroke="#3d1f0a" strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d="M344,330 Q414,258 492,214 Q542,178 582,140" stroke="#3d1f0a" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M317,422 Q248,376 178,346 Q128,326 78,306" stroke="#3d1f0a" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M347,392 Q422,346 492,326 Q542,312 588,296" stroke="#3d1f0a" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M322,300 Q258,244 198,194 Q158,158 128,120" stroke="#4a2810" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M343,270 Q402,214 462,174 Q512,146 550,118" stroke="#4a2810" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M314,240 Q258,184 208,140" stroke="#4a2810" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M350,220 Q402,164 452,126" stroke="#4a2810" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M318,198 Q274,150 238,116" stroke="#4a2810" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M347,182 Q386,136 422,106" stroke="#4a2810" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        {/* Sub-branches */}
        <path d="M262,298 Q228,274 198,250" stroke="#5c3616" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M422,262 Q456,238 486,216" stroke="#5c3616" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M222,348 Q178,324 148,314" stroke="#5c3616" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M452,322 Q492,298 522,280" stroke="#5c3616" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M192,238 Q158,214 133,196" stroke="#5c3616" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M482,212 Q512,186 537,173" stroke="#5c3616" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M332,148 Q308,116 288,100" stroke="#5c3616" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M338,126 Q358,96 378,82" stroke="#5c3616" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* ── CANOPY BASE SILHOUETTE — solid shape so it always reads as one mass ── */}
        <path
          d="M50,310 L70,330 L105,345 L145,350 L190,348 L240,340 L285,335 L320,338 L355,335 L390,338 L435,340 L480,345 L525,342 L570,332 L610,315 L635,290 L645,260 L638,230 L625,200 L600,170 L570,145 L535,122 L495,105 L450,92 L400,82 L350,78 L300,80 L255,88 L215,100 L180,118 L145,140 L115,165 L90,195 L68,228 L52,262 L48,285 Z"
          fill="#0d3316"
          opacity={0.82}
        />
        {/* Inner highlight — lighter green on right/top side */}
        <path
          d="M330,85 L370,82 L415,88 L455,100 L490,118 L525,142 L555,172 L580,205 L600,240 L612,275 L610,300 L590,320 L555,330 L510,336 L460,338 L410,340 L360,338 L320,340 L290,338 L260,330 L225,318 L195,308 L170,300 L150,285 L135,260 L130,230 L140,198 L160,170 L190,145 L220,125 L260,108 L300,95 Z"
          fill="#166534"
          opacity={0.5}
        />
        {/* Edge highlight for depth */}
        <path
          d="M350,88 L410,92 L460,105 L505,125 L545,152 L575,185 L600,222 L612,262 L608,285 L590,305 L555,318 L510,325 L460,328 L410,330 L360,330 L320,332 L280,328 L240,318 L200,305 L170,292 L145,270 L130,245 L135,215 L155,185 L185,158 L220,135 L265,115 L310,100 Z"
          fill="#15803d"
          opacity={0.28}
        />

        {/* ── DENSE LEAF DOTS — 3500+ tiny ellipses for texture ── */}
        <g style={{ animation: "rustle1 4s ease-in-out infinite" }}>
          {canopy.map((d, i) => (
            <LeafDot key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}
