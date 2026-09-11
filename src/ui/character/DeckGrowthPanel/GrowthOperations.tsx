import type { Card } from "@/engine";
import { RULES } from "@/engine";
import { ExpShardGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { DeckCard } from "@/ui/character/DeckCard";
import { HoldButton } from "@/ui/common/HoldButton";
import { GrowthGlyph } from "./GrowthGlyph";
import s from "./GrowthOperations.module.css";

interface Props {
  mode: "draw" | "remove";
  cost: number;
  disabled: boolean;
  reason?: string;
  pending?: boolean;
  preview?: Card;
  deckSize: number;
  minDeckSize: number;
  onAction: () => void;
}

export function GrowthOperations({ mode, cost, disabled, reason, pending, preview, deckSize, minDeckSize, onAction }: Props) {
  const drawing = mode === "draw";
  return <section className={s.column} data-mode={mode} aria-label={drawing ? "抽卡" : "删卡"}>
    <h3 className={s.heading}><GrowthGlyph kind={mode} />{drawing ? "抽卡" : "删卡"}</h3>
    <div className={s.stage}>
      {drawing ? <div className={s.fan} aria-hidden="true">
        <span className={s.back}><GrowthGlyph kind="growth" /></span>
        <span className={s.back}><GrowthGlyph kind="growth" /></span>
        <span className={s.back}><GrowthGlyph kind="growth" /><span>霓虹都市</span></span>
        <span className={s.orbit} />
      </div> : preview ? <DeckCard card={preview} index={0} selected={false} focusStyle="none" /> : <p className={s.note}>当前卡组为空</p>}
    </div>
    <div className={s.badge}>{drawing ? `抽取 ${RULES.deck.drawChoices} 张候选 · 选择一张` : `当前 ${deckSize} 张 · 至少保留 ${minDeckSize} 张`}</div>
    <div className={s.cost}><ExpShardGlyph /><span>{pending && drawing ? "已支付经验" : "本次消耗"}</span>{!(pending && drawing) && <><strong>{cost}</strong><span>经验</span></>}</div>
    <p className={s.note}>{reason ?? (drawing ? "扩充卡组，寻找新的战术可能" : "选择要移除的卡牌，精简你的卡组")}</p>
    {drawing && !pending ? (
      <HoldButton className={s.action} disabled={disabled} onComplete={onAction} aria-label="长按抽卡">
        <GrowthGlyph kind={mode} />长按抽卡
      </HoldButton>
    ) : (
      <button className={s.action} type="button" disabled={disabled} onClick={onAction}><GrowthGlyph kind={mode} />{drawing ? "继续选卡" : "删卡"}</button>
    )}
  </section>;
}
