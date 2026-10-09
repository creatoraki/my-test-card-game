// 全站通用卡面: 新皮肤(PickCardFace, 354×483 设计 px)整体缩到 220 宽(220×300.2), 在 220×308 卡位里上下各留 ≈4px。
// 卡位与老手牌卡面(HandCard)同尺寸, 牌堆 / 卡组 / 详情 / 奖励等所有容器的版式、外层缩放与落位都不用改。
// 缩放走 transform, 卡内字号与钢框线宽按比例一起缩, 不重排。
// 战斗标记默认并进卡内右上徽记列(marks="inside", 网格里卡上方没空位); 手牌托盘传 "outside" 排到卡外左上。
import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { PickCardFace, type PickCardExit, type PickCardMarksAt, type PickCardState } from "@/ui/common/card/CardRewardPicker";
import { cx } from "@/ui/common/shared/cx";
import s from "./CardFace.module.css";

interface Props {
  card: Card;
  /** hover = 钢框提亮; selected = 暗紫钢框(selectFrame 时再挂霓虹选中框)。 */
  state?: PickCardState;
  selectFrame?: boolean;
  playable?: boolean;
  unaffordable?: boolean;
  activated?: boolean;
  cost?: number;
  starPay?: number;
  onRootRelease?: (uid: string) => void;
  rootReleaseDisabled?: boolean;
  exit?: PickCardExit | null;
  onExited?: (uid: string) => void;
  marks?: PickCardMarksAt;
  /** 给出即播放网格入场(上浮淡入), 值为错峰延迟(ms)。 */
  dealDelay?: number;
  className?: string;
}

export function CardFace({ dealDelay, className, selectFrame = false, marks = "inside", ...face }: Props) {
  return (
    <div
      className={cx(s.slot, className)}
      data-card-face
      data-deal={dealDelay !== undefined ? "" : undefined}
      style={dealDelay !== undefined ? ({ "--deal-delay": `${dealDelay}ms` } as CSSProperties) : undefined}
    >
      <div className={s.scale}>
        <PickCardFace {...face} selectFrame={selectFrame} marks={marks} />
      </div>
    </div>
  );
}
