"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { playSmashSound } from "@/lib/audio";

const CARD_COLORS = [
  { env: "#FFD6E0", dark: "#c94a6a", paper: "#FFF0F4" },
  { env: "#D6F0FF", dark: "#2e7eaa", paper: "#F0F8FF" },
  { env: "#D6FFE8", dark: "#2e8a55", paper: "#F0FFF8" },
  { env: "#FFF3D6", dark: "#b37a00", paper: "#FFFBF0" },
  { env: "#EDD6FF", dark: "#7a2eb3", paper: "#F5F0FF" },
  { env: "#FFE8D6", dark: "#b35a00", paper: "#FFF4ED" },
];

interface SmashCardData { uid: number; x: number; colorIdx: number; duration: number; }

function SmashCardPieces({ x, y, color }: { x: number; y: number; color: typeof CARD_COLORS[0] }) {
  const pieces = useRef(Array.from({length: 8}).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    return { dx: Math.cos(angle)*dist, dy: Math.sin(angle)*dist - 20, rot: Math.random()*360 };
  })).current;

  return (
    <div style={{ position:"fixed", left:x, top:y, zIndex:300, pointerEvents:"none" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position:"absolute", width: i%2===0 ? 24 : 16, height: i%2===0 ? 18 : 12,
          background: i%3===0 ? color.env : color.paper,
          border: `1px solid ${color.dark}44`, borderRadius: 3,
          animation: "pieceFly 0.7s ease-out forwards",
          "--pdx": `${p.dx}px`, "--pdy": `${p.dy}px`, "--prot": `${p.rot}deg`,
        } as React.CSSProperties}/>
      ))}
      <div style={{ position:"absolute", left:-20, top:-30, fontFamily:"'Lilita One',cursive", fontSize:20,
        color:color.dark, animation:"popText 0.6s ease-out forwards", whiteSpace:"nowrap" }}>✨</div>
    </div>
  );
}

