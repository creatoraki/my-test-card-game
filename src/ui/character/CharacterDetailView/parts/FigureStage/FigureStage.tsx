// 详情立绘窗：静态场景、矢量边框与信息底栏分层，矩形仍由 FIGURE_RECT 下发。
// 取景沿用飞行层的 cover / 50% 6%，交接期间由 hidden 让位。
import type { CSSProperties } from "react";
import type { QuirkId } from "@/engine";
import { useTownStore } from "@/store/town/townStore";
import { CrewCard } from "@/ui/character/FormationScreen/parts/CrewCard/CrewCard";
import { cx } from "@/ui/common/shared/cx";
import { FIGURE_ART_WIDTH } from "@/ui/character/CharacterDetailView/detailLayout";
import s from "./FigureStage.module.css";

interface Props {
  characterId: string;
  emoji: string;
  name: string;
  deckLevel: number;
  exp: number;
  upgradeCost: number | null;
  upgradeDisabled: boolean;
  onUpgrade: () => void;
  vitals: { hp: number; hpLimit: number; maxHp: number };
  pollution: number;
  sick: boolean;
  quirks: readonly QuirkId[];
  /** 悬浮卡面时用遮罩压暗，避免整栏模糊滤镜。 */
  dimmed: boolean;
  hidden: boolean;
  style?: CSSProperties;
}

export function FigureStage({ characterId, name, upgradeDisabled, onUpgrade, dimmed, hidden, style }: Props) {
  const cs = useTownStore((state) => state.characters[characterId]);
  const onField = useTownStore((state) => state.party.includes(characterId));
  const resting = useTownStore((state) => state.nutrition.occupants.some((occupant) => occupant.charId === characterId));
  if (!cs) return null;
  return (
    <section className={cx(s.stage, hidden && s["is-hidden"], dimmed && s["is-dimmed"])}
      style={{ "--figure-art-width": FIGURE_ART_WIDTH + "px", ...style } as CSSProperties}
      aria-label={name + "角色档案"}>
      <CrewCard cs={cs} detail index={0} onField={onField} resting={resting}
        lastOne={false} full={false} size={0} hidden={false} offsetX={0} offsetY={0}
        scatter={null} entrance={false} onOpen={() => {}} onToggle={() => {}}
        upgradeDisabled={upgradeDisabled || hidden || dimmed} onUpgrade={onUpgrade} />
      <div className={s.dimmer} aria-hidden="true" />
    </section>
  );
}
