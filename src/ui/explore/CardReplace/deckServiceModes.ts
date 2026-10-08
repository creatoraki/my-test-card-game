// 卡组面板的四种服务: 文案与舱位事实表。弹窗骨架(DeckServiceModal)不按服务分支写文案, 统一从这里取。
import { cardDisplayName, RULES, type Card } from "@/engine";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import type { CharacterState } from "@/store/town/townTypes";
import type { ChamberFact } from "./ReplaceChamber";
import type { DeckSlotLabels } from "./ReplaceDeckGrid";

export type DeckServiceMode = "replace" | "remove" | "copy" | "draw";

export interface DeckServiceText {
  title: string;
  /** 舱位名称。 */
  chamber: string;
  caption: string;
  doneCaption: string;
  slot: DeckSlotLabels;
  /** 舱位为空时的提示。 */
  emptyText: string;
  /** 底栏: 尚未放入卡牌时的引导。 */
  prompt: string;
  /** 底栏: 已放入卡牌时的说明。 */
  picked: (card: Card) => string;
  doneNote: string;
  /** 工具栏计数后缀, 如「可替换」。 */
  countLabel: string;
  confirm: string;
  abandon: string;
}

export const DECK_SERVICE_TEXT: Record<DeckServiceMode, DeckServiceText> = {
  replace: {
    title: "普通卡替换",
    chamber: "置换舱",
    caption: "选择一张卡牌放入置换舱，它会被替换为一张随机普通卡，原卡及其模组一并移除。",
    doneCaption: "置换舱已完成本次置换。",
    slot: { idle: "点击放入置换舱", picked: "已放入置换舱" },
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入置换舱",
    picked: (card) => `确认后「${cardDisplayName(card)}」将被移除`,
    doneNote: "置换完成，原卡及其模组已移除",
    countLabel: "可替换",
    confirm: "确认替换",
    abandon: "放弃置换",
  },
  remove: {
    title: "删牌",
    chamber: "删除舱",
    caption: "选择一张卡牌放入删除舱，确认后它会连同模组一起从卡组中移除。",
    doneCaption: "删除舱已完成本次删除。",
    slot: { idle: "点击放入删除舱", picked: "已放入删除舱" },
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入删除舱",
    picked: (card) => `确认后「${cardDisplayName(card)}」及其模组将被删除`,
    doneNote: "删除完成",
    countLabel: "可删除",
    confirm: "确认删除",
    abandon: "放弃删牌",
  },
  copy: {
    title: "卡牌复制",
    chamber: "复制舱",
    caption: "选择一张卡牌放入复制舱，确认后获得一张干净的同名卡，不继承模组与污染。",
    doneCaption: "复制舱已完成本次复制。",
    slot: { idle: "点击放入复制舱", picked: "已放入复制舱" },
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入复制舱",
    picked: (card) => `确认后获得一张干净的「${cardDisplayName(card)}」`,
    doneNote: "复制完成，新卡已加入卡组",
    countLabel: "可复制",
    confirm: "确认复制",
    abandon: "放弃复制",
  },
  draw: {
    title: "三选一抽牌",
    chamber: "抽牌舱",
    caption: "选择一名角色，确认后从其专属候选中三选一，领取一张加入卡组。",
    doneCaption: "",
    slot: { idle: "", picked: "" },
    emptyText: `确认后生成${RULES.deck.drawChoices}张候选`,
    prompt: "切换页签选择要抽牌的角色",
    picked: () => "",
    doneNote: "",
    countLabel: "",
    confirm: "生成候选",
    abandon: "放弃抽牌",
  },
};

/** 舱位事实表: 把这次服务的结果范围、模组去向逐条列出。 */
export function chamberFacts(mode: DeckServiceMode, character: CharacterState | undefined, card: Card | null, ownerName: string): ChamberFact[] {
  const deckSize = character?.deck.length ?? 0;
  const cardName = card ? `「${cardDisplayName(card)}」` : "未选择";
  if (mode === "replace") {
    const candidates = character && card ? commonReplaceCandidates(character, card.uid).length : 0;
    return [
      { label: "放入卡牌", value: cardName },
      { label: "置换结果", value: card ? `随机普通卡 · ${candidates} 种可能` : "随机普通卡" },
      { label: "原卡模组", value: card ? (card.cardModule ? "将随原卡一并移除" : "无模组") : "—", tone: card?.cardModule ? "warn" : undefined },
    ];
  }
  if (mode === "remove") {
    return [
      { label: "删除卡牌", value: cardName },
      { label: "删除后卡组", value: `${card ? deckSize - 1 : deckSize} 张 · 至少保留 ${character?.minDeckSize ?? 0} 张` },
      { label: "原卡模组", value: card ? (card.cardModule ? "将随原卡一并移除" : "无模组") : "—", tone: card?.cardModule ? "warn" : undefined },
    ];
  }
  if (mode === "copy") {
    return [
      { label: "复制卡牌", value: cardName },
      { label: "获得", value: card ? "干净的同名卡" : "—" },
      { label: "模组与污染", value: "不继承" },
    ];
  }
  return [
    { label: "抽牌角色", value: ownerName },
    { label: "候选", value: `${RULES.deck.drawChoices} 张专属卡三选一` },
    { label: "当前卡组", value: `${deckSize} 张` },
  ];
}
