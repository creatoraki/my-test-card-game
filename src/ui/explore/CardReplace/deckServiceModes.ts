// 卡组面板的三种服务: 文案与舱位事实表。弹窗骨架(DeckServiceModal)不按服务分支写文案, 统一从这里取。
import { cardDisplayName, type Card } from "@/engine";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import type { CharacterState } from "@/store/town/townTypes";
import type { ChamberFact } from "./ReplaceChamber";
import type { ReplacePhase } from "./useReplaceSequence";

export type DeckServiceMode = "replace" | "remove" | "copy";

export interface DeckServiceText {
  title: string;
  /** 舱位名称。 */
  chamber: string;
  caption: string;
  doneCaption: string;
  /** 卡位读屏提示。 */
  slotAction: string;
  /** 舱位为空时的提示。 */
  emptyText: string;
  /** 底栏: 尚未放入卡牌时的引导。 */
  prompt: string;
  /** 底栏: 已放入卡牌时的说明。 */
  picked: (card: Card) => string;
  /** 底栏: 演出各分镜的进度说明。 */
  phaseNote: Partial<Record<ReplacePhase, string>>;
  /** 底栏: 演出结束后的结论。 */
  summary: (before: Card | undefined, after: Card | undefined, ownerName: string) => string;
  /** 工具栏计数后缀, 如「可替换」。 */
  countLabel: string;
  confirm: string;
  abandon: string;
}

const name = (card: Card | undefined) => (card ? cardDisplayName(card) : "—");

export const DECK_SERVICE_TEXT: Record<DeckServiceMode, DeckServiceText> = {
  replace: {
    title: "普通卡替换",
    chamber: "置换舱",
    caption: "选择一张卡牌放入置换舱，它会被替换为一张随机普通卡，原卡及其模组一并移除。",
    doneCaption: "置换舱已完成本次置换。",
    slotAction: "放入置换舱",
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入置换舱",
    picked: (card) => `确认后「${cardDisplayName(card)}」将被移除`,
    phaseNote: { scan: "正在解析原卡结构……", dissolve: "原卡溶解中……", form: "新卡成形中……", settle: "置换完成" },
    summary: (before, after, owner) => `「${name(before)}」已替换为「${name(after)}」，新卡已加入${owner}的卡组`,
    countLabel: "可替换",
    confirm: "确认替换",
    abandon: "放弃置换",
  },
  remove: {
    title: "删牌",
    chamber: "删除舱",
    caption: "选择一张卡牌放入删除舱，确认后它会连同模组一起从卡组中移除。",
    doneCaption: "删除舱已完成本次删除。",
    slotAction: "放入删除舱",
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入删除舱",
    picked: (card) => `确认后「${cardDisplayName(card)}」及其模组将被删除`,
    phaseNote: { scan: "正在解析卡牌结构……", dissolve: "卡牌分解中……", settle: "删除完成" },
    summary: (before, _after, owner) => `「${name(before)}」已从${owner}的卡组中删除`,
    countLabel: "可删除",
    confirm: "确认删除",
    abandon: "放弃删牌",
  },
  copy: {
    title: "卡牌复制",
    chamber: "复制舱",
    caption: "选择一张卡牌放入复制舱，确认后获得一张干净的同名卡，不继承模组与污染。",
    doneCaption: "复制舱已完成本次复制。",
    slotAction: "放入复制舱",
    emptyText: "从左侧选择一张卡牌",
    prompt: "点击卡牌放入复制舱",
    picked: (card) => `确认后获得一张干净的「${cardDisplayName(card)}」`,
    phaseNote: { scan: "正在解析卡牌结构……", form: "复制件成形中……", settle: "复制完成" },
    summary: (_before, after, owner) => `已获得「${name(after)}」，新卡已加入${owner}的卡组`,
    countLabel: "可复制",
    confirm: "确认复制",
    abandon: "放弃复制",
  },
};

/** 舱位事实表: 把这次服务的结果范围、模组去向逐条列出。 */
export function chamberFacts(mode: DeckServiceMode, character: CharacterState | undefined, card: Card | null): ChamberFact[] {
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
  return [
    { label: "复制卡牌", value: cardName },
    { label: "获得", value: card ? "干净的同名卡" : "—" },
    { label: "模组与污染", value: "不继承" },
  ];
}

/** 结果阶段的舱位事实表: 演出未结束时结果一栏显示进度, 结束后写明结果。 */
export function resultFacts(mode: DeckServiceMode, before: Card | undefined, after: Card | undefined, done: boolean): ChamberFact[] {
  const moduleFact: ChamberFact = { label: "原卡模组", value: before?.cardModule ? "已随原卡移除" : "无模组", tone: before?.cardModule ? "warn" : undefined };
  if (mode === "replace") {
    return [
      { label: "放入卡牌", value: `「${name(before)}」` },
      done ? { label: "置换结果", value: `「${name(after)}」`, tone: "good" } : { label: "置换结果", value: "重构中……" },
      moduleFact,
    ];
  }
  if (mode === "remove") {
    return [
      { label: "删除卡牌", value: `「${name(before)}」` },
      done ? { label: "处理结果", value: "已删除", tone: "good" } : { label: "处理结果", value: "分解中……" },
      moduleFact,
    ];
  }
  return [
    { label: "复制卡牌", value: `「${name(before ?? after)}」` },
    done ? { label: "获得", value: `「${name(after)}」`, tone: "good" } : { label: "获得", value: "成形中……" },
    { label: "模组与污染", value: "不继承" },
  ];
}
