"use client";

const GARLAND_COLORS = ["#FFD6E0", "#EDD6FF", "#FFF3D6", "#D6F0FF", "#D6FFE8", "#FFE8D6"];

interface GarlandProps {
  position?: "fixed" | "absolute";
  top?: number;
  zIndex?: number;
}

export default function Garland({ position = "fixed", top = 0, zIndex = 30 }: GarlandProps) {
  const triangles = Array.from({ length: 14 });
  return (
    <svg
      style={{ position, top, left: 0, width: "100%", overflow: "visible", pointerEvents: "none", zIndex }}
      height="40"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
    >
      <path
        d={`M0,8 ${triangles.map((_, i) => {
          const x = (i + 0.5) * (1200 / triangles.length);
          return `Q${x},28 ${(i + 1) * (1200 / triangles.length)},8`;
        }).join(" ")}`}
        stroke="#c94a6a" strokeWidth="1.5" fill="none" opacity="0.6"
      />
      {triangles.map((_, i) => {
        const x = i * (1200 / triangles.length), w = 1200 / triangles.length, cx = x + w / 2;
        return (
          <polygon key={i}
            points={`${cx - w * 0.35},10 ${cx + w * 0.35},10 ${cx},34`}
            fill={GARLAND_COLORS[i % GARLAND_COLORS.length]}
            stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}