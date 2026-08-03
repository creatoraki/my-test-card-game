// 战斗签符号的卡面美术查表。与 ui/eventArt.ts / ui/cardArt.ts 同一条线:
// **美术只挂在 UI 层**, 不往 explore/types.ts 的 SlotSymbol 上加字段 ——
// 符号的数据定义(data/slotSymbols.ts)描述的是规则, 换一套美术不该动到它。
//
// 现在 16 个符号(5 战斗 + 3 准备 + 8 BOSS)全指向占位图; 补正式素材时只需在这里改行。
// ⚠ 卡面美术区是**正方形**(见 SlotReels.css 的 --slot-card-w), 与 256×256 的占位素材同比。

import placeholderArt from "@/assets/占位素材.png";

const SLOT_ART: Record<string, string> = {
  // 普通轮 · 战斗卡
  "sb-steady": placeholderArt,
  "sb-tempo": placeholderArt,
  "sb-pressure": placeholderArt,
  "sb-tactics": placeholderArt,
  "sb-greed": placeholderArt,
  // 普通轮 · 战前准备卡
  "sp-supply": placeholderArt,
  "sp-intel": placeholderArt,
  "sp-retrofit": placeholderArt,
  // BOSS 轮
  "sbs-standard": placeholderArt,
  "sbs-priority": placeholderArt,
  "sbs-escort": placeholderArt,
  "sbs-overclock": placeholderArt,
  "sbs-hardened": placeholderArt,
  "sbs-degraded": placeholderArt,
  "sbs-exposed": placeholderArt,
  "sbs-scrapheap": placeholderArt,
};

export const SLOT_ART_SOURCES: readonly string[] = [...new Set(Object.values(SLOT_ART))];

// 未登记的符号回落到占位图 —— 新增符号时忘了配美术不该让整条转轮开天窗。
export function slotArt(symbolId: string): string {
  return SLOT_ART[symbolId] ?? placeholderArt;
}
