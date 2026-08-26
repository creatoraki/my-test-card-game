// 角色档案 Modal —— 战斗与探索两个场景共用的一块浮层。
//
// ★ 本组件**不读 store、不含任何规则**: 属性、血量、卡组、装备全部由调用方查好传进来,
//   换装也只是把点击转成回调(与 PartyMemberCard / AssemblyBench 同一路数)。
//   - 战斗界面(BattleScreen ← AllyBar): 不传 swap ⇒ 全只读, 包括装备。
//   - 探索界面(ExploreScreen ← PartyMemberCard): 传 swap ⇒ 装备可与远征背包互换。
//
// 视觉沿用模块装配舱的弹窗语言, 外壳走 common/PanelShell(遮罩 + 切角面板 + EventPanelFrame)。
// 关闭是两段式: 调用方持 closing, 播完 PANEL_OUT_MS 再卸载 —— 否则退场动画会被直接剪掉。

import { useState, type CSSProperties } from "react";
import type { Card, StatBlock, StatusInstance } from "@/engine";
import { getCharacter } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import { PanelShell } from "@/ui/common/PanelShell";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { ModalDeck } from "./parts/ModalDeck";
import { ModalEquip, type EquipSwap } from "./parts/ModalEquip";
import { ModalProfile } from "./parts/ModalProfile";
import { ModalStats } from "./parts/ModalStats";
import s from "./CharacterModal.module.css";

/** 档案的主色。战斗用冷青, 探索用琥珀 —— 与各自场景的 HUD 呼应。 */
export const MODAL_ACCENT = { battle: "#52cfff", explore: "#f0b429" };

export interface CharacterVitals {
  hp: number;
  hpLimit: number;
  maxHp: number;
  shield?: number;
}

interface Props {
  charId: string;
  /** 面板属性。战斗传战斗单位的 stats(含羁绊/光环), 探索传 deriveStats 的局外口径。 */
  stats: StatBlock;
  vitals: CharacterVitals;
  pollution: number;
  sick: boolean;
  quirks: readonly string[];
  /** 战斗内的临时状态; 探索不传。 */
  statuses?: StatusInstance[];
  /** 阵亡/濒死标记, 只影响标题旁的状态词。 */
  down?: boolean;
  deck: Card[];
  equipped: Record<EquipSlot, ItemStack | null>;
  /** 不传 = 装备区只读。 */
  swap?: EquipSwap;
  /** 主色。缺省冷青。 */
  accent?: string;
  closing: boolean;
  onClose: () => void;
  /** 遮罩层的附加类名 —— 各场景据此压 z-index。 */
  className?: string;
}

export function CharacterModal({
  charId,
  stats,
  vitals,
  pollution,
  sick,
  quirks,
  statuses,
  down = false,
  deck,
  equipped,
  swap,
  accent = MODAL_ACCENT.battle,
  closing,
  onClose,
  className,
}: Props) {
  const def = getCharacter(charId);
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);

  const showTooltip = (element: HTMLElement, stack: ItemStack) => {
    setHovered({ stack, point: tooltipPointFromElement(element) });
  };
  const hideTooltip = () => setHovered(null);

  return (
    <PanelShell
      accent={accent}
      title={`${def.name} · 档案`}
      status={
        <>
          {down ? "阵亡" : `HP ${Math.max(0, Math.round(vitals.hp))}/${Math.round(vitals.hpLimit)}`}
          {" · "}
          {deck.length} 张卡牌
          {swap ? " · 可与背包换装" : " · 只读"}
        </>
      }
      closeLabel="关闭角色档案"
      closing={closing}
      onClose={onClose}
      themeStyle={{ "--asm-frame": accent, "--asm-glow": accent } as CSSProperties}
      className={className}
    >
      <div className={s["cm-body"]}>
        <ModalProfile
          charId={charId}
          name={def.name}
          emoji={def.emoji}
          vitals={vitals}
          pollution={pollution}
          sick={sick}
          quirks={quirks}
          statuses={statuses}
          down={down}
        />
        <ModalStats stats={stats} />
        <div className={s["cm-right-column"]}>
          <ModalEquip
            equipped={equipped}
            swap={swap}
            onShowTooltip={showTooltip}
            onHideTooltip={hideTooltip}
          />
          <ModalDeck deck={deck} />
        </div>
      </div>

      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} />}
    </PanelShell>
  );
}
