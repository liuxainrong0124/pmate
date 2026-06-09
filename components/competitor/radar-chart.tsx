"use client";

interface RadarChartProps {
  dimensions: string[];
  yourScore: number[];
  competitorScore: number[];
  yourLabel?: string;
  competitorLabel?: string;
}

export function RadarChart({
  dimensions,
  yourScore,
  competitorScore,
  yourLabel = "我方",
  competitorLabel = "竞品",
}: RadarChartProps) {
  const cx = 150;
  const cy = 150;
  const maxR = 120;
  const levels = [2, 4, 6, 8, 10];
  const n = dimensions.length;
  if (n < 3) return null;

  const angleForIndex = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;

  const point = (angle: number, value: number) => {
    const r = (value / 10) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  };

  const polygonPoints = (scores: number[]) =>
    scores.map((s, i) => point(angleForIndex(i), s)).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="w-full h-auto max-w-[400px] mx-auto">
      {/* Concentric level polygons */}
      {levels.map((lvl) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const a = angleForIndex(i);
          const r = (lvl / 10) * maxR;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(" ");
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const a = angleForIndex(i);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(a)}
            y2={cy + maxR * Math.sin(a)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Competitor score polygon */}
      <polygon
        points={polygonPoints(competitorScore)}
        fill="rgba(239,68,68,0.15)"
        stroke="#ef4444"
        strokeWidth="2"
      />
      {competitorScore.map((s, i) => {
        const a = angleForIndex(i);
        const r = (s / 10) * maxR;
        return (
          <circle
            key={`comp-dot-${i}`}
            cx={cx + r * Math.cos(a)}
            cy={cy + r * Math.sin(a)}
            r="4"
            fill="#ef4444"
          />
        );
      })}

      {/* Your score polygon */}
      <polygon
        points={polygonPoints(yourScore)}
        fill="rgba(59,130,246,0.15)"
        stroke="#3b82f6"
        strokeWidth="2"
      />
      {yourScore.map((s, i) => {
        const a = angleForIndex(i);
        const r = (s / 10) * maxR;
        return (
          <circle
            key={`your-dot-${i}`}
            cx={cx + r * Math.cos(a)}
            cy={cy + r * Math.sin(a)}
            r="4"
            fill="#3b82f6"
          />
        );
      })}

      {/* Labels */}
      {dimensions.map((d, i) => {
        const a = angleForIndex(i);
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600"
            style={{ fontSize: "12px" }}
          >
            {d}
          </text>
        );
      })}

      {/* Score labels at level 2, 6, 10 */}
      <text x={cx} y={cy - (2 / 10) * maxR + 4} textAnchor="middle" className="fill-gray-300" style={{ fontSize: "9px" }}>
        2
      </text>
      <text x={cx} y={cy - (6 / 10) * maxR + 4} textAnchor="middle" className="fill-gray-300" style={{ fontSize: "9px" }}>
        6
      </text>
      <text x={cx} y={cy - (10 / 10) * maxR + 4} textAnchor="middle" className="fill-gray-300" style={{ fontSize: "9px" }}>
        10
      </text>

      {/* Legend */}
      <g transform="translate(20, 268)">
        <circle cx="6" cy="0" r="5" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="16" y="4" className="fill-gray-600" style={{ fontSize: "11px" }}>{yourLabel}</text>
        <circle cx="70" cy="0" r="5" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1.5" />
        <text x="80" y="4" className="fill-gray-600" style={{ fontSize: "11px" }}>{competitorLabel}</text>
      </g>
    </svg>
  );
}
