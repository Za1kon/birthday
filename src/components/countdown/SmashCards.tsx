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

interface CardState {
  progress: number;
  lastTime: number | null;
  duration: number;
  done: boolean;
  smashed: boolean;
}

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

function SmashCard({ card, elRef, onSmash, onDone, gravityActive, punteriaActive }: {
  card: SmashCardData;
  elRef: (el: HTMLDivElement | null) => void;
  onSmash: (uid: number, x: number, y: number) => void;
  onDone: (uid: number) => void;
  gravityActive: boolean;
  punteriaActive: boolean;
}) {
  const c = CARD_COLORS[card.colorIdx % CARD_COLORS.length];
  const divRef = useRef<HTMLDivElement>(null);
  const smashedRef = useRef(false);
  const onSmashRef = useRef(onSmash);
  useEffect(() => { onSmashRef.current = onSmash; }, [onSmash]);

  useEffect(() => {
    elRef(divRef.current);
    return () => elRef(null);
  }, [elRef]);

  const doSmash = useCallback((cx: number, cy: number) => {
    if (smashedRef.current) return;
    smashedRef.current = true;
    if (divRef.current) {
      divRef.current.style.transition = "transform 0.15s ease-out, opacity 0.2s ease-out";
      divRef.current.style.transform += " scale(1.2)";
      divRef.current.style.opacity = "0";
    }
    setTimeout(() => onSmashRef.current(card.uid, cx, cy), 150);
  }, [card.uid]);

  // Touch — attached to the SVG node via ref
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    let sx=0, sy=0;
    const onTs = (e: TouchEvent) => {
      sx=e.touches[0].clientX; sy=e.touches[0].clientY; e.preventDefault();
    };
    const onTe = (e: TouchEvent) => {
      e.preventDefault();
      if (Math.abs(e.changedTouches[0].clientX-sx)<20 && Math.abs(e.changedTouches[0].clientY-sy)<20)
        doSmash(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };
    el.addEventListener("touchstart", onTs, { passive:false });
    el.addEventListener("touchend",   onTe, { passive:false });
    return () => { el.removeEventListener("touchstart",onTs); el.removeEventListener("touchend",onTe); };
  }, [card.uid, doSmash]);

  const EXPAND = 48;
  const EMOJI_SIZE = 28; // approx emoji hit area
  const w = 52, h = 68, stringLen = 55, notch = 10, r = 8;
  const svgPath = `M ${r} 0 L ${w-r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h-notch} L ${w/2} ${h} L 0 ${h-notch} L 0 ${r} Q 0 0 ${r} 0 Z`;
  const clipId = `smclip-${card.uid}`;

  // Emoji center in SVG coords: x=w/2, y=h/2+10
  const emojyCX = w / 2;
  const emojyCY = h / 2 + 10;

  return (
    <div ref={divRef} style={{
      position:"fixed", left:`${card.x}%`, top:"-150px",
      display:"flex", flexDirection:"column", alignItems:"center",
      zIndex:100, willChange:"transform", touchAction:"none",
    }}>
      <div style={{ width:2, height:stringLen, background:`linear-gradient(to bottom,${c.dark}55,${c.dark}22)`, pointerEvents:"none" }}/>
      {/* NoobTrainer: transparent padded wrapper expands clickable area */}
      <div
        onClick={gravityActive ? (e) => doSmash(e.clientX, e.clientY) : undefined}
        style={{
          padding: gravityActive ? EXPAND : 0,
          margin: gravityActive ? -EXPAND : 0,
          background: "transparent",
          pointerEvents: gravityActive ? "auto" : "none",
        }}
      >
        <svg
          ref={svgRef}
          width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible"
          onClick={!gravityActive && !punteriaActive ? (e) => doSmash(e.clientX, e.clientY) : undefined}
          style={{ display:"block", cursor: punteriaActive ? "default" : "pointer", pointerEvents:"auto" }}
        >
          <defs><clipPath id={clipId}><path d={svgPath}/></clipPath></defs>
          <path d={svgPath} fill={c.dark} opacity={0.1} transform="translate(0,3)"/>
          <path d={svgPath} fill={c.env} stroke={c.dark} strokeWidth="1.5" strokeOpacity={0.3}/>
          {/* Puntería: highlight the emoji zone */}
          {punteriaActive && (
            <circle cx={emojyCX} cy={emojyCY} r={EMOJI_SIZE/2}
              fill="none" stroke={c.dark} strokeWidth="1.5" strokeDasharray="3 2" opacity={0.5}/>
          )}
          <rect x={0} y={0} width={w} height={14} fill="white" fillOpacity={0.4} clipPath={`url(#${clipId})`}/>
          <circle cx={w/2} cy={8} r={4} fill="white" stroke={c.dark} strokeWidth="1.2" strokeOpacity={0.4}/>
          <path d={svgPath} fill="none" stroke={c.dark} strokeWidth="1" strokeOpacity={0.15}
            strokeDasharray="3 3" transform="scale(0.88) translate(3.5, 4)"/>
          {/* Emoji — clickable only when puntería active */}
          <text
            x={emojyCX} y={emojyCY}
            textAnchor="middle" dominantBaseline="middle" fontSize={22}
            onClick={punteriaActive ? (e) => { e.stopPropagation(); doSmash((e as any).clientX, (e as any).clientY); } : undefined}
            style={{ cursor: punteriaActive ? "pointer" : "default", pointerEvents: punteriaActive ? "auto" : "none" }}
          >
            {["🎀","⭐","✨","🌸","💫"][card.colorIdx % 5]}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function SmashCards({ onScore, onHit, onMiss, multiplier = 1, gravityActive = false, punteriaActive = false }: {
  onScore: (amount?: number) => void;
  onHit: () => void;
  onMiss: () => void;
  multiplier?: number;
  gravityActive?: boolean;
  punteriaActive?: boolean;
}) {
  const [cards, setCards] = useState<SmashCardData[]>([]);
  const [pieces, setPieces] = useState<{ uid:number; x:number; y:number; colorIdx:number }[]>([]);
  const counterRef = useRef(0);
  const spawnRef = useRef<() => void>(() => {});
  const multiplierRef = useRef(multiplier);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  const punteriaActiveRef = useRef(punteriaActive);
  useEffect(() => { punteriaActiveRef.current = punteriaActive; }, [punteriaActive]);
  const onMissRef = useRef(onMiss);
  useEffect(() => { onMissRef.current = onMiss; }, [onMiss]);
  const onHitRef = useRef(onHit);
  useEffect(() => { onHitRef.current = onHit; }, [onHit]);

  const cardStatesRef = useRef<Map<number, CardState>>(new Map());
  const elMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef<number>(0);
  const onDoneCallbackRef = useRef<(uid: number) => void>(() => {});
  const onSmashCallbackRef = useRef<(uid: number, x: number, y: number) => void>(() => {});
  const totalYRef = useRef(800);

  useEffect(() => { totalYRef.current = window.innerHeight + 200; }, []);

  useEffect(() => {
    if (cards.length === 0) { cancelAnimationFrame(rafRef.current); return; }

    cards.forEach(card => {
      if (!cardStatesRef.current.has(card.uid)) {
        cardStatesRef.current.set(card.uid, {
          progress: 0, lastTime: null, duration: card.duration, done: false, smashed: false,
        });
      }
    });

    const tick = (now: number) => {
      const toRemove: number[] = [];
      cardStatesRef.current.forEach((state, uid) => {
        if (state.done || state.smashed) return;
        if (state.lastTime === null) state.lastTime = now;
        const dt = now - state.lastTime;
        state.lastTime = now;
        state.progress = Math.min(1, state.progress + dt / state.duration);
        const el = elMapRef.current.get(uid);
        if (el) el.style.transform = `translate3d(0,${state.progress * (totalYRef.current + 150)}px,0)`;
        if (state.progress >= 1) { state.done = true; toRemove.push(uid); }
      });
      toRemove.forEach(uid => {
        cardStatesRef.current.delete(uid);
        onMissRef.current();
        onDoneCallbackRef.current(uid);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cards]);

  useEffect(() => {
    const activeUids = new Set(cards.map(c => c.uid));
    cardStatesRef.current.forEach((_, uid) => {
      if (!activeUids.has(uid)) cardStatesRef.current.delete(uid);
    });
  }, [cards]);

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
      const interval = (530 + Math.random() * 800) / multiplierRef.current;
      t.id = window.setTimeout(() => {
        if (!document.hidden) spawnRef.current();
        schedule();
      }, interval);
    };
    window.setTimeout(() => spawnRef.current(), 300);
    window.setTimeout(() => spawnRef.current(), 700);
    schedule();
    const onVis = () => { if (!document.hidden) { clearTimeout(t.id); schedule(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(t.id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const handleDone = useCallback((uid: number) => {
    setCards(prev => prev.filter(c => c.uid !== uid));
  }, []);
  useEffect(() => { onDoneCallbackRef.current = handleDone; }, [handleDone]);

  const handleSmash = useCallback((uid: number, x: number, y: number) => {
    const state = cardStatesRef.current.get(uid);
    if (!state || state.smashed) return;
    state.smashed = true;
    const card = cards.find(c => c.uid === uid);
    if (!card) return;
    playSmashSound();
    setPieces(prev => [...prev, { uid, x, y, colorIdx: card.colorIdx }]);
    setCards(prev => prev.filter(c => c.uid !== uid));
    onScore(punteriaActiveRef.current ? 5 : 1);
    onHitRef.current();
    setTimeout(() => setPieces(prev => prev.filter(p => p.uid !== uid)), 800);
  }, [cards, onScore]);
  useEffect(() => { onSmashCallbackRef.current = handleSmash; }, [handleSmash]);

  const makeElRef = useCallback((uid: number) => (el: HTMLDivElement | null) => {
    if (el) elMapRef.current.set(uid, el);
    else elMapRef.current.delete(uid);
  }, []);

  return (
    <>
      {cards.map(card => (
        <SmashCard
          key={card.uid}
          card={card}
          elRef={makeElRef(card.uid)}
          onSmash={handleSmash}
          onDone={handleDone}
          gravityActive={gravityActive}
          punteriaActive={punteriaActive}
        />
      ))}
      {pieces.map(p => (
        <SmashCardPieces key={p.uid} x={p.x} y={p.y} color={CARD_COLORS[p.colorIdx % CARD_COLORS.length]}/>
      ))}
    </>
  );
}