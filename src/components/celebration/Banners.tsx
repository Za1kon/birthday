"use client";

import { useEffect, useState } from "react";
import { PALETTE } from "@/lib/colors";
import { useIsMobile } from "@/lib/hooks";

const BANNER_COLORS = PALETTE;
const BANNER_WORDS = ["🎂", "Feliz", "Cumple!", "🎉", "Feliz", "Cumple!", "🥳", "🎈"];

interface FallingBanner {
  id:number; word:string; x:number; hangHeight:number;
  color:(typeof BANNER_COLORS)[0]; delay:number; duration:number;
  rotation:number; size:number; stringLength:number; swayDuration:number;
}

const BANNERS_DESKTOP = {
  positions: [2, 10, 18, 26, 68, 76, 84, 92],
  heights:   [0, 120, 60, 180, 80, 20, 150, 40],
  strings:   [60, 100, 40, 130, 70, 50, 90, 110],
};

const BANNERS_MOBILE = {
  positions: [4, 12, 68, 78],
  heights:   [0, 100, 40, 130],
  strings:   [50, 80, 60, 90],
};

function estimateTextWidth(word: string, fontSize: number) {
  return Math.ceil(word.length * fontSize * 0.65);
}

function GiftTag({ banner }: { banner: FallingBanner }) {
  const { bg, text } = banner.color;
  const textW = estimateTextWidth(banner.word, banner.size);
  const w = textW + 16;
  const h = banner.size * 2.2 + 20;
  const notch = 10, r = 10;
  const svgPath = `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - notch} L ${w/2} ${h} L 0 ${h - notch} L 0 ${r} Q 0 0 ${r} 0 Z`;
  const clipId = `gtclip-${banner.id}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible"
      style={{ animation:`sway ${banner.swayDuration}s ease-in-out infinite alternate`, transformOrigin:"top center", filter:`drop-shadow(0 5px 12px ${text}2a)` }}>
      <defs><clipPath id={clipId}><path d={svgPath}/></clipPath></defs>
      <path d={svgPath} fill={text} opacity={0.07} transform="translate(0,3)"/>
      <path d={svgPath} fill={bg} stroke={text} strokeWidth="1.5" strokeOpacity={0.22}/>
      <rect x={0} y={0} width={w} height={13} fill="white" fillOpacity={0.38} clipPath={`url(#${clipId})`}/>
      <circle cx={w/2} cy={9} r={4} fill="white" stroke={text} strokeWidth="1.2" strokeOpacity={0.4}/>
      <text x={w/2} y={h/2 + 2} textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Lilita One', cursive" fontSize={banner.size} fill={text} fillOpacity={0.88}>
        {banner.word}
      </text>
    </svg>
  );
}

function HangingBanner({ banner }: { banner: FallingBanner }) {
  return (
    <div style={{
      position:"fixed", left:`${banner.x}%`, top:banner.hangHeight,
      display:"flex", flexDirection:"column", alignItems:"center",
      animation:`bannerDrop ${banner.duration}s ${banner.delay}s cubic-bezier(0.34,1.2,0.64,1) both`,
      pointerEvents:"none", zIndex: 20 - Math.floor(banner.hangHeight / 20),
      rotate:`${banner.rotation}deg`, transformOrigin:"top center", willChange:"transform",
    }}>
      <div style={{ width:2, height:banner.stringLength, background:`linear-gradient(to bottom,${banner.color.text}55,${banner.color.text}11)` }}/>
      <GiftTag banner={banner}/>
    </div>
  );
}

export default function Banners() {
  const isMobile = useIsMobile();
  const [banners, setBanners] = useState<FallingBanner[]>([]);

  useEffect(() => {
    const cfg = isMobile ? BANNERS_MOBILE : BANNERS_DESKTOP;
    const words = isMobile ? ["🎉", "Feliz", "Cumple!", "🥳"] : BANNER_WORDS;
    setBanners(words.map((word, i) => ({
      id:i, word, x:cfg.positions[i], hangHeight:cfg.heights[i],
      color:BANNER_COLORS[i%BANNER_COLORS.length],
      delay:i*0.18, duration:0.9, rotation:-8+(i%4)*4,
      size: isMobile
        ? (["Cumple!"].includes(word) ? 16 : 16+(i%3)*6)
        : (["Cumple!"].includes(word) ? 32 : 22+(i%3)*10),
      stringLength:cfg.strings[i], swayDuration:2+(i%3)*0.7,
    })));
  }, [isMobile]);

  return <>{banners.map(b => <HangingBanner key={b.id} banner={b} />)}</>;
}