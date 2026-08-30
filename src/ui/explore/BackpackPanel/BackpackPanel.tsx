// ★ 探索页的背包面板 ★ —— 24 格网格 + 分类 tab + 实时负重读数(见 探索模式设计.md §6.4)。
//
// 沿用探索页的浮层语言: **无全屏遮罩**, 落在画布正中的同一个 936×680 外框里 ——
// 与落点事件面板、事件奖励、物品拾取、交易终端同框同页眉(见 ui/common/EventPanel)。
// ⚠ 开放时机的真相点在 explore/session.canOpenBackpack, 不在这里 —— 本组件只画结论。
//
// 三种模式共用同一块面板(设计文档 §6.4 明确要求「背包满时自动弹出同一面板」):
//   · 常规      —— 看 / 用 / 丢
//   · 替换模式  —— session.pendingPickup 非空: 强制打开且不可关, 必须丢够格子才能拿
//   · 寄件模式  —— session.chuteOpen: 多选物品寄回据点(E −5)

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { burdenHitPenalty, burdenInitiativePenalty, RULES } from "@/engine";
import {
  backpackFree,
  backpackSlots,
  burdenNow,
  canUseItem,
  partyBurdenAdapt,
} from "@/explore/session";
import { EXPLORE_RULES } from "@/explore/rules";
import { layoutBackpack, stackSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import {
  EventPanelBody,
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { panelRevealVars } from "@/ui/explore/styles/panelReveal";
import { cx } from "@/ui/common/cx";
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

  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // 丢弃二次确认的 uid
  const [shipping, setShipping] = useState<string[]>([]); // 寄件模式的勾选

  const backpack = session?.backpack ?? [];
  const cells = useMemo(
    () => layoutBackpack(backpack, RULES.burden.backpackSlots),
    [backpack],
  );

  // 换选中项时清掉确认态 —— 否则「确认丢弃」会挂在另一件东西上, 那是最坏的一类误操作。
  useEffect(() => setConfirming(null), [selected]);

  if (!session) return null;

  const used = backpackSlots(session);
  const free = backpackFree(session);
  const burden = burdenNow(session);
  const hitPenalty = burdenHitPenalty(burden);
  const initiativePenalty = burdenInitiativePenalty(burden);
  const adapt = partyBurdenAdapt(session);
  const pending = session.pendingPickup;
  const replaceMode = pending.length > 0;
  const chuteMode = session.chuteOpen;
  const pendingHasUndroppable = pending.some((st) => getItemDef(st.itemId).undroppable);
  const sel = backpack.find((s) => s.uid === selected) ?? null;
  const selDef = sel ? getItemDef(sel.itemId) : null;

  const toggleShip = (uid: string) =>
    setShipping((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));

  const onSlotClick = (st: ItemStack) => {
    if (chuteMode) return toggleShip(st.uid);
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
                命中 −{hitPenalty}% · 先手 −{initiativePenalty}
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
            {/* 两条模式横幅与分类 tab 钉在内容区上方 —— 与其它浮层一样, 只允许下面的主体滚动。 */}
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
                  传送投递口已开启 —— 选中的物品寄回据点，团灭也带得走
                </span>
                <EventPanelButton
                  tone="primary"
                  className={s["bp-mini"]}
                  disabled={!shipping.length}
                  onClick={() => {
                    shipHome(shipping);
                    setShipping([]);
                  }}
                >
                  寄回 {shipping.length} 件 · 粒子 −{EXPLORE_RULES.chute.energyCost}
                </EventPanelButton>
              </div>
            )}

            <div className={s["bp-tabs"]}>
              <ItemTabs
                stacks={backpack}
                tab={tab}
                equipTab={equipTab}
                onTab={setTab}
                onEquipTab={setEquipTab}
              />
            </div>

            <EventPanelBody className={s["bp-body"]}>
              <div className={s["bp-grid"]} style={{ "--bp-cols": COLS } as CSSProperties}>
                {cells.map((cell, i) => {
                  if (cell.kind === "empty") return <EmptySlot key={i} />;
                  return (
                    <ItemSlot
                      key={cell.stack.uid}
                      stack={cell.stack}
                      selected={chuteMode ? shipping.includes(cell.stack.uid) : selected === cell.stack.uid}
                      disabled={chuteMode && !!getItemDef(cell.stack.itemId).undroppable}
                      dimmed={!matchTab(cell.stack, tab, equipTab)}
                      onClick={() => onSlotClick(cell.stack)}
                    />
                  );
                })}
              </div>

              <div className={s["bp-detail"]}>
                <ItemDetail
                  stack={sel}
                  placeholder="背包里的东西都会占格子——每格让全队命中、暴击、闪避各降 1%。"
                >
                  {sel && selDef && (
                    <>
                      {selDef.use && (
                        <>
                          <EventPanelButton
                            tone="primary"
                            className={s["bp-mini"]}
                            disabled={!canUseItem(session)}
                            onClick={() => sel && onUse(sel)}
                          >
                            使用
                          </EventPanelButton>
                          {/* 原生 title 提示已去掉, 锁定理由直接写在按钮下面(项目约定: 不用 title) */}
                          {!canUseItem(session) && <p className={s["bp-locked"]}>本阶段不能使用消耗品</p>}
                        </>
                      )}
                      {/* 丢弃**不可撤销**, 故在详情区原地二次确认 ——
                          探索页已经是「浮层里的浮层」, 再叠一层模态读起来会很脏。 */}
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
    </div>
  );
}

// 「还差几格」—— 取待取物里**最小**的那件所需的缺口, 玩家丢到这个数就能开始拿。
function shortBy(pending: ItemStack[], free: number): number {
  const min = Math.min(...pending.map((st) => stackSlots(st, getItemDef(st.itemId))));
  return Math.max(0, min - free);
}
