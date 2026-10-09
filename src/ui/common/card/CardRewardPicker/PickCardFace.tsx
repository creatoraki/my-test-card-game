// 三选一同款卡面(354×483): HandCard(华丽费用宝石) + 钢框叠加(PickCardRim) + 可选紫色霓虹选中框(PickSelectFrame)。
// 卡面放大的字号 / 徽章 / 配色钩子由 PickCardFace.module.css 自带下发, 不依赖外层网格, 别的面板可直接复用。
// ⚠ 钢框与选中框按 354×483 坐标绘制: 想要更小的卡面请在外层整体 transform 缩放, 不要改 --hand-card-w。
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import { PickCardRim } from "./parts/PickCardRim";
import { PickSelectFrame } from "./parts/PickSelectFrame";
import s from "./PickCardFace.module.css";

/** hover = 钢框提亮 + 淡紫细线; selected = 暗紫钢框 + 霓虹选中框呼吸。 */
export type PickCardState = "hover" | "selected" | null;

interface Props {
  card: Card;
  state?: PickCardState;
  /** false = 不挂霓虹选中框(只展示卡面时)。 */
  selectFrame?: boolean;
}

export function PickCardFace({ card, state = null, selectFrame = true }: Props) {
  return (
    <div className={s.face}>
      <HandCard card={card} variant="pile" playable selected={false} ornateCost />
      <PickCardRim state={state} />
      {selectFrame && <PickSelectFrame state={state} />}
    </div>
  );
}
