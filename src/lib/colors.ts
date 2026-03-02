// ─── Shared color palette ─────────────────────────────────────────────────────
// Used by both Countdown and Celebration

export const PALETTE = [
  { bg: "#FFD6E0", text: "#c94a6a" },
  { bg: "#D6F0FF", text: "#2e7eaa" },
  { bg: "#D6FFE8", text: "#2e8a55" },
  { bg: "#FFF3D6", text: "#b37a00" },
  { bg: "#EDD6FF", text: "#7a2eb3" },
  { bg: "#FFE8D6", text: "#b35a00" },
];

export const BACKGROUND_GRADIENT = `
  radial-gradient(ellipse at 20% 0%,  #FFD6E0 0%, transparent 50%),
  radial-gradient(ellipse at 80% 100%, #D6F0FF 0%, transparent 50%),
  radial-gradient(ellipse at 50% 50%,  #FFF3D6 0%, transparent 70%),
  #FFF5F8
`.trim();