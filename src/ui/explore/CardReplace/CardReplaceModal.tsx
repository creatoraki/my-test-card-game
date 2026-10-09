// 普通卡替换弹窗: 探索服务与战斗奖励共用, 只做换牌模式的适配, 骨架与演出见 DeckServiceModal。
// onReplace 换卡后把前后两张卡写进 action.result(待办不出队), 演出结束「完成」才由调用方把待办出队。
import { useCallback } from "react";
import type { Card } from "@/engine";
import type { CardReplaceResult, ExploreState } from "@/explore/types";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import type { CharacterState } from "@/store/town/townTypes";
import { DeckServiceModal } from "./DeckServiceModal";

/** 一次置换机会; result 写入后弹窗进入演出段。 */
export interface ReplaceCardAction {
  result?: CardReplaceResult;
}

interface Props {
  /** null = 关闭(带退场动画)。 */
  action: ReplaceCardAction | null;
  members: ExploreState["party"];
  /** 独立角色数据，用于界面演示等受控场景。 */
  characters?: Record<string, CharacterState>;
  lockedCharId: string | null;
  kicker?: string;
  paymentNote?: string;
  unavailableReason?: string | null;
  /** 执行换卡并把结果写回 action.result; 失败返回 false。 */
  onReplace: (charId: string, uid: string) => boolean;
  onFinish: () => void;
}

export function CardReplaceModal({ action, members, characters, lockedCharId, kicker = "置换协议 / 服务", paymentNote, unavailableReason, onReplace, onFinish }: Props) {
  const cardReason = useCallback((character: CharacterState, card: Card) =>
    commonReplaceCandidates(character, card.uid).length ? null : "没有可换出的普通卡", []);
  return (
    <DeckServiceModal
      mode="replace"
      open={Boolean(action)}
      result={action?.result ?? null}
      members={members}
      characters={characters}
      lockedCharId={lockedCharId}
      kicker={kicker}
      paymentNote={paymentNote}
      unavailableReason={unavailableReason}
      cardReason={cardReason}
      onConfirm={(charId, uid) => uid ? onReplace(charId, uid) : false}
      onFinish={onFinish}
    />
  );
}
