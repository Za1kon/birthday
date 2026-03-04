import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const STREAK_UNLOCK = 50;

// ─── Supabase helpers ─────────────────────────────────────────────────────────

export async function fetchBestStreak(): Promise<number> {
  const { data } = await supabase.from("streak").select("best").eq("id", 1).single();
  return data?.best ?? 0;
}

export async function submitStreak(value: number): Promise<number> {
  const { data } = await supabase.rpc("update_streak_if_better", { new_val: value });
  return typeof data === "number" ? data : 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStreak() {
  const [current, setCurrent] = useState(0);   // current live streak
  const [best, setBest] = useState<number | null>(null);  // global best from Supabase
  const currentRef = useRef(0);

  useEffect(() => { fetchBestStreak().then(setBest); }, []);

  // Realtime: update best if another device beats it
  useEffect(() => {
    const channel = supabase
      .channel("streak-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "streak" },
        (payload: any) => { setBest((payload.new as any).best); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const hit = useCallback(() => {
    const next = currentRef.current + 1;
    currentRef.current = next;
    setCurrent(next);
    // Submit to Supabase — it only updates if it's a new best
    submitStreak(next).then(newBest => setBest(newBest));
  }, []);

  const miss = useCallback(() => {
    currentRef.current = 0;
    setCurrent(0);
  }, []);

  return { current, best, hit, miss };
}