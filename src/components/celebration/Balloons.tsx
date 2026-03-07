"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
const GOLDEN_COLOR = { color: "#FFD700", highlight: "#FFF3A0", knot: "#B8860B" };

const SIZES_DESKTOP = [70, 55, 65, 50, 45, 60, 58, 48];
const SIZES_MOBILE  = [62, 54, 58, 50];
const DURATIONS     = [8, 6, 9, 7, 11, 8, 6, 10];
const DRIFTS        = [8, -6, -9, 7, 5, -5, -8, 6];

const BASE_MAX            = 6;
const AVA_MAX             = 18;
const SPAWN_INTERVAL_MS     = 1000;
const SPAWN_INTERVAL_AVA_MS = 333;

interface BalloonData {
  uid: number;
  left: string;
  size: number;
  duration: number;
  drift: number;
  colorIndex: number;
}

let _uid = 0;

function makeBalloon(isMobile: boolean, colorCursor: number): BalloonData {
  const sizes = isMobile ? SIZES_MOBILE : SIZES_DESKTOP;
  const idx   = colorCursor % sizes.length;
  const size  = sizes[idx];
  const screenW = typeof window !== "undefined" ? window.innerWidth : 400;
  const balloonWidthPct = (size / screenW) * 100;
  const safeRight    = 100 - balloonWidthPct;
  const leftBandMax  = isMobile ? 10 : 16;
  const rightBandMin = isMobile ? Math.min(82, safeRight-2) : Math.min(80, safeRight-2);
  const rightBandMax = safeRight - 1;
  const leftPct = Math.random() < 0.5
    ? Math.random() * leftBandMax
    : rightBandMin + Math.random() * (rightBandMax - rightBandMin);
  return {
    uid:       _uid++,
    left:      `${leftPct}%`,
    size,
    duration:  DURATIONS[idx % DURATIONS.length],
    drift:     DRIFTS[idx % DRIFTS.length],
    colorIndex: colorCursor % BALLOON_COLORS.length,
  };
}

// ─── Pop animation ────────────────────────────────────────────────────────────
function BalloonPop({ x, y, color, onDone }: { x:number; y:number; color:string; onDone:()=>void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const SIZE = 140;
    canvas.width = SIZE; canvas.height = SIZE;
    const particles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i/12)*Math.PI*2, dist = 35+Math.random()*35;
      return { dx: Math.cos(angle)*dist, dy: Math.sin(angle)*dist, size: 4+Math.random()*6 };
    });
    let start: number|null = null, raf: number, called = false;
    const finish = () => { if (!called) { called=true; onDoneRef.current(); } };
    const draw = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now-start)/800);
      ctx.clearRect(0,0,SIZE,SIZE);
      ctx.beginPath(); ctx.arc(SIZE/2,SIZE/2,30*t*2.5,0,Math.PI*2);
      ctx.strokeStyle=color+"55"; ctx.lineWidth=3*(1-t); ctx.globalAlpha=1-t; ctx.stroke(); ctx.globalAlpha=1;
      for (const p of particles) {
        const ease=1-Math.pow(1-t,2);
        ctx.globalAlpha=1-t; ctx.fillStyle=color;
        ctx.beginPath(); ctx.arc(SIZE/2+p.dx*ease,SIZE/2+p.dy*ease,p.size*(1-t*0.8)/2,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=t<0.7?1:1-(t-0.7)/0.3;
      ctx.fillStyle=color; ctx.font="bold 16px 'Lilita One',cursive"; ctx.textAlign="center";
      ctx.fillText("pop!",SIZE/2,SIZE/2-20*t-10); ctx.globalAlpha=1;
      if (t<1) { raf=requestAnimationFrame(draw); } else { finish(); }
    };
    raf = requestAnimationFrame(draw);
    const timer = setTimeout(finish, 900);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"fixed", left:x-70, top:y-70, pointerEvents:"none", zIndex:200 }}/>;
}