function SmashCard({ card, onSmash, onDone }: {
  card: SmashCardData;
  onSmash: (uid: number, x: number, y: number) => void;
  onDone: (uid: number) => void;
}) {
  const c = CARD_COLORS[card.colorIdx % CARD_COLORS.length];
  const divRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number|null>(null);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);
  const smashedRef = useRef(false);

  useEffect(() => {
    const totalY = window.innerHeight + 200;
    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      progressRef.current = Math.min(1, progressRef.current + dt / card.duration);
      const p = progressRef.current;
      const ty = p * (totalY + 150);
      if (divRef.current) divRef.current.style.transform = `translate3d(0,${ty}px,0)`;
      if (p < 1) { rafRef.current = requestAnimationFrame(tick); }
      else if (!doneRef.current) { doneRef.current = true; onDone(card.uid); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [card.uid, card.duration, onDone]);

  const doSmash = (cx: number, cy: number) => {
    if (smashedRef.current) return;
    smashedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (divRef.current) {
      divRef.current.style.transition = "transform 0.15s ease-out, opacity 0.2s ease-out";
      divRef.current.style.transform += " scale(1.2)";
      divRef.current.style.opacity = "0";
    }
    setTimeout(() => onSmash(card.uid, cx, cy), 150);
  };

  useEffect(() => {
    const el = divRef.current; if (!el) return;
    let sx=0, sy=0;
    const onTs = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.touches[0].clientY - rect.top < 40) return;
      sx=e.touches[0].clientX; sy=e.touches[0].clientY; e.preventDefault();
    };
    const onTe = (e: TouchEvent) => {
      e.preventDefault();
      if (Math.abs(e.changedTouches[0].clientX-sx)<20 && Math.abs(e.changedTouches[0].clientY-sy)<20)
        doSmash(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };
    el.addEventListener("touchstart", onTs, { passive:false });
    el.addEventListener("touchend", onTe, { passive:false });
    return () => { el.removeEventListener("touchstart",onTs); el.removeEventListener("touchend",onTe); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.uid]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    if (e.clientY - rect.top < 40) return;
    doSmash(e.clientX, e.clientY);
  };

  const w = 52, h = 68, stringLen = 55, notch = 10, r = 8;
  const svgPath = `M ${r} 0 L ${w-r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h-notch} L ${w/2} ${h} L 0 ${h-notch} L 0 ${r} Q 0 0 ${r} 0 Z`;
  const clipId = `smclip-${card.uid}`;

  return (
    <div ref={divRef} onClick={handleClick} style={{
      position:"fixed", left:`${card.x}%`, top:"-150px",
      display:"flex", flexDirection:"column", alignItems:"center",
      zIndex:100, cursor:"default", willChange:"transform", touchAction:"none",
    }}>
      <div style={{ width:2, height:stringLen, background:`linear-gradient(to bottom,${c.dark}55,${c.dark}22)`, pointerEvents:"none", cursor:"default" }}/>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible" style={{ cursor:"pointer" }}>
        <defs><clipPath id={clipId}><path d={svgPath}/></clipPath></defs>
        <path d={svgPath} fill={c.dark} opacity={0.1} transform="translate(0,3)"/>
        <path d={svgPath} fill={c.env} stroke={c.dark} strokeWidth="1.5" strokeOpacity={0.3}/>
        <rect x={0} y={0} width={w} height={14} fill="white" fillOpacity={0.4} clipPath={`url(#${clipId})`}/>
        <circle cx={w/2} cy={8} r={4} fill="white" stroke={c.dark} strokeWidth="1.2" strokeOpacity={0.4}/>
        <path d={svgPath} fill="none" stroke={c.dark} strokeWidth="1" strokeOpacity={0.15}
          strokeDasharray="3 3" transform="scale(0.88) translate(3.5, 4)"/>
        <text x={w/2} y={h/2+10} textAnchor="middle" dominantBaseline="middle" fontSize={22}>
          {["🎀","⭐","✨","🌸","💫"][card.colorIdx % 5]}
        </text>
      </svg>
    </div>
  );
}

export default function SmashCards({ onScore }: { onScore: () => void }) {
  const [cards, setCards] = useState<SmashCardData[]>([]);
  const [pieces, setPieces] = useState<{ uid:number; x:number; y:number; colorIdx:number }[]>([]);
  const counterRef = useRef(0);
  const spawnRef = useRef<() => void>(() => {});

  const spawnCard = useCallback(() => {
    const uid = counterRef.current++;
    const x = 5 + Math.random() * 88;
    const colorIdx = Math.floor(Math.random() * CARD_COLORS.length);
    const duration = 2500 + Math.random() * 3500;
    setCards(prev => [...prev.slice(-21), { uid, x, colorIdx, duration }]);
  }, []);

  useEffect(() => { spawnRef.current = spawnCard; }, [spawnCard]);

  useEffect(() => {
    const t = { id: 0 as number };
    const schedule = () => {
      t.id = window.setTimeout(() => {
        if (!document.hidden) spawnRef.current();
        schedule();
      }, 530 + Math.random() * 800);
    };
    window.setTimeout(() => spawnRef.current(), 300);
    window.setTimeout(() => spawnRef.current(), 700);
    schedule();
    const onVis = () => { if (!document.hidden) { clearTimeout(t.id); schedule(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(t.id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const handleSmash = useCallback((uid: number, x: number, y: number) => {
    const card = cards.find(c => c.uid === uid);
    if (!card) return;
    playSmashSound();
    setPieces(prev => [...prev, { uid, x, y, colorIdx: card.colorIdx }]);
    setCards(prev => prev.filter(c => c.uid !== uid));
    onScore();
    setTimeout(() => setPieces(prev => prev.filter(p => p.uid !== uid)), 800);
  }, [cards, onScore]);

  const handleDone = useCallback((uid: number) => {
    setCards(prev => prev.filter(c => c.uid !== uid));
  }, []);

  return (
    <>
      {cards.map(card => (
        <SmashCard key={card.uid} card={card} onSmash={handleSmash} onDone={handleDone}/>
      ))}
      {pieces.map(p => (
        <SmashCardPieces key={p.uid} x={p.x} y={p.y} color={CARD_COLORS[p.colorIdx % CARD_COLORS.length]}/>
      ))}
    </>
  );
}