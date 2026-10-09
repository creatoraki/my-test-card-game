// 战斗手牌托盘里的一张牌: 托盘交互壳(命中区 / 悬停上弹 / 邻卡让位 / 发牌飞入 / 模式徽章) + 新皮肤卡面(CardFace)。
// 三层: .slot(永不位移的命中区, 吃悬停 / 点击 / 层序 / 鱼鳞叠版式) → .mover(悬停上弹与邻卡让位) → .deal(发牌飞入)。
//   ⚠ 壳不能跟着卡动: 卡上弹后若命中区跟着走, 光标会掉出卡外 ⇒ 落回 ⇒ 又盖住光标 ⇒ 无限抖动(老 HandCard 同理)。
// 悬停直接写进 handFocusStore(详情面板 / 队伍槽高亮各自订阅), 不经父级冒泡; 本组件只用本地 state 驱动钢框提亮。
// 出牌 / 弃牌 / 阵亡离场演出交给新卡面的 exit(整张卡含钢框一起走), 播完回调 onExited。
import { memo, useEffect, useState, type CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { playSfx } from "@/ui/audio";
import { clearHandHover, setHandHover } from "@/ui/battle/state/handFocusStore";
import { CardFace } from "@/ui/common/card/CardFace";
import type { PickCardExit } from "@/ui/common/card/CardRewardPicker";
import { cx } from "@/ui/common/shared/cx";
import { HandTrayAction, type HandTrayActionKind } from "./HandTrayAction";
import s from "./HandTrayCard.module.css";

interface Props {
  card: Card;
  playable: boolean;
  /** 费用不足仍可点击查看提示。 */
  unaffordable?: boolean;
  selected: boolean;
  leaving?: boolean;
  discarding?: boolean;
  purged?: boolean;
  /** 抽牌飞入的绝对延迟(ms), 由父级按批次计算。 */
  dealDelay?: number;
  onExited?: (uid: string) => void;
  onClick?: (uid: string) => void;
  actionBadge?: HandTrayActionKind | null;
  onAction?: (uid: string) => void;
  cost?: number;
  starPay?: number;
  activated?: boolean;
  onRootRelease?: (uid: string) => void;
  rootReleaseDisabled?: boolean;
}

export const HandTrayCard = memo(function HandTrayCard({
  card,
  playable,
  unaffordable,
  selected,
  leaving,
  discarding,
  purged,
  dealDelay,
  onExited,
  onClick,
  actionBadge,
  onAction,
  cost,
  starPay = 0,
  activated,
  onRootRelease,
  rootReleaseDisabled,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const passive = card.cardType === "passive";
  const effectiveCost = cost ?? card.cost;
  const exit: PickCardExit | null = purged ? "purge" : discarding ? "discard" : leaving ? "leave" : null;
  const showAction = Boolean(actionBadge) && !leaving && !card.rooted;

  useEffect(() => {
    if (dealDelay === undefined) return;
    const timer = window.setTimeout(() => playSfx("cardDraw"), Math.max(0, dealDelay));
    return () => window.clearTimeout(timer);
  }, [card.uid, dealDelay]);

  const style = {
    ["--owner-color" as string]: getCharacter(card.ownerCharId).color,
    ["--deal-delay" as string]: `${dealDelay ?? 0}ms`,
  } as CSSProperties;

  return (
    <div
      className={cx(s.slot, (playable || unaffordable || passive) && s.playable)}
      style={style}
      data-tray-slot
      data-selected={selected ? "" : undefined}
      data-leaving={leaving || discarding || purged ? "" : undefined}
      data-action={showAction ? "" : undefined}
      onMouseEnter={() => {
        if (leaving) return;
        setHovered(true);
        playSfx("cardHover");
        setHandHover(card, effectiveCost);
      }}
      onMouseLeave={() => {
        setHovered(false);
        clearHandHover(card);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (leaving) return;
        onClick?.(card.uid);
      }}
    >
      {showAction && actionBadge && <HandTrayAction kind={actionBadge} onAction={() => onAction?.(card.uid)} />}
      <div className={s.mover}>
        <div className={s.deal}>
          <CardFace
            card={card}
            state={selected ? "selected" : hovered && !leaving ? "hover" : null}
            selectFrame
            playable={playable}
            unaffordable={unaffordable}
            activated={activated}
            cost={cost}
            starPay={starPay}
            onRootRelease={onRootRelease}
            rootReleaseDisabled={rootReleaseDisabled}
            exit={exit}
            onExited={onExited}
            marks="outside"
          />
        </div>
      </div>
    </div>
  );
});