// ─── Balloon ──────────────────────────────────────────────────────────────────
function Balloon({ b, onPop, onHit, onMiss, onDone, gravityActive, punteriaActive, vientoActive, escudoActive, doradoActive, escudoGen }: {
  b: BalloonData;
  onPop: (amount?: number) => void;
  onHit: () => void;
  onMiss: () => void;
  onDone: (uid: number) => void;
  gravityActive?: boolean;
  punteriaActive?: boolean;
  vientoActive?: boolean;
  escudoActive?: boolean;
  doradoActive?: boolean;
  escudoGen: number;
}) {
  const rawColor = BALLOON_COLORS[b.colorIndex % BALLOON_COLORS.length];
  const c = doradoActive ? GOLDEN_COLOR : rawColor;
  const stringLen = b.size * 1.4;
  const svgW = Math.abs(b.drift) + 4;
  const outerRef = useRef<HTMLDivElement>(null);
  const poppedRef = useRef(false);
  const doneRef   = useRef(false);
  const [popPos, setPopPos] = useState<{x:number;y:number}|null>(null);
  const shieldBrokenGenRef = useRef(-1);
  const [shieldFlash, setShieldFlash] = useState(false);
  const escudoActiveRef = useRef(escudoActive);
  escudoActiveRef.current = escudoActive;
  const escudoGenRef = useRef(escudoGen);
  if (escudoGenRef.current !== escudoGen) {
    escudoGenRef.current = escudoGen;
    shieldBrokenGenRef.current = -1;
  }

  const doPopRef = useRef<(x:number,y:number,fromPunteria?:boolean)=>void>(()=>{});
  const doPop = (x:number, y:number, fromPunteria=false) => {
    if (poppedRef.current || doneRef.current) return;
    if (escudoActiveRef.current && shieldBrokenGenRef.current !== escudoGenRef.current) {
      shieldBrokenGenRef.current = escudoGenRef.current;
      setShieldFlash(true);
      setTimeout(() => setShieldFlash(false), 300);
      return;
    }
    poppedRef.current = true;
    doneRef.current = true;
    playPopSound();
    let pts = 1;
    if (fromPunteria)       pts *= 5;
    if (vientoActive)       pts *= 2;
    if (escudoActive)       pts *= 3;
    if (doradoActive)       pts *= 5;
    onPop(pts);
    onHit();
    setPopPos({ x, y });
  };
  doPopRef.current = doPop;

  // animationend → miss + done
  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName !== "balloonRise") return;
      if (doneRef.current) return;
      doneRef.current = true;
      if (!poppedRef.current) onMiss();
      onDone(b.uid);
    };
    el.addEventListener("animationend", onEnd);
    return () => el.removeEventListener("animationend", onEnd);
  }, [b.uid, onMiss, onDone]);

  // Touch handler
  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    let sx=0, sy=0;
    const onTs = (e:TouchEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.touches[0].clientY > rect.top+b.size*1.15+14) return;
      sx=e.touches[0].clientX; sy=e.touches[0].clientY; e.preventDefault();
    };
    const onTe = (e:TouchEvent) => {
      if (!sx&&!sy) return; e.preventDefault();
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX-sx)<15 && Math.abs(t.clientY-sy)<15) {
        if (punteriaActive) {
          const rect = el.getBoundingClientRect();
          const cx=rect.left+b.size*0.5, cy=rect.top+b.size*1.15*0.45, dotR=18;
          const dx=t.clientX-cx, dy=t.clientY-cy;
          if (dx*dx+dy*dy<=dotR*dotR) doPopRef.current(t.clientX,t.clientY,true);
        } else { doPopRef.current(t.clientX,t.clientY); }
      }
      sx=0; sy=0;
    };
    el.addEventListener("touchstart",onTs,{passive:false});
    el.addEventListener("touchend",onTe,{passive:false});
    return () => { el.removeEventListener("touchstart",onTs); el.removeEventListener("touchend",onTe); };
  }, [b.size, punteriaActive]);

  const hasShield = !!escudoActive && shieldBrokenGenRef.current !== escudoGenRef.current;
  const EXPAND = 48;



  if (popPos) return (
    <>
      <BalloonPop x={popPos.x} y={popPos.y} color={c.color} onDone={() => { setPopPos(null); onDone(b.uid); }}/>
      <div style={{ position:"fixed", left:popPos.x, top:popPos.y, pointerEvents:"none", zIndex:100, animation:"stringFall 1.5s ease-in forwards" }}>
        <svg width={svgW+10} height={stringLen} overflow="visible" viewBox={`0 0 ${svgW+10} ${stringLen}`}>
          <path d={`M${(svgW+10)/2},0 Q${b.drift>0?svgW+10:0},${stringLen/2} ${(svgW+10)/2},${stringLen}`} stroke={c.knot+"cc"} strokeWidth="2" fill="none"/>
        </svg>
      </div>
    </>
  );

  const swayDur = 1.8+(b.uid%5)*0.3;
  return (
    <div ref={outerRef} style={{
      position:"fixed", left:b.left, bottom:"-200px",
      display:"flex", flexDirection:"column", alignItems:"center",
      animation:`balloonRise ${b.duration}s 0s ease-in-out 1 forwards`,
      zIndex:30, touchAction:"none",
    }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        ...(vientoActive ? { animation:`balloonSwayFast ${swayDur*0.6}s ease-in-out infinite`, willChange:"transform" } : {}) }}>
        <div onClick={gravityActive&&!punteriaActive?(e)=>doPop(e.clientX,e.clientY):undefined}
          style={{ padding:gravityActive&&!punteriaActive?EXPAND:0, margin:gravityActive&&!punteriaActive?-EXPAND:0, background:"transparent", pointerEvents:gravityActive&&!punteriaActive?"auto":"none" }}>
          <div style={{ position:"relative" }}>
            {hasShield && (
              <svg width={b.size} height={b.size*1.15} viewBox={`0 0 ${b.size} ${b.size*1.15}`}
                style={{ position:"absolute", top:0, left:0, pointerEvents:"none", zIndex:6, overflow:"visible", filter:shieldFlash?"drop-shadow(0 0 8px rgba(200,220,255,1))":"none", transition:"filter 0.2s ease" }}>
                {punteriaActive ? (()=>{
                  const dotCX=b.size*0.5, dotCY=b.size*1.15*0.45, dotR=18;
                  return (<>
                    <circle cx={dotCX} cy={dotCY} r={dotR} fill={shieldFlash?"rgba(200,220,255,0.4)":"rgba(155,164,181,0.18)"} style={{transition:"fill 0.2s ease"}}/>
                    <circle cx={dotCX} cy={dotCY} r={dotR} fill="none" stroke={shieldFlash?"#fff":"#9BA4B5"} strokeWidth="2.5" style={{transition:"stroke 0.2s ease"}}/>
                    <text x={dotCX} y={dotCY} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🛡️</text>
                  </>);
                })() : (<>
                  <ellipse cx={b.size/2} cy={b.size*1.15/2} rx={b.size/2} ry={b.size*1.15/2} fill={shieldFlash?"rgba(200,220,255,0.4)":"rgba(155,164,181,0.18)"} style={{transition:"fill 0.2s ease"}}/>
                  <ellipse cx={b.size/2} cy={b.size*1.15/2} rx={b.size/2} ry={b.size*1.15/2} fill="none" stroke={shieldFlash?"#fff":"#9BA4B5"} strokeWidth="2.5" style={{transition:"stroke 0.2s ease"}}/>
                  <ellipse cx={b.size/2} cy={b.size*0.18} rx={b.size*0.28} ry={b.size*0.06} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
                  <text x={b.size/2} y={b.size*1.15/2+4} textAnchor="middle" dominantBaseline="middle" fontSize={b.size*0.3}>🛡️</text>
                </>)}
              </svg>
            )}
            <div style={{ width:b.size, height:b.size*1.15, background:`radial-gradient(circle at 35% 35%, ${c.highlight} 0%, ${c.color} 60%)`, borderRadius:"50% 50% 45% 45%", position:"relative", filter:doradoActive?"drop-shadow(0 4px 12px #FFD70066)":"none", cursor:"pointer", pointerEvents:punteriaActive?"none":"auto" }}
              onClick={!punteriaActive&&!gravityActive?(e)=>doPop(e.clientX,e.clientY):undefined}>
              {punteriaActive && (<>
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",borderRadius:"50% 50% 45% 45%",pointerEvents:"none",zIndex:3}}/>
                <div style={{position:"absolute",left:"50%",top:"45%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.9)",background:"rgba(255,255,255,0.15)",pointerEvents:"none",zIndex:4}}/>
                <div onClick={(e)=>{e.stopPropagation();doPop(e.clientX,e.clientY,true);}} style={{position:"absolute",left:"50%",top:"45%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:"50%",cursor:"pointer",zIndex:5,pointerEvents:"auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:"#fff",opacity:0.95}}/>
                </div>
              </>)}
              {!punteriaActive && <div style={{position:"absolute",top:"15%",left:"22%",width:"22%",height:"28%",background:"rgba(255,255,255,0.45)",borderRadius:"50%",transform:"rotate(-30deg)",pointerEvents:"none"}}/>}
              <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:8,height:8,background:c.knot,borderRadius:"50% 50% 40% 40%",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-14,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:`8px solid ${c.knot}`,pointerEvents:"none"}}/>
            </div>
          </div>
        </div>
        <svg width={svgW} height={stringLen} style={{overflow:"visible",marginTop:14,pointerEvents:"none"}} viewBox={`0 0 ${svgW} ${stringLen}`}>
          <path d={`M${svgW/2},0 Q${b.drift>0?svgW:0},${stringLen/2} ${svgW/2},${stringLen}`} stroke={c.knot+"88"} strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Balloons({ onPop, onMiss, onHit, multiplier=1, gravityActive=false, punteriaActive=false, vientoActive=false, escudoActive=false, doradoActive=false }: {
  onPop?: (amount?: number) => void;
  onMiss?: () => void;
  onHit?: () => void;
  multiplier?: number;
  gravityActive?: boolean;
  punteriaActive?: boolean;
  vientoActive?: boolean;
  escudoActive?: boolean;
  doradoActive?: boolean;
}) {
  const isMobile = useIsMobile();
  const [balloons, setBalloons] = useState<BalloonData[]>([]);
  const colorCursor = useRef(0);
  const multiplierRef = useRef(multiplier);
  multiplierRef.current = multiplier;
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const balloonsRef = useRef<BalloonData[]>([]);
  const maxOnScreenRef = useRef(BASE_MAX);
  maxOnScreenRef.current = multiplier > 1 ? AVA_MAX : BASE_MAX;
  const onMissRef = useRef(onMiss); onMissRef.current = onMiss;
  const onHitRef  = useRef(onHit);  onHitRef.current  = onHit;
  const onPopRef  = useRef(onPop);  onPopRef.current  = onPop;
  const [escudoGen, setEscudoGen] = useState(0);
  const prevEscudoRef = useRef(escudoActive);
  if (prevEscudoRef.current !== escudoActive) {
    prevEscudoRef.current = escudoActive;
    setEscudoGen(g => g+1);
  }

  const spawnOne = useCallback(() => {
    setBalloons(prev => {
      if (prev.length >= maxOnScreenRef.current) return prev;
      const b = makeBalloon(isMobileRef.current, colorCursor.current++);
      const next = [...prev, b];
      balloonsRef.current = next;
      return next;
    });
  }, []);

  const handleDone = useCallback((uid: number) => {
    setBalloons(prev => {
      const next = prev.filter(b => b.uid !== uid);
      balloonsRef.current = next;
      return next;
    });
  }, []);

  const spawnOneRef = useRef(spawnOne);
  spawnOneRef.current = spawnOne;

  // Spawn loop
  useEffect(() => {
    spawnOneRef.current();
    const interval = multiplier > 1 ? SPAWN_INTERVAL_AVA_MS : SPAWN_INTERVAL_MS;
    const id = setInterval(() => spawnOneRef.current(), interval);
    return () => clearInterval(id);
  }, [multiplier]);

  return (
    <>
      <style>{`
        @keyframes balloonRise {
          0%   { transform:translateY(0) translateX(0); opacity:0 }
          2%   { opacity:1 }
          30%  { transform:translateY(-35vh) translateX(6px) }
          60%  { transform:translateY(-70vh) translateX(-4px) }
          95%  { opacity:.8 }
          100% { transform:translateY(-115vh) translateX(0); opacity:0 }
        }
        @keyframes stringFall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 30%{transform:translateY(10px) rotate(15deg)} 100%{transform:translateY(120px) rotate(40deg);opacity:0} }
        @keyframes balloonSwayFast { 0%,100%{transform:translateX(-16px)} 50%{transform:translateX(16px)} }
      `}</style>
      {balloons.map(b => (
        <Balloon key={b.uid} b={b}
          onPop={(amt) => onPopRef.current?.(amt)}
          onHit={() => onHitRef.current?.()}
          onMiss={() => onMissRef.current?.()}
          onDone={handleDone}
          gravityActive={gravityActive} punteriaActive={punteriaActive}
          vientoActive={vientoActive} escudoActive={escudoActive} doradoActive={doradoActive}
          escudoGen={escudoGen}
        />
      ))}
    </>
  );
}