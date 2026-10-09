// 三选一同款卡面(354×483): HandCard(华丽费用宝石) + 钢框叠加(PickCardRim) + 可选紫色霓虹选中框(PickSelectFrame)。
// 卡面放大的字号 / 徽章 / 配色钩子由 PickCardFace.module.css 自带下发, 不依赖外层网格, 别的面板可直接复用。
// ⚠ 钢框与选中框按 354×483 坐标绘制: 想要更小的卡面请在外层整体 transform 缩放, 不要改 --hand-card-w。
// ★ 老手牌卡面的各种特殊态(稀有度 / 打不出 / 被动 / 升级 / 污染 / 激活 / 模组 / 标记 / 培育 / 缠根 / 星辉 / 共鸣 / 离场)
//   在本皮肤里各有一份新版: 钢框配色走 face/pickFaceTone.ts 派生的 look, 线稿走 face/PickRimDecor,
//   角标走 face/PickFaceCorner + face/PickFaceBadges(右上: 病毒/模组) + face/PickFaceMarks(卡外左上: 缠根/标记/培育/共鸣),
//   缠根覆层走 face/PickRooted; 对 HandCard 内部件的改写在 face/PickFaceStates.module.css。
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import { cx } from "@/ui/common/shared/cx";
import { PickCardRim } from "./parts/PickCardRim";
import { PickSelectFrame } from "./parts/PickSelectFrame";
import { pickRimLook } from "./face/pickFaceTone";
import { PickRimDecor } from "./face/PickRimDecor";
import { PickFaceCorner } from "./face/PickFaceCorner";
import { PickFaceBadges } from "./face/PickFaceBadges";
import { PickFaceMarks, pickMarkSockets } from "./face/PickFaceMarks";
import { PickRooted } from "./face/PickRooted";
import s from "./PickCardFace.module.css";
import st from "./face/PickFaceStates.module.css";

/** hover = 钢框提亮 + 淡紫细线; selected = 暗紫钢框 + 霓虹选中框呼吸。 */
export type PickCardState = "hover" | "selected" | null;
/** 离场演出: leave = 出牌出鞘; discard = 弃牌白光; purge = 所属角色阵亡碎裂。 */
export type PickCardExit = "leave" | "discard" | "purge";
/** 战斗标记(缠根 / 卡牌标记 / 培育 / 共鸣)的落位: outside = 卡外左上一行(手牌); inside = 并进右上徽记列(网格里卡上方没空位)。 */
export type PickCardMarksAt = "outside" | "inside";

interface Props {
  card: Card;
  state?: PickCardState;
  /** false = 不挂霓虹选中框(只展示卡面时)。 */
  selectFrame?: boolean;
  /** 以下与 HandCard 同名 prop 同义; 缺省 = 可打出、无额外收益。 */
  playable?: boolean;
  unaffordable?: boolean;
  activated?: boolean;
  cost?: number;
  starPay?: number;
  onRootRelease?: (uid: string) => void;
  rootReleaseDisabled?: boolean;
  exit?: PickCardExit | null;
  /** 离场演出播完(整张卡已不可见)。 */
  onExited?: (uid: string) => void;
  marks?: PickCardMarksAt;
}

export function PickCardFace({
  card,
  state = null,
  selectFrame = true,
  playable = true,
  unaffordable,
  activated = false,
  cost,
  starPay = 0,
  onRootRelease,
  rootReleaseDisabled,
  exit = null,
  onExited,
  marks = "outside",
}: Props) {
  const look = pickRimLook(card, { playable, unaffordable, activated });
  const effectiveCost = cost ?? card.cost;

  return (
    <div
      className={cx(s.face, st.states)}
      data-state={state ?? undefined}
      data-activated={activated ? "" : undefined}
      data-exit={exit ?? undefined}
      onTransitionEnd={(event) => {
        if (exit === "leave" && event.target === event.currentTarget && event.propertyName === "transform") onExited?.(card.uid);
      }}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if ((exit === "discard" && event.animationName.includes("pickFaceDiscard"))
          || (exit === "purge" && event.animationName.includes("pickFaceShatter"))) onExited?.(card.uid);
      }}
    >
      <HandCard
        card={card}
        variant="pile"
        playable={playable}
        unaffordable={unaffordable}
        selected={false}
        activated={activated}
        cost={cost}
        starPay={starPay}
        ornateCost
      />
      {card.rooted && <PickRooted uid={card.uid} onRelease={onRootRelease} disabled={rootReleaseDisabled} />}
      <PickCardRim state={state} look={look} />
      <PickRimDecor look={look} activated={activated} />
      <PickFaceCorner card={card} cost={effectiveCost} starPay={starPay} />
      <PickFaceBadges card={card} extra={marks === "inside" ? pickMarkSockets(card, "left") : undefined} />
      {marks === "outside" && <PickFaceMarks card={card} />}
      {selectFrame && <PickSelectFrame state={state} />}
    </div>
  );
}
