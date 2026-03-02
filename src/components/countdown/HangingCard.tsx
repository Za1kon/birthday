"use client";

import { PALETTE } from "@/lib/colors";

const BANNER_COLORS = PALETTE;

export default function HangingCard({ value, label, color, delay, swayDelay }: {
  value: string; label: string; color: typeof BANNER_COLORS[0]; delay: number; swayDelay: number;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", animationDelay:`${delay}s` }} className="hang-in">
      <div style={{ width:2, height:48, background:"linear-gradient(to bottom,#c94a6a55,#c94a6a22)", borderRadius:1 }}/>
      <div className="sway" style={{
        animationDelay:`${swayDelay}s`, background:color.bg,
        border:`2px solid ${color.text}22`, borderRadius:16,
        boxShadow:`0 8px 32px ${color.text}22, 0 2px 8px rgba(0,0,0,0.08)`,
        padding:"24px 32px 20px", display:"flex", flexDirection:"column",
        alignItems:"center", gap:4, minWidth:140, position:"relative",
      }}>
        <div style={{ position:"absolute", top:-10, width:12, height:12, borderRadius:"50%",
          background:"#fff", border:`2px solid ${color.text}44`, boxShadow:"inset 0 1px 3px rgba(0,0,0,0.15)" }}/>
        <span style={{ fontFamily:"'Lilita One',cursive", fontSize:"clamp(48px,8vw,80px)",
          color:color.text, lineHeight:1, letterSpacing:"-2px" }}>{value}</span>
        <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13,
          color:color.text, textTransform:"uppercase", letterSpacing:"3px", opacity:0.75 }}>{label}</span>
      </div>
    </div>
  );
}