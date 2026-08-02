// ★ 探索页的背包面板 ★ —— 24 格网格 + 分类 tab + 实时负重读数(见 探索模式设计.md §6.4)。
//
// 沿用探索页的浮层语言: **无全屏遮罩**, 从画布上方滑入(与落点浮层、控制终端的吊绳面板同族)。
// ⚠ 开放时机的真相点在 explore/session.canOpenBackpack, 不在这里 —— 本组件只画结论。
//
// 三种模式共用同一块面板(设计文档 §6.4 明确要求「背包满时自动弹出同一面板」):
//   · 常规      —— 看 / 用 / 丢
//   · 替换模式  —— session.pendingPickup 非空: 强制打开且不可关, 必须丢够格子才能拿
//   · 寄件模式  —— session.chuteOpen: 多选物品寄回据点(E −5)

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getItemDef } from "../data";
import { RULES } from "../engine";
import {
  backpackFree,
  backpackSlots,
  burdenNow,
  canUseItem,
  partyBurdenAdapt,
} from "../explore/session";
import { EXPLORE_RULES } from "../explore/rules";
import { layoutBackpack, stackSlots } from "../items/inventory";
import type { ItemStack } from "../items/types";
import { useExploreStore } from "../store/exploreStore";
import ItemDetail from "./ItemDetail";
import ItemSlot, { EmptySlot } from "./ItemSlot";
import ItemTabs from "./ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "./itemFilters";
import "./BackpackPanel.css";

const COLS = 8; // 8 × 3 = 24。只影响 CSS grid 的列数, 排布本身与列数无关。

