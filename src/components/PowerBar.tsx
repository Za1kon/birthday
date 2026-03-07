"use client";

import { useEffect, useRef, useState } from "react";
import { POWERS, COOLDOWN_MS, COOLDOWN_MS_BY_ID, getCooldownEnd, setCooldownEnd, isOnCooldown, isUnlocked } from "@/lib/powers";

// ─── Power toast descriptions ─────────────────────────────────────────────────

const POWER_TOAST_DATA: Record<string, { emoji: string; name: string; desc: string }> = {
  avalanche: { emoji: "🌊", name: "Avalancha",      desc: "x3 objetivos por 15s" },
  punteria:  { emoji: "🎯", name: "Puntería",       desc: "hitbox mínima — cada acierto x5 por 30s" },
  viento:    { emoji: "💨", name: "Viento",          desc: "targets se mecen x2 por 30s" },
  escudo:    { emoji: "🛡️", name: "Escudo",          desc: "2 clicks por target por 30s" },
  dorado:    { emoji: "✨", name: "Toque de Oro",    desc: "¡todo dorado! x5 por 1 minuto" },
  gravity:   { emoji: "🧲", name: "NoobTrainer",    desc: "hitbox ampliada por 15s" },
};

// ─── Power toast component ────────────────────────────────────────────────────

function PowerToast({ activeId }: { activeId: string | null }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{ emoji: string; name: string; desc: string } | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!activeId) return;
    const toastData = POWER_TOAST_DATA[activeId];
    if (!toastData) return;
    clearTimeout(timerRef.current);
    setData(toastData);
    setVisible(true);
    timerRef.current = window.setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timerRef.current);
  }, [activeId]);

  if (!visible || !data) return null;

  return (
    <div style={{
      position:"fixed", top:"42%", left:"50%",
      transform:"translateX(-50%)",
      zIndex:9000, pointerEvents:"none",
      textAlign:"center",
      animation:"powerToastIn 2s ease forwards",
    }}>
      <div style={{
        background:"rgba(255,255,255,0.96)",
        border:"2px solid #FFD6E0",
        borderRadius:18,
        padding:"14px 24px 12px",
        boxShadow:"0 8px 32px rgba(201,74,106,0.18), 0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          fontFamily:"'Lilita One',cursive",
          fontSize:"clamp(22px,6vw,38px)",
          color:"#c94a6a",
          textShadow:"0 2px 16px rgba(201,74,106,0.15)",
          lineHeight:1.1,
        }}>
          {data.emoji} {data.name}
        </div>
        <div style={{
          fontFamily:"'Nunito',sans-serif",
          fontWeight:700,
          fontSize:"clamp(11px,3vw,15px)",
          color:"#7a2eb3",
          marginTop:5,
        }}>
          {data.desc}
        </div>
      </div>
    </div>
  );
}

// ─── Cooldown fill ────────────────────────────────────────────────────────────

function CooldownFill({ endTime, size, id }: { endTime: number; size: number; id: string }) {
  const remaining = Math.max(0, endTime - Date.now());
  const totalMs = COOLDOWN_MS_BY_ID[id] ?? COOLDOWN_MS;
  const elapsed = totalMs - remaining;
  const startPct = (elapsed / totalMs) * 100;
  const keyframe = `cdFill_${id}`;
  return (
    <>
      <style>{`
        @keyframes ${keyframe} {
          from { height: ${startPct}% }
          to   { height: 100% }
        }
      `}</style>
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        height:"100%", overflow:"hidden", pointerEvents:"none", borderRadius:8,
      }}>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"#c94a6a",
          animation:`${keyframe} ${remaining}ms linear forwards`,
          opacity:0.7,
        }}/>
      </div>
    </>
  );
}

function CooldownText({ endTime }: { endTime: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, endTime - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <div style={{
      position:"absolute", bottom:2, left:0, right:0,
      textAlign:"center", fontFamily:"'Nunito',sans-serif",
      fontWeight:900, fontSize:9, color:"#fff",
      textShadow:"0 1px 3px rgba(0,0,0,0.8)",
      letterSpacing:0.5, lineHeight:1,
    }}>
      {mins}:{String(secs).padStart(2,"0")}
    </div>
  );
}

