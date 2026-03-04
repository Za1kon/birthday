"use client";

import { useEffect } from "react";

export default function TrackVisit() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}