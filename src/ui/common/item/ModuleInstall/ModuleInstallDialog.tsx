// 远征途中的「原地装配」弹窗 —— 从待拾取框里的模组直接装到出战队员的卡牌上。
//
// 与据点装配舱的区别只有两条(其余口径完全一致, 校验共用 townStore.installModuleStack):
//   · 模组来自**待拾取框**而不是仓库 —— 装成了就不占背包格, 取消则仍留在待拾取框。
//   · 角色只列**本趟远征的出战队伍**, 没带出来的人不在这儿装。
// 阵亡队员仍然列出但不可选: 卡组还在, 但这趟远征他已经用不上了。
//
// 布局口径: 模组信息(效果 / 条件)压成头部下方一条紧凑信息带, 剩余高度全部留给卡牌区 ——
// 玩家在这儿真正要做的判断是「装到哪张牌上」, 卡面越大越好挑。

import { useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { canEquipModule, getCardModule, getCharacter, getItemDef } from "@/data";
import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import { useTownStore } from "@/store/townStore";
import { itemIcon } from "@/ui/art/itemArt";
import { DeckCard } from "@/ui/character/DeckCard";
import { cx } from "@/ui/common/cx";
import s from "./ModuleInstallDialog.module.css";

interface Props {
  stack: ItemStack;
  onClose: () => void;
}

export function ModuleInstallDialog({ stack, onClose }: Props) {
  const party = useExploreStore((state) => state.session?.party ?? []);
  const characters = useTownStore((state) => state.characters);
  const installLootModule = useExploreStore((state) => state.installLootModule);

  const selectable = party.filter((member) => member.alive);
  const [charId, setCharId] = useState(selectable[0]?.charId ?? party[0]?.charId ?? "");
  const [cardUid, setCardUid] = useState<string | null>(null);

  const def = getItemDef(stack.itemId);
  const moduleDef = getCardModule(stack.itemId);
  const deck: Card[] = characters[charId]?.deck ?? [];
  const equippable = useMemo(
    () => new Set(deck.filter((card) => !card.cardModule && canEquipModule(card, stack.itemId)).map((card) => card.uid)),
    [deck, stack.itemId],
  );
  const selectedCard = deck.find((card) => card.uid === cardUid) ?? null;
  const confirmDisabled = !selectedCard || !equippable.has(selectedCard.uid);

  const confirm = () => {
    if (!selectedCard) return;
    if (!installLootModule(stack.uid, charId, selectedCard.uid)) return;
    // 弹窗关掉 + 待拾取框里少一件, 反馈已经够了, 不再额外弹结果文案。
    onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={s.layer} role="dialog" aria-modal="true" aria-label="装配模组">
      <div className={s.backdrop} onClick={onClose} aria-hidden />
      <section className={s.panel}>
        <header className={s.head}>
          <span className={s.icon} aria-hidden>{itemIcon(def)}</span>
          <div className={s.title}>
            <span className={s.kicker}>原地装配</span>
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
              <span className={s.hint}>只有满足条件、且还空着模组槽的卡牌可选。</span>
            </dd>
          </div>
        </dl>

        <div className={s.stage}>
          <div className={s.chars}>
            {party.map((member) => (
              <button
                key={member.charId}
                className={cx(s.charTab, charId === member.charId && s.isActive)}
                type="button"
                disabled={!member.alive}
                onClick={() => {
                  setCharId(member.charId);
                  setCardUid(null);
                }}
                style={{ "--owner-color": getCharacter(member.charId).color } as CSSProperties}
              >
                {getCharacter(member.charId).name}
                {!member.alive && <span className={s.downed}>阵亡</span>}
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
                    {card.cardModule && <span className={s.installed}>已装模组</span>}
                  </div>
                );
              })
            ) : (
              <p className={s.empty}>该角色没有卡牌。</p>
            )}
          </div>
        </div>

        <footer className={s.foot}>
          <span className={s.note}>
            {selectedCard
              ? confirmDisabled
                ? "这张牌装不了该模组"
                : `将装配到「${selectedCard.name}」`
              : "选择一张卡牌"}
          </span>
          <div className={s.actions}>
            <button className={cx(s.btn, s.isPrimary)} type="button" disabled={confirmDisabled} onClick={confirm}>
              确认装配
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