// ─── Key bindings: Q W E A S D → powers[0..5] ────────────────────────────────

const POWER_KEYS = ["Q", "W", "E", "A", "S", "D"];
const KEY_TO_POWER: Record<string, string> = Object.fromEntries(
  POWERS.map((p, i) => [POWER_KEYS[i], p.id])
);

// ─── Single power icon ────────────────────────────────────────────────────────

function PowerIcon({ power, keyLabel, size, count, bestStreak, onActivate, active, isMobile, blocked }: {
  power: typeof POWERS[0];
  keyLabel?: string;
  size: number;
  count: number | null;
  bestStreak: number | null;
  onActivate: (id: string) => void;
  active: boolean;
  isMobile?: boolean;
  blocked?: boolean;
}) {
  const unlocked = isUnlocked(power, count, bestStreak);
  const [cooldownEnd, setCooldownEndState] = useState(0);
  const [onCD, setOnCD] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const end = getCooldownEnd(power.id);
    setCooldownEndState(end);
    setOnCD(end > Date.now());
  }, [power.id, active]);

  useEffect(() => {
    if (!onCD) return;
    const id = setInterval(() => {
      if (!isOnCooldown(power.id)) { setOnCD(false); clearInterval(id); }
    }, 1000);
    return () => clearInterval(id);
  }, [onCD, power.id]);

  const handleClick = () => {
    if (!unlocked || onCD || active || blocked) return;
    setCooldownEnd(power.id);
    const end = getCooldownEnd(power.id);
    setCooldownEndState(end);
    setOnCD(true);
    onActivate(power.id);
  };

  const locked = !unlocked;
  const disabled = locked || onCD || active || blocked;

  const tooltipText = blocked
    ? "No compatible con el poder activo"
    : locked
    ? (power.unlocksAt < 0
        ? `Se desbloquea con racha de 50`
        : `Se desbloquea a los ${power.unlocksAt.toLocaleString()} puntos`)
    : onCD ? power.name
    : power.description || power.name;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position:"relative", width:size, height:size,
        borderRadius:10,
        background: blocked ? "#fff0cc"
          : locked ? "#e0e0e088"
          : onCD   ? "#e0e0e0cc"
          : active  ? "#c94a6acc"
          :           "#fff",
        border: blocked ? "2px solid #e0a000"
          : locked ? "2px solid #ccc"
          : `2px solid #c94a6a${unlocked ? "cc" : "44"}`,
        boxShadow: blocked ? "0 2px 12px rgba(224,160,0,0.25)"
          : unlocked && !locked ? "0 2px 12px rgba(201,74,106,0.25)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"transform 0.15s, box-shadow 0.15s",
        transform: !disabled ? "scale(1)" : "scale(0.95)",
        overflow:"visible",
        filter: locked ? "grayscale(1) opacity(0.5)" : blocked ? "grayscale(0.4) opacity(0.7)" : "none",
        zIndex: showTooltip ? 600 : "auto",
      }}
    >
      {keyLabel && (
        <div style={{
          position:"absolute", top:4, right:4,
          fontFamily:"'Nunito',sans-serif", fontWeight:900,
          fontSize:8, lineHeight:1,
          color: locked ? "#bbb" : "#c94a6a",
          background: locked ? "#e8e8e8cc" : "#ffffffcc",
          border: `1px solid ${locked ? "#ccc" : "#c94a6a33"}`,
          borderRadius:3, padding:"1px 3px",
          zIndex:3, pointerEvents:"none",
        }}>
          {keyLabel}
        </div>
      )}

      <span style={{ fontSize: locked ? 16 : 20, lineHeight:1, position:"relative", zIndex:2 }}>
        {power.emoji}
      </span>

      {blocked && (
        <div style={{
          position:"absolute", inset:0, borderRadius:8,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(255,240,200,0.5)", zIndex:3, pointerEvents:"none",
        }}>
          <span style={{ fontSize:14, lineHeight:1 }}>🚫</span>
        </div>
      )}

      {onCD && unlocked && (
        <>
          <CooldownFill endTime={cooldownEnd} size={size} id={power.id} />
          <CooldownText endTime={cooldownEnd} />
        </>
      )}

      {unlocked && !onCD && !active && count === power.unlocksAt && (
        <div style={{
          position:"absolute", inset:0, borderRadius:10,
          background:"rgba(201,74,106,0.2)",
          animation:"powerUnlock 1s ease-out forwards",
        }}/>
      )}

      {showTooltip && !isMobile && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", left:"50%",
          transform:"translateX(-50%)",
          background:"#1e0a14",
          color:"#fff",
          fontFamily:"'Nunito',sans-serif", fontWeight:700,
          fontSize:11, lineHeight:1.4,
          padding:"6px 10px", borderRadius:8,
          pointerEvents:"none",
          zIndex:600,
          boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
          border:"1px solid rgba(255,255,255,0.08)",
          maxWidth:180, whiteSpace:"normal", textAlign:"center",
        }}>
          {tooltipText}
          <div style={{
            position:"absolute", bottom:"100%", left:"50%",
            transform:"translateX(-50%)",
            width:0, height:0,
            borderLeft:"5px solid transparent",
            borderRight:"5px solid transparent",
            borderBottom:"5px solid #1e0a14",
          }}/>
        </div>
      )}
    </div>
  );
}

