// 模组装配弹窗(通用壳) —— 选角色 → 选卡牌 → 确认装配。
//
// 探索(ExploreModuleInstall: 出战队员, 来源 = 背包 / 待拾取框)与据点仓库(TownModuleInstall:
// 全部已唤醒角色, 来源 = 仓库)各包一层, 只差「列哪些人」「确认时调哪个 action」「旧模组去哪」。
// 允许顶替: 已装模组的卡也可选, 页脚写清楚被顶下来的旧模组会去哪儿。
//
// 布局口径: 模组信息(效果 / 条件)压成头部下方一条紧凑信息带, 剩余高度全部留给卡牌区 ——
// 玩家在这儿真正要做的判断是「装到哪张牌上」, 卡面越大越好挑。

import { useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { canEquipModule, getCardModule, getCharacter, getItemDef } from "@/data";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/town/townStore";
import { itemIcon } from "@/ui/art/items/itemArt";
import { DeckCard } from "@/ui/common/card/DeckCard";
import { cx } from "@/ui/common/shared/cx";
import s from "./ModuleInstallDialog.module.css";

export interface InstallMember {
  charId: string;
  /** 不可选(例如远征中阵亡)。 */
  disabled?: boolean;
  /** 角色页签上的附注, 例如「阵亡」。 */
  tag?: string;
}

interface Props {
  stack: ItemStack;
  members: readonly InstallMember[];
  /** 头部小标题, 例如「远征装载」「仓库装载」。 */
  kicker: string;
  /** 被顶替的旧模组去向, 拼进页脚提示: 「…将退回{returnTo}」。 */
  returnTo: string;
  onConfirm: (charId: string, cardUid: string) => boolean;
  onClose: () => void;
}

export function ModuleInstallDialog({ stack, members, kicker, returnTo, onConfirm, onClose }: Props) {
  const characters = useTownStore((state) => state.characters);
  const firstSelectable = members.find((member) => !member.disabled) ?? members[0];
  const [charId, setCharId] = useState(firstSelectable?.charId ?? "");
  const [cardUid, setCardUid] = useState<string | null>(null);

  const def = getItemDef(stack.itemId);
  const moduleDef = getCardModule(stack.itemId);
  const deck: Card[] = characters[charId]?.deck ?? [];
  const equippable = useMemo(
    () => new Set(deck.filter((card) => canEquipModule(card, stack.itemId)).map((card) => card.uid)),
    [deck, stack.itemId],
  );
  const selectedCard = deck.find((card) => card.uid === cardUid) ?? null;
  const confirmDisabled = !selectedCard || !equippable.has(selectedCard.uid);
  const replacedName = selectedCard?.cardModule ? getItemDef(selectedCard.cardModule.itemId).name : null;

  const confirm = () => {
    if (!selectedCard) return;
    // 弹窗关掉 + 来源容器里少一件, 反馈已经够了, 不再额外弹结果文案。
    if (onConfirm(charId, selectedCard.uid)) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={s.layer} role="dialog" aria-modal="true" aria-label="装配模组">
      <div className={s.backdrop} onClick={onClose} aria-hidden />
      <section className={s.panel}>
        <header className={s.head}>
          <span className={s.icon} aria-hidden>{itemIcon(def)}</span>
          <div className={s.title}>
            <span className={s.kicker}>{kicker}</span>
            <strong>{def.name}</strong>
          </div>
          <button className={s.close} type="button" onClick={onClose} aria-label="关闭装配窗口">
            ✕
          </button>
        </header>

        {/* 效果与条件并排一条 —— 效果是「装上去有什么用」, 条件是「哪些牌能装」。 */}
        <dl className={s.info}>
          <div className={s.infoCol}>
            <dt>装配效果</dt>
            <dd>{def.desc}</dd>
          </div>
          <div className={s.infoCol}>
            <dt>装配条件</dt>
            <dd>
              {moduleDef?.equipText ?? "无"}
              <span className={s.hint}>满足条件的卡牌可选，已装模组的卡牌会被顶替。</span>
            </dd>
          </div>
        </dl>

        <div className={s.stage}>
          <div className={s.chars}>
            {members.map((member) => (
              <button
                key={member.charId}
                className={cx(s.charTab, charId === member.charId && s.isActive)}
                type="button"
                disabled={member.disabled}
                onClick={() => {
                  setCharId(member.charId);
                  setCardUid(null);
                }}
                style={{ "--owner-color": getCharacter(member.charId).color } as CSSProperties}
              >
                {getCharacter(member.charId).name}
                {member.tag && <span className={s.downed}>{member.tag}</span>}
              </button>
            ))}
          </div>

          <div className={s.deck} role="list">
            {deck.length ? (
              deck.map((card, index) => {
                const usable = equippable.has(card.uid);
                return (
                  <div
                    key={card.uid}
                    className={cx(s.card, !usable && s.dimmed)}
                    role="listitem"
                    data-selected={card.uid === cardUid ? "true" : undefined}
                  >
                    <DeckCard
                      card={card}
                      selected={card.uid === cardUid}
                      index={index}
                      onClick={() => usable && setCardUid(card.uid)}
                      className={s.deckCard}
                    />
                    {card.cardModule && (
                      <span className={s.installed}>已装：{getItemDef(card.cardModule.itemId).name}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className={s.empty}>该角色没有卡牌。</p>
            )}
          </div>
        </div>

        <footer className={s.foot}>
          <span className={cx(s.note, replacedName && !confirmDisabled && s.isWarn)}>
            {!selectedCard
              ? "选择一张卡牌"
              : confirmDisabled
                ? "这张牌装不了该模组"
                : replacedName
                  ? `将顶替「${replacedName}」装配到「${selectedCard.name}」，${replacedName}将退回${returnTo}`
                  : `将装配到「${selectedCard.name}」`}
          </span>
          <div className={s.actions}>
            <button className={cx(s.btn, s.isPrimary)} type="button" disabled={confirmDisabled} onClick={confirm}>
              {replacedName ? "确认顶替" : "确认装配"}
            </button>
            <button className={s.btn} type="button" onClick={onClose}>
              取消
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