export default function BackpackPanel({ onClose }: { onClose: () => void }) {
  const session = useExploreStore((s) => s.session);
  const discardItem = useExploreStore((s) => s.discardItem);
  const useItemAction = useExploreStore((s) => s.useItem);
  const takePending = useExploreStore((s) => s.takePending);
  const abandonPending = useExploreStore((s) => s.abandonPending);
  const shipHome = useExploreStore((s) => s.shipHome);

  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // 丢弃二次确认的 uid
  const [shipping, setShipping] = useState<string[]>([]); // 寄件模式的勾选
  const [flash, setFlash] = useState<string | null>(null); // 使用消耗品后的一句反馈

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
  const burden = Math.round(burdenNow(session));
  const adapt = partyBurdenAdapt(session);
  const pending = session.pendingPickup;
  const replaceMode = pending.length > 0;
  const chuteMode = session.chuteOpen;
  const sel = backpack.find((s) => s.uid === selected) ?? null;
  const selDef = sel ? getItemDef(sel.itemId) : null;

  const toggleShip = (uid: string) =>
    setShipping((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));

  const onSlotClick = (st: ItemStack) => {
    if (chuteMode) return toggleShip(st.uid);
    setSelected(st.uid);
  };

  const doUse = () => {
    if (!sel) return;
    const note = useItemAction(sel.uid);
    if (note) {
      setFlash(note);
      setSelected(null);
      window.setTimeout(() => setFlash(null), 2400);
    }
  };

  return (
    <div className="bp-modal">
      <section className="bp-panel">
        <header className="bp-head">
          <div>
            <span className="expl-kicker">随身携带</span>
            <h3 className="bp-title">背包</h3>
          </div>

          {/* 顶部实时读数。★ key 挂 used ⇒ 每丢一件这一行重挂一次走个跳变,
              「边丢边看数字回升」是设计文档 §6.4 点名要有的手感。 */}
          <div className="bp-readout" key={used}>
            <span className="bp-load">
              负重 <strong className={used > 0 ? "is-bad" : ""}>{used}</strong> / {
                RULES.burden.backpackSlots
              }
            </span>
            <span className="bp-penalty">
              命中 −{burden}% · 暴击 −{burden}% · 闪避 −{burden}%
            </span>
            <span className="bp-adapt">负重适应 {Math.min(100, Math.round(adapt))}%</span>
          </div>

          {/* 替换模式下没有退路: 必须处理完待取物才能关(设计文档 §6.4) */}
          {!replaceMode && (
            <button className="bp-close" type="button" onClick={onClose} aria-label="关闭背包">
              ✕
            </button>
          )}
        </header>

        {replaceMode && (
          <div className="bp-pending">
            <span className="bp-pending-label">
              背包装不下 —— 丢够格子才拿得走（还差 {shortBy(pending, free)} 格）
            </span>
            <div className="bp-pending-row">
              {pending.map((st, i) => {
                const need = stackSlots(st, getItemDef(st.itemId));
                const ok = need <= free;
                return (
                  <div className="bp-pending-item" key={st.uid}>
                    <ItemSlot stack={st} />
                    <button
                      className="expl-btn is-primary bp-mini"
                      type="button"
                      disabled={!ok}
                      onClick={() => takePending(i)}
                    >
                      {ok ? "拿取" : `还需 ${need - free} 格`}
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="expl-btn bp-mini" type="button" onClick={() => abandonPending()}>
              全部放弃拾取
            </button>
          </div>
        )}

        {chuteMode && (
          <div className="bp-chute">
            <span className="bp-chute-label">
              传送投递口已开启 —— 选中的物品寄回据点，团灭也带得走
            </span>
            <button
              className="expl-btn is-primary bp-mini"
              type="button"
              disabled={!shipping.length}
              onClick={() => {
                shipHome(shipping);
                setShipping([]);
              }}
            >
              寄回 {shipping.length} 件 · 粒子 −{EXPLORE_RULES.chute.energyCost}
            </button>
          </div>
        )}

        <ItemTabs
          stacks={backpack}
          tab={tab}
          equipTab={equipTab}
          onTab={setTab}
          onEquipTab={setEquipTab}
        />

        <div className="bp-body">
          <div className="bp-grid" style={{ "--bp-cols": COLS } as CSSProperties}>
            {cells.map((cell, i) => {
              if (cell.kind === "empty") return <EmptySlot key={i} />;
              return (
                <ItemSlot
                  key={cell.stack.uid}
                  stack={cell.stack}
                  selected={chuteMode ? shipping.includes(cell.stack.uid) : selected === cell.stack.uid}
                  dimmed={!matchTab(cell.stack, tab, equipTab)}
                  onClick={() => onSlotClick(cell.stack)}
                />
              );
            })}
          </div>

          <ItemDetail stack={sel} placeholder="背包里的东西都会占格子——每格让全队命中、暴击、闪避各降 1%。">
            {sel && selDef && (
              <>
                {selDef.use && (
                  <button
                    className="expl-btn is-primary bp-mini"
                    type="button"
                    disabled={!canUseItem(session)}
                    title={canUseItem(session) ? undefined : "本阶段不能使用消耗品"}
                    onClick={doUse}
                  >
                    使用
                  </button>
                )}
                {/* 丢弃**不可撤销**, 故在详情区原地二次确认 ——
                    探索页已经是「浮层里的浮层」, 再叠一层模态读起来会很脏。 */}
                {confirming === sel.uid ? (
                  <>
                    <button
                      className="expl-btn is-danger bp-mini"
                      type="button"
                      onClick={() => {
                        discardItem(sel.uid);
                        setSelected(null);
                      }}
                    >
                      确认丢弃
                    </button>
                    <button
                      className="expl-btn bp-mini"
                      type="button"
                      onClick={() => setConfirming(null)}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    className="expl-btn bp-mini"
                    type="button"
                    onClick={() => setConfirming(sel.uid)}
                  >
                    丢弃
                  </button>
                )}
              </>
            )}
          </ItemDetail>
        </div>

        {flash && <p className="bp-flash">{flash}</p>}
      </section>
    </div>
  );
}

// 「还差几格」—— 取待取物里**最小**的那件所需的缺口, 玩家丢到这个数就能开始拿。
function shortBy(pending: ItemStack[], free: number): number {
  const min = Math.min(...pending.map((st) => stackSlots(st, getItemDef(st.itemId))));
  return Math.max(0, min - free);
}
