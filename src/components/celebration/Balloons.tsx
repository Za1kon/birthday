"use client";

import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/lib/hooks";
import { playPopSound } from "@/lib/audio";

const BALLOON_COLORS = [
  { color: "#FFD6E0", highlight: "#fff0f4", knot: "#c94a6a" },
  { color: "#D6F0FF", highlight: "#edf8ff", knot: "#2e7eaa" },
  { color: "#D6FFE8", highlight: "#edfff4", knot: "#2e8a55" },
  { color: "#FFF3D6", highlight: "#fffaed", knot: "#b37a00" },
  { color: "#EDD6FF", highlight: "#f8eeff", knot: "#7a2eb3" },
  { color: "#FFE8D6", highlight: "#fff4ed", knot: "#b35a00" },
];

const BALLOON_CONFIG_DESKTOP = [
  { left:  "3%", size: 70, delay: 0,   duration:  8, drift:  8 },
  { left:  "8%", size: 55, delay: 2,   duration:  6, drift: -6 },
  { left: "88%", size: 65, delay: 1,   duration:  9, drift: -9 },
  { left: "93%", size: 50, delay: 3.5, duration:  7, drift:  7 },
  { left: "15%", size: 45, delay: 5,   duration: 11, drift:  5 },
  { left: "80%", size: 60, delay: 1.5, duration:  8, drift: -5 },
  { left:  "6%", size: 58, delay: 6,   duration:  6, drift: -8 },
  { left: "85%", size: 48, delay: 2.5, duration: 10, drift:  6 },
];

const BALLOON_CONFIG_MOBILE = [
  { left:  "0%", size: 40, delay: 0,   duration:  7, drift:  4 },
  { left:  "4%", size: 34, delay: 3,   duration:  6, drift: -3 },
  { left: "82%", size: 38, delay: 1.5, duration:  9, drift: -4 },
  { left: "88%", size: 30, delay: 4,   duration:  7, drift:  3 },
];

// Pop effect: canvas-based so we avoid spawning 12+ divs per pop
function BalloonPop({ x, y, color, onDone }: { x: number; y: number; color: string; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const SIZE = 140;
    canvas.width = SIZE; canvas.height = SIZE;

    const particles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const dist  = 35 + Math.random() * 35;
      return { dx: Math.cos(angle)*dist, dy: Math.sin(angle)*dist, size: 4+Math.random()*6, p: 0 };
    });

    let start: number | null = null;
    const duration = 800;
    let raf: number;

    const draw = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      ctx.clearRect(0, 0, SIZE, SIZE);

      // ring
      ctx.beginPath();
      ctx.arc(SIZE/2, SIZE/2, 30 * t * 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 3 * (1 - t);
      ctx.globalAlpha = 1 - t;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // particles
      for (const p of particles) {
        const ease = 1 - Math.pow(1 - t, 2);
        const px = SIZE/2 + p.dx * ease;
        const py = SIZE/2 + p.dy * ease;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 - t * 0.8) / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // "pop!" text
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.fillStyle = color;
      ctx.font = "bold 16px 'Lilita One', cursive";
      ctx.textAlign = "center";
      ctx.fillText("pop!", SIZE/2, SIZE/2 - 20 * t - 10);
      ctx.globalAlpha = 1;

      if (t < 1) { raf = requestAnimationFrame(draw); }
      else { onDone(); }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [color, onDone]);

  return (
    <canvas ref={canvasRef} style={{
      position:"fixed", left: x - 70, top: y - 70,
      pointerEvents:"none", zIndex:200,
    }}/>
  );
}

