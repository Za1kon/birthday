// ─── Powers / Milestones system ───────────────────────────────────────────────

export const COOLDOWN_MS = 1 * 60 * 1000; // 1 minute (default)

export const COOLDOWN_MS_BY_ID: Record<string, number> = {
  punteria: 3 * 60 * 1000, // 3 minutes
};

export interface Power {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocksAt: number; // count milestone
  multiplier: number; // spawn rate multiplier when active
}

export const POWERS: Power[] = [
  {
    id: "avalanche",
    name: "Avalancha",
    emoji: "🌊",
    description: "Inunda la pantalla x3 durante 15 segundos",
    unlocksAt: 1000,
    multiplier: 3,
  },
  {
    id: "punteria",
    name: "Puntería",
    emoji: "🎯",
    description: "Hitbox reducida — cada acierto vale x5 durante 15s",
    unlocksAt: 2500,
    multiplier: 1,
  },
  { id: "power3", name: "???", emoji: "🔒", description: "???", unlocksAt: 5000,  multiplier: 1 },
  { id: "power4", name: "???", emoji: "🔒", description: "???", unlocksAt: 10000, multiplier: 1 },
  { id: "power5", name: "???", emoji: "🔒", description: "???", unlocksAt: 20000, multiplier: 1 },
  {
    id: "gravity",
    name: "NoobTrainer",
    emoji: "🧲",
    unlocksAt: -1, // unlocked by streak, not points
    multiplier: 1,
  },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = (id: string) => `power_cooldown_${id}`;

export function getCooldownEnd(id: string): number {
  try {
    const v = localStorage.getItem(LS_KEY(id));
    return v ? parseInt(v) : 0;
  } catch { return 0; }
}

export function setCooldownEnd(id: string): void {
  try {
    const ms = COOLDOWN_MS_BY_ID[id] ?? COOLDOWN_MS;
    localStorage.setItem(LS_KEY(id), String(Date.now() + ms));
  } catch {}
}

export function isOnCooldown(id: string): boolean {
  return getCooldownEnd(id) > Date.now();
}

export function isUnlocked(power: Power, count: number | null, bestStreak?: number | null): boolean {
  if (power.id === "gravity") return (bestStreak ?? 0) >= 50;
  if (power.unlocksAt < 0) return false;
  return (count ?? 0) >= power.unlocksAt;
}