// ─── Achievement card ─────────────────────────────────────────────────────────

function AchievementCard({ emoji, name, unlocked, unlockedLabel, lockedLabel, description }: {
  emoji: string; name: string; unlocked: boolean;
  unlockedLabel: string; lockedLabel: string; description: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius:16, padding:"16px",
      background: unlocked ? "#FFF0F4" : "#f5f5f5",
      border: `2px solid ${unlocked ? "#FFD6E0" : "#e0e0e0"}`,
      marginBottom:12,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <span style={{ fontSize:24 }}>{emoji}</span>
        <div>
          <div style={{ fontFamily:"'Lilita One',cursive", fontSize:16, color: unlocked ? "#c94a6a" : "#aaa" }}>
            {name}
          </div>
          <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:1 }}>
            {unlocked ? unlockedLabel : lockedLabel}
          </div>
        </div>
      </div>
      <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, color:"#666", lineHeight:1.5, margin:0 }}>
        {description}
      </p>
    </div>
  );
}

// ─── Achievements menu ────────────────────────────────────────────────────────

function AchievementsMenu({ count, bestStreak, onClose }: { count: number | null; bestStreak: number | null; onClose: () => void }) {
  const c = count ?? 0;
  const bs = bestStreak ?? 0;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998, display:"flex" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)" }}/>
      <div style={{
        position:"relative", zIndex:1,
        width: 290, height:"100%",
        background:"#fff",
        boxShadow:"4px 0 24px rgba(0,0,0,0.12)",
        display:"flex", flexDirection:"column",
        padding:"24px 20px",
        overflowY:"auto",
        animation:"slideInLeft 0.25s cubic-bezier(0.34,1.2,0.64,1) both",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ fontFamily:"'Lilita One',cursive", fontSize:22, color:"#c94a6a" }}>🏆 Logros</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#999" }}>✕</button>
        </div>

        <AchievementCard
          emoji={c >= 1000 ? "🌊" : "🔒"}
          name="Avalancha"
          unlocked={c >= 1000}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Falta ${(1000 - c).toLocaleString()} puntos`}
          description={<>Llegá a <strong>1.000 puntos</strong> para desbloquear Avalancha — x3 targets por 15s.</>}
        />

        <AchievementCard
          emoji={c >= 2500 ? "🎯" : "🔒"}
          name="Puntería"
          unlocked={c >= 2500}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Falta ${(2500 - c).toLocaleString()} puntos`}
          description={<>Llegá a <strong>2.500 puntos</strong> para desbloquear Puntería — hitbox mínima pero x5 por acierto, 30s.</>}
        />

        <AchievementCard
          emoji={c >= 5000 ? "💨" : "🔒"}
          name="Viento"
          unlocked={c >= 5000}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Falta ${(5000 - c).toLocaleString()} puntos`}
          description={<>Llegá a <strong>5.000 puntos</strong> para desbloquear Viento — targets que se mecen x2 por 30s.</>}
        />

        <AchievementCard
          emoji={c >= 10000 ? "🛡️" : "🔒"}
          name="Escudo"
          unlocked={c >= 10000}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Falta ${(10000 - c).toLocaleString()} puntos`}
          description={<>Llegá a <strong>10.000 puntos</strong> para desbloquear Escudo — los targets necesitan 2 clicks para caer, 30s.</>}
        />

        <AchievementCard
          emoji={c >= 20000 ? "✨" : "🔒"}
          name="Toque de Oro"
          unlocked={c >= 20000}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Falta ${(20000 - c).toLocaleString()} puntos`}
          description={<>Llegá a <strong>20.000 puntos</strong> para desbloquear el Toque de Oro — ¡todo se vuelve dorado! x5 por 1 minuto.</>}
        />

        <AchievementCard
          emoji={bs >= 50 ? "🧲" : "🔒"}
          name="NoobTrainer"
          unlocked={bs >= 50}
          unlockedLabel="✅ Desbloqueado"
          lockedLabel={`🔒 Mejor racha: ${bs}/50`}
          description={<>Conseguí una racha de <strong>50 objetivos</strong> sin que ninguno escape para desbloquear NoobTrainer — hitbox ampliada.</>}
        />
      </div>
    </div>
  );
}

// ─── Main PowerBar ────────────────────────────────────────────────────────────

export default function PowerBar({ count, bestStreak, onActivate, activeId, blockedId }: {
  count: number | null;
  bestStreak: number | null;
  onActivate: (id: string) => void;
  activeId: string | null;
  blockedId?: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const onActivateRef = useRef(onActivate);
  useEffect(() => { onActivateRef.current = onActivate; }, [onActivate]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      const powerId = KEY_TO_POWER[key];
      if (!powerId) return;
      const power = POWERS.find(p => p.id === powerId);
      if (!power) return;
      const unlocked = isUnlocked(power, count, bestStreak);
      if (!unlocked) return;
      if (isOnCooldown(power.id)) return;
      if (activeId === power.id) return;
      setCooldownEnd(power.id);
      onActivateRef.current(powerId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, count, bestStreak, activeId]);

  return (
    <>
      <style>{`
        @keyframes powerUnlock {
          0%   { transform:scale(1);   opacity:1 }
          100% { transform:scale(2.5); opacity:0 }
        }
        @keyframes slideInLeft {
          from { transform:translateX(-100%) }
          to   { transform:translateX(0) }
        }
        @keyframes powerToastIn {
          0%   { opacity:0; transform:translateX(-50%) scale(0.85) }
          20%  { opacity:1; transform:translateX(-50%) scale(1.05) }
          35%  {            transform:translateX(-50%) scale(1) }
          75%  { opacity:1 }
          100% { opacity:0; transform:translateX(-50%) scale(0.95) }
        }
      `}</style>

      <PowerToast activeId={activeId} />

      <div style={{
        position:"fixed", top:16, right:16,
        display:"grid",
        gridTemplateColumns:`repeat(3, ${isMobile ? 44 : 56}px)`,
        gap:6,
        zIndex:500,
      }}>
        {POWERS.map((p, i) => (
          <PowerIcon
            key={p.id}
            power={p}
            keyLabel={isMobile ? undefined : POWER_KEYS[i]}
            size={isMobile ? 44 : 56}
            count={count}
            bestStreak={bestStreak}
            onActivate={onActivate}
            active={activeId === p.id}
            isMobile={isMobile}
            blocked={blockedId === p.id}
          />
        ))}
      </div>

      <div style={{ position:"fixed", top:16, left:16, zIndex:500 }}>
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            width:44, height:44, borderRadius:10,
            background:"#fff", border:"2px solid #FFD6E0",
            boxShadow:"0 2px 12px rgba(201,74,106,0.15)",
            cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:20,
          }}
        >
          {isMobile ? "☰" : "🏆"}
        </button>
      </div>

      {menuOpen && (
        <AchievementsMenu count={count} bestStreak={bestStreak} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}