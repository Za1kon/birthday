"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/lib/hooks";
import { playEnvelopeSound } from "@/lib/audio";

const LETTER_TYPES = [
  { id:"red",   envColor:"#E85D5D", envDark:"#B23A3A", paperBg:"#FFF1F1", accent:"#C44545", emoji:"💀", title:"Un Deseo",    message:"Que este año esté lleno de gore que te haga reír hasta que te duela la panza #ElGoreMeDaRisa (por no decir más) ¡Feliz cumple! 🩸" },
  { id:"purple", envColor:"#D4AAFF", envDark:"#8e44c9", paperBg:"#F5F0FF", accent:"#7a2eb3", emoji:"🌟", title:"Una Oscuridad",   message:"Hay dos, dos que tienen sus propios problemas y los dos son como son, eso los juntó y así encajan perfecto 🌟" },
  { id:"blue",   envColor:"#A8D8FF", envDark:"#2e7eaa", paperBg:"#F0F8FF", accent:"#2e7eaa", emoji:"⚔️", title:"Una Fantasía", message:'Prometo que este año vas a poder ganarme en algún juego. Pero a final de año seguro manca de mrd ahre 💀💀💀' },
  { id:"green",  envColor:"#A8FFD4", envDark:"#2e8a55", paperBg:"#F0FFF8", accent:"#2e8a55", emoji:"🌿", title:"¿Te Gustó La Sorpresa?",  message:"Te la saco? Te la pongo? Te garcho? Me amas? Te la chupo? Te quiero? Te recontramega doy cariño? 🌿" },
  { id:"yellow", envColor:"#FFE8A8", envDark:"#b37a00", paperBg:"#FFFBF0", accent:"#b37a00", emoji:"🌻", title:"Lista De Nombres",  message:"Larry Capija, Rosa Melano, Dolores Delano, Tomás Turbado, Elver Galarga, Benito Camelo, Agostina Se Arrima 🎀" },
  { id:"pink",  envColor:"#F8BBD0", envDark:"#D81B60", paperBg:"#FFF0F6", accent:"#EC407A", emoji:"❤️", title:"TQM",     message:"Quiero mejorar con vos y crecer con vos, que seamos los mejores, aunque vos ya sos la mejor. Te quiero un monton ❤️" },
];
type LetterType = typeof LETTER_TYPES[0];
interface LetterCard { uid:number; typeIndex:number; x:number; }

const CARD_FALL_DURATION = 8000;

function EnvelopeShape({ t, small }: { t:LetterType; small?:boolean }) {
  const w = small ? 60 : 100, h = small ? 44 : 72;
  return (
    <div style={{ width:w, height:h, position:"relative", flexShrink:0 }}>
      <div style={{ position:"absolute", inset:0, background:t.envColor, borderRadius:6, border:`1.5px solid ${t.envDark}55`, boxShadow:`0 4px 12px ${t.envDark}22` }}/>
      <div style={{ position:"absolute", bottom:0, left:0, width:"50%", height:"52%", borderRight:`1.5px solid ${t.envDark}44`, borderTop:`1.5px solid ${t.envDark}44` }}/>
      <div style={{ position:"absolute", bottom:0, right:0, width:"50%", height:"52%", borderLeft:`1.5px solid ${t.envDark}44`, borderTop:`1.5px solid ${t.envDark}44` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"48%", background:t.envDark, opacity:.8, clipPath:"polygon(0 0,100% 0,50% 100%)", borderRadius:"6px 6px 0 0" }}/>
      <div style={{ position:"absolute", top:"34%", left:"50%", transform:"translate(-50%,-50%)", width:small?14:18, height:small?14:18, borderRadius:"50%", background:t.envDark, opacity:.85, display:"flex", alignItems:"center", justifyContent:"center", fontSize:small?8:10 }}>
        {t.emoji}
      </div>
    </div>
  );
}

function LetterModal({ t, onClose }: { t:LetterType; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, animation:"fadeOverlay 0.2s ease both" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.paperBg, border:`2px solid ${t.accent}33`, borderRadius:24, padding:"32px 28px", maxWidth:320, width:"88%", boxShadow:`0 32px 80px ${t.accent}44`, animation:"cardPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both", textAlign:"center", position:"relative", overflow:"hidden" }}>
        {[0,1,2,3,4].map(i => <div key={i} style={{ position:"absolute", left:24, right:24, top:124+i*26, height:1, background:t.accent+"1a", pointerEvents:"none" }}/>)}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><EnvelopeShape t={t} small/></div>
        <div style={{ fontFamily:"'Lilita One',cursive", fontSize:24, color:t.accent, marginBottom:12 }}>{t.title}</div>
        <p style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:15, color:"#555", lineHeight:1.7, position:"relative" }}>{t.message}</p>
        <button onClick={onClose} style={{ marginTop:20, background:t.accent, color:"#fff", border:"none", borderRadius:100, padding:"10px 28px", fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:13, letterSpacing:2, cursor:"pointer", textTransform:"uppercase" }}>Cerrar ✕</button>
      </div>
    </div>
  );
}

