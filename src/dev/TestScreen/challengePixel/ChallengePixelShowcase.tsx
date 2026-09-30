import { useState } from "react";
import { CHALLENGE_DEFS, CHALLENGE_POOL, type ChallengeId } from "@/engine";
import { GLYPH_SIZE, PixelGlyph, getChallengeGlyph } from "@/ui/art/challenge";
import s from "./ChallengePixelShowcase.module.css";

/** 主图放大 6 倍, 小样给 1× / 2× 原尺寸; 全部为整数倍, 保证像素锐利。 */
const HERO_SIZE = GLYPH_SIZE * 6;
const PREVIEW_SIZES = [GLYPH_SIZE, GLYPH_SIZE * 2];

/** 按掉落加成从低到高排, 与 defs 分档一致。 */
const ORDERED_IDS = [...CHALLENGE_POOL].sort(
  (a, b) => CHALLENGE_DEFS[a].dropBonus - CHALLENGE_DEFS[b].dropBonus,
);

function ChallengeCard({ id, broken, onToggle }: { id: ChallengeId; broken: boolean; onToggle: () => void }) {
  const def = CHALLENGE_DEFS[id];
  const grid = getChallengeGlyph(id);
  return (
    <button type="button" className={s.card} data-broken={broken} onClick={onToggle}>
      <div className={s.stage}>
        <PixelGlyph className={s.hero} grid={grid} gridSize={GLYPH_SIZE} size={HERO_SIZE} broken={broken} />
      </div>
      <div className={s.head}>
        <span className={s.name}>{def.title}</span>
        <span className={s.bonus}>+{def.dropBonus.toFixed(1)}</span>
      </div>
      <p className={s.desc}>{def.desc}</p>
      <div className={s.sizes}>
        {PREVIEW_SIZES.map((size) => (
          <PixelGlyph key={size} grid={grid} gridSize={GLYPH_SIZE} size={size} broken={broken} />
        ))}
        <span className={s.state}>{broken ? "已打破" : "进行中"}</span>
      </div>
    </button>
  );
}

export function ChallengePixelShowcase() {
  const [brokenIds, setBrokenIds] = useState<ReadonlySet<ChallengeId>>(new Set());
  const toggle = (id: ChallengeId) => setBrokenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>挑战词条 · 像素图标</h1>
        <p className={s.hint}>32×32 像素 1:1 画布，多色阶明暗 + 深色描边。点击卡片切换“已打破”状态，悬停查看跳动。</p>
        <div className={s.actions}>
          <button type="button" className={s.action} onClick={() => setBrokenIds(new Set())}>全部完好</button>
          <button type="button" className={s.action} onClick={() => setBrokenIds(new Set(ORDERED_IDS))}>全部打破</button>
        </div>
      </header>
      <div className={s.grid}>
        {ORDERED_IDS.map((id) => (
          <ChallengeCard key={id} id={id} broken={brokenIds.has(id)} onToggle={() => toggle(id)} />
        ))}
      </div>
    </div>
  );
}
