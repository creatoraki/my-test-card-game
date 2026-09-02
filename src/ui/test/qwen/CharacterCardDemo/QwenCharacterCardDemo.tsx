import { useState } from "react";
import { CharacterCard } from "./CharacterCard";
import { CHARACTER_CARDS, DEFAULT_PARTY, PARTY_LIMIT } from "./characterCardData";
import s from "./QwenCharacterCardDemo.module.css";

export function QwenCharacterCardDemo() {
  const [party, setParty] = useState<string[]>(DEFAULT_PARTY);
  const [sweepKey, setSweepKey] = useState(0);

  const toggle = (characterId: string) => {
    setParty((currentParty) => {
      if (currentParty.includes(characterId)) {
        return currentParty.length > 1 ? currentParty.filter((id) => id !== characterId) : currentParty;
      }
      return currentParty.length < PARTY_LIMIT ? [...currentParty, characterId] : currentParty;
    });
  };

  return (
    <section className={s.root}>
      <header className={s.header}>
        <p className={s.kicker}>qwen 试验台 / 角色卡</p>
        <h1>角色立绘 · 边缘光晕卡</h1>
        <p className={s.description}>
          立绘满铺 9:16 卡面，底部渐变承载角色名、上阵状态和编队操作。默认前 3 人上阵；队伍最多 3 人，且至少保留 1 人。
        </p>
      </header>

      <div className={s.stage}>
        <div className={s.stageArt} aria-hidden="true" />
        <div className={s.stageTopline}>
          <span>当前编队</span>
          <strong>{party.length} / {PARTY_LIMIT}</strong>
        </div>
        <div className={s.cardRail}>
          {CHARACTER_CARDS.map((character) => {
            const active = party.includes(character.id);
            const disabledReason = active
              ? party.length === 1
                ? "至少保留 1 人上阵"
                : undefined
              : party.length >= PARTY_LIMIT
                ? `队伍已满（上限 ${PARTY_LIMIT} 人）`
                : undefined;

            return (
              <CharacterCard
                key={`${character.id}-${sweepKey}`}
                {...character}
                characterId={character.id}
                active={active}
                disabledReason={disabledReason}
                animated={sweepKey > 0}
                onToggle={() => toggle(character.id)}
              />
            );
          })}
        </div>
        <div className={s.stageFooter}>
          <span className={s.footerHint}>边缘光晕随编队状态常亮</span>
          <button type="button" className={s.replay} onClick={() => setSweepKey((value) => value + 1)}>
            ↻ 回放入场扫光
          </button>
        </div>
      </div>
    </section>
  );
}