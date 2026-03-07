// ─── Powers / Milestones system ───────────────────────────────────────────────

// export const COOLDOWN_MS = 1 * 60 * 1000; // 1 minute (default)
export const COOLDOWN_MS = 30 * 1000; // DEBUG: 30s

export const COOLDOWN_MS_BY_ID: Record<string, number> = {
  punteria:  3 * 60 * 1000, // 3 minutes
  viento:    3 * 60 * 1000, // 3 minutes
  escudo:    3 * 60 * 1000, // 3 minutes
  dorado:    5 * 60 * 1000, // 5 minutes
};

export interface Power {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocksAt: number;
  multiplier: number;
  duration: number;
}

export const POWERS: Power[] = [
  {
    id: "avalanche",
    name: "Avalancha",
    emoji: "🌊",
    description: "Inunda la pantalla x3 durante 15 segundos",
    unlocksAt: 1000,
    multiplier: 3,
    duration: 15_000,
  },
  {
    id: "punteria",
    name: "Puntería",
    emoji: "🎯",
    description: "Hitbox reducida — cada acierto vale x5 durante 30s",
    unlocksAt: 2500,
    multiplier: 5,
    duration: 30_000,
  },
  {
    id: "viento",
    name: "Viento",
    emoji: "💨",
    description: "Los targets se mecen x2 durante 30s — combina multiplicadores",
    unlocksAt: 5000,
    multiplier: 2,
    duration: 30_000,
  },
  {
    id: "escudo",
    name: "Escudo",
    emoji: "🛡️",
    description: "Los targets necesitan 2 clicks — más difícil, combina multiplicadores, 30s",
    unlocksAt: 10000,
    multiplier: 1,
    duration: 30_000,
  },
  {
    id: "dorado",
    name: "Toque de Oro",
    emoji: "✨",
    description: "¡Todo se vuelve dorado! x5 durante 1 minuto",
    unlocksAt: 20000,
    multiplier: 5,
    duration: 60_000,
  },
  {
    id: "gravity",
    name: "NoobTrainer",
    emoji: "🧲",
    description: "Hitbox ampliada por 15s",
    unlocksAt: -1,
    multiplier: 1,
    duration: 15_000,
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