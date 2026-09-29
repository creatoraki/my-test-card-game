// ★ 卡牌奖励三选一 ★ —— 战斗胜利的额外卡牌奖励与探索事件的角色卡牌奖励共用的独立弹窗。
//
// 交互: 悬停/聚焦候选 → 外框右外侧显示该卡详情(放大卡面 + 词条, 与战斗手牌详情同款);
//       点击候选只「选中」(可改选), 点底栏「确认选择」才真正领取; 「放弃」由调用方决定语义。
// 详情显示的卡 = 悬停 ?? 选中, 与战斗 CardInfoPanel 同一条规则: 移开鼠标后仍能看到已选那张。
//
// ⚠ 本组件 portal 到设计画布([data-stage-canvas]), 自带压暗遮罩, 不依赖宿主面板的尺寸与层级。
//   z-index 300: 高于胜利面板(40)与探索奖励层(35), 低于全局确认框(500)。
// ⚠ options 由调用方 useMemo 稳定下来 —— 每次渲染都 makeCard 会让卡面 uid 抖动、memo 全部失效。
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { cardDisplayName } from "@/engine";
import { playSfx } from "@/ui/audio";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { CardDetail } from "@/ui/common/card/CardDetail";
import { cx } from "@/ui/common/shared/cx";
import { CardPickSlot } from "./CardPickSlot";
import { PickFrameDecor } from "./PickFrameDecor";
import type { CardPickOption } from "./types";
import s from "./CardRewardPicker.module.css";

const CLOSE_MS = 220;

interface Props {
  /** null / 空数组 = 关闭(带退场动画)。 */
  options: CardPickOption[] | null;
  kicker?: string;
  title: string;
  caption?: string;
  confirmLabel?: string;
  skipLabel?: string;
  /** 返回 false 表示领取失败(如卡组已满): 弹窗保持打开、可重新选择。 */
  onConfirm: (option: CardPickOption) => boolean | void;
  onSkip: () => void;
}

export function CardRewardPicker({
  options,
  kicker = "卡牌奖励",
  title,
  caption,
  confirmLabel = "确认选择",
  skipLabel = "放弃",
  onConfirm,
  onSkip,
}: Props) {
  const open = Boolean(options?.length);
  const presence = useRevealPresence(open, options, CLOSE_MS);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  // 同一批候选只允许结算一次: 退场动画期间(调用方已清掉候选)再点按钮不能重复领取。
  const settledRef = useRef(false);
  const signature = options?.map((option) => option.key).join("|") ?? "";

  useEffect(() => {
    setSelectedKey(null);
    setHoveredKey(null);
    settledRef.current = false;
  }, [signature]);

  useEffect(() => {
    if (open) playSfx("panel");
  }, [open]);

  const handleHover = useCallback((key: string | null) => setHoveredKey(key), []);

  const shown = presence.data;
  if (typeof document === "undefined" || !presence.mounted || !shown?.length) return null;

  const selected = shown.find((option) => option.key === selectedKey) ?? null;
  const detail = shown.find((option) => option.key === hoveredKey) ?? selected;
  const locked = () => presence.closing || settledRef.current;

  const confirm = () => {
    if (!selected || locked()) return;
    settledRef.current = true;
    playSfx("confirm");
    if (onConfirm(selected) === false) settledRef.current = false;
  };
  const skip = () => {
    if (locked()) return;
    settledRef.current = true;
    playSfx("back");
    onSkip();
  };

  return createPortal(
    <div
      className={s.layer}
      data-closing={presence.closing ? "" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <section className={s.frame}>
        <PickFrameDecor />

        <header className={s.head}>
          <span className={s.kicker}>{kicker}</span>
          <h2 className={s.title}>{title}</h2>
          {caption && <p className={s.caption}>{caption}</p>}
        </header>

        <div className={s.grid} data-pick-grid>
          {shown.map((option, index) => (
            <CardPickSlot
              key={option.key}
              option={option}
              index={index}
              selected={option.key === selectedKey}
              hovered={option.key === hoveredKey}
              dimmed={selectedKey !== null && option.key !== selectedKey}
              onSelect={setSelectedKey}
              onHover={handleHover}
            />
          ))}
        </div>

        <footer className={s.foot}>
          <span className={s.note}>
            {selected ? (
              <>已选择：<strong className={s.noteName}>{cardDisplayName(selected.card)}</strong></>
            ) : "悬停查看详情，点击卡牌进行选择"}
          </span>
          <div className={s.actions} data-sfx="off">
            <button type="button" className={s.button} onClick={skip}>
              {skipLabel}
            </button>
            <button
              type="button"
              className={cx(s.button, s.primary)}
              disabled={!selected}
              onClick={confirm}
            >
              {confirmLabel}
            </button>
          </div>
        </footer>

        {detail && (
          <aside className={s.detail} key={detail.key} aria-live="polite">
            <CardDetail card={detail.card} />
          </aside>
        )}
      </section>
    </div>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}
