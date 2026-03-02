"use client";

import { useEffect, useState } from "react";
import Countdown from "@/components/countdown/Countdown";
import Celebration from "@/components/celebration/Celebration";

export default function Page() {
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const target = new Date("2026-03-18T00:00:00");
    const now = new Date();
    if (now >= target) { setIsBirthday(true); return; }
    const id = setInterval(() => {
      if (new Date() >= target) { clearInterval(id); setIsBirthday(true); }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return isBirthday ? <Celebration /> : <Countdown />;
}