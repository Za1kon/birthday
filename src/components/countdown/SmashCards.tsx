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

const GOLD_COLOR = { env: "#FFD700", dark: "#B8860B", paper: "#FFFDE7" };

interface SmashCardData {
  uid: number;
  x: number;
  colorIdx: number;
  duration: number;
  swayPeriod: number;
  swayPhase: number;
  swayAmp: number;
}

interface CardState {
  progress: number;
  elapsed: number;
  lastTime: number | null;
  duration: number;
  swayPeriod: number;
  swayPhase: number;
  swayAmp: number;
  done: boolean;
  smashed: boolean;
}

function SmashCardPieces({ x, y, color }: { x: number; y: number; color: typeof CARD_COLORS[0] }) {
  const pieces = useRef(Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 20, rot: Math.random() * 360 };
  })).current;

  return (
    <div style={{ position: "fixed", left: x, top: y, zIndex: 300, pointerEvents: "none" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", width: i % 2 === 0 ? 24 : 16, height: i % 2 === 0 ? 18 : 12,
          background: i % 3 === 0 ? color.env : color.paper,
          border: `1px solid ${color.dark}44`, borderRadius: 3,
          animation: "pieceFly 0.7s ease-out forwards",
          "--pdx": `${p.dx}px`, "--pdy": `${p.dy}px`, "--prot": `${p.rot}deg`,
        } as React.CSSProperties} />
      ))}
      <div style={{
        position: "absolute", left: -20, top: -30,
        fontFamily: "'Lilita One',cursive", fontSize: 20,
        color: color.dark, animation: "popText 0.6s ease-out forwards", whiteSpace: "nowrap",
      }}>✨</div>
    </div>
  );
}

