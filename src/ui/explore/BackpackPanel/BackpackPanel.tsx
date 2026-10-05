// ★ 探索页的背包面板 ★ —— 24 格网格(按分区自动排序 + 分区分割线) + 实时负重读数(见 探索模式设计.md §6.4)。
//
// 沿用探索页的浮层语言: **无全屏遮罩**, 落在画布正中的同一个 1336×904 外框里 ——
// 与落点事件面板、事件奖励、物品拾取、交易终端同框同页眉(见 ui/common/widget/EventPanel)。
// ⚠ 开放时机的真相点在 explore/session.canOpenBackpack, 不在这里 —— 本组件只画结论。
//
// 三种模式共用同一块面板(设计文档 §6.4 明确要求「背包满时自动弹出同一面板」):
//   · 常规      —— 看 / 用 / 丢
//   · 替换模式  —— session.pendingPickup 非空: 强制打开且不可关, 必须丢够格子才能拿
//   · 寄件模式  —— session.chuteOpen: 多选物品寄回据点(E −5)
// 另外, 拾取框(pendingLoot)非空时顶部挂一条拾取横幅, 选中物品可「放回拾取框」腾格子 —— 背包满时整理用。

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { burdenDodgePenalty, burdenHitPenalty, burdenPrecisionPenalty, RULES } from "@/engine";
import {
  backpackFree,
  backpackSlots,
  burdenNow,
  canUseItem,
  partyBurdenAdapt,
} from "@/explore/session";
import { EXPLORE_RULES } from "@/explore/core/exploreRules";
import { canShipHome, stackSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import { ItemSectionMark } from "@/ui/common/item/ItemSectionMark";
import { sectionMarks, sortBySection } from "@/ui/common/item/shared/itemSections";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelStage,
} from "@/ui/common/widget/EventPanel";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { useBackpackModules } from "@/ui/explore/BackpackModules";
import { cx } from "@/ui/common/shared/cx";
import { BackpackLootBanner } from "./parts/BackpackLootBanner";
import s from "./BackpackPanel.module.css";

const COLS = 8; // 8 × 3 = 24。只影响 CSS grid 的列数, 排布本身与列数无关。

