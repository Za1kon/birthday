"use client";

import { useEffect, useRef, useState } from "react";

export default function CounterDisplay({ value }: { value: number | null }) {
  const prevRef = useRef(value);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      if (value !== null) { setBump(true); setTimeout(() => setBump(false), 300); }
    }
  }, [value]);

  if (value === null) return null;

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%",
      zIndex: 201, pointerEvents: "none",
      fontFamily: "'Lilita One',cursive",
      fontSize: "clamp(28px,6vw,52px)",
      color: "#c94a6a",
      textShadow: "0 2px 12px rgba(201,74,106,0.2)",
      lineHeight: 1,
      transform: bump ? "translateX(-50%) scale(1.3)" : "translateX(-50%) scale(1)",
      transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {value}
    </div>
  );
}