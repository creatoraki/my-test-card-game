// ★ 卡牌奖励三选一 ★ —— 战斗胜利的额外卡牌奖励与探索事件的角色卡牌奖励共用的独立弹窗。
//
// 交互: 悬停/聚焦候选 → 该卡侧边浮出词条释义; 点击候选只「选中」(可改选), 点底栏「确认选择」才真正领取;
//       「放弃」由调用方决定语义。释义只跟随悬停: 设计稿的选中态画面里不出现浮层, 移开鼠标即收起。
// 版式: 固定 1400×916 面板(设计 px), 外框/选中框/连接线/落位常量全部在 parts/pickGeometry.ts。
//
// 候选: 全队混合抽, 每张带归属角色(ownerCharId), 不再先选人。
// 开合: 与锻造师等事件档案面板同款「中缝亮线 → 上下展开」, 不压暗遮罩(见 module.css 顶部)。
//
// ⚠ 本组件 portal 到设计画布([data-stage-canvas]), 不依赖宿主面板的尺寸与层级。
//   z-index 300: 高于胜利面板(40)与探索奖励层(35), 低于全局确认框(500)。
// ⚠ options 由调用方 useMemo 稳定下来 —— 每次渲染都 makeCard 会让卡面 uid 抖动、memo 全部失效。
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { cardDisplayName } from "@/engine";
import { playSfx } from "@/ui/audio";
import { useRevealPresence } from "@/ui/common/frame/ModalReveal";
import { CardPickSlot } from "./CardPickSlot";
import { PickConnector } from "./parts/PickConnector";
import { PickFooter } from "./parts/PickFooter";
import { PickFrame } from "./parts/PickFrame";
import { PickHeader } from "./parts/PickHeader";
import { PickKeywordAside } from "./parts/PickKeywordAside";
import { GRID_LEFT, GRID_TOP } from "./parts/pickGeometry";
import type { CardPickOption } from "./types";
import s from "./CardRewardPicker.module.css";

/** 收起时长 = 事件档案面板的 PANEL_CLOSE_MS(与 module.css 的 pickRevealOut 一致)。 */
const CLOSE_MS = 380;

interface Props {
  /** null / 空数组 = 关闭(带退场动画)。 */
  options: CardPickOption[] | null;
  kicker?: string;
  title: string;
  caption?: string;
  confirmLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
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
  allowSkip = true,
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

  const selectedIndex = shown.findIndex((option) => option.key === selectedKey);
  const selected = selectedIndex >= 0 ? shown[selectedIndex] : null;
  const detailIndex = shown.findIndex((option) => option.key === hoveredKey);
  const detail = detailIndex >= 0 ? shown[detailIndex] : null;
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
        <PickFrame />
        <PickHeader kicker={kicker} title={title} caption={caption} />

        <div className={s.grid} data-pick-grid style={{ left: GRID_LEFT, top: GRID_TOP }}>
          {shown.map((option, index) => (
            <CardPickSlot
              key={option.key}
              option={option}
              index={index}
              selected={option.key === selectedKey}
              hovered={option.key === hoveredKey}
              onSelect={setSelectedKey}
              onHover={handleHover}
            />
          ))}
        </div>

        <PickConnector index={selected ? selectedIndex : null} />

        <PickFooter
          note={selected ? (
            <>已选择：<strong className={s.noteName}>{cardDisplayName(selected.card)}</strong></>
          ) : "点击卡牌进行选择"}
          allowSkip={allowSkip}
          skipLabel={skipLabel}
          confirmLabel={confirmLabel}
          canConfirm={Boolean(selected)}
          onSkip={skip}
          onConfirm={confirm}
        />

        {detail && (
          <PickKeywordAside key={detail.key} card={detail.card} index={detailIndex} count={shown.length} />
        )}
        <span className={s.bar} aria-hidden />
      </section>
    </div>,
    document.querySelector<HTMLElement>("[data-stage-canvas]") ?? document.body,
  );
}