function FallingCard({ card, onOpen, onDone, isMobile }: {
  card:LetterCard; onOpen:(uid:number)=>void; onDone:(uid:number)=>void; isMobile:boolean;
}) {
  const t = LETTER_TYPES[card.typeIndex];
  const progressRef   = useRef(0);
  const pausedRef     = useRef(false);
  const lastTimeRef   = useRef<number|null>(null);
  const rafRef        = useRef<number>(0);
  const divRef        = useRef<HTMLDivElement>(null);
  const doneCalledRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const totalY = window.innerHeight + 160;
    const tick = (now:number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (!pausedRef.current) {
        progressRef.current = Math.min(1, progressRef.current + dt / CARD_FALL_DURATION);
      }
      const p = progressRef.current;
      const translateY = p * (totalY + 110);
      // Only translateY in rAF — rotation handled by CSS animation on child
      if (divRef.current) {
        divRef.current.style.transform = `translateY(${translateY}px)`;
      }
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        onDone(card.uid);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [card.uid, onDone]);

  const openedRef = useRef(false);
  const onOpenRef = useRef(onOpen);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);

  const doOpen = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    playEnvelopeSound();
    onOpenRef.current(card.uid);
  };

  useEffect(() => {
    const el = divRef.current; if (!el) return;
    let sx=0, sy=0;
    const onTs = (e: TouchEvent) => { sx=e.touches[0].clientX; sy=e.touches[0].clientY; e.preventDefault(); };
    const onTe = (e: TouchEvent) => {
      e.preventDefault();
      if (Math.abs(e.changedTouches[0].clientX-sx)<15 && Math.abs(e.changedTouches[0].clientY-sy)<15) doOpen();
    };
    el.addEventListener("touchstart", onTs, { passive:false });
    el.addEventListener("touchend",   onTe, { passive:false });
    return () => { el.removeEventListener("touchstart",onTs); el.removeEventListener("touchend",onTe); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.uid]);

  return (
    <div
      ref={divRef}
      style={{
        position:"fixed", left:`${card.x}%`, top:"-110px",
        zIndex:50, willChange:"transform", touchAction:"none",
      }}
    >
      {/* Child handles rotation via CSS — keeps both transforms GPU-composited */}
      <div
        onClick={doOpen}
        onMouseEnter={() => { pausedRef.current = true; setHovered(true); }}
        onMouseLeave={() => { pausedRef.current = false; lastTimeRef.current = null; setHovered(false); }}
        style={{
          cursor:"pointer", pointerEvents:"auto",
          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
          animation:`letterSway ${CARD_FALL_DURATION}ms linear forwards`,
          animationPlayState: hovered ? "paused" : "running",
          willChange:"transform",
          marginLeft: isMobile ? -30 : -50, // half of envelope width to center it
        }}
      >
        <div style={{ position:"relative" }}>
          {hovered && (
            <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)",
              fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:10,
              color:t.accent, letterSpacing:1.5, textTransform:"uppercase",
              background:"#fff", padding:"2px 8px", borderRadius:100,
              border:`1px solid ${t.accent}33`, whiteSpace:"nowrap",
              animation:"fadeOverlay 0.15s ease both", boxShadow:`0 2px 8px ${t.envDark}33`, pointerEvents:"none" }}>
              toca para abrir ✉️
            </div>
          )}
          <div style={{ outline: hovered ? `3px solid ${t.envDark}66` : "none", borderRadius:6,
            boxShadow: hovered ? `0 6px 20px ${t.envDark}44` : "none", transition:"box-shadow 0.15s, outline 0.15s" }}>
            <EnvelopeShape t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FallingLetters() {
  const isMobile = useIsMobile();
  const [cards, setCards] = useState<LetterCard[]>([]);
  const [openedType, setOpenedType] = useState<LetterType|null>(null);
  const counterRef = useRef(0);

  const spawnCard = useCallback(() => {
    const uid = counterRef.current++;
    const typeIndex = Math.floor(Math.random() * LETTER_TYPES.length);
    const envelopeW = isMobile ? 60 : 100; // matches EnvelopeShape width
    const safePct = (envelopeW / window.innerWidth) * 100;
    const side = Math.random() < 0.5;
    const x = isMobile
      ? (side ? 2 + Math.random()*10 : Math.min(88 - safePct, 65) + Math.random()*8)
      : (side ? 2 + Math.random()*20 : Math.min(100 - safePct, 72) + Math.random()*18);
    setCards(prev => [...prev.slice(-16), { uid, typeIndex, x }]);
  }, [isMobile]);

  const spawnRef = useRef(spawnCard);
  useEffect(() => { spawnRef.current = spawnCard; }, [spawnCard]);

  useEffect(() => {
    const initial = window.setTimeout(() => spawnRef.current(), 800);
    const t = { id: 0 as number };
    const scheduleNext = () => {
      t.id = window.setTimeout(() => {
        if (!document.hidden) spawnRef.current();
        scheduleNext();
      }, 2000 + Math.random() * 2500);
    };
    scheduleNext();
    const handleVisibility = () => { if (!document.hidden) { clearTimeout(t.id); scheduleNext(); } };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { clearTimeout(initial); clearTimeout(t.id); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  const handleDone = useCallback((uid:number) => setCards(prev => prev.filter(c=>c.uid!==uid)), []);
  const handleOpen = (uid:number) => {
    const card = cards.find(c=>c.uid===uid);
    if (!card) return;
    setOpenedType(LETTER_TYPES[card.typeIndex]);
    setCards(prev => prev.filter(c=>c.uid!==uid));
  };

  return (
    <>
      <style>{`
        @keyframes letterSway {
          0%   { transform: rotate(-18deg) }
          48%  { transform: rotate(18deg)  }
          100% { transform: rotate(-12deg) }
        }
      `}</style>
      {cards.map(card => <FallingCard key={card.uid} card={card} onOpen={handleOpen} onDone={handleDone} isMobile={isMobile}/>)}
      {openedType && <LetterModal t={openedType} onClose={()=>setOpenedType(null)}/>}
    </>
  );
}