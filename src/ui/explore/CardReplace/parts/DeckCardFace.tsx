// 卡组面板的卡面皮肤: 卡组柜 / 培养舱 / 舱内演出共用同一个卡面出口, 由 DeckServiceModal 的 cardSkin 统一切换。
//   · hand = 原手牌卡面(220×308);
//   · pick = 三选一同款卡面(354×483, 华丽宝石 + 钢框 + 紫色霓虹选中框), 整体缩到 220 宽(220×300)并在 220×308 卡位里垂直居中。
// 两种皮肤都按 220×308 卡位占位, 外层缩放 / 落位 / 演出遮罩不用改。
import { createContext, useContext } from "react";
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import { PickCardFace, type PickCardState } from "@/ui/common/card/CardRewardPicker";
import s from "./DeckCardFace.module.css";

export type DeckCardSkin = "hand" | "pick";

const DeckCardSkinContext = createContext<DeckCardSkin>("hand");
export const DeckCardSkinProvider = DeckCardSkinContext.Provider;
export const useDeckCardSkin = () => useContext(DeckCardSkinContext);

interface Props {
  card: Card;
  /** 只对 pick 皮肤生效: 钢框 / 霓虹选中框的状态。 */
  state?: PickCardState;
  /** 只对 pick 皮肤生效: false = 不挂霓虹选中框。 */
  selectFrame?: boolean;
}

export function DeckCardFace({ card, state = null, selectFrame = false }: Props) {
  const skin = useDeckCardSkin();
  if (skin === "hand") return <HandCard card={card} variant="pile" playable selected={false} />;
  return (
    <div className={s.slot}>
      <div className={s.pick}>
        <PickCardFace card={card} state={state} selectFrame={selectFrame} />
      </div>
    </div>
  );
}
