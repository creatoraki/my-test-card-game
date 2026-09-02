// 编队卡 —— 一整张高楼型取景窗: 立绘顶满卡片, 角色名与上阵/下阵动作条浮在窗内底部。
//
// ⚠⚠ 卡面主体是 button 而外壳不是: 卡面要能点(进详情), 底部动作条也要能点, 而
//   button 里嵌 button 是非法 HTML(浏览器会把内层拆出去, 点击行为随之乱掉)。
//   故做成「div 外壳 + 两个同级 button」。
// ★ 卡面文字只有角色名 —— 数值一律去详情态看, 高楼型卡的体量全给立绘与上阵状态。
// ★ data-crew-card 挂在最外层 div 上: 回程飞行的落点靠它认领(见 formationMorph/useFormationMorph.ts)。
//   ⚠ 不能挂在 BorderGlow 上 —— 它只认自己 props 里的那几项, 不透传任意 DOM 属性。
//   data 属性不参与 CSS Modules 哈希, 是跨模块能命中的唯一通道。

import type { CSSProperties, MouseEvent } from "react";
import { getCharacter } from "@/data";
import type { CharacterState } from "@/store/townStore";
import { CHARACTER_CARD_GLOW, characterGlow } from "@/ui/character/characterGlow";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
import s from "./CrewCard.module.css";

interface Props {
  cs: CharacterState;
  /** 网格序号: 错峰入场用。 */
  index: number;
  onField: boolean;
  lastOne: boolean;
  full: boolean;
  size: number;
  /** 过场期间由飞行层代演 —— 本体让位, 但仍占着网格位不塌陷。 */
  hidden: boolean;
  /** 飞散/收拢的方向量(列距、行距), 由 CrewGrid 按与被点卡的距离下发。 */
  offset: { dx: number; dy: number } | null;
  scatter: "out" | "in" | null;
  /**
   * 是否播卡片自己的入场动画。
   * ⚠⚠ 只有本页**首次**铺开卡阵时才播。从详情态回来时卡阵是重新挂载的, 若还留着入场动画,
   *   收拢动画一结束(类被摘掉)animation-name 就从 crewScatterIn 变成 crewIn ⇒ 浏览器会**重新起播**,
   *   表现为卡片刚归位又整片闪一次。 */
  entrance: boolean;
  onOpen: (el: HTMLElement) => void;
  onToggle: () => void;
}

export function CrewCard({
  cs,
  index,
  onField,
  lastOne,
  full,
  size,
  hidden,
  offset,
  scatter,
  entrance,
  onOpen,
  onToggle,
}: Props) {
  const def = getCharacter(cs.charId);
  const glow = characterGlow(def.color);
  const blocked = onField ? lastOne : full;
  const reason = onField ? "至少要保留 1 名队员上阵" : `上阵人数已达上限 ${size} 人`;
  const { point, bind } = useHoverTooltip();

  // 起飞点要量的是**外壳**(整张卡的矩形), 不是被点的那颗按钮。
  const open = (event: MouseEvent<HTMLElement>) => {
    const shell = event.currentTarget.closest<HTMLElement>("[data-crew-card]");
    if (shell) onOpen(shell);
  };

  const distance = offset ? Math.abs(offset.dx) + Math.abs(offset.dy) : 0;

  return (
    <div
      className={cx(
        s.card,
        onField && s["is-on"],
        !entrance && s["is-instant"],
        hidden && s["is-hidden"],
        scatter === "out" && s["is-scatter-out"],
        scatter === "in" && s["is-scatter-in"],
      )}
      style={
        {
          "--i": index,
          "--dx": offset?.dx ?? 0,
          "--dy": offset?.dy ?? 0,
          "--dist": distance,
          "--gc-color": def.color,
        } as CSSProperties
      }
      data-crew-card={cs.charId}
    >
      <BorderGlow
        className={s.glow}
        persistent={onField}
        followPointer={!onField}
        animated={false}
        fillOpacity={onField ? 0.3 : 0.2}
        {...CHARACTER_CARD_GLOW}
        {...glow}
        backgroundColor={
          onField ? "color-mix(in srgb, var(--gc-color) 24%, #091318)" : CHARACTER_CARD_GLOW.backgroundColor
        }
      >
        <div className={s.body}>
          <button className={s.main} type="button" onClick={open}>
            <CharacterPortrait
              characterId={def.id}
              emoji={def.emoji}
              alt={def.name}
              className={s.bust}
            />
            <span className={s.scrim} aria-hidden="true" />
            <span className={s.name}>{def.name}</span>
          </button>

          {onField && (
            <span className={s.flag} role="img" aria-label="出战中">
              上阵
            </span>
          )}

          <span className={s["toggle-slot"]} {...bind}>
            <button className={s.toggle} type="button" disabled={blocked} onClick={onToggle}>
              {onField ? "下阵" : "上阵"}
            </button>
            {blocked && point && (
              <HoverTooltip point={point}>
                <strong>{onField ? "无法下阵" : "无法上阵"}</strong>
                <p>{reason}</p>
              </HoverTooltip>
            )}
          </span>
        </div>
      </BorderGlow>
    </div>
  );
}
