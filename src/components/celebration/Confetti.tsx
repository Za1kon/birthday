"use client";

// Confetti rendered on a single canvas — zero DOM nodes, zero compositor layers.
// Much lighter on mobile than 14-30 individual divs with willChange:transform.

import { useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/hooks";

const COLORS = ["#FFD6E0","#D6F0FF","#D6FFE8","#FFF3D6","#EDD6FF","#FFE8D6","#c94a6a","#2e7eaa"];

interface Piece {
  x: number; y: number; w: number; h: number;
  color: string; isCircle: boolean;
  speed: number; drift: number; rot: number; rotSpeed: number;
}

export default function Confetti() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const count = isMobile ? 14 : 30;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init pieces
    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      const size = 6 + (i % 4) * 4;
      return {
        x: (i * (window.innerWidth / count)) % window.innerWidth,
        y: -20 - Math.random() * window.innerHeight,
        w: i % 3 !== 0 ? size / 2 : size,
        h: i % 3 !== 0 ? size : size / 2,
        color: COLORS[i % COLORS.length],
        isCircle: i % 3 === 0,
        speed: 1.2 + (i % 4) * 0.4,
        drift: (Math.random() - 0.5) * 0.6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.y += p.speed;
        p.x += p.drift;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.color;
        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:10 }}
    />
  );
}