function SmashCard({
  card, elRef, onSmash, onDone,
  gravityActive, punteriaActive, escudoActive, doradoActive, doradoFading,
}: {
  card: SmashCardData;
  elRef: (el: HTMLDivElement | null) => void;
  onSmash: (uid: number, x: number, y: number) => void;
  onDone: (uid: number) => void;
  gravityActive: boolean;
  punteriaActive: boolean;
  escudoActive: boolean;
  doradoActive: boolean;
  doradoFading: boolean;
}) {
  const baseColor = CARD_COLORS[card.colorIdx % CARD_COLORS.length];
  const c = doradoActive ? GOLD_COLOR : baseColor;

  const divRef = useRef<HTMLDivElement>(null);
  const smashedRef = useRef(false);
  const onSmashRef = useRef(onSmash);
  useEffect(() => { onSmashRef.current = onSmash; }, [onSmash]);

  const [shieldHits, setShieldHits] = useState(0);
  const shieldHitsRef = useRef(0);
  const [shieldFlash, setShieldFlash] = useState(false);
  const escudoActiveRef = useRef(escudoActive);

  useEffect(() => {
    const prev = escudoActiveRef.current;
    escudoActiveRef.current = escudoActive;
    if (prev !== escudoActive) {
      shieldHitsRef.current = 0;
      setShieldHits(0);
      setShieldFlash(false);
    }
  }, [escudoActive]);

  useEffect(() => {
    elRef(divRef.current);
    return () => elRef(null);
  }, [elRef]);

  const doSmash = useCallback((cx: number, cy: number) => {
    if (smashedRef.current) return;
    if (escudoActiveRef.current && shieldHitsRef.current === 0) {
      shieldHitsRef.current = 1;
      setShieldHits(1);
      setShieldFlash(true);
      setTimeout(() => setShieldFlash(false), 300);
      return;
    }
    smashedRef.current = true;
    if (divRef.current) {
      divRef.current.style.transition = "opacity 0.15s ease-out";
      divRef.current.style.opacity = "0";
    }
    setTimeout(() => onSmashRef.current(card.uid, cx, cy), 150);
  }, [card.uid]);

  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    let sx = 0, sy = 0;
    const onTs = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; e.preventDefault(); };
    const onTe = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - sx) < 20 && Math.abs(t.clientY - sy) < 20)
        doSmash(t.clientX, t.clientY);
    };
    el.addEventListener("touchstart", onTs, { passive: false });
    el.addEventListener("touchend",   onTe, { passive: false });
    return () => { el.removeEventListener("touchstart", onTs); el.removeEventListener("touchend", onTe); };
  }, [card.uid, doSmash]);

  const EXPAND = 48;
  const EMOJI_SIZE = 32;
  const w = 52, h = 68, stringLen = 55, r = 8, notch = 10;
  const svgPath = `M ${r} 0 L ${w-r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h-notch} L ${w/2} ${h} L 0 ${h-notch} L 0 ${r} Q 0 0 ${r} 0 Z`;
  const clipId = `smclip-${card.uid}`;
  const emojyCX = w / 2;
  const emojyCY = h / 2 + 10;
  const dotCY = emojyCY - 3; // circle shifted up to match emoji visual center
  const hasShield = escudoActive && shieldHits === 0;

  return (
    // Single div — rAF writes ONE transform: translate3d(X, Y, 0)
    // X = sway, Y = fall. One composite layer, one GPU upload per frame.
    <div
      ref={divRef}
      style={{
        position: "fixed", left: `${card.x}%`, top: "-150px",
        zIndex: 100, willChange: "transform", touchAction: "none",
        display: "flex", flexDirection: "column", alignItems: "center",
        ...(doradoFading ? { animation: "doradoFlickerSm 1.5s ease-in-out forwards" } : {}),
      }}
    >
      {/* String */}
      <div style={{
        width: 2, height: stringLen,
        background: `linear-gradient(to bottom,${c.dark}55,${c.dark}22)`,
        pointerEvents: "none",
      }} />

      {/* Card + shield */}
      <div style={{ position: "relative" }}>
        {hasShield && (
          <svg
            width={w} height={h}
            viewBox={`0 0 ${w} ${h}`}
            style={{
              position: "absolute",
              top: 0, left: 0,
              pointerEvents: "none", zIndex: 5, overflow: "visible",

            }}
          >
            {punteriaActive ? (() => {
              const dotR = EMOJI_SIZE / 2;
              return (
                <>
                  <circle cx={emojyCX} cy={dotCY} r={18}
                    fill={shieldFlash ? "rgba(200,220,255,0.45)" : "rgba(155,164,181,0.18)"}
                    style={{ transition: "fill 0.2s ease" }}
                  />
                  <circle cx={emojyCX} cy={dotCY} r={18}
                    fill="none" stroke={shieldFlash ? "#ffffff" : "#9BA4B5"}
                    strokeWidth="2.5" style={{ transition: "stroke 0.2s ease" }}
                  />
                  <text x={emojyCX} y={emojyCY} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🛡️</text>
                </>
              );
            })() : (
              <>
                <path d={svgPath}
                  fill={shieldFlash ? "rgba(200,220,255,0.45)" : "rgba(155,164,181,0.18)"}
                  style={{ transition: "fill 0.2s ease" }}
                />
                <path d={svgPath} fill="none"
                  stroke={shieldFlash ? "#ffffff" : "#9BA4B5"}
                  strokeWidth="2.5" style={{ transition: "stroke 0.2s ease" }}
                />
                <path d={`M ${r+4} 4 L ${w-r-4} 4`}
                  stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"
                />
                <text x={w/2} y={h/2+10} textAnchor="middle" dominantBaseline="middle" fontSize={w*0.3}>🛡️</text>
              </>
            )}
          </svg>
        )}

        <div
          onClick={gravityActive ? (e) => doSmash(e.clientX, e.clientY) : undefined}
          style={{
            padding: gravityActive ? EXPAND : 0,
            margin: gravityActive ? -EXPAND : 0,
            background: "transparent",
            pointerEvents: gravityActive ? "auto" : "none",
          }}
        >
          <div style={{ position: "relative", width: w, height: h, overflow: "visible" }}>
          <svg
            ref={svgRef}
            width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible"
            onClick={!gravityActive && !punteriaActive ? (e) => doSmash(e.clientX, e.clientY) : undefined}
            style={{
              display: "block",
              cursor: punteriaActive ? "default" : "pointer",
              pointerEvents: "auto",
              
            }}
          >
            <defs><clipPath id={clipId}><path d={svgPath} /></clipPath></defs>
            <path d={svgPath} fill={c.dark} opacity={0.1} transform="translate(0,3)" />
            <path d={svgPath} fill={c.env} stroke={c.dark} strokeWidth="1.5" strokeOpacity={0.3} />

            <rect x={0} y={0} width={w} height={14} fill="white" fillOpacity={doradoActive ? 0.6 : 0.4} clipPath={`url(#${clipId})`} />
            <circle cx={w / 2} cy={8} r={4} fill="white" stroke={c.dark} strokeWidth="1.2" strokeOpacity={0.4} />
            <path d={svgPath} fill="none" stroke={c.dark} strokeWidth="1" strokeOpacity={0.15}
              strokeDasharray="3 3" transform="scale(0.88) translate(3.5, 4)" />
            {doradoActive && (
              <rect x={0} y={h * 0.3} width={w} height={4} fill="rgba(255,255,255,0.4)" clipPath={`url(#${clipId})`} />
            )}
            <text
              x={emojyCX} y={emojyCY}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={22}
              style={{ pointerEvents: "none" }}
            >
              {escudoActive && shieldHits === 0
                ? "🛡️"
                : doradoActive
                  ? "⭐"
                  : ["🎀", "⭐", "✨", "🌸", "💫"][card.colorIdx % 5]}
            </text>
          </svg>
          {/* Puntería CSS overlay — same as Balloons */}
          {punteriaActive && (
            <>
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", borderRadius:8, pointerEvents:"none", zIndex:2 }}/>
              <div style={{ position:"absolute", left:"50%", top:dotCY, transform:"translate(-50%,-50%)", width:36, height:36, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.9)", background:"rgba(255,255,255,0.15)", pointerEvents:"none", zIndex:3 }}/>
              <div
                onClick={(e) => { e.stopPropagation(); doSmash(e.clientX, e.clientY); }}
                style={{ position:"absolute", left:"50%", top:dotCY, transform:"translate(-50%,-50%)", width:36, height:36, borderRadius:"50%", cursor:"pointer", zIndex:4, pointerEvents:"auto", display:"flex", alignItems:"center", justifyContent:"center" }}
              >
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#fff", opacity:0.95 }}/>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SmashCards({
  onScore, onHit, onMiss,
  multiplier = 1,
  gravityActive = false,
  punteriaActive = false,
  vientoActive = false,
  escudoActive = false,
  doradoActive = false,
  doradoFading = false,
}: {
  onScore: (amount?: number) => void;
  onHit: () => void;
  onMiss: () => void;
  multiplier?: number;
  gravityActive?: boolean;
  punteriaActive?: boolean;
  vientoActive?: boolean;
  escudoActive?: boolean;
  doradoActive?: boolean;
  doradoFading?: boolean;
}) {
  const [cards, setCards] = useState<SmashCardData[]>([]);
  const [pieces, setPieces] = useState<{ uid: number; x: number; y: number; colorIdx: number }[]>([]);
  const counterRef = useRef(0);
  const spawnRef = useRef<() => void>(() => {});
  const multiplierRef = useRef(multiplier);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  const punteriaActiveRef = useRef(punteriaActive);
  useEffect(() => { punteriaActiveRef.current = punteriaActive; }, [punteriaActive]);
  const doradoActiveRef = useRef(doradoActive);
  useEffect(() => { doradoActiveRef.current = doradoActive; }, [doradoActive]);
  const vientoActiveRef = useRef(vientoActive);
  useEffect(() => { vientoActiveRef.current = vientoActive; }, [vientoActive]);
  const escudoActiveRef2 = useRef(escudoActive);
  useEffect(() => { escudoActiveRef2.current = escudoActive; }, [escudoActive]);
  const onMissRef = useRef(onMiss);
  useEffect(() => { onMissRef.current = onMiss; }, [onMiss]);
  const onHitRef = useRef(onHit);
  useEffect(() => { onHitRef.current = onHit; }, [onHit]);

  const cardStatesRef = useRef<Map<number, CardState>>(new Map());
  const elMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef<number>(0);
  const onDoneCallbackRef = useRef<(uid: number) => void>(() => {});
  const totalYRef = useRef(800);

  useEffect(() => { totalYRef.current = window.innerHeight + 200; }, []);

  // Register new card states when cards array changes
  useEffect(() => {
    cards.forEach(card => {
      if (!cardStatesRef.current.has(card.uid)) {
        cardStatesRef.current.set(card.uid, {
          progress: 0,
          elapsed: 0,
          lastTime: null,
          duration: card.duration,
          swayPeriod: card.swayPeriod,
          swayPhase: card.swayPhase,
          swayAmp: card.swayAmp,
          done: false,
          smashed: false,
        });
      }
    });
    const activeUids = new Set(cards.map(c => c.uid));
    cardStatesRef.current.forEach((_, uid) => {
      if (!activeUids.has(uid)) cardStatesRef.current.delete(uid);
    });
  }, [cards]);

  // Single persistent RAF — never restarts, no dropped frames on spawn
  useEffect(() => {
    const tick = (now: number) => {
      const toRemove: number[] = [];
      const doViento = vientoActiveRef.current;
      const totalY = totalYRef.current;

      cardStatesRef.current.forEach((state, uid) => {
        if (state.done || state.smashed) return;
        if (state.lastTime === null) state.lastTime = now;
        const dt = now - state.lastTime;
        state.lastTime = now;
        state.elapsed += dt;
        state.progress = Math.min(1, state.progress + dt / state.duration);

        const el = elMapRef.current.get(uid);
        if (el) {
          const y = state.progress * (totalY + 150);
          const x = doViento
            ? state.swayAmp * Math.sin((state.elapsed / state.swayPeriod) * Math.PI * 2 + state.swayPhase)
            : 0;
          el.style.transform = `translate3d(${x}px,${y}px,0)`;
        }

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
  }, []);

  const spawnCard = useCallback(() => {
    const uid = counterRef.current++;
    const x = 5 + Math.random() * 88;
    const colorIdx = Math.floor(Math.random() * CARD_COLORS.length);
    const duration = 2500 + Math.random() * 3500;
    const swayPeriod = 1800 + Math.random() * 1000;
    const swayPhase = Math.random() * Math.PI * 2;
    const swayAmp = 16 + Math.random() * 10;
    setCards(prev => [...prev.slice(-21), { uid, x, colorIdx, duration, swayPeriod, swayPhase, swayAmp }]);
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
    let pts = 1;
    if (punteriaActiveRef.current) pts *= 5;
    if (vientoActiveRef.current)   pts *= 2;
    if (escudoActiveRef2.current)   pts *= 3;
    if (doradoActiveRef.current)   pts *= 5;
    onScore(pts);
    onHitRef.current();
    setTimeout(() => setPieces(prev => prev.filter(p => p.uid !== uid)), 800);
  }, [cards, onScore]);

  const makeElRef = useCallback((uid: number) => (el: HTMLDivElement | null) => {
    if (el) elMapRef.current.set(uid, el);
    else elMapRef.current.delete(uid);
  }, []);

  return (
    <>
      <style>{`
@keyframes doradoFlickerSm {
          0%   { opacity:1; filter:brightness(1) }
          15%  { opacity:0.6; filter:brightness(2) saturate(0.2) }
          30%  { opacity:1; filter:brightness(1) }
          50%  { opacity:0.4; filter:brightness(2.5) saturate(0) }
          70%  { opacity:0.9; filter:brightness(1) }
          85%  { opacity:0.5; filter:brightness(2) saturate(0.1) }
          100% { opacity:1; filter:brightness(1) }
        }
      `}</style>
      {cards.map(card => (
        <SmashCard
          key={card.uid}
          card={card}
          elRef={makeElRef(card.uid)}
          onSmash={handleSmash}
          onDone={handleDone}
          gravityActive={gravityActive}
          punteriaActive={punteriaActive}
          escudoActive={escudoActive}
          doradoActive={doradoActive}
          doradoFading={doradoFading}
        />
      ))}
      {pieces.map(p => (
        <SmashCardPieces
          key={p.uid} x={p.x} y={p.y}
          color={doradoActive ? GOLD_COLOR : CARD_COLORS[p.colorIdx % CARD_COLORS.length]}
        />
      ))}
    </>
  );
}