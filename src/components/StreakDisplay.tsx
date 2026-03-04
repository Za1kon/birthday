"use client";

import { useEffect, useRef, useState } from "react";

export default function StreakDisplay({ current, best }: { current: number; best: number | null }) {
  // Local best that updates instantly (same pattern as CounterDisplay)
  const [localBest, setLocalBest] = useState(best);
  const prevBestRef = useRef(best);

  useEffect(() => {
    if (best !== prevBestRef.current) {
      prevBestRef.current = best;
      setLocalBest(best);
    }
  }, [best]);

  // Also update local best immediately when current streak exceeds it
  useEffect(() => {
    if (localBest === null || current > localBest) setLocalBest(current);
  }, [current, localBest]);

  return (
    <div style={{
      position: "fixed", top: "clamp(44px, 8vw, 72px)", left: "50%",
      transform: "translateX(-50%)",
      zIndex: 201, pointerEvents: "none",
      textAlign: "center",
      fontFamily: "'Nunito', sans-serif",
    }}>
      {current > 1 && (
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(13px,3vw,18px)",
          color: "#7a2eb3",
          lineHeight: 1,
          textShadow: "0 1px 6px rgba(122,46,179,0.15)",
        }}>
          ¡Que no se caigan! {current} 🔥
        </div>
      )}
      {localBest !== null && (
        <div style={{
          fontWeight: 700,
          fontSize: "clamp(9px,2vw,11px)",
          color: "#b37a00",
          letterSpacing: 1,
          textTransform: "uppercase",
          opacity: 0.75,
          marginTop: 2,
        }}>
          mejor racha: {localBest}
        </div>
      )}
    </div>
  );
}