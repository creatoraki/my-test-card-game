// 模组装配弹窗(通用壳) —— 选角色 → 选卡牌 → 确认装配。
//
// 探索(ExploreModuleInstall: 出战队员, 来源 = 背包)与据点仓库(TownModuleInstall:
// 全部已唤醒角色, 来源 = 仓库)各包一层, 只差「列哪些人」「确认时调哪个 action」「旧模组去哪」。
// 允许顶替: 已装模组的卡也可选, 详情栏写清楚被顶下来的旧模组会去哪儿。
//
// 外观与研究中心「模组装配」页同一套红黑编号面板: 01 角色 / 02 卡组 / 03 装配详情。
// 本文件只做编排与选择态, 三栏各自一个组件。

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { canEquipModule } from "@/data";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import theme from "@/ui/common/frame/TerminalPanel/researchTheme.module.css";
import { cx } from "@/ui/common/shared/cx";
import { InstallDeckPanel } from "./InstallDeckPanel";
import { InstallDetailPanel } from "./InstallDetailPanel";
import { InstallMemberPanel } from "./InstallMemberPanel";
import s from "./ModuleInstallDialog.module.css";

export interface InstallMember {
  charId: string;
  /** 不可选(例如远征中阵亡)。 */
  disabled?: boolean;
  /** 角色条上的附注, 例如「阵亡」。 */
  tag?: string;
}

interface Props {
  stack: ItemStack;
  members: readonly InstallMember[];
  /** 详情栏小标题, 例如「远征装载」「仓库装载」。 */
  kicker: string;
  /** 被顶替的旧模组去向, 拼进提示: 「…将退回{returnTo}」。 */
  returnTo: string;
  onConfirm: (charId: string, cardUid: string) => boolean;
  onClose: () => void;
}

export function ModuleInstallDialog({ stack, members, kicker, returnTo, onConfirm, onClose }: Props) {
  const characters = useTownStore((state) => state.characters);
  const firstSelectable = members.find((member) => !member.disabled) ?? members[0];
  const [charId, setCharId] = useState(firstSelectable?.charId ?? "");
  const [cardUid, setCardUid] = useState<string | null>(null);

  const deck: Card[] = characters[charId]?.deck ?? [];
  const equippable = useMemo(
    () => new Set(deck.filter((card) => canEquipModule(card, stack.itemId)).map((card) => card.uid)),
    [deck, stack.itemId],
  );
  const selectedCard = deck.find((card) => card.uid === cardUid) ?? null;
  const confirmDisabled = !selectedCard || !equippable.has(selectedCard.uid);

  const confirm = () => {
    if (!selectedCard) return;
    // 弹窗关掉 + 来源容器里少一件, 反馈已经够了, 不再额外弹结果文案。
    if (onConfirm(charId, selectedCard.uid)) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={cx(theme.theme, s.layer)} role="dialog" aria-modal="true" aria-label="装配模组">
      <div className={s.backdrop} onClick={onClose} aria-hidden />
      <div className={s.body}>
        <InstallMemberPanel
          members={members}
          selected={charId}
          onSelect={(id) => {
            setCharId(id);
            setCardUid(null);
          }}
        />
        <InstallDeckPanel deck={deck} equippable={equippable} selectedUid={cardUid} onSelect={setCardUid} />
        <InstallDetailPanel
          stack={stack}
          kicker={kicker}
          returnTo={returnTo}
          selectedCard={selectedCard}
          confirmDisabled={confirmDisabled}
          onConfirm={confirm}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}
