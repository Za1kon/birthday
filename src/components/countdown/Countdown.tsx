"use client";

import { useEffect, useState } from "react";
import { PALETTE } from "@/lib/colors";
import { warmUpAudio } from "@/lib/audio";
import { useCounter } from "@/lib/counter";
import CounterDisplay from "@/components/CounterDisplay";
import Garland from "@/components/Garland";
import HangingCard from "./HangingCard";
import SmashCards from "./SmashCards";
import Streamers from "./Streamers";

const BANNER_COLORS = PALETTE;
const LABELS = ["días", "horas", "minutos", "segundos"];
const TARGET = new Date("2026-03-18T00:00:00");

function pad(n: number) { return String(n).padStart(2, "0"); }
function getTimeLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function Countdown() {
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft>>(null);
  const { count, increment: handleScore } = useCounter();

  useEffect(() => {
    document.title = "Faltan...";
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel="icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⏳</text></svg>";
    const unlock = () => { warmUpAudio(); document.removeEventListener("touchstart", unlock); document.removeEventListener("mousedown", unlock); };
    document.addEventListener("touchstart", unlock, { passive: true });
    document.addEventListener("mousedown", unlock, { passive: true });
    return () => { document.removeEventListener("touchstart", unlock); document.removeEventListener("mousedown", unlock); };
  }, []);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const values = time
    ? [pad(time.days), pad(time.hours), pad(time.minutes), pad(time.seconds)]
    : ["00","00","00","00"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; user-select:none; -webkit-user-select:none; }
        body { min-height:100vh; background:#FFF5F8; }

        .countdown-root {
          min-height:100vh;
          background: radial-gradient(ellipse at 20% 0%,#FFD6E0 0%,transparent 50%),
                      radial-gradient(ellipse at 80% 100%,#D6F0FF 0%,transparent 50%),
                      radial-gradient(ellipse at 50% 50%,#FFF3D6 0%,transparent 70%),
                      #FFF5F8;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:80px 24px 60px; position:relative; overflow:hidden;
        }

        @keyframes dropIn    { from{transform:translateY(-120px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes sway      { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes pieceFly  { 0%{transform:translate(0,0) rotate(0deg);opacity:1} 100%{transform:translate(var(--pdx),var(--pdy)) rotate(var(--prot));opacity:0} }
        @keyframes popText   { 0%{transform:translateY(0) scale(1);opacity:1} 60%{transform:translateY(-16px) scale(1.3);opacity:1} 100%{transform:translateY(-30px) scale(.8);opacity:0} }

        .hang-in { animation:dropIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both; }
        .sway    { animation:sway 4s ease-in-out infinite; transform-origin:top center; }
        .cards-row { display:flex; gap:clamp(16px,4vw,48px); flex-wrap:wrap; justify-content:center; margin-top:32px; }
      `}</style>

      <CounterDisplay value={count} />
      <Garland zIndex={200} top={0} />
      <Garland zIndex={200} top={44} />
      <SmashCards onScore={handleScore} />

      <div className="countdown-root">
        <div className="title-drop" style={{
          fontFamily:"'Lilita One',cursive", fontSize:"clamp(32px,7vw,64px)",
          color:"#c94a6a", textAlign:"center", lineHeight:1.1,
          textShadow:"0 4px 16px rgba(201,74,106,0.15)", marginBottom:8,
        }}>Faltan...</div>

        <div className="cards-row">
          {values.map((val,i) => (
            <HangingCard key={i} value={val} label={LABELS[i]}
              color={BANNER_COLORS[i]} delay={i*0.12} swayDelay={i*0.8}/>
          ))}
        </div>

        <Streamers />
      </div>
    </>
  );
}