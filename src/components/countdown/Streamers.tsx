"use client";

import { useEffect, useRef } from "react";
import { PALETTE } from "@/lib/colors";

const COLORS = PALETTE;

interface Streamer {
  x: number; y: number;
  w: number; h: number;
  color: string;
  speed: number;
  rot: number; rotSpeed: number;
  stringH: number;
}

export default function Streamers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const streamers: Streamer[] = [
      ...[0,1,2,3,4].map(i => ({
        x: (4 + i*3) / 100 * window.innerWidth,
        y: -60 - Math.random() * window.innerHeight,
        w: 18 + (i%3)*6, h: 24 + (i%3)*6,
        color: COLORS[i % COLORS.length].bg,
        speed: 1.5 + i * 0.3,
        rot: (-10 + i*5) * Math.PI/180,
        rotSpeed: 0,
        stringH: 120 + i*40,
      })),
      ...[0,1,2,3,4].map(i => ({
        x: (100 - 4 - i*3) / 100 * window.innerWidth,
        y: -60 - Math.random() * window.innerHeight,
        w: 18 + (i%3)*6, h: 24 + (i%3)*6,
        color: COLORS[(i+2) % COLORS.length].bg,
        speed: 1.4 + i * 0.25,
        rot: (10 - i*5) * Math.PI/180,
        rotSpeed: 0,
        stringH: 100 + i*50,
      })),
    ];

    interface Dot { x:number; y:number; r:number; color:string; speed:number; }
    const dots: Dot[] = Array.from({length:16}, (_,i) => ({
      x: ((i*7)%100) / 100 * window.innerWidth,
      y: canvas.height + (10+(i*13)%30),
      r: (6+(i%4)*4) / 2,
      color: COLORS[i % COLORS.length].bg,
      speed: 0.6 + (i*1.3%8) / 8 * 0.8,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // dots
      for (const d of dots) {
        d.y -= d.speed;
        if (d.y < -d.r * 2) d.y = canvas.height + d.r;
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const s of streamers) {
        s.y += s.speed;
        if (s.y > canvas.height + 100) s.y = -s.stringH - s.h - 10;

        const cx = s.x, cy = s.y;

        // string
        ctx.strokeStyle = "#c94a6a44";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + s.stringH);
        ctx.stroke();

        // tag
        ctx.save();
        ctx.translate(cx, cy + s.stringH);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color;
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 0.5;
        const hw = s.w/2, hh = s.h/2;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, s.w, s.h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1 }}
    />
  );
}