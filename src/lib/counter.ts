import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchCount(): Promise<number> {
  const { data } = await supabase.from("counter").select("value").eq("id", 1).single();
  return data?.value ?? 0;
}

export async function incrementCount(amount: number): Promise<number> {
  const { data } = await supabase.rpc("increment_counter", { amount });
  return typeof data === "number" ? data : 0;
}

export function useCounter() {
  const [count, setCount] = useState<number | null>(null);
  const pendingRef = useRef(0);
  const flushingRef = useRef(false);

  useEffect(() => { fetchCount().then(setCount); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("counter-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "counter" },
        (payload: any) => {
          const newVal = (payload.new as any).value;
          setCount(c => (c !== null && c > newVal) ? c : newVal);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const flushPending = useCallback(async () => {
    if (flushingRef.current || pendingRef.current === 0) return;
    flushingRef.current = true;
    const toFlush = pendingRef.current;
    pendingRef.current = 0;
    const newVal = await incrementCount(toFlush);
    setCount(c => (c !== null && c > newVal) ? c : newVal);
    flushingRef.current = false;
    if (pendingRef.current > 0) flushPending();
  }, []);

  const increment = useCallback((amount = 1) => {
    setCount(c => (c ?? 0) + amount);
    pendingRef.current += amount;
    flushPending();
  }, [flushPending]);

  return { count, increment };
}