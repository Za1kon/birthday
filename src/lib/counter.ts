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

export async function incrementCount(): Promise<number> {
  const { data } = await supabase.rpc("increment_counter");
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
        (payload: any) => { setCount((payload.new as any).value); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const flushPending = useCallback(async () => {
    if (flushingRef.current || pendingRef.current === 0) return;
    flushingRef.current = true;
    const toFlush = pendingRef.current;
    pendingRef.current = 0;
    for (let i = 0; i < toFlush; i++) {
      const newVal = await incrementCount();
      setCount(newVal);
    }
    flushingRef.current = false;
    if (pendingRef.current > 0) flushPending();
  }, []);

  const increment = useCallback(() => {
    setCount(c => (c ?? 0) + 1);
    pendingRef.current++;
    flushPending();
  }, [flushPending]);

  return { count, increment };
}