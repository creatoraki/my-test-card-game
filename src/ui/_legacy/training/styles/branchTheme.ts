// 六条训练链的表现色。色相保持在青绿范围, 只负责视觉区分。
export const BRANCH_HUE: Record<string, { hue: string; deep: string }> = {
  handLimit: { hue: "#2ab7a9", deep: "#0f716d" },
  redraw: { hue: "#42ae9c", deep: "#286e68" },
  wait: { hue: "#1baab7", deep: "#176d78" },
  mana: { hue: "#249dca", deep: "#1a6681" },
  draw: { hue: "#5ca98e", deep: "#3a745e" },
  openingHand: { hue: "#78b38a", deep: "#4b755d" },
};