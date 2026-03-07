"use client";

import { useEffect, useState } from "react";
import { warmUpAudio } from "@/lib/audio";
import { useCounter } from "@/lib/counter";
import { useStreak } from "@/lib/streak";
import { POWERS } from "@/lib/powers";
import CounterDisplay from "@/components/CounterDisplay";
import StreakDisplay from "@/components/StreakDisplay";
import PowerBar from "@/components/PowerBar";
import Garland from "@/components/Garland";
import Balloons from "./Balloons";
import Confetti from "./Confetti";
import Banners from "./Banners";
import FallingLetters from "./FallingLetters";
import MainCard from "./MainCard";

export default function Celebration() {
  const { count, increment } = useCounter();
  const { current: streak, best: bestStreak, hit, miss } = useStreak();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [gravityActive, setGravityActive] = useState(false);
  const [punteriaActive, setPunteriaActive] = useState(false);
  const [vientoActive, setVientoActive] = useState(false);
  const [escudoActive, setEscudoActive] = useState(false);
  const [doradoActive, setDoradoActive] = useState(false);

  const handleActivate = (id: string) => {
    const power = POWERS.find(p => p.id === id);
    if (!power) return;
    if (id === "punteria" && gravityActive) return;
    if (id === "gravity" && punteriaActive) return;
    setActiveId(id);
    const dur = power.duration;
    if (id === "gravity") {
      setGravityActive(true);
      setTimeout(() => { setGravityActive(false); setActiveId(null); }, dur);
    } else if (id === "punteria") {
      setPunteriaActive(true);
      setTimeout(() => { setPunteriaActive(false); setActiveId(null); }, dur);
    } else if (id === "viento") {
      setVientoActive(true);
      setTimeout(() => { setVientoActive(false); setActiveId(null); }, dur);
    } else if (id === "escudo") {
      setEscudoActive(true);
      setTimeout(() => { setEscudoActive(false); setActiveId(null); }, dur);
    } else if (id === "dorado") {
      setDoradoActive(true);
      setTimeout(() => { setDoradoActive(false); setActiveId(null); }, dur);
    } else if (id === "avalanche") {
      setMultiplier(power.multiplier);
      setTimeout(() => { setMultiplier(1); setActiveId(null); }, dur);
    }
  };

  useEffect(() => {
    document.title = "¡Feliz Cumple Agostina! 🎉";
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel="icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎂</text></svg>";
    const unlock = () => { warmUpAudio(); document.removeEventListener("touchstart", unlock); document.removeEventListener("mousedown", unlock); };
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("mousedown", unlock, { passive: true });
    return () => { document.removeEventListener("touchstart", unlock); document.removeEventListener("mousedown", unlock); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; user-select:none; -webkit-user-select:none; }

        .celebration-root {
          min-height: 100svh;
          background:
            radial-gradient(ellipse at 20% 0%,  #FFD6E0 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, #D6F0FF 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%,  #FFF3D6 0%, transparent 70%),
            #FFF5F8;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding: clamp(48px,8vh,80px) 16px clamp(24px,4vh,48px);
          position:relative; overflow:hidden;
        }

        @keyframes bannerDrop   { from{transform:translateY(-280px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes sway         { from{transform:rotate(-4deg)} to{transform:rotate(4deg)} }
        @keyframes confettiFall { from{transform:translate3d(0,-20px,0) rotate(0deg)} to{transform:translate3d(0,110vh,0) rotate(720deg)} }
        @keyframes mainDrop     { from{transform:translateY(-60px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse        { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes fadeOverlay  { from{opacity:0} to{opacity:1} }
        @keyframes cardPopIn    { from{transform:scale(0.75) translateY(24px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }

        .main-card {
          animation: mainDrop 0.8s 1s cubic-bezier(0.34,1.56,0.64,1) both, pulse 3s 2s ease-in-out infinite;
          will-change: transform;
          background: #fff;
          border-radius: clamp(20px, 4vw, 36px);
          padding: clamp(32px,5vw,56px) clamp(24px,6vw,72px) clamp(24px,5vw,48px);
          padding-top: clamp(40px,6vw,64px);
          box-shadow: 0 20px 60px rgba(201,74,106,0.13), 0 4px 16px rgba(0,0,0,0.05);
          text-align:center; position:relative; z-index:5;
          width: min(92vw, 480px);
          border: 2px solid #FFD6E0;
          overflow:visible;
        }
        @media (max-width: 639px) {
          .main-card { animation: mainDrop 0.8s 1s cubic-bezier(0.34,1.56,0.64,1) both; }
        }
        .card-eyebrow { font-family:'Nunito',sans-serif; font-weight:900; font-size:clamp(9px,2.5vw,11px); letter-spacing:4px; text-transform:uppercase; color:#c94a6a; opacity:.6; margin-bottom:4px; animation:mainDrop .5s 1s both; }
        .card-name    { font-family:'Lilita One',cursive; font-size:clamp(32px,9vw,68px); color:#c94a6a; line-height:1; text-shadow:0 3px 16px rgba(201,74,106,0.18); animation:mainDrop .6s 1.1s cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-divider { display:flex; align-items:center; gap:8px; margin:clamp(10px,2vw,14px) 0; animation:mainDrop .5s 1.2s both; }
        .card-divider-line { flex:1; height:1.5px; background:linear-gradient(to right,transparent,#FFD6E0,transparent); }
        .card-divider-dot  { width:5px; height:5px; border-radius:50%; background:#c94a6a; opacity:.4; }
        .card-feliz   { font-family:'Lilita One',cursive; font-size:clamp(22px,6vw,46px); color:#7a2eb3; line-height:1.15; animation:mainDrop .6s 1.25s cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-seal    { position:relative; width:90px; height:90px; margin:clamp(10px,2vw,16px) auto 0; animation:mainDrop .6s 1.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-seal-inner { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
        .card-age-number { font-family:'Lilita One',cursive; font-size:clamp(22px,5vw,34px); color:#c94a6a; line-height:1; }
        .card-age-label  { font-family:'Nunito',sans-serif; font-weight:900; font-size:clamp(8px,2vw,11px); color:#7a2eb3; letter-spacing:1px; text-transform:uppercase; }
        .card-stars   { font-size:clamp(16px,4vw,20px); margin-top:clamp(8px,1.5vw,14px); letter-spacing:6px; animation:mainDrop .5s 1.55s both; opacity:.7; }
      `}</style>

      <CounterDisplay value={count} />
      <StreakDisplay current={streak} best={bestStreak} />
      <PowerBar count={count} bestStreak={bestStreak} onActivate={handleActivate} activeId={activeId}
        blockedId={gravityActive ? "punteria" : punteriaActive ? "gravity" : null} />
      <div className="celebration-root">
        <Garland zIndex={30} />
        <Balloons onPop={increment} onHit={hit} onMiss={miss} multiplier={multiplier} gravityActive={gravityActive} punteriaActive={punteriaActive} vientoActive={vientoActive} escudoActive={escudoActive} doradoActive={doradoActive} />
        <Confetti />
        <FallingLetters />
        <Banners />
        <MainCard />
      </div>
    </>
  );
}