function Balloon({ left, size, delay, duration, drift, colorIndex, onPop }: {
  left: string; size: number; delay: number; duration: number; drift: number; colorIndex: number; onPop?: () => void;
}) {
  const c = BALLOON_COLORS[colorIndex % BALLOON_COLORS.length];
  const stringLen = size * 1.4;
  const svgW = Math.abs(drift) + 4;
  const [popPos, setPopPos] = useState<{x:number;y:number}|null>(null);
  const balloonRef = useRef<HTMLDivElement>(null);
  const poppedRef  = useRef(false);

  const doPop = (x: number, y: number) => {
    if (poppedRef.current) return;
    poppedRef.current = true;
    playPopSound();
    onPop?.();
    setPopPos({ x, y });
    setTimeout(() => { poppedRef.current = false; }, 1700);
  };

  useEffect(() => {
    const el = balloonRef.current; if (!el) return;
    let sx=0, sy=0;
    const onTs = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      // Only register touch if it's in the balloon area (top portion), not the string
      if (e.touches[0].clientY > rect.top + size * 1.15 + 14) return;
      sx=e.touches[0].clientX; sy=e.touches[0].clientY; e.preventDefault();
    };
    const onTe = (e: TouchEvent) => {
      if (!sx && !sy) return;
      e.preventDefault();
      if (Math.abs(e.changedTouches[0].clientX-sx)<15 && Math.abs(e.changedTouches[0].clientY-sy)<15)
        doPop(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      sx=0; sy=0;
    };
    el.addEventListener("touchstart", onTs, { passive:false });
    el.addEventListener("touchend",   onTe, { passive:false });
    return () => { el.removeEventListener("touchstart",onTs); el.removeEventListener("touchend",onTe); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  if (popPos) {
    return (
      <>
        <BalloonPop x={popPos.x} y={popPos.y} color={c.color} onDone={() => setPopPos(null)} />
        {/* Falling string */}
        <div style={{ position:"fixed", left:popPos.x, top:popPos.y,
          pointerEvents:"none", zIndex:100, animation:"stringFall 1.5s ease-in forwards" }}>
          <svg width={svgW+10} height={stringLen} overflow="visible" viewBox={`0 0 ${svgW+10} ${stringLen}`}>
            <path d={`M${(svgW+10)/2},0 Q${drift>0?svgW+10:0},${stringLen/2} ${(svgW+10)/2},${stringLen}`}
              stroke={c.knot+"cc"} strokeWidth="2" fill="none"/>
          </svg>
        </div>
      </>
    );
  }

  return (
    <div ref={balloonRef} style={{
      position:"fixed", left, bottom:"-200px",
      display:"flex", flexDirection:"column", alignItems:"center",
      animation:`balloonRise ${duration}s ${delay}s ease-in-out infinite`,
      zIndex:30, contain:"layout style", touchAction:"none",
    }}>
      <div onClick={(e) => doPop(e.clientX, e.clientY)} style={{
        width:size, height:size*1.15,
        background:`radial-gradient(circle at 35% 35%, ${c.highlight} 0%, ${c.color} 60%)`,
        borderRadius:"50% 50% 45% 45%", position:"relative",
        filter:`drop-shadow(0 4px 8px ${c.knot}33)`,
        cursor:"pointer",
      }}>
        <div style={{ position:"absolute", top:"15%", left:"22%", width:"22%", height:"28%",
          background:"rgba(255,255,255,0.45)", borderRadius:"50%", transform:"rotate(-30deg)" }}/>
        <div style={{ position:"absolute", bottom:-6, left:"50%", transform:"translateX(-50%)",
          width:8, height:8, background:c.knot, borderRadius:"50% 50% 40% 40%" }}/>
        <div style={{ position:"absolute", bottom:-14, left:"50%", transform:"translateX(-50%)",
          width:0, height:0, borderLeft:"5px solid transparent",
          borderRight:"5px solid transparent", borderTop:`8px solid ${c.knot}` }}/>
      </div>
      <svg width={svgW} height={stringLen} style={{ overflow:"visible", marginTop:14, pointerEvents:"none" }}
        viewBox={`0 0 ${svgW} ${stringLen}`}>
        <path d={`M${svgW/2},0 Q${drift>0?svgW:0},${stringLen/2} ${svgW/2},${stringLen}`}
          stroke={c.knot+"88"} strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  );
}

export default function Balloons({ onPop }: { onPop?: () => void }) {
  const isMobile = useIsMobile();
  const config = isMobile ? BALLOON_CONFIG_MOBILE : BALLOON_CONFIG_DESKTOP;
  return (
    <>
      <style>{`
        /*
          balloonRise replaces the old balloonFloat + balloonSway combo.
          A single animation on the container handles both rise and sway
          using translateX for the drift — no second child animation needed.
        */
        @keyframes balloonRise {
          0%   { transform: translateY(0)      translateX(0);   opacity:0 }
          2%   { opacity:1 }
          30%  { transform: translateY(-35vh)  translateX(6px)  }
          60%  { transform: translateY(-70vh)  translateX(-4px) }
          95%  { opacity:.8 }
          100% { transform: translateY(-115vh) translateX(0);   opacity:0 }
        }
        @keyframes stringFall {
          0%   { transform:translateY(0) rotate(0deg);   opacity:1 }
          30%  { transform:translateY(10px) rotate(15deg) }
          100% { transform:translateY(120px) rotate(40deg); opacity:0 }
        }
      `}</style>
      {config.map((b, i) => (
        <Balloon key={i} left={b.left} size={b.size} delay={b.delay}
          duration={b.duration} drift={b.drift} colorIndex={i} onPop={onPop} />
      ))}
    </>
  );
}