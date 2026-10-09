// 一组对照: 左 = 老皮肤(手牌卡面 220×308, 等比放大到与新皮肤同宽 354), 右 = 新皮肤(三选一卡面 354×483)。
// 两张卡吃同一份样本与交互态; 离场样本由父级循环推进 exit, 每轮用 key 重新挂载。
import { useState } from "react";
import type { Card } from "@/engine";
import { HandCard } from "@/ui/common/card/HandCard";
import { PickCardFace, type PickCardExit, type PickCardState } from "@/ui/common/card/CardRewardPicker";
import type { SkinSample } from "./skinStateSamples";
import s from "./SkinPair.module.css";

export type Interaction = "none" | "hover" | "selected";

interface Props {
  sample: SkinSample;
  card: Card;
  interaction: Interaction;
  exit: PickCardExit | null;
}

const noop = () => {};

export function SkinPair({ sample, card, interaction, exit }: Props) {
  const [pointerHover, setPointerHover] = useState(false);
  const p = sample.props ?? {};
  const playable = p.playable ?? true;
  const cost = p.costDelta ? Math.max(0, card.cost + p.costDelta) : undefined;
  const selected = sample.selected || interaction === "selected";
  const newState: PickCardState = selected ? "selected" : interaction === "hover" || pointerHover ? "hover" : null;

  return (
    <div className={s.pair}>
      <section className={s.column}>
        <h2 className={s.heading}>老皮肤 · 手牌卡面</h2>
        <div className={s.stage}>
          <div className={s.oldScale}>
            <HandCard
              card={card}
              variant="hand"
              playable={playable}
              selected={selected}
              activated={p.activated}
              cost={cost}
              starPay={p.starPay}
              leaving={exit != null}
              discarding={exit === "discard"}
              purged={exit === "purge"}
              onRootRelease={p.rootRelease ? noop : undefined}
            />
          </div>
        </div>
        <p className={s.note}>{sample.oldNote}</p>
      </section>

      <section className={s.column}>
        <h2 className={s.heading}>新皮肤 · 三选一卡面</h2>
        <div className={s.stage} onMouseEnter={() => setPointerHover(true)} onMouseLeave={() => setPointerHover(false)}>
          <div className={s.newBox}>
            <PickCardFace
              card={card}
              state={newState}
              playable={playable}
              activated={p.activated}
              cost={cost}
              starPay={p.starPay}
              exit={exit}
              onRootRelease={p.rootRelease ? noop : undefined}
            />
          </div>
        </div>
        <p className={s.note}>{sample.newNote}</p>
      </section>
    </div>
  );
}