export default function BackpackPanel({
  onClose,
  onUse,
}: {
  onClose: () => void;
  // 「使用」由 ExploreScreen 统一接手: 目标类消耗品进入左下角头像选择流程, 其余立即生效。
  onUse: (stack: ItemStack) => void;
}) {
  const session = useExploreStore((s) => s.session);
  const discardItem = useExploreStore((s) => s.discardItem);
  const takePending = useExploreStore((s) => s.takePending);
  const abandonPending = useExploreStore((s) => s.abandonPending);
  const shipHome = useExploreStore((s) => s.shipHome);
  const returnToLoot = useExploreStore((s) => s.returnToLoot);

  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // 丢弃二次确认的 uid
  const [shipping, setShipping] = useState<string[]>([]); // 寄件模式的勾选
  const modules = useBackpackModules();

  const backpack = session?.backpack ?? [];
  // 与底部背包同一套分区排序(只排展示, 不动存储顺序)。
  const ordered = useMemo(() => sortBySection(backpack), [backpack]);
  const marks = useMemo(() => sectionMarks(ordered), [ordered]);
  const emptyCount = Math.max(0, RULES.burden.backpackSlots - ordered.length);

  // 换选中项时清掉确认态 —— 否则「确认丢弃」会挂在另一件东西上, 那是最坏的一类误操作。
  useEffect(() => setConfirming(null), [selected]);

  if (!session) return null;

  const used = backpackSlots(session);
  const free = backpackFree(session);
  const burden = burdenNow(session);
  const hitPenalty = burdenHitPenalty(burden);
  const dodgePenalty = burdenDodgePenalty(burden);
  const precisionPenalty = burdenPrecisionPenalty(burden);
  const adapt = partyBurdenAdapt(session);
  const pending = session.pendingPickup;
  const replaceMode = pending.length > 0;
  const chuteMode = session.chuteOpen;
  const lootMode = session.pendingLoot.length > 0 && !replaceMode && !chuteMode;
  const pendingHasUndroppable = pending.some((st) => getItemDef(st.itemId).undroppable);
  const sel = backpack.find((s) => s.uid === selected) ?? null;
  const selDef = sel ? getItemDef(sel.itemId) : null;

  const shippingCount = backpack.reduce((total, stack) => total + (shipping.includes(stack.uid) ? stack.count : 0), 0);
  const toggleShip = (stack: ItemStack) => {
    if (!canShipHome(stack, getItemDef(stack.itemId))) return;
    setShipping((cur) => {
      if (cur.includes(stack.uid)) return cur.filter((uid) => uid !== stack.uid);
      const count = backpack.reduce((total, item) => total + (cur.includes(item.uid) ? item.count : 0), 0);
      return count + stack.count <= EXPLORE_RULES.chute.maxItems ? [...cur, stack.uid] : cur;
    });
  };

  const onSlotClick = (st: ItemStack) => {
    if (chuteMode) return toggleShip(st);
    setSelected(st.uid);
  };

  return (
    <div className={s["bp-modal"]}>
      <section className={cx(s["bp-panel"], s["panel-reveal"])} style={panelRevealVars()}>
        <span className={s["panel-bar"]} aria-hidden />
        <span className={s["panel-scan"]} aria-hidden />
        <EventPanelFrame
          accent="#7fd4c4"
          kicker="随身携带 / 背包"
          title="背包"
          contentKey="backpack"
          status={
            /* 顶部实时读数。★ key 挂 used ⇒ 每丢一件这一行重挂一次走个跳变,
               「边丢边看数字回升」是设计文档 §6.4 点名要有的手感。 */
            <div className={s["bp-readout"]} key={used}>
              <span className={s["bp-load"]}>
                负重 <strong className={used > 0 ? s["is-bad"] : undefined}>{used}</strong> / {
                  RULES.burden.backpackSlots
                }
              </span>
              <span className={s["bp-penalty"]}>
                命中 −{hitPenalty}% · 闪避 −{dodgePenalty}% · 精准 −{precisionPenalty}%
              </span>
              <span className={s["bp-adapt"]}>负重适应 {Math.round(adapt)} 格</span>
            </div>
          }
          headerExtra={
            /* 替换模式下没有退路: 必须处理完待取物才能关(设计文档 §6.4) */
            !replaceMode ? (
              <button className={s["bp-close"]} type="button" onClick={onClose} aria-label="关闭背包">
                ✕
              </button>
            ) : undefined
          }
        >
          <EventPanelStage>
            {/* 两条模式横幅钉在内容区上方 —— 与其它浮层一样, 只允许下面的主体滚动。 */}
            {replaceMode && (
              <div className={s["bp-pending"]}>
                <span className={s["bp-pending-label"]}>
                  背包装不下 —— 丢够格子才拿得走（还差 {shortBy(pending, free)} 格）
                </span>
                <div className={s["bp-pending-row"]}>
                  {pending.map((st, i) => {
                    const need = stackSlots(st, getItemDef(st.itemId));
                    const ok = need <= free;
                    return (
                      <div className={s["bp-pending-item"]} key={st.uid}>
                        <ItemSlot stack={st} />
                        <EventPanelButton
                          tone="primary"
                          className={s["bp-mini"]}
                          disabled={!ok}
                          onClick={() => takePending(i)}
                        >
                          {ok ? "拿取" : `还需 ${need - free} 格`}
                        </EventPanelButton>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {chuteMode && (
              <div className={s["bp-chute"]}>
                <span className={s["bp-chute-label"]}>
                  每次最多寄回 {EXPLORE_RULES.chute.maxItems} 件 · 已选 {shippingCount} / {EXPLORE_RULES.chute.maxItems} 件 · 团灭也带得走
                </span>
                <EventPanelButton
                  tone="primary"
                  className={s["bp-mini"]}
                  disabled={!shippingCount || shippingCount > EXPLORE_RULES.chute.maxItems}
                  onClick={() => {
                    shipHome(shipping);
                    setShipping([]);
                  }}
                >
                  寄回 {shippingCount} 件 · 粒子 −{EXPLORE_RULES.chute.energyCost}
                </EventPanelButton>
              </div>
            )}

            {lootMode && <BackpackLootBanner loot={session.pendingLoot} free={free} />}

            <EventPanelBody className={s["bp-body"]}>
              <div className={s["bp-grid"]} style={{ "--bp-cols": COLS } as CSSProperties}>
                {ordered.map((stack, i) => (
                  <div className={s["bp-cell"]} key={stack.uid}>
                    <ItemSlot
                      stack={stack}
                      selected={chuteMode ? shipping.includes(stack.uid) : selected === stack.uid}
                      disabled={chuteMode && (!canShipHome(stack, getItemDef(stack.itemId))
                        || (!shipping.includes(stack.uid) && shippingCount + stack.count > EXPLORE_RULES.chute.maxItems))}
                      onClick={() => onSlotClick(stack)}
                    />
                    <ItemSectionMark mark={marks[i]} rowStart={i % COLS === 0} />
                  </div>
                ))}
                {Array.from({ length: emptyCount }, (_, i) => <EmptySlot key={`empty-${i}`} />)}
              </div>

              <div className={s["bp-detail"]}>
                <ItemDetail
                  stack={sel}
                  placeholder="背包里的东西都会占格子——每 4 格让全队命中降 1%，每 2 格让闪避和精准各降 1%。"
                >
                  {sel && selDef && (
                    <>
                      {/* 模组随时可装载(阶段白名单同背包本身); 模组箱与消耗品同受 canUseItem 约束。 */}
                      {modules.isModule(sel) && (
                        <EventPanelButton tone="primary" className={s["bp-mini"]} onClick={() => modules.install(sel)}>
                          装载
                        </EventPanelButton>
                      )}
                      {selDef.use && (
                        <>
                          <EventPanelButton
                            tone="primary"
                            className={s["bp-mini"]}
                            disabled={!canUseItem(session)}
                            onClick={() => (modules.isCrate(sel) ? modules.openCrate(sel) : onUse(sel))}
                          >
                            {modules.isCrate(sel) ? "拆箱" : "使用"}
                          </EventPanelButton>
                          {/* 原生 title 提示已去掉, 锁定理由直接写在按钮下面(项目约定: 不用 title) */}
                          {!canUseItem(session) && <p className={s["bp-locked"]}>本阶段不能使用消耗品</p>}
                        </>
                      )}
                      {/* 丢弃**不可撤销**, 故在详情区原地二次确认 ——
                          探索页已经是「浮层里的浮层」, 再叠一层模态读起来会很脏。 */}
                      {/* 拾取框非空时可把它放回去腾格子, 离开前还能再拿回, 故不做二次确认。 */}
                      {lootMode && !selDef.undroppable && (
                        <EventPanelButton
                          tone="primary"
                          className={s["bp-mini"]}
                          onClick={() => {
                            returnToLoot(sel.uid);
                            setSelected(null);
                          }}
                        >
                          放回拾取框
                        </EventPanelButton>
                      )}
                      {selDef.undroppable ? (
                        <p className={s["bp-locked"]}>锁死在背包上，远征途中无法卸下</p>
                      ) : confirming === sel.uid ? (
                        <>
                          <EventPanelButton
                            tone="danger"
                            className={s["bp-mini"]}
                            onClick={() => {
                              discardItem(sel.uid);
                              setSelected(null);
                            }}
                          >
                            确认丢弃
                          </EventPanelButton>
                          <EventPanelButton className={s["bp-mini"]} onClick={() => setConfirming(null)}>
                            取消
                          </EventPanelButton>
                        </>
                      ) : (
                        <EventPanelButton className={s["bp-mini"]} onClick={() => setConfirming(sel.uid)}>
                          丢弃
                        </EventPanelButton>
                      )}
                    </>
                  )}
                </ItemDetail>
              </div>
            </EventPanelBody>

            <EventPanelFoot
              note={
                replaceMode ? (
                  "先处理完待取物才能关上背包"
                ) : lootMode ? (
                  `占用 ${used} / ${RULES.burden.backpackSlots} 格 · 放回拾取框的物品离开前都能再拿回`
                ) : (
                  `占用 ${used} / ${RULES.burden.backpackSlots} 格`
                )
              }
            >
              {replaceMode && !pendingHasUndroppable && (
                <EventPanelButton onClick={() => abandonPending()}>全部放弃拾取</EventPanelButton>
              )}
            </EventPanelFoot>
          </EventPanelStage>
        </EventPanelFrame>
      </section>
      {modules.overlay}
    </div>
  );
}

// 「还差几格」—— 取待取物里**最小**的那件所需的缺口, 玩家丢到这个数就能开始拿。
function shortBy(pending: ItemStack[], free: number): number {
  const min = Math.min(...pending.map((st) => stackSlots(st, getItemDef(st.itemId))));
  return Math.max(0, min - free);
}
